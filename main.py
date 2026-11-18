"""
ClimaPonto - Central de Leituras
FIAP | Global Solution 2026.2 | Computational Thinking with Python
Equipe Debuggers:
    Enrico Vieira de Almeida Vidal - RM 569217
    Guilherme De Rosa Peres        - RM 569193
    Vinícius Fuentes Cavalcanti    - RM 570818

O que o programa faz:
    Recebe as leituras de temperatura e umidade dos pontos de ônibus (do sensor
    ESP32 do ClimaPonto, pela API do FIWARE, ou medições de campo nos pontos sem sensor), classifica o calor em
    normal, atenção (30 °C ou mais) ou crítico (35 °C ou mais), guarda tudo em
    arquivos JSON e gera painel, consultas, estatísticas e tendência de aquecimento.

Como executar (Python 3.10 ou mais novo):
    pip install requests
    python main.py
"""

import json
import os
import time
from datetime import datetime, timedelta, timezone

try:
    import requests                       # usado só na opção 2 (API do FIWARE)
except ImportError:
    requests = None

# =============================================================================
# CONFIGURAÇÕES
# =============================================================================
PASTA = os.path.dirname(os.path.abspath(__file__))
PASTA_DADOS = os.path.join(PASTA, "dados")
ARQ_PONTOS = os.path.join(PASTA_DADOS, "pontos.json")
ARQ_LEITURAS = os.path.join(PASTA_DADOS, "leituras.json")
ARQ_CONFIG = os.path.join(PASTA_DADOS, "config_fiware.json")
PASTA_RELATORIOS = os.path.join(PASTA, "relatorios")
PASTA_BACKUP = os.path.join(PASTA, "backup_dados")   # capturas reais do sensor: o programa só cria, nunca apaga

# Captura real do ESP32 (FIWARE do grupo, 16/11/2026 23:33, ponto P001 Santana), embutida no código.
# Garante dados reais para quem recebe só o main.py e nunca rodou o programa com o servidor ligado.
# Formato: (horário UTC, temperatura °C, umidade %, média móvel °C, estado)
CAPTURA_REAL_EMBUTIDA = (
    ("2026-11-17T02:33:01Z", 49.8, 40.0, 41.3, "critico"),
    ("2026-11-17T02:33:04Z", 35.6, 40.0, 41.3, "critico"),
    ("2026-11-17T02:33:10Z", 24.4, 40.0, 39.0, "critico"),
    ("2026-11-17T02:33:14Z", 24.4, 40.0, 36.8, "critico"),
    ("2026-11-17T02:33:17Z", 24.4, 40.0, 31.7, "atencao"),
    ("2026-11-17T02:33:21Z", 24.4, 40.0, 26.6, "normal"),
)

LIMITES = (30.0, 35.0)                  # (atenção, crítico) em °C - mesmos do ESP32 e do site
FAIXA_TEMPERATURA = (-40.0, 80.0)       # faixa válida do sensor DHT22 (igual ao ESP32)
FAIXA_UMIDADE = (0.0, 100.0)
FUSO_BRASILIA = timedelta(hours=-3)
VOLTAR = "v"                            # em qualquer pergunta, "v" volta ao menu principal
LEITURAS_DO_SENSOR = 6                  # quantas leituras do ESP32 são buscadas em cada consulta
PAGINA_HISTORICO = 100                  # o STH-Comet devolve no máximo 100 leituras por consulta
PAGINAS_HISTORICO = 15                  # até 1.500 leituras: mais de 1 hora de envios do ESP32
JANELA_MEDIA = timedelta(hours=1)       # leituras do sensor guardadas e usadas na média: a última hora
INTERVALO_COLETA = 5                    # segundos entre consultas na coleta ao vivo (o ESP32 publica a cada 2 s)
PERIODOS_DIA = (("Madrugada", 0, 6), ("Manhã", 6, 12), ("Tarde", 12, 18), ("Noite", 18, 24))
NOMES_ESTADO = {"normal": "Normal", "atencao": "Atenção", "critico": "CRÍTICO"}
NOMES_ORIGEM = {"manual": "medição de campo", "esp32_fiware": "sensor ESP32 (FIWARE)"}

# Configuração do FIWARE da parte de Edge Computing (Vinícius). Só o IP muda a cada vez
# que o servidor na nuvem é ligado; por isso só ele fica salvo em dados/config_fiware.json.
CONFIG_PADRAO = {"ip": "", "porta_iot_agent": 4041, "porta_orion": 1026, "porta_sth": 8666,
                 "fiware_service": "climaponto", "fiware_servicepath": "/"}
NOMES_ATRIBUTOS = {"t": "temperatura", "h": "umidade", "m": "media_movel", "s": "estado_sensor"}

PONTOS_INICIAIS = [
    {"id": "P001", "nome": "Santana", "regiao": "Zona Norte", "dispositivo": "climaponto-p001"},
    {"id": "P002", "nome": "Interlagos", "regiao": "Zona Sul", "dispositivo": ""},
    {"id": "P003", "nome": "Barueri", "regiao": "Grande São Paulo", "dispositivo": ""},
]


# =============================================================================
# REGRAS DO CLIMAPONTO
# =============================================================================
def classificar_temperatura(temperatura: float, limites: tuple = LIMITES) -> str:
    """Devolve o estado do ponto: 'normal', 'atencao' ou 'critico'."""
    atencao, critico = limites
    if temperatura >= critico:
        return "critico"
    elif temperatura >= atencao:
        return "atencao"
    else:
        return "normal"


def para_brasilia(timestamp_utc: str) -> datetime:
    """Converte '2026-11-16T22:30:00Z' (UTC, como vem do FIWARE) para o horário de Brasília."""
    instante = datetime.fromisoformat(timestamp_utc.replace("Z", "").split(".")[0])
    return instante + FUSO_BRASILIA


def hora_texto(timestamp_utc: str) -> str:
    """Mostra um horário UTC do FIWARE como data e hora de Brasília (ex.: 16/11/2026 23:33)."""
    return para_brasilia(timestamp_utc).strftime("%d/%m/%Y %H:%M")


def criar_leitura(ponto_id: str, temperatura: float, umidade: float, origem: str,
                  timestamp: str, media_movel: float | None = None) -> dict:
    """Monta uma leitura no formato combinado com o ESP32 e o site. A média móvel do ESP32 é
    guardada como veio; o estado definitivo é dado depois pela média da última hora."""
    if media_movel is not None:
        media_movel = round(media_movel, 1)
    return {"ponto_id": ponto_id, "temperatura": round(temperatura, 1), "umidade": round(umidade, 1),
            "media_movel": media_movel, "estado": classificar_temperatura(temperatura),
            "origem": origem, "timestamp": timestamp}


def atualizar_media_ultima_hora(leituras: list) -> None:
    """Calcula, para cada leitura, a média das temperaturas do mesmo ponto na última hora
    (de 60 min antes até o horário dela) e classifica o estado por essa média.
    Assim um pico isolado não muda o estado sozinho, e leituras em sequência não distorcem a média."""
    for leitura in leituras:
        fim = para_brasilia(leitura["timestamp"])
        inicio = fim - JANELA_MEDIA
        na_hora = []
        for outra in leituras:
            if outra["ponto_id"] == leitura["ponto_id"] and inicio <= para_brasilia(outra["timestamp"]) <= fim:
                na_hora.append(outra["temperatura"])
        leitura["media_1h"] = round(sum(na_hora) / len(na_hora), 1)
        leitura["leituras_1h"] = len(na_hora)
        leitura["estado"] = classificar_temperatura(leitura["media_1h"])


# =============================================================================
# ARQUIVOS JSON E DE TEXTO
# =============================================================================
def carregar_json(caminho: str, padrao: list | dict) -> list | dict:
    """Lê um arquivo JSON e devolve os dados. Se o arquivo não existir, devolve o padrão."""
    if os.path.exists(caminho):
        # Se o arquivo existir, carrega os dados dele
        try:
            with open(caminho, "r", encoding="utf-8") as arquivo:
                return json.load(arquivo)
        except ValueError:
            # Arquivo com conteúdo inválido: guarda com outro nome (nada é apagado) e começa do padrão
            copia = caminho + ".corrompido"
            if not os.path.exists(copia):
                os.rename(caminho, copia)
            print(f"\n  [AVISO] {os.path.basename(caminho)} estava com conteúdo inválido: foi guardado como "
                  f"{os.path.basename(copia)} e não foi carregado.")
            return padrao
        except OSError:
            print(f"\n  [AVISO] Não foi possível abrir {os.path.basename(caminho)} (sem permissão ou em uso).")
            return padrao
    # Se o arquivo não existir, começa do padrão
    return padrao


def salvar_json(caminho: str, dados: list | dict) -> bool:
    """Grava os dados no arquivo JSON (cria a pasta se ainda não existir).
    Devolve False se não conseguir gravar (pasta sem permissão, arquivo aberto em outro programa)."""
    try:
        pasta = os.path.dirname(caminho)
        if not os.path.exists(pasta):
            os.mkdir(pasta)
        with open(caminho, "w", encoding="utf-8") as arquivo:
            json.dump(dados, arquivo, indent=4, ensure_ascii=False)
        return True
    except OSError:
        print(f"  [ERRO] Não foi possível salvar {os.path.basename(caminho)}. Feche o arquivo se estiver aberto.")
        return False


def exportar_relatorio_txt(linhas: list, nome: str) -> str | None:
    """Grava um relatório em arquivo de texto e devolve o caminho (ou None se não conseguir)."""
    try:
        if not os.path.exists(PASTA_RELATORIOS):
            os.mkdir(PASTA_RELATORIOS)
        caminho = os.path.join(PASTA_RELATORIOS, f"{nome}_{datetime.now():%Y%m%d_%H%M}.txt")
        with open(caminho, "w", encoding="utf-8") as arquivo:
            for linha in linhas:
                arquivo.write(linha + "\n")
        return caminho
    except OSError:
        print("  [ERRO] Não foi possível criar o relatório.")
        return None


# =============================================================================
# ENTRADAS COM VALIDAÇÃO
# =============================================================================
def ler_numero(mensagem: str, minimo: float, maximo: float, padrao: float | None = None) -> float | None:
    """Repete a pergunta até receber um número dentro da faixa [minimo, maximo].
    Devolve None se o usuário digitar v (voltar)."""
    while True:
        texto = input(mensagem).strip().replace(",", ".")
        if texto.lower() == VOLTAR:
            return None
        if texto == "" and padrao is not None:
            return padrao
        try:
            valor = float(texto)
        except ValueError:
            print("  Digite um número (ex.: 31.5).")
            continue
        if valor != valor:                                 # NaN não é igual a ele mesmo
            print("  Valor inválido.")
        elif minimo <= valor <= maximo:
            return valor
        else:
            print(f"  O valor precisa estar entre {minimo:g} e {maximo:g}.")


def ler_texto(mensagem: str, obrigatorio: bool = True) -> str | None:
    """Lê um texto; devolve None se o usuário digitar v (voltar)."""
    while True:
        texto = input(mensagem).strip()
        if texto.lower() == VOLTAR:
            return None
        if texto or not obrigatorio:
            return texto
        print("  Este campo é obrigatório.")


def ler_sim_nao(mensagem: str) -> bool:
    """Pergunta de sim ou não. "v" conta como não (volta sem fazer nada)."""
    while True:
        resposta = input(f"{mensagem} (s/n): ").strip().lower()
        if resposta in ("s", "sim"):
            return True
        if resposta in ("n", "nao", "não", VOLTAR):
            return False
        print("  Responda s ou n.")


def ler_data_hora(mensagem: str) -> str | None:
    """Lê data e hora de Brasília (dd/mm/aaaa hh:mm). Enter = agora. Devolve em UTC (ISO),
    ou None se o usuário digitar v (voltar)."""
    while True:
        texto = input(mensagem).strip()
        if texto.lower() == VOLTAR:
            return None
        try:
            if texto == "":
                local = datetime.now()
            else:
                local = datetime.strptime(texto, "%d/%m/%Y %H:%M")
        except ValueError:
            print("  Use o formato dd/mm/aaaa hh:mm (ex.: 16/11/2026 14:30) ou Enter para agora.")
            continue
        if local > datetime.now() + timedelta(minutes=5):
            print("  A leitura não pode ser no futuro.")
            continue
        return (local - FUSO_BRASILIA).strftime("%Y-%m-%dT%H:%M:00Z")


def escolher_ponto(pontos: list, mensagem: str = "Ponto (código, nome ou Enter para ver a lista): ") -> dict | None:
    """Encontra um ponto pelo código ou nome. Enter mostra a lista numerada."""
    while True:
        texto = input(mensagem).strip().lower()
        if texto == VOLTAR:
            return None
        if texto == "":
            for i in range(len(pontos)):
                ponto = pontos[i]
                print(f"   {i + 1} - {ponto['id']} {ponto['nome']} ({ponto['regiao']})")
            texto = input("   Número do ponto (v para voltar): ").strip().lower()
            if texto in ("", VOLTAR):
                return None
            if texto.isdigit() and 1 <= int(texto) <= len(pontos):
                return pontos[int(texto) - 1]
            print("  Número inválido.")
            continue
        for ponto in pontos:                                 # busca linear
            if texto in (ponto["id"].lower(), ponto["nome"].lower()):
                return ponto
        print("  Ponto não encontrado. Dê Enter para ver a lista.")


# =============================================================================
# BUSCAS E ORDENAÇÃO (feitas à mão)
# =============================================================================
def buscar_leituras(leituras: list, **criterios) -> list:
    """Busca linear: devolve as leituras que atendem a todos os critérios.
    Exemplo: buscar_leituras(leituras, ponto_id="P001", estado="critico")."""
    encontradas = []
    for leitura in leituras:
        combina = True
        for campo, valor in criterios.items():
            if leitura.get(campo) != valor:
                combina = False
        if combina:
            encontradas.append(leitura)
    return encontradas


def fora_de_ordem(anterior, atual, decrescente: bool) -> bool:
    """Diz se o elemento anterior precisa andar uma posição para a direita na ordenação."""
    if decrescente:
        return anterior < atual
    return anterior > atual


def ordenar(lista: list, chave: str, decrescente: bool = False) -> list:
    """Ordenação por inserção (insertion sort). Devolve uma nova lista, sem alterar a original."""
    copia = list(lista)
    for i in range(1, len(copia)):
        atual = copia[i]
        j = i - 1
        while j >= 0 and fora_de_ordem(copia[j][chave], atual[chave], decrescente):
            copia[j + 1] = copia[j]
            j -= 1
        copia[j + 1] = atual
    return copia


def busca_binaria_horario(leituras_ordenadas: list, alvo: str) -> int:
    """Busca binária: devolve o índice da leitura mais próxima do horário alvo (UTC ISO).
    A lista precisa estar ordenada por timestamp."""
    inicio, fim = 0, len(leituras_ordenadas) - 1
    while inicio < fim:
        meio = (inicio + fim) // 2
        if leituras_ordenadas[meio]["timestamp"] < alvo:
            inicio = meio + 1
        else:
            fim = meio
    if inicio > 0:                                          # compara com o vizinho anterior
        antes = para_brasilia(leituras_ordenadas[inicio - 1]["timestamp"])
        depois = para_brasilia(leituras_ordenadas[inicio]["timestamp"])
        alvo_dt = para_brasilia(alvo)
        if abs(alvo_dt - antes) < abs(depois - alvo_dt):
            return inicio - 1
    return inicio


# =============================================================================
# CÁLCULOS
# =============================================================================
def resumo_numerico(*valores: float) -> tuple:
    """Recebe qualquer quantidade de valores e devolve (mínimo, máximo, média)."""
    if not valores:
        return (None, None, None)
    return (min(valores), max(valores), sum(valores) / len(valores))


def contar_estados(leituras: list) -> dict:
    """Conta quantas leituras há em cada estado (normal, atenção, crítico)."""
    contagem = {"normal": 0, "atencao": 0, "critico": 0}
    for leitura in leituras:
        contagem[leitura["estado"]] += 1
    return contagem


def matriz_periodos(pontos: list, leituras: list) -> list:
    """Matriz [ponto][período do dia] com a temperatura média (None quando não há leitura)."""
    matriz = []
    for ponto in pontos:
        linha = []
        do_ponto = buscar_leituras(leituras, ponto_id=ponto["id"])
        for _, inicio, fim in PERIODOS_DIA:
            valores = []
            for leitura in do_ponto:
                if inicio <= para_brasilia(leitura["timestamp"]).hour < fim:
                    valores.append(leitura["temperatura"])
            linha.append(resumo_numerico(*valores)[2])
        matriz.append(linha)
    return matriz


def calcular_tendencia(leituras_ponto: list, quantidade: int = LEITURAS_DO_SENSOR) -> dict | None:
    """Velocidade de aquecimento (°C/h) entre a primeira e a última das últimas leituras.
    É a derivada discreta usada na análise matemática: taxa = (T2 - T1) / (t2 - t1)."""
    ultimas = ordenar(leituras_ponto, "timestamp")[-quantidade:]
    if len(ultimas) < 2:
        return None
    primeira, ultima = ultimas[0], ultimas[-1]
    horas = (para_brasilia(ultima["timestamp"]) - para_brasilia(primeira["timestamp"])).total_seconds() / 3600
    if horas <= 0:
        return None
    taxa = (ultima["temperatura"] - primeira["temperatura"]) / horas
    previsao = None
    proximo = None
    for limite in LIMITES:
        if proximo is None and ultima["temperatura"] < limite:
            proximo = limite
    if taxa > 0 and proximo is not None:
        previsao = (proximo, (proximo - ultima["temperatura"]) / taxa * 60)   # minutos
    return {"taxa": taxa, "horas": horas, "n": len(ultimas), "primeira": primeira, "ultima": ultima,
            "previsao": previsao}


# =============================================================================
# API DO FIWARE (leituras reais do sensor ESP32)
# =============================================================================
def cabecalhos_fiware(config: dict) -> dict:
    """Cabeçalhos que o FIWARE exige para saber de qual serviço são os dados."""
    return {"fiware-service": config["fiware_service"], "fiware-servicepath": config["fiware_servicepath"]}


def consultar_dispositivo(config: dict, dispositivo: str) -> dict:
    """Pergunta ao IoT Agent qual entidade e quais atributos o ESP32 usa."""
    url = f"http://{config['ip']}:{config['porta_iot_agent']}/iot/devices/{dispositivo}"
    resposta = requests.get(url, headers=cabecalhos_fiware(config), timeout=8)
    resposta.raise_for_status()
    return resposta.json()


def procurar_no_orion(config: dict, dispositivo: str) -> dict:
    """Plano B: procura no Orion uma entidade cujo id lembre o dispositivo (ex.: 'p001')."""
    url = f"http://{config['ip']}:{config['porta_orion']}/v2/entities"
    resposta = requests.get(url, headers=cabecalhos_fiware(config),
                            params={"options": "keyValues", "limit": 100}, timeout=8)
    resposta.raise_for_status()
    numero = ""                                                     # "climaponto-p001" -> "001"
    for caractere in dispositivo:
        if caractere.isdigit():
            numero += caractere
    pistas = (dispositivo.lower(), dispositivo.split("-")[0].lower(), numero)
    melhor, maior_nota = None, 0
    for entidade in resposta.json():                                # busca linear com pontuação
        nota = 0
        for pista in pistas:
            if pista and pista in entidade["id"].lower():
                nota += 1
        if nome_do_atributo(list(entidade.keys()), "t", "temperature", "temperatura"):
            nota += 1                                               # tem temperatura: mais provável
        if nota > maior_nota:
            melhor, maior_nota = entidade, nota
    if melhor is None or maior_nota < 2:
        return None                                                 # entidade do sensor não encontrada
    return melhor


def nome_do_atributo(chaves: list, *apelidos: str) -> str | None:
    """Acha, entre os atributos da entidade, o primeiro que combina com um dos apelidos."""
    for apelido in apelidos:
        for chave in chaves:
            if chave.lower() == apelido:
                return chave
    return None


def descobrir_entidade(config: dict, dispositivo: str) -> tuple:
    """Devolve (entidade, nomes dos atributos t/h/m), primeiro pelo IoT Agent e, se falhar, pelo Orion."""
    try:
        cadastro = consultar_dispositivo(config, dispositivo)
        entidade = {"id": cadastro["entity_name"], "tipo": cadastro["entity_type"]}
        nomes = {}
        for atributo in cadastro.get("attributes", []):
            nomes[atributo.get("object_id", atributo["name"])] = atributo["name"]
        return entidade, nomes
    except (requests.exceptions.RequestException, KeyError):
        pass
    achada = procurar_no_orion(config, dispositivo)
    if achada is None:
        return None, {}
    chaves = list(achada.keys())
    nomes = {"t": nome_do_atributo(chaves, "t", "temperature", "temperatura"),
             "h": nome_do_atributo(chaves, "h", "humidity", "umidade"),
             "m": nome_do_atributo(chaves, "m", "media", "media_movel", "average")}
    encontrados = {}
    for codigo, nome in nomes.items():
        if nome:
            encontrados[codigo] = nome
    return {"id": achada["id"], "tipo": achada["type"]}, encontrados


def consultar_historico(config: dict, entidade: dict, atributo: str, desde: str) -> list:
    """Busca no STH-Comet as leituras de um atributo a partir do horário 'desde' (UTC), de 100 em 100
    (limite de cada consulta). Sem histórico, devolve lista vazia."""
    url = (f"http://{config['ip']}:{config['porta_sth']}/STH/v1/contextEntities/type/{entidade['tipo']}"
           f"/id/{entidade['id']}/attributes/{atributo}")
    valores = []
    for pagina in range(PAGINAS_HISTORICO):
        parametros = {"hLimit": PAGINA_HISTORICO, "hOffset": pagina * PAGINA_HISTORICO, "dateFrom": desde}
        try:
            resposta = requests.get(url, headers=cabecalhos_fiware(config), params=parametros, timeout=8)
            resposta.raise_for_status()
            elementos = resposta.json()["contextResponses"][0]["contextElement"]["attributes"]
        except (requests.exceptions.RequestException, KeyError, IndexError, ValueError):
            return valores                                   # STH-Comet desligado ou sem assinatura
        if not elementos or not elementos[0]["values"]:
            return valores
        valores.extend(elementos[0]["values"])
        if len(elementos[0]["values"]) < PAGINA_HISTORICO:
            return valores
    return valores


def consultar_atual(config: dict, entidade: dict) -> dict:
    """Busca o valor mais recente da entidade no Orion."""
    url = f"http://{config['ip']}:{config['porta_orion']}/v2/entities/{entidade['id']}"
    resposta = requests.get(url, headers=cabecalhos_fiware(config), params={"options": "keyValues"}, timeout=8)
    resposta.raise_for_status()
    return resposta.json()


def horario_utc(marca: str) -> str:
    """Padroniza '2026-11-17T02:12:50.123Z' ou '...+00:00' para '2026-11-17T02:12:50Z'."""
    return marca.split(".")[0].replace("+00:00", "").rstrip("Z") + "Z"


def horario_do_orion(config: dict, entidade: dict) -> str | None:
    """Horário da última leitura que chegou ao Orion (atributo TimeInstant), ou None."""
    try:
        atual = consultar_atual(config, entidade)
    except requests.exceptions.RequestException:
        return None
    marca = atual.get("TimeInstant") or atual.get("dateModified")
    if marca:
        return horario_utc(marca)
    return None


def coletar_ao_vivo(config: dict, entidade: dict, nomes: dict, quantidade: int) -> dict:
    """Sem histórico no FIWARE, lê o valor atual no Orion várias vezes até juntar 'quantidade' leituras.
    Ctrl+C interrompe e fica com o que já foi coletado."""
    print(f"  Coletando {quantidade} leituras ao vivo no Orion, "
          f"uma a cada {INTERVALO_COLETA} s (Ctrl+C para parar antes)...")
    por_horario, anterior, sem_novidade = {}, None, 0
    try:
        while len(por_horario) < quantidade:
            atual = consultar_atual(config, entidade)
            marca = atual.get("TimeInstant") or atual.get("dateModified")
            horario = horario_utc(marca or datetime.now(timezone.utc).isoformat())
            if marca != anterior and horario not in por_horario:     # só conta leitura nova
                valores = {}
                for codigo, nome in nomes.items():
                    if codigo in "thm" and nome in atual:
                        valores[codigo] = float(atual[nome])
                por_horario[horario] = valores
                sem_novidade = 0
                print(f"   leitura {len(por_horario)}/{quantidade}: {valores.get('t', '?')} °C")
            else:
                sem_novidade += 1
                if sem_novidade >= 4:                                 # ~20 s sem leitura nova
                    print("   O sensor parou de enviar leituras novas (o Wokwi está rodando?).")
                    break
            anterior = marca
            if len(por_horario) < quantidade:
                time.sleep(INTERVALO_COLETA)
    except KeyboardInterrupt:
        print("   Coleta interrompida; usando as leituras já recebidas.")
    return por_horario


def servidor_ligado(config: dict, espera: float = 3) -> bool:
    """Pesquisa rápida: o servidor FIWARE responde? (consulta a versão do Orion)."""
    if requests is None or not config["ip"]:
        return False
    try:
        url = f"http://{config['ip']}:{config['porta_orion']}/version"
        return requests.get(url, timeout=espera).status_code == 200
    except requests.exceptions.RequestException:
        return False


def uma_por_minuto(por_horario: dict) -> dict:
    """O ESP32 envia a cada poucos segundos: do histórico, fica só a leitura mais recente de cada minuto
    (cerca de 60 leituras por hora), o suficiente para a Média 1h sem guardar centenas de leituras iguais."""
    ultima_do_minuto = {}
    for horario in ordenar_texto(list(por_horario.keys())):
        ultima_do_minuto[horario[:16]] = horario                 # "2026-11-18T21:48" -> horário mais recente
    resultado = {}
    for horario in ultima_do_minuto.values():
        resultado[horario] = por_horario[horario]
    return resultado


def ordenar_texto(lista: list) -> list:
    """Ordenação por inserção de uma lista de textos (mesma lógica de ordenar)."""
    copia = list(lista)
    for i in range(1, len(copia)):
        atual = copia[i]
        j = i - 1
        while j >= 0 and copia[j] > atual:
            copia[j + 1] = copia[j]
            j -= 1
        copia[j + 1] = atual
    return copia


def baixar_leituras_fiware(config: dict, ponto: dict, quantidade: int, ao_vivo: bool = True) -> list | None:
    """Monta leituras completas (temperatura, umidade e média móvel) a partir do FIWARE.
    Devolve None se o sensor não for encontrado no FIWARE."""
    entidade, nomes = descobrir_entidade(config, ponto["dispositivo"])
    if entidade is None:
        return None
    print(f"  Dispositivo {ponto['dispositivo']} -> entidade {entidade['id']}")

    # Histórico da última hora (com folga de 10 min), contada a partir do horário do Orion
    ultima_orion = horario_do_orion(config, entidade)
    referencia = datetime.now(timezone.utc)
    if ultima_orion:
        referencia = datetime.strptime(ultima_orion, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    desde = (referencia - JANELA_MEDIA - timedelta(minutes=10)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    por_horario = {}
    for codigo in ("t", "h", "m"):
        if codigo not in nomes:
            continue
        for valor in consultar_historico(config, entidade, nomes[codigo], desde):
            horario = valor["recvTime"].split(".")[0] + "Z"
            por_horario.setdefault(horario, {})[codigo] = float(valor["attrValue"])
    por_horario = uma_por_minuto(por_horario)

    if por_horario:
        ultima_historico = max(por_horario)
    else:
        ultima_historico = None
    texto_historico = "nenhuma"
    if ultima_historico:
        texto_historico = hora_texto(ultima_historico)
    texto_orion = "nenhuma"
    if ultima_orion:
        texto_orion = hora_texto(ultima_orion)
    print(f"  Última leitura no histórico (STH-Comet): {texto_historico}")
    print(f"  Última leitura no valor atual (Orion):   {texto_orion}")
    orion_mais_novo = ultima_orion is not None and (ultima_historico is None or ultima_orion > ultima_historico)
    if ao_vivo and (not por_horario or orion_mais_novo):
        if por_horario:
            print("  O histórico não está acompanhando as leituras novas; vou buscá-las direto no Orion.")
        por_horario.update(coletar_ao_vivo(config, entidade, nomes, quantidade))
    elif orion_mais_novo:
        print("  Há leituras mais novas chegando ao Orion: use a opção 2 para coletá-las.")

    leituras = []
    for horario, valores in por_horario.items():
        if "t" not in valores or "h" not in valores:
            continue                                         # leitura incompleta é descartada
        t, h = valores["t"], valores["h"]
        if FAIXA_TEMPERATURA[0] <= t <= FAIXA_TEMPERATURA[1] and FAIXA_UMIDADE[0] <= h <= FAIXA_UMIDADE[1]:
            leituras.append(criar_leitura(ponto["id"], t, h, "esp32_fiware", horario, valores.get("m")))
    return leituras


# =============================================================================
# EXIBIÇÃO
# =============================================================================
def titulo(texto: str, mostrar_voltar: bool = True) -> None:
    """Título de cada tela, com o lembrete de que "v" volta ao menu."""
    print("\n" + "=" * 72)
    print(f"  {texto}")
    print("=" * 72)
    if mostrar_voltar:
        print("  (digite v em qualquer pergunta para voltar ao menu)")


def opcao_invalida(mensagem: str = "Opção inválida.") -> None:
    """Avisa da opção inválida e espera o Enter; depois o programa volta ao menu."""
    print(f"  {mensagem}")
    input("  Pressione Enter para voltar ao menu...")


def subtitulo(texto: str) -> None:
    """Título de uma parte da tela."""
    print(f"\n  --- {texto} ---")


CABECALHO_LEITURAS = (f"  {'Data e hora':<17} {'Ponto':<6}{'Temp.':>9}{'Umidade':>9}{'Média 1h':>10}"
                      f"   {'Estado':<9}Origem")


def linha_leitura(leitura: dict) -> str:
    """Uma leitura formatada em colunas alinhadas com o cabeçalho CABECALHO_LEITURAS."""
    if "media_1h" in leitura:
        media = f"{leitura['media_1h']:.1f} °C"
    else:
        media = "-"
    return (f"  {hora_texto(leitura['timestamp']):<17} {leitura['ponto_id']:<6}"
            f"{leitura['temperatura']:>6.1f} °C{leitura['umidade']:>7.1f} %{media:>10}"
            f"   {NOMES_ESTADO[leitura['estado']]:<9}{NOMES_ORIGEM.get(leitura['origem'], leitura['origem'])}")


def mostrar_leituras(leituras: list, limite: int = 30) -> None:
    """Tabela de leituras, da mais recente para a mais antiga (no máximo 'limite' linhas)."""
    if not leituras:
        print("  Nenhuma leitura encontrada.")
        return
    ordenadas = ordenar(leituras, "timestamp", decrescente=True)
    print(CABECALHO_LEITURAS)
    print("  " + "-" * 82)
    for leitura in ordenadas[:limite]:
        print(linha_leitura(leitura))
    print("  Média 1h = média das temperaturas do ponto na hora anterior à leitura; o estado usa essa média.")
    if len(leituras) > limite:
        print(f"  ... mostrando as {limite} mais recentes de {len(leituras)}.")


# =============================================================================
# FUNCIONALIDADES DO MENU
# =============================================================================
def registrar_leitura(pontos: list, leituras: list) -> None:
    """Opção 1: medição de campo feita com termômetro portátil nos pontos sem sensor."""
    titulo("REGISTRAR MEDIÇÃO DE CAMPO")
    subtitulo("Quando usar")
    print("  Medição feita pela equipe de campo com termômetro portátil, nos pontos que ainda")
    print("  não têm sensor ESP32 ou quando o sensor do ponto está com defeito.\n")
    ponto = escolher_ponto(pontos)
    if ponto is None:
        return
    if ponto["dispositivo"]:
        print(f"  Este ponto tem sensor ({ponto['dispositivo']}); prefira a opção 2 para buscar as leituras dele.")
        if not ler_sim_nao("Registrar a medição de campo mesmo assim (sensor com defeito)?"):
            return
    temperatura = ler_numero("Temperatura (°C): ", *FAIXA_TEMPERATURA)
    if temperatura is None:
        return
    umidade = ler_numero("Umidade (%): ", *FAIXA_UMIDADE)
    if umidade is None:
        return
    horario = ler_data_hora("Data e hora (dd/mm/aaaa hh:mm, Enter = agora): ")
    if horario is None:
        return
    leitura = criar_leitura(ponto["id"], temperatura, umidade, "manual", horario)
    leituras.append(leitura)
    atualizar_media_ultima_hora(leituras)
    if salvar_json(ARQ_LEITURAS, leituras):
        subtitulo("Medição de campo registrada")
        mostrar_leituras([leitura])


def sincronizar(config: dict, ponto: dict, leituras: list, quantidade: int = LEITURAS_DO_SENSOR,
                ao_vivo: bool = True) -> list | None:
    """Renova as leituras do sensor do ponto: junta as novas com as salvas e guarda só as da última hora
    (contada a partir da leitura mais nova), que são as usadas na Média 1h. Medições de campo não são apagadas.
    Devolve as leituras novas, ou None se o FIWARE não respondeu
    (nesse caso as leituras salvas continuam valendo)."""
    try:
        novas = baixar_leituras_fiware(config, ponto, quantidade, ao_vivo)
    except requests.exceptions.ConnectionError:
        print("  Não foi possível conectar. O servidor FIWARE pode estar desligado ou o IP mudou.")
        print("  As leituras já salvas continuam disponíveis nas opções 3 a 6.")
        return None
    except requests.exceptions.Timeout:
        print("  O servidor demorou demais para responder. Tente de novo em alguns instantes.")
        return None
    except requests.exceptions.HTTPError as erro:
        print(f"  O FIWARE respondeu com erro ({erro.response.status_code}). "
              "Confira se o dispositivo está cadastrado no IoT Agent.")
        return None
    except (KeyError, IndexError, ValueError, TypeError):
        novas = None
    if novas is None:
        print("  Não foi possível identificar o sensor no FIWARE (cadastro ou formato diferente do esperado).")
        return None
    if not novas:
        if ao_vivo:
            print("  Nenhuma leitura nova chegou do sensor. As leituras salvas foram mantidas.")
        else:
            print(f"  {ponto['id']}: sem histórico no FIWARE. Use a opção 2 para coletar ao vivo.")
        return []
    # Junta as salvas com as recebidas (sem repetir horário) e fica só com as da última hora.
    # Uma leitura salva só sai quando chega outra pelo menos 1 hora MAIS NOVA que ela.
    salvas = buscar_leituras(leituras, ponto_id=ponto["id"], origem="esp32_fiware")
    por_horario = {}
    for leitura in salvas + novas:
        por_horario[leitura["timestamp"]] = leitura
    todas = ordenar(list(por_horario.values()), "timestamp")
    mais_nova = para_brasilia(todas[-1]["timestamp"])
    mais_recentes = []
    for leitura in todas:
        if mais_nova - para_brasilia(leitura["timestamp"]) <= JANELA_MEDIA:
            mais_recentes.append(leitura)
    horarios_antes = []
    for leitura in salvas:
        horarios_antes.append(leitura["timestamp"])
    entraram = []
    for leitura in mais_recentes:
        if leitura["timestamp"] not in horarios_antes:
            entraram.append(leitura)
    if not entraram:
        print(f"  {ponto['id']}: nenhuma leitura mais nova que as salvas. Nada foi alterado.")
        return []
    manter = []
    for leitura in leituras:
        if not (leitura["ponto_id"] == ponto["id"] and leitura["origem"] == "esp32_fiware"):
            manter.append(leitura)
    leituras.clear()
    leituras.extend(manter)
    leituras.extend(mais_recentes)
    atualizar_media_ultima_hora(leituras)
    if not salvar_json(ARQ_LEITURAS, leituras):
        return None
    print(f"  {ponto['id']}: {len(entraram)} leitura(s) nova(s) do sensor; ficaram as "
          f"{len(mais_recentes)} leituras da última hora.")
    guardar_backup(ponto, mais_recentes)
    return entraram


def guardar_backup(ponto: dict, leituras_sensor: list) -> None:
    """Guarda uma cópia da captura em backup_dados, com data e hora no nome (nunca sobrescreve outra)."""
    agora = para_brasilia(datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"))
    sensor = (ponto.get("dispositivo") or ponto["id"]).replace("-", "_")
    caminho = os.path.join(PASTA_BACKUP, f"leituras_{sensor}_{agora:%d-%m-%Y_%H%M}.json")
    if not os.path.exists(caminho) and salvar_json(caminho, leituras_sensor):
        print(f"  Cópia de segurança: backup_dados/{os.path.basename(caminho)}")


def restaurar_backup() -> list:
    """Se o arquivo principal não tem leituras, recupera a captura mais recente de backup_dados."""
    if not os.path.exists(PASTA_BACKUP):
        return []
    melhor = []
    mais_nova = ""
    for nome in os.listdir(PASTA_BACKUP):
        if not nome.endswith(".json"):
            continue
        dados = carregar_json(os.path.join(PASTA_BACKUP, nome), [])
        validas = []
        horarios = []
        for leitura in dados:
            if "timestamp" in leitura and "ponto_id" in leitura and "temperatura" in leitura:
                validas.append(leitura)
                horarios.append(leitura["timestamp"])
        if validas and max(horarios) > mais_nova:
            mais_nova = max(horarios)
            melhor = validas
    return melhor


def captura_embutida() -> list:
    """Último recurso: as leituras reais que vêm dentro do próprio código."""
    leituras = []
    for horario, temperatura, umidade, media, estado in CAPTURA_REAL_EMBUTIDA:
        leituras.append({"ponto_id": "P001", "temperatura": temperatura, "umidade": umidade,
                         "media_movel": media, "estado": estado, "origem": "esp32_fiware",
                         "timestamp": horario})
    return leituras


def verificar_sensor_ao_abrir(pontos: list, leituras: list, config: dict) -> None:
    """Na abertura: se o servidor estiver ligado, atualiza sozinho; se não, avisa e usa os dados salvos."""
    print("\nVerificando se o sensor do ClimaPonto está online...")
    if servidor_ligado(config):
        print(f"  Servidor FIWARE ligado ({config['ip']}). Atualizando as leituras...")
        for ponto in pontos:
            if ponto["dispositivo"]:
                sincronizar(config, ponto, leituras, ao_vivo=False)   # na abertura, sem espera
    elif leituras:
        ultima = ordenar(leituras, "timestamp")[-1]
        print(f"  Sensor offline: usando as {len(leituras)} leituras salvas "
              f"(a mais recente é de {hora_texto(ultima['timestamp'])}).")
        print("  Se o servidor foi ligado com outro IP, use a opção 2.")
    else:
        print("  Sensor offline e ainda não há leituras salvas. Use a opção 1 ou 2.")


def importar_do_sensor(pontos: list, leituras: list, config: dict) -> None:
    """Opção 2: busca as leituras reais do ESP32 na API do FIWARE."""
    titulo("BUSCAR LEITURAS DO SENSOR ESP32 (API DO FIWARE)")
    if requests is None:
        print("  A biblioteca requests não está instalada. Rode: pip install requests")
        return
    com_sensor = []
    for ponto in pontos:
        if ponto["dispositivo"]:
            com_sensor.append(ponto)
    if not com_sensor:
        print("  Nenhum ponto tem sensor cadastrado (opção 7).")
        return
    subtitulo("Como funciona")
    print("  O ESP32 envia as leituras por MQTT para o FIWARE (servidor na nuvem do grupo).")
    print("  O servidor só fica ligado durante os testes; o IP muda a cada vez que é ligado.\n")
    atual = config["ip"] or "nenhum"
    while True:
        ip = input(f"IP do servidor FIWARE (Enter = último usado: {atual}): ").strip() or config["ip"]
        if ip.lower() == VOLTAR:
            return
        partes = ip.split(".")
        valido = len(partes) == 4
        for parte in partes:
            if not parte.isdigit() or int(parte) > 255:
                valido = False
        if valido:
            break
        print("  IP inválido. Exemplo: 52.207.229.41")
    config["ip"] = ip
    if len(com_sensor) == 1:
        ponto = com_sensor[0]
    else:
        ponto = escolher_ponto(com_sensor)
    if ponto is None:
        return
    subtitulo("Consulta ao FIWARE")
    print("  Buscando a última hora de leituras do sensor...")
    adicionadas = sincronizar(config, ponto, leituras)
    if adicionadas is not None:
        salvar_json(ARQ_CONFIG, {"ip": config["ip"]})
    subtitulo(f"Leituras do sensor salvas para {ponto['id']} {ponto['nome']}")
    mostrar_leituras(buscar_leituras(leituras, ponto_id=ponto["id"], origem="esp32_fiware"), limite=10)


def painel(pontos: list, leituras: list) -> None:
    """Opção 3: estado atual de cada ponto, pela média da última hora."""
    titulo("PAINEL - ESTADO ATUAL DE CADA PONTO", mostrar_voltar=False)
    orientacao = {"normal": "Espera sem alerta", "atencao": "Calor: procure sombra e água",
                  "critico": "CALOR FORTE: evite esperar no sol"}
    print(f"  {'Ponto':<18}{'Temp.':>9}{'Média 1h':>10}   {'Estado':<9}{'Última leitura':<18}Orientação")
    print("  " + "-" * 92)
    for ponto in pontos:
        do_ponto = buscar_leituras(leituras, ponto_id=ponto["id"])
        nome = f"{ponto['id']} {ponto['nome']}"
        if not do_ponto:
            print(f"  {nome:<18}{'-':>9}{'-':>10}   {'-':<9}{'sem leituras':<18}-")
            continue
        ultima = ordenar(do_ponto, "timestamp")[-1]
        if "media_1h" in ultima:
            media = f"{ultima['media_1h']:.1f} °C"
        else:
            media = "-"
        print(f"  {nome:<18}{ultima['temperatura']:>6.1f} °C{media:>10}   {NOMES_ESTADO[ultima['estado']]:<9}"
              f"{hora_texto(ultima['timestamp']):<18}{orientacao[ultima['estado']]}")
    subtitulo("Regra de classificação")
    print(f"  Normal: abaixo de {LIMITES[0]:g} °C | Atenção: de {LIMITES[0]:g} °C | Crítico: de {LIMITES[1]:g} °C")
    print("  O estado é calculado pela média da última hora (Média 1h), não por uma leitura isolada.")
    subtitulo("Quanto da última hora a Média 1h cobre")
    for ponto in pontos:
        do_ponto = ordenar(buscar_leituras(leituras, ponto_id=ponto["id"]), "timestamp")
        if not do_ponto:
            continue
        fim = para_brasilia(do_ponto[-1]["timestamp"])
        na_hora = []
        for leitura in do_ponto:
            if fim - para_brasilia(leitura["timestamp"]) <= JANELA_MEDIA:
                na_hora.append(leitura)
        segundos = (fim - para_brasilia(na_hora[0]["timestamp"])).total_seconds()
        if segundos >= 60:
            periodo = f"{segundos / 60:.0f} min"
        else:
            periodo = f"{segundos:.0f} s"
        if segundos >= 50 * 60:
            aviso = ""
        else:
            aviso = "  (menos de 1 hora de dados: a média fica completa com o sensor ligado por 1 hora)"
        print(f"  {ponto['id']} {ponto['nome']:<12} {len(na_hora)} leitura(s) em {periodo}{aviso}")


def consultar(pontos: list, leituras: list) -> None:
    """Opção 4: consultas por ponto, por estado (busca linear) e por horário (busca binária)."""
    titulo("CONSULTAR LEITURAS")
    subtitulo("Como deseja consultar?")
    print("  1 - Por ponto\n  2 - Por estado\n  3 - Por ponto e estado\n  4 - Leitura mais próxima de um horário")
    print("  0 - Voltar ao menu")
    opcao = input("Escolha: ").strip().lower()
    match opcao:
        case "0" | "v":
            return
        case "1":
            ponto = escolher_ponto(pontos)
            if ponto:
                subtitulo("Leituras encontradas")
                mostrar_leituras(buscar_leituras(leituras, ponto_id=ponto["id"]))
        case "2" | "3":
            if opcao == "3":
                ponto = escolher_ponto(pontos)
            else:
                ponto = None
            if opcao == "3" and ponto is None:
                return
            estado = ler_texto("Estado (normal, atencao ou critico): ")
            if estado is None:
                return
            estado = estado.lower().replace("ç", "c").replace("ã", "a").replace("í", "i")
            if estado not in NOMES_ESTADO:
                print("  Estado inválido.")
                return
            criterios = {"estado": estado}
            if ponto:
                criterios["ponto_id"] = ponto["id"]
            subtitulo("Leituras encontradas")
            mostrar_leituras(buscar_leituras(leituras, **criterios))
        case "4":
            ponto = escolher_ponto(pontos)
            if ponto is None:
                return
            do_ponto = ordenar(buscar_leituras(leituras, ponto_id=ponto["id"]), "timestamp")
            if not do_ponto:
                print("  Esse ponto não tem leituras.")
                return
            alvo = ler_data_hora("Horário procurado (dd/mm/aaaa hh:mm): ")
            if alvo is None:
                return
            subtitulo("Leitura mais próxima do horário procurado")
            mostrar_leituras([do_ponto[busca_binaria_horario(do_ponto, alvo)]])
        case _:
            opcao_invalida()


def estatisticas(pontos: list, leituras: list) -> None:
    """Opção 5: resumo, ranking e matriz por período do dia, com relatório .txt opcional."""
    titulo("ESTATÍSTICAS POR PONTO", mostrar_voltar=False)
    subtitulo("Resumo de cada ponto")
    relatorio = [f"ClimaPonto - Relatório de estatísticas ({datetime.now():%d/%m/%Y %H:%M})", ""]
    resumos = []
    for ponto in pontos:
        do_ponto = buscar_leituras(leituras, ponto_id=ponto["id"])
        if not do_ponto:
            continue
        temperaturas = []
        for leitura in do_ponto:
            temperaturas.append(leitura["temperatura"])
        minimo, maximo, media = resumo_numerico(*temperaturas)
        estados = contar_estados(do_ponto)
        resumos.append({"ponto": ponto, "media": media})
        texto = [f"{ponto['id']} {ponto['nome']} - {len(do_ponto)} leitura(s)",
                 f"   Temperatura: mínima {minimo:.1f} °C | média {media:.1f} °C | máxima {maximo:.1f} °C",
                 f"   Estados: normal {estados['normal']} | atenção {estados['atencao']} | crítico {estados['critico']}"]
        for linha in texto:
            print("  " + linha)
        relatorio += texto
    if not resumos:
        print("  Ainda não há leituras. Use a opção 1 ou 2.")
        return

    subtitulo("Ranking dos pontos mais quentes (temperatura média)")
    relatorio += ["", "Ranking dos pontos mais quentes (temperatura média)"]
    ranking = ordenar(resumos, "media", decrescente=True)
    for i in range(len(ranking)):
        item = ranking[i]
        linha = f"   {i + 1}º {item['ponto']['id']} {item['ponto']['nome']:<12} {item['media']:.1f} °C"
        print("  " + linha)
        relatorio.append(linha)

    subtitulo("Temperatura média por período do dia (°C)")
    cabecalho = "   " + f"{'Ponto':<18}"
    for nome, inicio, fim in PERIODOS_DIA:
        cabecalho += f"{nome:>11}"
    print("  " + cabecalho)
    relatorio += ["", "Temperatura média por período do dia (°C)", cabecalho]
    matriz = matriz_periodos(pontos, leituras)
    for i in range(len(matriz)):
        linha_matriz = matriz[i]
        if linha_matriz.count(None) == len(linha_matriz):
            continue
        celulas = ""
        for valor in linha_matriz:
            if valor is None:
                celulas += f"{'-':>11}"
            else:
                celulas += f"{valor:>11.1f}"
        linha = f"   {pontos[i]['id'] + ' ' + pontos[i]['nome']:<18}{celulas}"
        print("  " + linha)
        relatorio.append(linha)

    if ler_sim_nao("\nDeseja salvar este relatório em arquivo de texto?"):
        caminho = exportar_relatorio_txt(relatorio, "estatisticas")
        if caminho:
            print(f"  Relatório salvo em {os.path.relpath(caminho, PASTA)}")


def tendencia(pontos: list, leituras: list) -> None:
    """Opção 6: o ponto está esquentando? Variação, velocidade e previsão de mudança de estado."""
    titulo("TENDÊNCIA - O PONTO ESTÁ ESQUENTANDO?")
    ponto = escolher_ponto(pontos)
    if ponto is None:
        return
    resultado = calcular_tendencia(buscar_leituras(leituras, ponto_id=ponto["id"]))
    if resultado is None:
        print("  São necessárias pelo menos 2 leituras em horários diferentes.")
        return
    ultima, taxa = resultado["ultima"], resultado["taxa"]
    minutos = resultado["horas"] * 60
    if minutos >= 1:
        duracao = f"{minutos:.0f} minutos"
    else:
        duracao = f"{minutos * 60:.0f} segundos"
    subtitulo(f"Resultado para {ponto['id']} {ponto['nome']}")
    print(f"  Últimas {resultado['n']} leituras, em {duracao}.")
    print(f"  Agora: {ultima['temperatura']:.1f} °C ({NOMES_ESTADO[ultima['estado']]})")
    variacao = ultima["temperatura"] - resultado["primeira"]["temperatura"]
    print(f"  Variação: {variacao:+.1f} °C em {duracao}")
    if minutos >= 10:
        print(f"  Velocidade: {taxa:+.2f} °C por hora  (taxa = variação da temperatura ÷ tempo)")
    else:
        print("  (intervalo curto: a velocidade em °C por hora não é mostrada para não exagerar a tendência)")
    if abs(taxa) < 0.1:
        print("  -> Temperatura estável.")
    elif taxa < 0:
        print("  -> O ponto está esfriando.")
    elif resultado["previsao"]:
        limite, minutos_ate = resultado["previsao"]
        if limite == LIMITES[0]:
            estado = "ATENÇÃO"
        else:
            estado = "CRÍTICO"
        print(f"  -> Esquentando: no ritmo atual, chega a {limite:g} °C ({estado}) em cerca de {minutos_ate:.0f} min.")
    else:
        print("  -> Esquentando, e já está no estado crítico.")


def gerenciar_pontos(pontos: list, leituras: list) -> None:
    """Opção 7: cadastrar, editar e remover pontos de ônibus."""
    titulo("PONTOS DE ÔNIBUS")
    subtitulo("Pontos cadastrados")
    print(f"  {'Código':<8}{'Nome':<16}{'Região':<20}Sensor no FIWARE")
    print("  " + "-" * 62)
    for ponto in pontos:
        sensor = ponto["dispositivo"] or "sem sensor"
        print(f"  {ponto['id']:<8}{ponto['nome']:<16}{ponto['regiao']:<20}{sensor}")
    subtitulo("O que deseja fazer?")
    print("  1 - Cadastrar  2 - Editar  3 - Remover  0 - Voltar ao menu")
    match input("Escolha: ").strip().lower():
        case "1":
            numeros = [0]
            for ponto in pontos:
                numeros.append(int(ponto["id"][1:]))
            numero = max(numeros) + 1
            nome = ler_texto("Nome do ponto: ")
            regiao = None
            sensor = None
            if nome is not None:
                regiao = ler_texto("Região: ")
            if regiao is not None:
                sensor = ler_texto("Código do sensor no FIWARE (Enter se não tiver): ", obrigatorio=False)
            if sensor is None:
                return
            novo = {"id": f"P{numero:03d}", "nome": nome, "regiao": regiao, "dispositivo": sensor}
            pontos.append(novo)
            salvar_json(ARQ_PONTOS, pontos)
            print(f"  Ponto {novo['id']} cadastrado.")
        case "2":
            ponto = escolher_ponto(pontos)
            if ponto:
                print("  (Enter mantém o valor atual; no sensor, digite - para tirar o sensor do ponto)")
                alteracoes = {}                                  # só aplica no fim (v cancela tudo)
                for campo in ("nome", "regiao", "dispositivo"):
                    novo_valor = input(f"{campo.capitalize()} [{ponto[campo]}]: ").strip()
                    if novo_valor.lower() == VOLTAR:
                        print("  Edição cancelada. Nada foi alterado.")
                        return
                    if campo == "dispositivo" and novo_valor == "-":
                        alteracoes[campo] = ""
                    elif novo_valor:
                        alteracoes[campo] = novo_valor
                ponto.update(alteracoes)
                salvar_json(ARQ_PONTOS, pontos)
                print("  Ponto atualizado.")
        case "3":
            ponto = escolher_ponto(pontos)
            if ponto is None:
                return
            quantas = len(buscar_leituras(leituras, ponto_id=ponto["id"]))
            if ler_sim_nao(f"Remover {ponto['id']} {ponto['nome']} e suas {quantas} leitura(s)?"):
                pontos.remove(ponto)
                manter = []
                for leitura in leituras:
                    if leitura["ponto_id"] != ponto["id"]:
                        manter.append(leitura)
                leituras.clear()
                leituras.extend(manter)
                salvar_json(ARQ_PONTOS, pontos)
                salvar_json(ARQ_LEITURAS, leituras)
                print("  Ponto removido.")
        case "0" | "v":
            return
        case _:
            opcao_invalida()


# =============================================================================
# MENU PRINCIPAL
# =============================================================================
def mostrar_menu(total_leituras: int) -> None:
    """Menu principal."""
    titulo(f"CLIMAPONTO | CENTRAL DE LEITURAS   ({total_leituras} leituras salvas)", mostrar_voltar=False)
    print("  1 - Registrar medição de campo (pontos sem sensor)")
    print("  2 - Buscar leituras do sensor ESP32 (API do FIWARE)")
    print("  3 - Painel: estado atual de cada ponto")
    print("  4 - Consultar leituras (por ponto, estado ou horário)")
    print("  5 - Estatísticas por ponto e ranking dos mais quentes")
    print("  6 - Tendência: o ponto está esquentando?")
    print("  7 - Pontos de ônibus (cadastrar, editar, remover)")
    print("  0 - Sair")


def main() -> None:
    """Carrega os dados, verifica o sensor e mantém o menu rodando até o usuário sair."""
    pontos = carregar_json(ARQ_PONTOS, [])
    if not pontos:
        pontos = []
        for ponto in PONTOS_INICIAIS:
            pontos.append(dict(ponto))
        salvar_json(ARQ_PONTOS, pontos)
    leituras = carregar_json(ARQ_LEITURAS, [])
    if not leituras:
        leituras, fonte = restaurar_backup(), "da cópia de segurança (backup_dados)"
        if not leituras:
            leituras, fonte = captura_embutida(), "da captura real que vem no código (16/11/2026)"
        salvar_json(ARQ_LEITURAS, leituras)
        print(f"\n  [AVISO] Não havia leituras salvas: {len(leituras)} leituras reais do sensor"
              f" foram carregadas {fonte}.")
    atualizar_media_ultima_hora(leituras)
    config = dict(CONFIG_PADRAO)
    config["ip"] = str(carregar_json(ARQ_CONFIG, {}).get("ip", ""))
    verificar_sensor_ao_abrir(pontos, leituras, config)

    while True:
        mostrar_menu(len(leituras))
        opcao = input("Escolha uma opção: ").strip()
        match opcao:
            case "1":
                registrar_leitura(pontos, leituras)
            case "2":
                importar_do_sensor(pontos, leituras, config)
            case "3":
                painel(pontos, leituras)
            case "4":
                consultar(pontos, leituras)
            case "5":
                estatisticas(pontos, leituras)
            case "6":
                tendencia(pontos, leituras)
            case "7":
                gerenciar_pontos(pontos, leituras)
            case "0":
                print("\nAté logo! Dados salvos em", os.path.relpath(PASTA_DADOS, os.getcwd()))
                break
            case _:
                opcao_invalida("Opção inválida. Digite um número de 0 a 7.")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\n\nPrograma encerrado.")
