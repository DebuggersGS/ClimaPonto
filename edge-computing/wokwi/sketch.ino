
/*
 * ClimaPonto - Monitoramento Ambiental Inteligente
 * FIAP | Global Solution 2026.2
 * Disciplina: Edge Computing & Computer Systems
 * Turma: 1ESPG-2026
 * Grupo: DEBUGGERS
 *
 * Integrantes:
 * Vinicius Fuentes Cavalcanti - RM 570818
 * Guilherme De Rosa Peres - RM 569193
 * Enrico Vieira de Almeida Vidal - RM 569217
 *
 * Descricao:
 * Sistema IoT de monitoramento de temperatura e umidade
 * em pontos de onibus, utilizando ESP32 e DHT22.
 *
 * Funcionalidades:
 * - Classificacao local em tres estados
 * - Alertas visuais e sonoros
 * - Suavizacao das leituras por media movel
 * - Tratamento de falhas do sensor
 * - Comunicacao MQTT com a plataforma FIWARE
 * - Funcionamento local independente da conectividade
 *
 * Ambiente: Wokwi - ESP32 Arduino/C++
 * Dados ambientais simulados para fins academicos.
 */

#include <Arduino.h>
#include <Wire.h>
#include <DHTesp.h>
#include <LiquidCrystal_I2C.h>
#include <math.h>
#include <WiFi.h>
#include <PubSubClient.h>

constexpr int PIN_DHT = 15;
constexpr int PIN_VERDE = 16;
constexpr int PIN_AMARELO = 17;
constexpr int PIN_VERMELHO = 18;
constexpr int PIN_BUZZER = 25;

constexpr bool SIMULAR_REDE_OFFLINE = false;
// Limites dos estados (temperatura suavizada, em graus C):
//   NORMAL  : abaixo de 30.0
//   ATENCAO : de 30.0 ate 34.9
//   CRITICO : 35.0 ou mais
// Valores definidos pelo grupo nos testes do prototipo: 30 C separa uma
// tarde comum de uma tarde quente na espera do onibus, e 35 C marca calor
// forte, quando vale chamar mais atencao. Sao limites DEMONSTRATIVOS:
// nao sao indice oficial, nao medem sensacao termica e nao sao alerta de
// saude. Os mesmos valores sao usados no Python e no site.
constexpr float LIMITE_ATENCAO = 30.0;
constexpr float LIMITE_CRITICO = 35.0;

constexpr unsigned long INTERVALO_LEITURA = 2000;
constexpr unsigned long INTERVALO_LCD = 500;
constexpr int TAMANHO_MEDIA = 5;


const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_SENHA = "";

// IP de exemplo do servidor FIWARE na nuvem (AWS). Muda quando a
// instancia for ligada novamente: atualizar aqui antes de testar o envio.
const char* MQTT_SERVIDOR = "52.207.229.41";
constexpr int MQTT_PORTA = 1883;

// Chave (apikey) do servico FIWARE do ClimaPonto, usada so na demonstracao.
// Fica visivel no projeto publico do Wokwi por decisao do grupo.
const char* CLIMA_API_KEY = "b3a8c667abb2f33fe3ad1074e7077404";

const char* MQTT_DISPOSITIVO = "climaponto-p001";

WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

unsigned long ultimaTentativaWiFi = 0;
unsigned long ultimaTentativaMQTT = 0;

constexpr unsigned long INTERVALO_RECONEXAO_WIFI = 10000;
constexpr unsigned long INTERVALO_RECONEXAO_MQTT = 10000;


// Teste demonstrativo de falha do sensor.
// false = funcionamento normal
// true  = simular leitura invalida
constexpr bool SIMULAR_FALHA_SENSOR = false;

DHTesp dht;
LiquidCrystal_I2C lcd(0x27, 16, 2);

enum Estado {
  SEM_DADOS,
  NORMAL,
  ATENCAO,
  CRITICO,
  FALHA_SENSOR
};

Estado estadoAtual = SEM_DADOS;

float temperaturas[TAMANHO_MEDIA] = {};
int quantidade = 0;
int indice = 0;

float temperatura = NAN;
float umidade = NAN;
float temperaturaSuavizada = NAN;

// Reinicia a janela apos falha para nao usar leituras antigas.
void limparMediaMovel() {
  quantidade = 0;
  indice = 0;
  temperaturaSuavizada = NAN;
  for (int i = 0; i < TAMANHO_MEDIA; i++) {
    temperaturas[i] = 0;
  }
}

unsigned long ultimaLeitura = 0;
unsigned long ultimaAtualizacaoLCD = 0;

bool buzzerLigado = false;
int frequenciaAtual = 0;

const char* nomeEstado(Estado estado) {
  switch (estado) {
    case NORMAL: return "NORMAL";
    case ATENCAO: return "ATENCAO";
    case CRITICO: return "CRITICO";
    case FALHA_SENSOR: return "FALHA SENSOR";
    default: return "SEM DADOS";
  }
}

void adicionarTemperatura(float valor) {
  temperaturas[indice] = valor;
  indice = (indice + 1) % TAMANHO_MEDIA;

  if (quantidade < TAMANHO_MEDIA) {
    quantidade++;
  }

  float soma = 0;

  for (int i = 0; i < quantidade; i++) {
    soma += temperaturas[i];
  }

  temperaturaSuavizada = soma / quantidade;
}

Estado classificar(float valor) {
  if (valor >= LIMITE_CRITICO) {
    return CRITICO;
  }

  if (valor >= LIMITE_ATENCAO) {
    return ATENCAO;
  }

  return NORMAL;
}

void atualizarLeds() {
  digitalWrite(PIN_VERDE, estadoAtual == NORMAL);
  digitalWrite(PIN_AMARELO, estadoAtual == ATENCAO);
  digitalWrite(PIN_VERMELHO, estadoAtual == CRITICO);
}

void atualizarBuzzer(unsigned long agora) {
  int frequencia = 0;
  bool deveTocar = false;

  if (estadoAtual == ATENCAO) {
    frequencia = 1000;
    deveTocar = (agora % 2000UL) < 200UL;
  } else if (estadoAtual == CRITICO) {
    frequencia = 1800;
    deveTocar = (agora % 800UL) < 300UL;
  }

  if (deveTocar) {
    if (!buzzerLigado || frequencia != frequenciaAtual) {
      tone(PIN_BUZZER, frequencia);
      buzzerLigado = true;
      frequenciaAtual = frequencia;
    }
  } else if (buzzerLigado) {
    noTone(PIN_BUZZER);
    buzzerLigado = false;
    frequenciaAtual = 0;
  }
}

void lerSensor() {
  TempAndHumidity dados;

  if (SIMULAR_FALHA_SENSOR) {
    dados.temperature = NAN;
    dados.humidity = NAN;
  } else {
    dados = dht.getTempAndHumidity();
  }

  if (
    isnan(dados.temperature) ||
    isnan(dados.humidity) ||
    dados.temperature < -40 ||
    dados.temperature > 80 ||
    dados.humidity < 0 ||
    dados.humidity > 100
  ) {
    temperatura = NAN;
    umidade = NAN;
    limparMediaMovel();
    estadoAtual = FALHA_SENSOR;
    Serial.println("[ERRO] Leitura invalida do DHT22.");
    atualizarLeds();
    return;
  }

  temperatura = dados.temperature;
  umidade = dados.humidity;

  adicionarTemperatura(temperatura);
  estadoAtual = classificar(temperaturaSuavizada);

  atualizarLeds();

  Serial.println("----------------------------");
  Serial.printf("Temperatura: %.1f C\n", temperatura);
  Serial.printf("Umidade: %.1f %%\n", umidade);
  Serial.printf("Media movel: %.1f C\n", temperaturaSuavizada);
  Serial.printf("Amostras: %d\n", quantidade);
  Serial.printf("Estado: %s\n", nomeEstado(estadoAtual));
  publicarLeitura();
}

void escreverLinha(int linha, const String& texto) {
  lcd.setCursor(0, linha);

  String ajustado = texto.substring(0, 16);

  while (ajustado.length() < 16) {
    ajustado += " ";
  }

  lcd.print(ajustado);
}

void atualizarLCD() {
  if (estadoAtual == SEM_DADOS) {
    escreverLinha(0, "CLIMAPONTO");
    escreverLinha(1, "Aguardando...");
    return;
  }

  if (estadoAtual == FALHA_SENSOR) {
    escreverLinha(0, "CLIMAPONTO");
    escreverLinha(1, "FALHA NO SENSOR");
    return;
  }

  String linha1 =
    "T:" + String(temperatura, 1) +
    "C U:" + String(umidade, 0) + "%";

  escreverLinha(0, linha1);

  String linha2 =
    String(nomeEstado(estadoAtual)) +
    " (SIM)";

  escreverLinha(1, linha2);
}


void conectarRede(unsigned long agora) {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  if (agora - ultimaTentativaWiFi < INTERVALO_RECONEXAO_WIFI) {
    return;
  }

  ultimaTentativaWiFi = agora;

  Serial.println("[WIFI] Tentando reconectar...");
  WiFi.reconnect();
}

void conectarMQTT(unsigned long agora) {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) {
    return;
  }

  if (agora - ultimaTentativaMQTT < INTERVALO_RECONEXAO_MQTT) {
    return;
  }

  ultimaTentativaMQTT = agora;

  Serial.println("[MQTT] Tentando conectar...");

  if (mqtt.connect("climaponto-esp32-p001")) {
    Serial.println("[MQTT] Conectado!");
  } else {
    Serial.printf("[MQTT] Falha, codigo: %d\n", mqtt.state());
  }
}

void publicarLeitura() {
  if (!mqtt.connected()) {
    Serial.println("[MQTT] Offline. Leitura apenas local.");
    return;
  }

  if (
    isnan(temperatura) ||
    isnan(umidade) ||
    isnan(temperaturaSuavizada) ||
    estadoAtual == FALHA_SENSOR
  ) {
    Serial.println("[MQTT] Leitura invalida. Envio ignorado.");
    return;
  }

  String topico =
    String("/ul/") +
    CLIMA_API_KEY +
    "/" +
    MQTT_DISPOSITIVO +
    "/attrs";

  String estado;

  switch (estadoAtual) {
    case NORMAL: estado = "normal"; break;
    case ATENCAO: estado = "atencao"; break;
    case CRITICO: estado = "critico"; break;
    default: return;
  }

  String mensagem =
    "t|" + String(temperatura, 1) +
    "|h|" + String(umidade, 1) +
    "|m|" + String(temperaturaSuavizada, 1) +
    "|s|" + estado;

  if (mqtt.publish(topico.c_str(), mensagem.c_str())) {
    Serial.println("[MQTT] Leitura publicada!");
  } else {
    Serial.println("[MQTT] Falha ao publicar.");
  }
}


void setup() {
  Serial.begin(115200);

  pinMode(PIN_VERDE, OUTPUT);
  pinMode(PIN_AMARELO, OUTPUT);
  pinMode(PIN_VERMELHO, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  atualizarLeds();

  Wire.begin(21, 22);

  lcd.init();
  lcd.backlight();

  escreverLinha(0, "CLIMAPONTO");
  escreverLinha(1, "Iniciando...");

  dht.setup(PIN_DHT, DHTesp::DHT22);

  Serial.println("CLIMAPONTO - GS 2026");
  Serial.println("Monitor ambiental iniciado.");
  Serial.println("Dados de simulacao.");

  // Primeira leitura apos intervalo adequado do DHT22.
  ultimaLeitura = millis();

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_SENHA, 6);

  ultimaTentativaWiFi = millis();

  mqtt.setServer(MQTT_SERVIDOR, MQTT_PORTA);
  mqtt.setSocketTimeout(1);
  mqtt.setKeepAlive(15);

  Serial.println("[REDE] Conectividade inicializada.");
}


void loop() {
  const unsigned long agora = millis();

  // Teste offline isolado: nao desliga servicos na AWS.
  if (SIMULAR_REDE_OFFLINE) {
    if (mqtt.connected()) {
      mqtt.disconnect();
    }
    if (WiFi.status() == WL_CONNECTED) {
      WiFi.disconnect();
    }
  }

  // Monitoramento e alertas locais nunca dependem da rede.
  if (agora - ultimaLeitura >= INTERVALO_LEITURA) {
    ultimaLeitura = agora;
    lerSensor();
  }

  if (agora - ultimaAtualizacaoLCD >= INTERVALO_LCD) {
    ultimaAtualizacaoLCD = agora;
    atualizarLCD();
  }

  atualizarBuzzer(agora);

  // Tentativas MQTT podem bloquear brevemente; espacadas a cada 10 s.
  if (!SIMULAR_REDE_OFFLINE) {
    conectarRede(agora);

    if (WiFi.status() == WL_CONNECTED) {
      conectarMQTT(agora);
      if (mqtt.connected()) {
        mqtt.loop();
      }
    }
  }
}
