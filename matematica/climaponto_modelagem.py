"""
=============================================================================
 CLIMAPONTO - Modelagem matemática do calor em pontos de ônibus
 Global Solution FIAP 2026.2 | Engenharia de Software 1º ano
 Disciplina: Differentiated Problem Solving
=============================================================================
 Equipe Debuggers
   Enrico Vieira de Almeida Vidal - RM 569217
   Guilherme De Rosa Peres        - RM 569193
   Vinícius Fuentes Cavalcanti    - RM 570818

 O que este programa faz
   - Menu para escolher o ponto de ônibus (localidade) e o período analisado.
   - Modelo e limites: variáveis, função ajustada aos dados reais e limites.
   - Derivadas: crescimento/decrescimento, pontos críticos e taxa de variação.
   - Integrais: área sob a curva e calor acumulado (graus-hora).
   - Gráficos com matplotlib: abrem na tela e, se o usuário quiser, são salvos em "figuras".
   - Leitura do sensor ClimaPonto (ESP32), parte de Edge Computing da solução
     integrada (nesta versão, leitura de demonstração: ver seção 4).

 De onde vêm os dados (é preciso internet na primeira execução)
   Medições REAIS de temperatura do ar das estações automáticas do INMET.
   1) Repositório do grupo no GitHub: um robô baixa os arquivos oficiais do INMET
      todo mês e publica só as 3 estações usadas (~230 KB). Download em segundos.
   2) Reserva: se o GitHub falhar, o programa baixa direto do portal do INMET
      (arquivos anuais com todas as estações do Brasil; demora mais).
   Os dados ficam guardados na pasta "dados_cache": nas próximas execuções o
   programa funciona até sem internet.

 Como executar
   pip install numpy sympy matplotlib
   python climaponto_modelagem.py
=============================================================================
"""

import json
import math
import random
import sys
import tempfile
import unicodedata
import urllib.error
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import sympy as sp
import matplotlib.pyplot as plt
from matplotlib.patches import Patch

# =============================================================================
# 0. CONFIGURAÇÃO
# =============================================================================
LIMIAR_ATENCAO = 30.0   # °C - estado "atenção" (regra do ClimaPonto)
LIMIAR_CRITICO = 35.0   # °C - estado "crítico"
JANELA_EXPOSICAO = (11.0, 17.0)  # horas de maior calor nos pontos
HORA_LIMITE = 7.0                # 7h: pico de passageiros pela manhã
INTERVALO_SENSOR_MIN = 10        # o ESP32 mede a cada 10 min (resultado do cálculo de limite)

# Pontos de ônibus monitorados e a estação do INMET usada como referência (tupla de dicionários)
PONTOS = (
    {"id": "P001", "nome": "Santana", "regiao": "Zona Norte", "estacao": "A701",
     "referencia": "INMET A701 - Mirante de Santana"},
    {"id": "P002", "nome": "Interlagos", "regiao": "Zona Sul", "estacao": "A771",
     "referencia": "INMET A771 - Interlagos"},
    {"id": "P003", "nome": "Barueri", "regiao": "Grande SP", "estacao": "A755",
     "referencia": "INMET A755 - Barueri"},
)
PERIODO_RELATORIO = (datetime(2025, 11, 1), datetime(2026, 11, 1))  # período do relatório PDF

URL_DADOS = "https://raw.githubusercontent.com/DebuggersGS/ClimaPonto-DPS/main/dados/inmet_sp.json"
API_CLIMAPONTO = None  # endereço da API do backend do ClimaPonto (ainda não publicado)
TAMANHO_MAXIMO = 20 * 1024 * 1024   # recusa respostas maiores que 20 MB
FAIXA_VALIDA = (-5.0, 45.0)         # °C fisicamente possíveis em São Paulo

URL_INMET = "https://portal.inmet.gov.br/uploads/dadoshistoricos/{ano}.zip"
ANO_INICIAL = 2025

PASTA = Path(__file__).resolve().parent
CACHE = PASTA / "dados_cache" / "inmet_sp.json"
PASTA_FIG = PASTA / "figuras"

ESTACOES_ANO = ("Primavera", "Verão", "Outono", "Inverno")
MESES_ESTACAO = {"Primavera": (9, 10, 11), "Verão": (12, 1, 2),
                 "Outono": (3, 4, 5), "Inverno": (6, 7, 8)}
CORES = {"Primavera": "#2a78d6", "Verão": "#eb6834", "Outono": "#1baf7a", "Inverno": "#eda100"}
COR_ATENCAO, COR_CRITICO = "#fab219", "#d03b3b"
NOMES_MES = ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")

t = sp.symbols("t", real=True)   # hora do dia (h)
d = sp.symbols("d", real=True)   # dias desde o início do período


def titulo(texto):
    print("\n" + "=" * 78)
    print(texto)
    print("=" * 78)


def hora_formatada(h):
    """Converte horas decimais em texto: 13.38 -> '13h23'."""
    h = h % 24
    horas, minutos = int(h), int(round((h - int(h)) * 60))
    if minutos == 60:
        horas, minutos = horas + 1, 0
    return f"{horas:02d}h{minutos:02d}"


def classificar_temperatura(temp, limite_atencao=LIMIAR_ATENCAO, limite_critico=LIMIAR_CRITICO):
    """Regra única de estados do ClimaPonto (a mesma do ESP32 e do painel web)."""
    if temp is None:
        return "sem_dados"
    elif temp >= limite_critico:
        return "critico"
    elif temp >= limite_atencao:
        return "atencao"
    else:
        return "normal"


# =============================================================================
# 1. DADOS: base leve do GitHub do grupo (com cópia local)
# =============================================================================
def abrir_https(url, tempo_limite):
    """Abre só endereços https:// (bloqueia file:// e outros esquemas inesperados)."""
    if not url.startswith("https://"):
        raise ValueError(f"endereço não permitido: {url}")
    pedido = urllib.request.Request(url, headers={"User-Agent": "ClimaPonto"})
    return urllib.request.urlopen(pedido, timeout=tempo_limite)  # nosec B310 - esquema verificado acima


def validar_base(base):
    """Confere a estrutura do JSON antes de usar (o arquivo vem da internet ou do disco).
    Estações mal formadas são descartadas; valores que não são número, infinitos ou fora
    da faixa física viram None (hora sem leitura). Lança ValueError se nada sobrar."""
    if not isinstance(base, dict) or not isinstance(base.get("estacoes"), dict):
        raise ValueError("JSON sem a chave 'estacoes'")
    limpas, descartados = {}, 0
    for codigo, estacao in base["estacoes"].items():
        try:
            datetime.strptime(estacao["inicio"], "%Y-%m-%dT%H:%M")
            temperaturas = estacao["temperaturas"]
            if not isinstance(temperaturas, list):
                continue
        except (KeyError, TypeError, ValueError):
            continue
        valores = []
        for v in temperaturas:
            if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) \
                    and FAIXA_VALIDA[0] <= v <= FAIXA_VALIDA[1]:
                valores.append(float(v))
            else:
                valores.append(None)
                descartados += v is not None
        limpas[str(codigo)] = {**estacao, "temperaturas": valores}
    if not limpas:
        raise ValueError("nenhuma estação válida no JSON")
    if descartados:
        print(f"  Aviso: {descartados} valores inválidos foram ignorados nos dados.")
    return {**base, "estacoes": limpas}


def baixar_json_github():
    with abrir_https(URL_DADOS, 15) as resposta:
        conteudo = resposta.read(TAMANHO_MAXIMO + 1)
    if len(conteudo) > TAMANHO_MAXIMO:
        raise ValueError("resposta grande demais")
    return validar_base(json.loads(conteudo.decode("utf-8")))


def ler_csv_inmet(texto, base):
    """Acrescenta à base as leituras de um CSV anual do INMET (UTC -> horário de Brasília)."""
    linhas = texto.splitlines()
    codigo = next((l.split(";")[1].strip() for l in linhas[:8] if l.startswith("CODIGO")), None)
    nome = next((l.split(";")[1].strip() for l in linhas[:8] if l.startswith("ESTACAO")), codigo)
    leituras = base.setdefault(codigo, {"nome": nome, "leituras": {}})["leituras"]
    for linha in linhas[9:]:
        p = linha.split(";")
        try:
            instante = datetime.strptime(p[0].replace("-", "/") + p[1][:2], "%Y/%m/%d%H") - timedelta(hours=3)
            temp = float(p[7].replace(",", "."))
        except (IndexError, ValueError):
            continue
        if FAIXA_VALIDA[0] <= temp <= FAIXA_VALIDA[1]:
            leituras[instante] = temp


def baixar_do_inmet():
    """Reserva: baixa os arquivos anuais oficiais do INMET e separa só as estações dos pontos."""
    codigos = {p["estacao"] for p in PONTOS}
    brutas = {}
    for ano in range(ANO_INICIAL, datetime.now().year + 1):
        print(f"  Baixando {URL_INMET.format(ano=ano)} (pode levar alguns minutos)...")
        with tempfile.TemporaryFile() as tmp:
            try:
                with abrir_https(URL_INMET.format(ano=ano), 300) as resposta:
                    while bloco := resposta.read(1 << 20):
                        tmp.write(bloco)
                tmp.seek(0)
                with zipfile.ZipFile(tmp) as pacote:
                    for info in pacote.infolist():
                        if info.filename.lower().endswith(".csv") and info.file_size < 50 * 1024 ** 2 \
                                and any(f"_{c}_" in info.filename for c in codigos):
                            ler_csv_inmet(pacote.read(info).decode("latin-1"), brutas)
            except (urllib.error.URLError, TimeoutError, OSError, ValueError, zipfile.BadZipFile) as erro:
                print(f"  Ano {ano} indisponível: {erro}")
    estacoes = {}
    for codigo, info in brutas.items():
        if not info["leituras"]:
            continue
        inicio, fim = min(info["leituras"]), max(info["leituras"])
        horas = int((fim - inicio).total_seconds() // 3600) + 1
        estacoes[codigo] = {"nome": info["nome"], "inicio": inicio.strftime("%Y-%m-%dT%H:%M"),
                            "temperaturas": [info["leituras"].get(inicio + timedelta(hours=i)) for i in range(horas)]}
    return validar_base({"estacoes": estacoes})


def salvar_cache(base):
    try:
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(base, ensure_ascii=False), encoding="utf-8")
    except OSError:
        pass   # sem permissão de escrita: só não guarda a cópia


def obter_base():
    """1) GitHub do grupo  2) cópia local de execuções anteriores  3) portal oficial do INMET."""
    print("Buscando dados do INMET no repositório do grupo...")
    try:
        base = baixar_json_github()
        salvar_cache(base)
        return base, "GitHub do grupo (dados INMET)"
    except (urllib.error.URLError, TimeoutError, OSError, ValueError):
        pass
    try:
        return validar_base(json.loads(CACHE.read_text(encoding="utf-8"))), "cópia local (dados_cache)"
    except (OSError, ValueError):
        pass
    print("GitHub indisponível. Usando o portal oficial do INMET (reserva).")
    try:
        base = baixar_do_inmet()
        salvar_cache(base)
        return base, "portal do INMET"
    except ValueError:
        sys.exit("Não foi possível obter os dados: verifique a conexão com a internet e tente de novo.")


def serie_da_estacao(base, codigo):
    """Lista (data e hora local, temperatura °C) de uma estação, sem as horas vazias."""
    estacao = base["estacoes"].get(codigo)
    if estacao is None:
        return []
    inicio = datetime.strptime(estacao["inicio"], "%Y-%m-%dT%H:%M")
    return [(inicio + timedelta(hours=i), v) for i, v in enumerate(estacao["temperaturas"]) if v is not None]


def definir_periodo(serie, modo):
    """'relatorio' = nov/2025 a out/2026 (período do relatório).
    'recente' = os 12 meses completos mais recentes COM DADOS SUFICIENTES: se o sensor do
    INMET ficou parado (acontece), o período recua mês a mês até achar um ano válido."""
    if modo == "relatorio":
        return PERIODO_RELATORIO
    fim = (serie[-1][0] + timedelta(hours=4)).replace(day=1, hour=0)  # tolera as últimas horas vazias
    for _ in range(36):
        inicio = fim.replace(year=fim.year - 1)
        if dados_suficientes(recortar(serie, inicio, fim), inicio, fim)[0]:
            return inicio, fim
        fim = (fim - timedelta(days=1)).replace(day=1)
    return (serie[-1][0] + timedelta(hours=4)).replace(day=1, hour=0).replace(
        year=serie[-1][0].year - 1), (serie[-1][0] + timedelta(hours=4)).replace(day=1, hour=0)


def recortar(serie, inicio, fim):
    return [(instante, v) for instante, v in serie if inicio <= instante < fim]


def estacao_do_mes(mes):
    for nome, meses in MESES_ESTACAO.items():
        if mes in meses:
            return nome
    raise ValueError(mes)


def perfil_medio(dados, estacao):
    """Temperatura média de cada hora do dia (0 a 23 h) na estação do ano."""
    grupos = defaultdict(list)
    for instante, temp in dados:
        if estacao_do_mes(instante.month) == estacao:
            grupos[instante.hour].append(temp)
    return np.arange(24.0), np.array([np.mean(grupos[h]) for h in range(24)])


def dias_completos(dados):
    """Dias que têm as 24 leituras horárias."""
    por_dia = defaultdict(dict)
    for instante, temp in dados:
        por_dia[instante.date()][instante.hour] = temp
    return {dia: np.array([h[k] for k in range(24)]) for dia, h in por_dia.items() if len(h) == 24}


def dia_mais_quente(dados, estacao):
    candidatos = {dia: v for dia, v in dias_completos(dados).items()
                  if estacao_do_mes(dia.month) == estacao}
    dia = max(candidatos, key=lambda k: candidatos[k].max())
    return dia, np.arange(24.0), candidatos[dia]


# =============================================================================
# 2. MODELO: série de Fourier ajustada por mínimos quadrados
#    T(t) = a0 + a1 cos(πt/12) + b1 sen(πt/12) + a2 cos(πt/6) + b2 sen(πt/6)
# =============================================================================
def ajustar_fourier(horas, temps):
    """Mínimos quadrados: encontra a0, a1, b1, a2, b2 que melhor descrevem os dados."""
    w = 2 * np.pi / 24
    matriz = np.column_stack([np.ones_like(horas),
                              np.cos(w * horas), np.sin(w * horas),
                              np.cos(2 * w * horas), np.sin(2 * w * horas)])
    coef, *_ = np.linalg.lstsq(matriz, temps, rcond=None)
    return coef


def funcao_simbolica(coef):
    """Monta T(t) no sympy para calcular limites, derivadas e integrais exatos."""
    a0, a1, b1, a2, b2 = [sp.Float(round(c, 4)) for c in coef]
    return (a0 + a1 * sp.cos(sp.pi * t / 12) + b1 * sp.sin(sp.pi * t / 12)
            + a2 * sp.cos(sp.pi * t / 6) + b2 * sp.sin(sp.pi * t / 6))


def ajustar_anual(dados, inicio):
    """Ciclo do ano: Tm(d) = m + c cos(2πd/365) + s sen(2πd/365), nas médias diárias."""
    completos = dias_completos(dados)
    dias = sorted(completos)
    x = np.array([(dia - inicio.date()).days for dia in dias], dtype=float)
    y = np.array([completos[dia].mean() for dia in dias])
    w = 2 * np.pi / 365
    coef, *_ = np.linalg.lstsq(np.column_stack([np.ones_like(x), np.cos(w * x), np.sin(w * x)]),
                               y, rcond=None)
    m, c, s = [sp.Float(round(v, 4)) for v in coef]
    return x, y, coef, m + c * sp.cos(2 * sp.pi * d / 365) + s * sp.sin(2 * sp.pi * d / 365)


def qualidade(observado, previsto):
    """R² e erro médio quadrático (RMSE, °C)."""
    residuo = observado - previsto
    r2 = 1 - np.sum(residuo ** 2) / np.sum((observado - observado.mean()) ** 2)
    return float(r2), float(np.sqrt(np.mean(residuo ** 2)))


def raizes(expr, var, a, b, passos=2401):
    """Raízes de expr = 0 em [a, b): procura troca de sinal na malha e refina por bisseção
    (método que sempre converge quando há troca de sinal)."""
    f = sp.lambdify(var, expr, "math")
    xs = np.linspace(a, b, passos)
    ys = [f(float(x)) for x in xs]
    encontradas = []
    for i in range(len(xs) - 1):
        esq, dir_, fe = float(xs[i]), float(xs[i + 1]), ys[i]
        if fe == 0:
            r = esq
        elif fe * ys[i + 1] < 0:
            for _ in range(60):
                meio = (esq + dir_) / 2
                if fe * f(meio) <= 0:
                    dir_ = meio
                else:
                    esq, fe = meio, f(meio)
            r = (esq + dir_) / 2
        else:
            continue
        if a <= r < b and all(abs(r - q) > 1e-6 for q in encontradas):
            encontradas.append(r)
    return sorted(encontradas)


def trapezio(f, a, b, n=20001):
    """Integral numérica pela regra do trapézio (usada para conferir as integrais exatas)."""
    x = np.linspace(a, b, n)
    y = np.broadcast_to(np.asarray(f(x), dtype=float), x.shape)   # função constante devolve escalar
    return float(np.sum((y[1:] + y[:-1]) / 2 * np.diff(x)))


def construir_modelos(dados, inicio, fim, ponto):
    modelos = {"perfis": {}, "quentes": {}, "dados": dados, "inicio": inicio, "fim": fim, "ponto": ponto}
    for est in ESTACOES_ANO:
        horas, medias = perfil_medio(dados, est)
        coef = ajustar_fourier(horas, medias)
        expr = funcao_simbolica(coef)
        r2, rmse = qualidade(medias, sp.lambdify(t, expr, "numpy")(horas))
        modelos["perfis"][est] = dict(horas=horas, temps=medias, coef=coef, expr=expr, r2=r2, rmse=rmse)
        dia, horas2, temps2 = dia_mais_quente(dados, est)
        coef2 = ajustar_fourier(horas2, temps2)
        expr2 = funcao_simbolica(coef2)
        r2b, rmseb = qualidade(temps2, sp.lambdify(t, expr2, "numpy")(horas2))
        modelos["quentes"][est] = dict(dia=dia, horas=horas2, temps=temps2, coef=coef2, expr=expr2,
                                       r2=r2b, rmse=rmseb)
    x, y, coef_a, expr_a = ajustar_anual(dados, inicio)
    r2a, rmsea = qualidade(y, sp.lambdify(d, expr_a, "numpy")(x))
    modelos["anual"] = dict(x=x, y=y, coef=coef_a, expr=expr_a, r2=r2a, rmse=rmsea)
    return modelos


def secao(pergunta, explicacao=()):
    """Título da análise em forma de pergunta + explicação curta em linguagem simples."""
    titulo(pergunta)
    for linha in explicacao:
        print(f"  {linha}")


def resumo(*itens):
    print("\n  EM RESUMO")
    for item in itens:
        print(f"     {item.strip()}" if item.startswith("   ") else f"  -> {item}")


def faixas(intervalos, tipo):
    """Junta os trechos crescentes/decrescentes do dia, emendando o que passa da meia-noite."""
    trechos = [[a, b] for a, b, k in intervalos if k == tipo]
    if len(trechos) > 1 and trechos[0][0] == 0.0 and trechos[-1][1] == 24.0:
        trechos[-1][1] = trechos.pop(0)[1] + 24
    return " e ".join(f"das {hora_formatada(a)} às {hora_formatada(b)}" for a, b in trechos) or "nunca"


def mes_ano(chave):
    return f"{NOMES_MES[chave[1] - 1]}/{chave[0]}"



# =============================================================================
# 3. VERIFICAÇÃO DOS LIMIARES 30 °C / 35 °C NOS DADOS REAIS
# =============================================================================
def verificar_limiares(modelos):
    dados = modelos["dados"]
    temps = np.array([v for _, v in dados])
    por_dia, por_hora = defaultdict(list), defaultdict(int)
    for instante, v in dados:
        por_dia[instante.date()].append(v)
        if v >= LIMIAR_ATENCAO:
            por_hora[instante.hour] += 1
    tmax = np.array([max(v) for v in por_dia.values()])
    h30, h35 = int(np.sum(temps >= 30)), int(np.sum(temps >= 35))
    total_horas = int((modelos["fim"] - modelos["inicio"]).total_seconds() // 3600)
    na_janela = sum(n for h, n in por_hora.items() if 11 <= h <= 17) / h30 * 100 if h30 else 0.0
    pct30 = h30 / len(temps) * 100
    ponto = modelos["ponto"]

    secao("DADOS REAIS - COM QUE FREQUÊNCIA O CALOR PASSA DE 30 °C E DE 35 °C?",
          (f"Medições de hora em hora da estação {ponto['referencia']},",
           f"de {modelos['inicio']:%d/%m/%Y} a {modelos['fim'] - timedelta(days=1):%d/%m/%Y}."))
    print(f"\n  Horas com medição: {len(temps)} de {total_horas} ({len(temps) / total_horas * 100:.1f} %)")
    print(f"  Temperatura: mínima {temps.min():.1f} °C | média {temps.mean():.1f} °C | máxima {temps.max():.1f} °C")
    print(f"\n  {'Estado do ClimaPonto':<26}{'Horas no período':>18}{'Dias em que aconteceu':>24}")
    for nome, horas_lim, limiar in (("Atenção (30 °C ou mais)", h30, 30), ("Crítico (35 °C ou mais)", h35, 35)):
        pct = horas_lim / len(temps) * 100
        texto_pct = f"{pct:.1f} %" if pct >= 0.1 or pct == 0 else f"{pct:.2f} %"
        print(f"  {nome:<26}{horas_lim:>9} ({texto_pct:>6}){int(np.sum(tmax >= limiar)):>15} dias")
    if h30:
        print(f"\n  {na_janela:.1f} % das horas acima de 30 °C aconteceram entre 11h e 17h.")
    resumo(f"30 °C só é passado em {pct30:.1f} % das horas: o alerta de atenção aparece nos momentos",
           "   realmente quentes, sem tocar o tempo todo.",
           f"35 °C é um extremo raro ({h35} h no período): bom limite para o estado crítico.")
    return dict(temps=temps, por_hora=por_hora, h30=h30, h35=h35, na_janela=na_janela, pct30=pct30)


# =============================================================================
# 4. SENSOR CLIMAPONTO (ESP32) - Edge Computing & Computer Systems
# =============================================================================
def receber_leituras_esp32(ponto, modelos, quantidade=6):
    """Últimas leituras do sensor instalado no ponto.

    COMO FUNCIONA NA SOLUÇÃO INTEGRADA
      1. O ESP32 do ponto lê o sensor DHT22 (temperatura e umidade) a cada 10 min;
         esse intervalo vem do cálculo de limite (erro < 3,5 % na taxa de variação).
      2. Ele classifica a leitura no próprio dispositivo (normal/atencao/critico) e aciona
         LEDs e buzzer mesmo sem internet: a decisão acontece na borda (edge).
      3. Com rede, envia à API do ClimaPonto um JSON no contrato do grupo:
         {"ponto_id", "temperatura", "umidade", "estado", "origem", "timestamp"}.
      4. Este programa consulta GET {API}/leituras?ponto_id=P001&limite=6 e usa as
         leituras para calcular a tendência (derivada) e prever o próximo estado.

    NESTA VERSÃO a API ainda não foi publicada (API_CLIMAPONTO = None). Por isso as
    leituras são de DEMONSTRAÇÃO, geradas a partir do modelo ajustado aos dados reais
    daquele ponto e daquele horário, com "origem": "simulacao_esp32".
    """
    if API_CLIMAPONTO:
        url = f"{API_CLIMAPONTO}/leituras?ponto_id={ponto['id']}&limite={quantidade}"
        with abrir_https(url, 10) as resposta:
            return validar_leituras(json.loads(resposta.read(TAMANHO_MAXIMO).decode("utf-8")), ponto)

    agora = datetime.now().replace(second=0, microsecond=0)
    agora -= timedelta(minutes=agora.minute % INTERVALO_SENSOR_MIN)
    modelo = sp.lambdify(t, modelos["perfis"][estacao_do_mes(agora.month)]["expr"], "numpy")
    gerador = random.Random(f"{ponto['id']}{agora:%Y%m%d%H%M}")  # nosec B311 - só simulação, não é segurança
    leituras = []
    for k in range(quantidade):
        instante = agora - timedelta(minutes=INTERVALO_SENSOR_MIN * (quantidade - 1 - k))
        hora = instante.hour + instante.minute / 60
        temp = round(float(modelo(hora)) + gerador.gauss(0, 0.15), 1)
        leituras.append({"ponto_id": ponto["id"], "temperatura": temp,
                         "umidade": round(min(95.0, max(20.0, 95 - 1.8 * temp + gerador.gauss(0, 1.0))), 1),
                         "estado": classificar_temperatura(temp), "origem": "simulacao_esp32",
                         "timestamp": (instante + timedelta(hours=3)).strftime("%Y-%m-%dT%H:%M:00Z")})
    return leituras


def validar_leituras(leituras, ponto):
    """Aceita só leituras do ponto pedido, com temperatura numérica na faixa física e
    horário no formato ISO; o estado é recalculado pela regra do ClimaPonto."""
    validas = []
    for leitura in leituras if isinstance(leituras, list) else []:
        try:
            temp = leitura["temperatura"]
            datetime.strptime(leitura["timestamp"], "%Y-%m-%dT%H:%M:%SZ")
            if leitura["ponto_id"] != ponto["id"] or isinstance(temp, bool) \
                    or not isinstance(temp, (int, float)) or not FAIXA_VALIDA[0] <= temp <= FAIXA_VALIDA[1]:
                continue
        except (KeyError, TypeError, ValueError):
            continue
        validas.append({**leitura, "estado": classificar_temperatura(float(temp))})
    return validas


def painel_sensor(ponto, modelos):
    titulo(f"SENSOR CLIMAPONTO (ESP32) - {ponto['id']} {ponto['nome']} ({ponto['regiao']})")
    try:
        leituras = receber_leituras_esp32(ponto, modelos)
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as erro:
        print(f"  Sensor indisponível ({erro}). Estado do ponto: SEM_DADOS.")
        return
    if len(leituras) < 2:
        print("  Leituras insuficientes do sensor. Estado do ponto: SEM_DADOS (não é tratado como normal).")
        return
    print("  Hora local | Temperatura | Umidade | Estado    | Origem")
    for leitura in leituras:
        local = datetime.strptime(leitura["timestamp"], "%Y-%m-%dT%H:%M:%SZ") - timedelta(hours=3)
        umidade = leitura.get("umidade")
        umidade = f"{umidade:5.1f} %" if isinstance(umidade, (int, float)) else "  --   "
        print(f"  {local:%H:%M}      | {leitura['temperatura']:6.1f} °C   | {umidade} "
              f"| {leitura['estado']:<9} | {leitura['origem']}")
    # tendência = derivada discreta: inclinação da reta de mínimos quadrados das últimas leituras
    horas = np.array([k * INTERVALO_SENSOR_MIN / 60 for k in range(len(leituras))])
    temps = np.array([leitura["temperatura"] for leitura in leituras])
    tendencia = float(np.polyfit(horas, temps, 1)[0])
    atual = temps[-1]
    print(f"\n  Agora: {atual:.1f} °C -> estado {classificar_temperatura(atual).upper()}")
    print(f"  Tendência (derivada T'): {tendencia:+.2f} °C/h "
          f"({'aquecendo' if tendencia > 0.05 else 'esfriando' if tendencia < -0.05 else 'estável'})")
    for limiar, nome in ((LIMIAR_ATENCAO, "ATENÇÃO"), (LIMIAR_CRITICO, "CRÍTICO")):
        if atual < limiar and tendencia > 0:
            minutos = (limiar - atual) / tendencia * 60     # T(t+Δt) ≈ T(t) + T'(t)·Δt
            if minutos <= 120:
                print(f"  Previsão: estado {nome} em cerca de {minutos:.0f} min, se a tendência continuar.")
            break
    print("\n  [Demonstração] Leituras simuladas (origem: simulacao_esp32). Na solução integrada,")
    print("  elas vêm do ESP32 do ponto pela API do ClimaPonto (parte de Edge Computing).")


# =============================================================================
# 5. MODELO MATEMÁTICO E LIMITES
# =============================================================================
def resumo_curva(info):
    """Mínima, máxima e hora de cada uma, a partir dos pontos críticos da curva ajustada."""
    criticos = analisar_derivada(info["expr"])["criticos"] or [dict(T=info["coef"][0], t=0.0)]
    menor = min(criticos, key=lambda c: c["T"])
    maior = max(criticos, key=lambda c: c["T"])
    return (f"{menor['T']:5.2f} °C às {hora_formatada(menor['t'])}",
            f"{maior['T']:5.2f} °C às {hora_formatada(maior['t'])}")


def modelo_e_limites(modelos):
    secao("MODELO E LIMITES - DE QUANTO EM QUANTO TEMPO O SENSOR DEVE MEDIR?",
          ("A temperatura sobe e desce todo dia no ritmo do Sol. O programa encontrou, pelos",
           "dados reais, a curva que melhor descreve esse ciclo de 24 h (série de Fourier,",
           "ajustada por mínimos quadrados). A fórmula completa está no relatório."))

    for grupo, nome in (("perfis", "DIA TÍPICO de cada estação do ano (média de cada hora)"),
                        ("quentes", "DIA MAIS QUENTE de cada estação do ano")):
        coluna_dia = "Dia         " if grupo == "quentes" else ""
        print(f"\n  {nome}")
        print(f"  {'Estação':<11}{coluna_dia}{'Média':>9}   "
              f"{'Mais frio':<20}{'Mais quente':<20}{'Erro da curva':>13}")
        for est in ESTACOES_ANO:
            info = modelos[grupo][est]
            menor, maior = resumo_curva(info)
            dia = f"{info['dia']:%d/%m/%Y}  " if grupo == "quentes" else ""
            print(f"  {est:<11}{dia}{info['coef'][0]:6.2f} °C   "
                  f"{menor:<20}{maior:<20}{info['rmse']:9.2f} °C")
    print("  (Erro da curva = diferença média entre a curva e as medições reais.)")
    a = modelos["anual"]
    print(f"\n  Ao longo do ano, a média diária varia em torno de {a['coef'][0]:.1f} °C, "
          "mais quente no verão")
    print("  e mais fria no inverno (curva anual, também ajustada aos dados).")

    T = modelos["perfis"]["Verão"]["expr"]
    h, D = sp.symbols("h D", positive=True)
    t0 = HORA_LIMITE
    quociente = (T.subs(t, t0 + h) - T.subs(t, t0)) / h            # taxa média -> instantânea
    L1 = float(sp.limit(quociente, h, 0))
    tabela = [(p, float(quociente.subs(h, p / 60))) for p in (60, 30, 15, 10, 5, 1)]
    escala = abs(L1) if abs(L1) > 1e-9 else 1.0
    L2 = float(sp.limit(T, t, 24, "-"))                               # continuidade do ciclo
    media_janela = sp.integrate(T, (t, t0, t0 + D)) / D               # média de janela -> pontual
    L3 = float(sp.limit(media_janela, D, 0))

    print(f"\n  LIMITE: quanto o intervalo entre leituras atrapalha? (verão, às {t0:.0f}h)")
    print("  O sensor mede a velocidade do aquecimento comparando duas leituras. Quanto menor o")
    print("  intervalo h entre elas, mais perto chega do valor real, que é o limite quando h -> 0.")
    print(f"  Valor real: lim h->0 [T({t0:.0f}+h) - T({t0:.0f})] / h = {L1:.3f} °C por hora\n")
    print(f"  {'Leitura a cada':>16}{'Velocidade medida':>21}{'Erro':>9}")
    for passo, valor in tabela:
        print(f"  {passo:>12} min{valor:>16.3f} °C/h{abs(valor - L1) / escala * 100:>8.1f} %")
    print("\n  Outros dois limites conferidos:")
    print(f"  - lim t->24 T(t) = {L2:.2f} °C = T(0): o dia termina como começa, "
          "a curva não tem 'saltos'.")
    print(f"  - Média dos 10 min após as {t0:.0f}h = {float(media_janela.subs(D, 1 / 6)):.2f} °C; "
          f"leitura do instante = {L3:.2f} °C.")

    erro10 = abs(tabela[3][1] - L1) / escala * 100
    erro60 = abs(tabela[0][1] - L1) / escala * 100
    resumo(f"De hora em hora o erro é de {erro60:.0f} %; a cada 10 minutos, cai para {erro10:.1f} %.",
           "   Por isso o sensor do ClimaPonto mede a cada 10 minutos.",
           "A média de 10 minutos quase não muda o valor: dá para usá-la para filtrar ruídos.")
    return dict(L1=L1, tabela=tabela, T=T)


# =============================================================================
# 6. DERIVADAS
# =============================================================================
def analisar_derivada(expr):
    """T', T'', pontos críticos (T'=0) com teste da 2ª derivada, intervalos e inflexões."""
    d1, d2 = sp.diff(expr, t), sp.diff(expr, t, 2)
    criticos = []
    for r in raizes(d1, t, 0, 24):
        segunda = float(d2.subs(t, r))
        criticos.append(dict(t=r, T=float(expr.subs(t, r)), d2=segunda,
                             tipo="máximo" if segunda < 0 else "mínimo"))
    cortes = [0.0] + [c["t"] for c in criticos] + [24.0]
    intervalos = [(a, b, "crescente" if float(d1.subs(t, (a + b) / 2)) > 0 else "decrescente")
                  for a, b in zip(cortes[:-1], cortes[1:])]
    inflexoes = [dict(t=r, taxa=float(d1.subs(t, r))) for r in raizes(d2, t, 0, 24)]
    if not inflexoes:   # só acontece com função constante
        inflexoes = [dict(t=0.0, taxa=0.0)]
    return dict(d1=d1, d2=d2, criticos=criticos, intervalos=intervalos,
                aquec=max(inflexoes, key=lambda x: x["taxa"]),
                resfr=min(inflexoes, key=lambda x: x["taxa"]))


def derivadas(modelos):
    secao("DERIVADAS - QUANDO O CALOR SOBE, CHEGA AO PICO E DESCE?",
          ("A derivada T'(t) é a velocidade da temperatura, em °C por hora:",
           "positiva = esquentando | negativa = esfriando | zero = momento mais quente ou mais frio."))
    resultados = {"perfis": {}, "quentes": {}}
    for est in ESTACOES_ANO:
        for grupo in ("perfis", "quentes"):
            resultados[grupo][est] = analisar_derivada(modelos[grupo][est]["expr"])

    print("\n  DIA TÍPICO de cada estação do ano")
    for est in ESTACOES_ANO:
        an = resultados["perfis"][est]
        frio = min(an["criticos"], key=lambda c: c["T"])
        quente = max(an["criticos"], key=lambda c: c["T"])
        print(f"\n  {est}")
        print(f"     esquenta {faixas(an['intervalos'], 'crescente')} | "
              f"esfria {faixas(an['intervalos'], 'decrescente')}")
        print(f"     mais frio: {frio['T']:.2f} °C às {hora_formatada(frio['t'])} | "
              f"mais quente: {quente['T']:.2f} °C às {hora_formatada(quente['t'])}")
        print(f"     aquece mais rápido às {hora_formatada(an['aquec']['t'])} ({an['aquec']['taxa']:+.2f} °C/h) | "
              f"esfria mais rápido às {hora_formatada(an['resfr']['t'])} ({an['resfr']['taxa']:+.2f} °C/h)")

    print("\n  DIA MAIS QUENTE de cada estação do ano")
    print(f"  {'Estação':<11}{'Dia':<12}{'Mais quente':<21}Aquecimento mais rápido")
    for est in ESTACOES_ANO:
        an, info = resultados["quentes"][est], modelos["quentes"][est]
        quente = max(an["criticos"], key=lambda c: c["T"])
        print(f"  {est:<11}{info['dia']:%d/%m/%Y}  {quente['T']:5.2f} °C às {hora_formatada(quente['t'])}"
              f"    {an['aquec']['taxa']:+.2f} °C/h às {hora_formatada(an['aquec']['t'])}")

    Ta = modelos["anual"]["expr"]
    d1a, d2a = sp.diff(Ta, d), sp.diff(Ta, d, 2)
    criticos_ano = []
    for r in raizes(d1a, d, 0, 365):
        tipo = "máximo" if float(d2a.subs(d, r)) < 0 else "mínimo"
        criticos_ano.append(dict(d=r, Tm=float(Ta.subs(d, r)), tipo=tipo,
                                 data=modelos["inicio"] + timedelta(days=round(r))))
    resultados["anual"] = dict(d1=d1a, criticos=criticos_ano)
    if criticos_ano:
        print("\n  Ao longo do ano (derivada da curva anual igual a zero):")
        for c in sorted(criticos_ano, key=lambda c: c["data"]):
            nome = "dia mais quente" if c["tipo"] == "máximo" else "dia mais frio"
            print(f"     {nome} do ano, em média: {c['data']:%d/%m/%Y} ({c['Tm']:.2f} °C)")

    picos = [max(resultados["perfis"][e]["criticos"], key=lambda c: c["T"])["t"]
             for e in ESTACOES_ANO if resultados["perfis"][e]["criticos"]] or [0.0]
    rapidos = [resultados["perfis"][e]["aquec"]["t"] for e in ESTACOES_ANO]
    resumo(f"O pico de calor é entre {hora_formatada(min(picos))} e {hora_formatada(max(picos))}, "
           "não ao meio-dia: o chão continua aquecendo o ar.",
           f"O calor sobe mais rápido entre {hora_formatada(min(rapidos))} e {hora_formatada(max(rapidos))}. "
           "Com essa velocidade, o sensor",
           "   prevê quando o ponto vai passar de 30 °C e avisa antes (veja a opção 3 do menu).")
    return resultados


# =============================================================================
# 7. INTEGRAIS
# =============================================================================
def graus_hora(expr, limiar):
    """E = ∫ max(T(t) - limiar, 0) dt em [0, 24]: integra T - limiar só onde T > limiar."""
    cortes = [0.0] + raizes(expr - limiar, t, 0, 24) + [24.0]
    total, trechos = 0.0, []
    for a, b in zip(cortes[:-1], cortes[1:]):
        if float(expr.subs(t, (a + b) / 2)) > limiar:
            valor = float(sp.integrate(expr - limiar, (t, a, b)))
            total += valor
            trechos.append((a, b, valor))
    f = sp.lambdify(t, expr, "numpy")
    conferencia = trapezio(lambda x: np.maximum(f(x) - limiar, 0), 0, 24)
    return total, trechos, conferencia


def graus_hora_dados_reais(dados, limiar):
    """Mesma grandeza nas leituras reais, mês a mês (trapézio entre horas consecutivas)."""
    por_mes, horas = defaultdict(float), defaultdict(int)
    for (t1, v1), (t2, v2) in zip(dados[:-1], dados[1:]):
        if t2 - t1 == timedelta(hours=1):
            por_mes[(t1.year, t1.month)] += (max(v1 - limiar, 0) + max(v2 - limiar, 0)) / 2
    for instante, v in dados:
        if v >= limiar:
            horas[(instante.year, instante.month)] += 1
    return por_mes, horas


def integrais(modelos):
    secao("INTEGRAIS - QUANTO CALOR SE ACUMULA?",
          ("A integral soma a temperatura ao longo do tempo (área sob a curva, em °C·h).",
           "Dividindo essa área pela duração, temos a temperatura média do intervalo."))
    areas, maior_diferenca = {}, 0.0
    print("\n  Temperatura média no DIA TÍPICO de cada estação")
    print(f"  {'Estação':<11}{'Dia inteiro':>13}{'Das 11h às 17h':>17}{'Diferença':>12}")
    for est in ESTACOES_ANO:
        T = modelos["perfis"][est]["expr"]
        area_dia = float(sp.integrate(T, (t, 0, 24)))
        area_jan = float(sp.integrate(T, (t, *JANELA_EXPOSICAO)))
        maior_diferenca = max(maior_diferenca, abs(trapezio(sp.lambdify(t, T, "numpy"), 0, 24) - area_dia))
        areas[est] = (area_dia, area_jan)
        print(f"  {est:<11}{area_dia / 24:>10.2f} °C{area_jan / 6:>14.2f} °C{area_jan / 6 - area_dia / 24:>+9.1f} °C")
    print("  (Integrais conferidas por outro método, a regra do trapézio: "
          + ("resultados iguais.)" if maior_diferenca < 5e-3 else f"diferença de {maior_diferenca:.3f} °C·h.)"))

    print("\n  CALOR ACIMA DE 30 °C (graus-hora: quanto e por quanto tempo passou de 30 °C)")
    print("  Exemplo: 10 °C·h = 5 horas a 2 °C acima de 30 °C, ou 2 horas a 5 °C acima.")
    e30 = {}
    print(f"\n  {'Estação':<11}{'Dia mais quente':<18}{'Acima de 30 °C':<17}{'Calor acumulado':>16}")
    for est in ESTACOES_ANO:
        info = modelos["quentes"][est]
        total, trechos, _ = graus_hora(info["expr"], LIMIAR_ATENCAO)
        e30[est] = total
        faixa = " e ".join(f"{hora_formatada(a)}-{hora_formatada(b)}" for a, b, _ in trechos) or "nunca"
        print(f"  {est:<11}{info['dia']:%d/%m/%Y}        {faixa:<17}{total:>11.2f} °C·h")

    por_mes, horas = graus_hora_dados_reais(modelos["dados"], LIMIAR_ATENCAO)
    total_ano = sum(por_mes.values())
    meses = sorted(set(por_mes) | set(horas))
    print(f"\n  {'Mês (medições reais)':<24}{'Calor acumulado':>16}{'Horas acima de 30 °C':>23}")
    for chave in meses:
        print(f"  {mes_ano(chave):<24}{por_mes.get(chave, 0):>11.2f} °C·h{horas.get(chave, 0):>17}")
    print(f"  {'TOTAL':<24}{total_ano:>11.2f} °C·h{sum(horas.values()):>17}")

    jan = areas["Verão"]
    itens = [f"No verão, quem espera o ônibus das 11h às 17h enfrenta {jan[1] / 6 - jan[0] / 24:.1f} °C "
             "a mais que a média do dia."]
    if total_ano > 0:
        mes_max = max(por_mes, key=por_mes.get)
        sem_calor = [mes_ano(k) for k in meses if por_mes.get(k, 0) == 0]
        itens.append(f"{mes_ano(mes_max)} concentrou {por_mes[mes_max] / total_ano * 100:.0f} % de todo o calor "
                     "acima de 30 °C do período.")
        if sem_calor:
            itens.append(f"Sem calor acima de 30 °C em: {', '.join(sem_calor)}.")
    resumo(*itens)
    return dict(areas=areas, e30=e30, por_mes=por_mes, horas=horas, total_ano=total_ano)


# =============================================================================
# 8. GRÁFICOS (matplotlib)
# =============================================================================
def estilo():
    plt.rcParams.update({
        "figure.dpi": 100, "savefig.dpi": 200, "savefig.bbox": "tight", "font.size": 10,
        "axes.titlesize": 11, "axes.titleweight": "bold", "axes.edgecolor": "#c3c2b7",
        "axes.grid": True, "grid.color": "#e1e0d9", "grid.linewidth": 0.6,
        "xtick.color": "#52514e", "ytick.color": "#52514e", "axes.spines.top": False,
        "axes.spines.right": False, "lines.linewidth": 2.0, "legend.frameon": False,
        "axes.facecolor": "#fcfcfb", "figure.facecolor": "white",
        "figure.constrained_layout.use": True})       # nada cortado, mesmo se a janela mudar de tamanho


def limiares(ax):
    ax.axhline(LIMIAR_ATENCAO, color=COR_ATENCAO, lw=1.3, ls="--")
    ax.axhline(LIMIAR_CRITICO, color=COR_CRITICO, lw=1.3, ls="--")
    tr = ax.get_yaxis_transform()
    ax.text(0.995, LIMIAR_ATENCAO + 0.25, "atenção 30 °C", transform=tr, ha="right", fontsize=8, color="#52514e")
    ax.text(0.995, LIMIAR_CRITICO + 0.25, "crítico 35 °C", transform=tr, ha="right", fontsize=8, color="#52514e")


def finalizar(fig, modelos, nome, y=-0.02):
    """Coloca a fonte dos dados no gráfico e guarda o nome do arquivo para salvar depois."""
    ponto = modelos["ponto"]
    fonte = (f"Fonte: {ponto['referencia']} ({ponto['id']} {ponto['nome']}), "
             f"{modelos['inicio']:%m/%Y} a {modelos['fim'] - timedelta(days=1):%m/%Y}. Elaboração própria.")
    fig.text(0.5, y, fonte, ha="center", fontsize=8, color="#52514e")
    fig.climaponto_arquivo = nome


def salvar_figuras(figuras, modelos):
    pasta = PASTA_FIG / modelos["ponto"]["id"]
    try:
        pasta.mkdir(parents=True, exist_ok=True)
        for fig in figuras:
            fig.savefig(pasta / fig.climaponto_arquivo)
        print(f"  {len(figuras)} gráfico(s) salvo(s) em {pasta}")
    except OSError as erro:   # pasta sem permissão de escrita
        print(f"  Não foi possível salvar os gráficos ({erro}).")


def meses_do_periodo(modelos):
    inicio = modelos["inicio"]
    return [((inicio.month - 1 + k) // 12 + inicio.year, (inicio.month - 1 + k) % 12 + 1) for k in range(12)]


def graficos_dados(modelos, lim):
    estilo()
    temps = lim["temps"]
    dados = modelos["dados"]
    posicoes, rotulos, vistos = [], [], set()
    for i, (instante, _) in enumerate(dados):
        if (instante.year, instante.month) not in vistos:
            vistos.add((instante.year, instante.month))
            posicoes.append(i)
            rotulos.append(f"{NOMES_MES[instante.month - 1]}/{instante:%y}")
    fig, ax = plt.subplots(figsize=(11, 3.8))
    ax.plot(np.arange(len(temps)), temps, color="#86b6ef", lw=0.6)
    limiares(ax)
    ax.set_xticks(posicoes)
    ax.set_xticklabels(rotulos)
    ax.set_xlim(0, len(temps))
    ax.set(xlabel="Leituras horárias em ordem cronológica", ylabel="Temperatura do ar (°C)",
           title=f"Figura 1 - Série horária real ({modelos['ponto']['nome']})")
    finalizar(fig, modelos, "fig01_serie_horaria.png", y=-0.07)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2), gridspec_kw=dict(width_ratios=[1.3, 1]))
    ax1.hist(temps, bins=np.arange(np.floor(temps.min()), np.ceil(temps.max()) + 0.5, 0.5),
             color="#86b6ef", edgecolor="white", linewidth=0.8)
    ax1.axvline(30, color=COR_ATENCAO, lw=1.6, ls="--")
    ax1.axvline(35, color=COR_CRITICO, lw=1.6, ls="--")
    topo = ax1.get_ylim()[1]
    caixa = dict(facecolor="white", edgecolor="none", alpha=0.9, pad=2)
    ax1.text(30.3, topo * 0.80, f"atenção: 30 °C\n{lim['h30']} h no período", fontsize=8, va="top", bbox=caixa)
    ax1.text(35.3, topo * 0.50, f"crítico: 35 °C\n{lim['h35']} h", fontsize=8, va="top", bbox=caixa)
    ax1.set(xlabel="Temperatura horária do ar (°C)", ylabel="Número de horas", title="Distribuição das leituras")
    ax2.bar(range(24), [lim["por_hora"].get(h, 0) for h in range(24)], color=COR_ATENCAO, width=0.8)
    ax2.set_xticks(range(0, 24, 3))
    ax2.set(xlabel="Hora do dia (horário de Brasília)", ylabel="Horas com T ≥ 30 °C",
            title=f"Quando 30 °C é atingido ({lim['na_janela']:.0f} % entre 11h e 17h)")
    fig.suptitle("Figura 2 - Verificação dos limiares do ClimaPonto", fontweight="bold")
    finalizar(fig, modelos, "fig02_limiares.png")


def graficos_modelo(modelos, res_modelo):
    estilo()
    tt = np.linspace(0, 24, 481)
    fig, eixos = plt.subplots(2, 2, figsize=(11, 6.6), sharex=True, sharey=True)
    for ax, est in zip(eixos.flat, ESTACOES_ANO):
        info = modelos["perfis"][est]
        ax.scatter(info["horas"], info["temps"], s=22, color="#52514e", zorder=3, label="média horária observada")
        ax.plot(tt, sp.lambdify(t, info["expr"], "numpy")(tt), color=CORES[est], label="função ajustada T(t)")
        ax.set_title(f"{est}: R² = {info['r2']:.4f} | erro médio = {info['rmse']:.2f} °C")
        ax.set_xticks(range(0, 25, 3))
        ax.set_xlim(0, 24)
        ax.legend(fontsize=8, loc="upper left")
    for ax in eixos[1]:
        ax.set_xlabel("Hora do dia, t (h)")
    for ax in eixos[:, 0]:
        ax.set_ylabel("Temperatura, T (°C)")
    fig.suptitle("Figura 3 - Função de Fourier ajustada aos dados reais (perfil médio)", fontweight="bold")
    finalizar(fig, modelos, "fig03_ajuste_funcao.png")

    T, L1, t0 = res_modelo["T"], res_modelo["L1"], HORA_LIMITE
    f = sp.lambdify(t, T, "numpy")
    perfil = modelos["perfis"]["Verão"]
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2))
    ax1.plot(tt, f(tt), color=CORES["Verão"], label="T(t) - verão")
    ax1.scatter(perfil["horas"], perfil["temps"], s=22, color="#52514e", zorder=3, label="dados (média horária)")
    for hh, ls in ((4, ":"), (2, "-."), (1, "--")):
        x = np.array([t0 - 1.5, t0 + hh + 1.5])
        incl = (f(t0 + hh) - f(t0)) / hh
        ax1.plot(x, f(t0) + incl * (x - t0), color="#898781", lw=1.1, ls=ls, label=f"secante h = {hh} h ({incl:.2f} °C/h)")
    x = np.array([t0 - 2.5, t0 + 2.5])
    ax1.plot(x, f(t0) + L1 * (x - t0), color="#0b0b0b", lw=1.4, label=f"tangente = limite = {L1:.2f} °C/h")
    ax1.scatter([t0], [f(t0)], s=50, color="#0b0b0b", zorder=4)
    ax1.set_xlim(0, 24)
    ax1.set_xticks(range(0, 25, 3))
    ax1.set(xlabel="Hora do dia, t (h)", ylabel="Temperatura, T (°C)", title=f"Secantes → tangente em t = {t0:.0f}h")
    ax1.legend(fontsize=7.5, loc="upper left")
    passos = [p for p, _ in res_modelo["tabela"]]
    ax2.plot(passos, [v for _, v in res_modelo["tabela"]], marker="o", ms=7, color=CORES["Verão"], label="taxa média")
    ax2.axhline(L1, color="#0b0b0b", lw=1.2, ls="--", label=f"limite h → 0 = {L1:.3f} °C/h")
    ax2.set_xscale("log")
    ax2.invert_xaxis()
    ax2.set_xticks(passos)
    ax2.set_xticklabels([str(p) for p in passos])
    ax2.set(xlabel="Intervalo entre leituras do sensor, h (min)", ylabel="Taxa de variação (°C/h)",
            title="Taxa média convergindo ao limite")
    ax2.legend(fontsize=8, loc="best")
    fig.suptitle("Figura 4 - Limite do quociente de diferenças", fontweight="bold")
    finalizar(fig, modelos, "fig04_limite.png")


def graficos_derivadas(modelos, res_deriv):
    estilo()
    tt = np.linspace(0, 24, 481)
    estilos = {"Primavera": "-", "Verão": "-", "Outono": "--", "Inverno": "-."}
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7.4), sharex=True)
    for est in ESTACOES_ANO:
        info, an = modelos["perfis"][est], res_deriv["perfis"][est]
        ax1.plot(tt, sp.lambdify(t, info["expr"], "numpy")(tt), color=CORES[est], ls=estilos[est], label=est)
        ax2.plot(tt, sp.lambdify(t, an["d1"], "numpy")(tt), color=CORES[est], ls=estilos[est], label=est)
        for c in an["criticos"]:
            ax1.scatter([c["t"]], [c["T"]], s=60, color=CORES[est], edgecolor="white", zorder=5,
                        marker="^" if c["tipo"] == "máximo" else "v")
        ax2.scatter([an["aquec"]["t"]], [an["aquec"]["taxa"]], s=50, color=CORES[est], edgecolor="white", zorder=5)
    ax1.set(ylabel="Temperatura, T (°C)", title="T(t) por estação (▲ máximo, ▼ mínimo)")
    ax1.legend(ncol=4, loc="upper left", fontsize=8.5)
    ax2.axhline(0, color="#52514e", lw=1)
    ax2.set(xlabel="Hora do dia, t (h)", ylabel="T'(t) (°C/h)",
            title="Derivada T'(t): > 0 aquecendo, < 0 resfriando (● aquecimento mais rápido)")
    ax2.set_xticks(range(0, 25, 2))
    ax2.set_xlim(0, 24)
    ax2.legend(ncol=4, loc="lower left", fontsize=8.5)
    fig.suptitle("Figura 5 - Funções e derivadas por estação do ano", fontweight="bold")
    finalizar(fig, modelos, "fig05_derivadas.png")

    a = modelos["anual"]
    dd = np.linspace(0, 365, 731)
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 6.6), sharex=True, gridspec_kw=dict(height_ratios=[1.6, 1]))
    ax1.scatter(a["x"], a["y"], s=9, color="#86b6ef", label="média diária observada")
    ax1.plot(dd, sp.lambdify(d, a["expr"], "numpy")(dd), color="#2a78d6", label="Tm(d) ajustada")
    for c in res_deriv["anual"]["criticos"]:
        ax1.scatter([c["d"]], [c["Tm"]], s=70, color="#0b0b0b", zorder=5, marker="^" if c["tipo"] == "máximo" else "v")
        ax1.annotate(f"{c['tipo']}: {c['Tm']:.1f} °C ({c['data']:%d/%m})", (c["d"], c["Tm"]),
                     xytext=(6, 8 if c["tipo"] == "máximo" else -14), textcoords="offset points", fontsize=8)
    ax1.set(ylabel="Temperatura média diária (°C)", title="Ciclo anual da temperatura média diária")
    ax1.legend(loc="lower left", fontsize=8.5)
    ax2.plot(dd, sp.lambdify(d, res_deriv["anual"]["d1"], "numpy")(dd), color="#2a78d6")
    ax2.axhline(0, color="#52514e", lw=1)
    inicio = modelos["inicio"]
    ax2.set_xticks([(datetime(ano, mes, 1) - inicio).days for ano, mes in meses_do_periodo(modelos)])
    ax2.set_xticklabels([NOMES_MES[mes - 1] for _, mes in meses_do_periodo(modelos)])
    ax2.set(xlabel="Dias desde o início do período, d", ylabel="Tm'(d) (°C/dia)", title="Derivada do ciclo anual")
    fig.suptitle("Figura 6 - Ciclo anual e sua derivada", fontweight="bold")
    finalizar(fig, modelos, "fig06_ciclo_anual.png")


def graficos_integrais(modelos, res_integ):
    estilo()
    tt = np.linspace(0, 24, 481)
    Tv = sp.lambdify(t, modelos["perfis"]["Verão"]["expr"], "numpy")
    area_dia, area_jan = res_integ["areas"]["Verão"]
    fig, ax = plt.subplots(figsize=(10, 4.4))
    ax.fill_between(tt, 0, Tv(tt), color="#cde2fb", label=f"∫₀²⁴ T dt = {area_dia:.1f} °C·h")
    jj = np.linspace(*JANELA_EXPOSICAO, 200)
    ax.fill_between(jj, 0, Tv(jj), color="#eb6834", alpha=0.45, label=f"∫₁₁¹⁷ T dt = {area_jan:.1f} °C·h")
    ax.plot(tt, Tv(tt), color=CORES["Verão"], label="T(t) - verão")
    ax.axhline(area_dia / 24, color="#0b0b0b", lw=1.1, ls=":", label=f"média = área/24 = {area_dia / 24:.2f} °C")
    ax.set_ylim(0, max(Tv(tt)) + 3.5)
    ax.set_xlim(0, 24)
    ax.set_xticks(range(0, 25, 2))
    ax.set(xlabel="Hora do dia, t (h)", ylabel="Temperatura, T (°C)",
           title="Figura 7 - Área sob a curva: carga térmica acumulada no dia médio de verão")
    ax.legend(loc="lower center", fontsize=8.5, ncol=2)
    finalizar(fig, modelos, "fig07_area_sob_curva.png")

    fig, eixos = plt.subplots(2, 2, figsize=(11, 7), sharey=True)
    for ax, est in zip(eixos.flat, ESTACOES_ANO):
        info = modelos["quentes"][est]
        y = sp.lambdify(t, info["expr"], "numpy")(tt)
        ax.fill_between(tt, 30, y, where=y > 30, color=COR_ATENCAO, alpha=0.55, label=f"E30 = {res_integ['e30'][est]:.2f} °C·h")
        ax.plot(tt, y, color=CORES[est], label="modelo T(t)")
        ax.scatter(info["horas"], info["temps"], s=14, color="#52514e", zorder=3, label="leituras reais")
        limiares(ax)
        ax.set_title(f"{est}: {info['dia']:%d/%m/%Y} (máx. {info['temps'].max():.1f} °C)")
        ax.set_xlim(0, 24)
        ax.set_xticks(range(0, 25, 4))
        ax.set_ylim(min(15, float(info["temps"].min()) - 1), max(38, float(info["temps"].max()) + 1.5))
        ax.legend(fontsize=7.5, loc="upper left")
    for ax in eixos[1]:
        ax.set_xlabel("Hora do dia, t (h)")
    for ax in eixos[:, 0]:
        ax.set_ylabel("Temperatura, T (°C)")
    fig.suptitle("Figura 8 - Graus-hora acima de 30 °C no dia mais quente de cada estação", fontweight="bold")
    finalizar(fig, modelos, "fig08_graus_hora_dias.png")

    meses = meses_do_periodo(modelos)
    valores = [res_integ["por_mes"].get(k, 0.0) for k in meses]
    fig, ax = plt.subplots(figsize=(10, 4.2))
    barras = ax.bar([f"{NOMES_MES[m - 1]}/{a % 100:02d}" for a, m in meses], valores,
                    color=[CORES[estacao_do_mes(m)] for _, m in meses], width=0.7, edgecolor="white", linewidth=2)
    for b, v, k in zip(barras, valores, meses):
        ax.text(b.get_x() + b.get_width() / 2, v + max(valores) * 0.01, f"{v:.0f}\n({res_integ['horas'].get(k, 0)} h)",
                ha="center", va="bottom", fontsize=7.5)
    ax.legend(handles=[Patch(color=CORES[e], label=e) for e in ESTACOES_ANO], ncol=4, loc="upper right", fontsize=8.5)
    ax.set_ylim(0, max(max(valores) * 1.35, 1))
    ax.set(xlabel="Mês (rótulo: °C·h e horas com T ≥ 30 °C)", ylabel="Graus-hora acima de 30 °C (°C·h)",
           title=f"Figura 9 - Calor acumulado acima de 30 °C: {res_integ['total_ano']:.0f} °C·h no período")
    finalizar(fig, modelos, "fig09_graus_hora_mensal.png", y=-0.07)


def caber_na_tela(fig):
    """Diminui a janela do gráfico se ela for maior que a tela (evita título e eixos cortados)."""
    try:
        janela = fig.canvas.manager.window
        if hasattr(janela, "winfo_screenwidth"):          # TkAgg, padrão no Windows
            largura, altura = janela.winfo_screenwidth(), janela.winfo_screenheight()
        else:                                             # QtAgg
            area = janela.screen().availableGeometry()
            largura, altura = area.width(), area.height()
        pixels = fig.dpi / getattr(fig.canvas, "device_pixel_ratio", 1)
        escala = min(1.0, 0.92 * largura / (fig.get_figwidth() * pixels),
                     0.82 * altura / (fig.get_figheight() * pixels))
        if escala < 1:
            fig.set_size_inches(fig.get_figwidth() * escala, fig.get_figheight() * escala, forward=True)
    except (AttributeError, TypeError, RuntimeError, ValueError):
        pass                                              # outro tipo de janela: mantém o tamanho


def mostrar_graficos(modelos, salvar_direto=False):
    """Abre os gráficos na tela e depois pergunta se o usuário quer salvá-los."""
    figuras = [plt.figure(n) for n in plt.get_fignums()
               if hasattr(plt.figure(n), "climaponto_arquivo")]
    if not salvar_direto:
        print("\nOs gráficos abriram em janelas. Feche as janelas para continuar.")
        for fig in figuras:
            caber_na_tela(fig)
        plt.show()
        resposta = input(f"Deseja salvar os {len(figuras)} gráfico(s) na pasta 'figuras'? (s/n): ")
        salvar_direto = resposta.strip().lower() in ("s", "sim")
    if salvar_direto:
        salvar_figuras(figuras, modelos)
    plt.close("all")


# =============================================================================
# 9. MENU
# =============================================================================
def normalizar(texto):
    """Minúsculas e sem acentos, para a busca aceitar 'interlagos', 'Zona Sul', 'p001'..."""
    return "".join(c for c in unicodedata.normalize("NFD", texto.lower()) if unicodedata.category(c) != "Mn")


def listar_pontos(pontos):
    print(f"\n  {'Nº':<4}{'Ponto':<8}{'Local':<28}Referência")
    for numero, ponto in enumerate(pontos, start=1):
        print(f"  {numero:<4}{ponto['id']:<8}{ponto['nome'] + ' (' + ponto['regiao'] + ')':<28}{ponto['referencia']}")


def escolher_da_lista(pontos):
    """Mostra a lista numerada e pede o número; Enter vazio cancela."""
    listar_pontos(pontos)
    while True:
        texto = input("\n  Digite o número (Enter para cancelar): ").strip()
        if texto == "":
            return None
        try:
            numero = int(texto)
        except ValueError:
            print("  Digite apenas o número da lista.")
            continue
        if 1 <= numero <= len(pontos):
            return pontos[numero - 1]
        print(f"  Número fora da lista (1 a {len(pontos)}).")


def escolher_ponto():
    texto = input("\nDigite o número, código ou nome do ponto (Enter mostra todos): ").strip()
    if texto == "":
        return escolher_da_lista(PONTOS)
    termo = normalizar(texto)
    encontrados = [p for numero, p in enumerate(PONTOS, start=1)
                   if termo == str(numero) or termo in normalizar(" ".join(
                       (p["id"], p["nome"], p["regiao"], p["referencia"])))]
    if len(encontrados) == 1:
        return encontrados[0]
    if encontrados:
        print(f"  Mais de um ponto encontrado para '{texto}':")
        return escolher_da_lista(encontrados)
    print(f"  Nenhum ponto encontrado para '{texto}'. Estes são os pontos disponíveis:")
    return escolher_da_lista(PONTOS)


def dados_suficientes(dados, inicio, fim):
    """Confere se o recorte tem dados para modelar: >= 70 % das horas e, em cada estação
    do ano, as 24 horas do dia e pelo menos um dia completo. Devolve (ok, motivo)."""
    total = (fim - inicio).total_seconds() / 3600
    if len(dados) < 0.7 * total:
        return False, f"só {len(dados) / total:.0%} das horas do período têm leitura"
    completos = dias_completos(dados)
    for est in ESTACOES_ANO:
        horas = {instante.hour for instante, _ in dados if estacao_do_mes(instante.month) == est}
        if len(horas) < 24 or not any(estacao_do_mes(dia.month) == est for dia in completos):
            return False, f"faltam dados da estação do ano {est}"
    return True, ""


def periodo_disponivel(base, ponto, modo):
    """Verifica, sem ajustar modelos, se o ponto tem dados suficientes no período."""
    serie = serie_da_estacao(base, ponto["estacao"])
    if not serie:
        return False, "", None, None
    inicio, fim = definir_periodo(serie, modo)
    ok, motivo = dados_suficientes(recortar(serie, inicio, fim), inicio, fim)
    return ok, motivo, inicio, fim


def explicar_indisponivel(ponto, motivo, inicio, fim):
    if inicio is None:
        print(f"\n  Dados da estação {ponto['estacao']} ainda não estão na base. O robô do repositório"
              "\n  inclui na próxima atualização mensal.")
    else:
        print(f"\n  {ponto['id']} {ponto['nome']} não tem dados suficientes de {inicio:%m/%Y} a "
              f"{fim - timedelta(days=1):%m/%Y}: {motivo}.\n  Motivo: a estação {ponto['estacao']} do INMET "
              "ficou sem medições em parte desses meses.")


def preparar(base, ponto, modo, avisar=True):
    """Recorta os dados da estação do ponto no período e ajusta os modelos.
    Devolve None (com explicação) quando não há dados suficientes."""
    ok, motivo, inicio, fim = periodo_disponivel(base, ponto, modo)
    if not ok:
        if avisar:
            explicar_indisponivel(ponto, motivo, inicio, fim)
        return None
    serie = serie_da_estacao(base, ponto["estacao"])
    dados = recortar(serie, inicio, fim)
    if avisar and modo == "recente" and fim < (serie[-1][0] + timedelta(hours=4)).replace(day=1, hour=0):
        print(f"\n  Aviso: a estação {ponto['estacao']} do INMET teve falhas nos meses mais recentes;"
              "\n  usando os 12 meses completos mais recentes com dados suficientes.")
    print(f"\n  Ajustando modelos para {ponto['id']} {ponto['nome']} "
          f"({inicio:%d/%m/%Y} a {fim - timedelta(days=1):%d/%m/%Y}, {len(dados)} leituras)...")
    modelos = construir_modelos(dados, inicio, fim, ponto)
    modelos["modo"] = "período do relatório" if modo == "relatorio" else "últimos 12 meses"
    return modelos


def cabecalho(modelos, origem, troca_periodo):
    ponto = modelos["ponto"]
    print("\n" + "=" * 70)
    print("  CLIMAPONTO | Monitoramento de calor em pontos de ônibus - SP")
    print("=" * 70)
    print(f"  Ponto: {ponto['id']} - {ponto['nome']} ({ponto['regiao']})")
    print(f"  Referência climática: {ponto['referencia']}")
    print(f"  Período: {modelos['inicio']:%d/%m/%Y} a {modelos['fim'] - timedelta(days=1):%d/%m/%Y}"
          f" ({modelos['modo']}) | dados: {origem}")
    print("  Sensor ESP32: demonstração (origem: simulacao_esp32)")
    print("-" * 70)
    print("  1 - Escolher ponto de ônibus (localidade)")
    print(f"  2 - {troca_periodo}")
    print("  3 - Sensor ESP32: temperatura agora, estado do ponto e tendência")
    print("  4 - Dados reais: com que frequência passa de 30 °C e de 35 °C?")
    print("  5 - Modelo e limites: de quanto em quanto tempo o sensor deve medir?")
    print("  6 - Derivadas: quando o calor sobe, chega ao pico e desce?")
    print("  7 - Integrais: quanto calor se acumula?")
    print("  0 - Sair")
    print("=" * 70)


def rodar_tudo(modelos, salvar_direto=False):
    """Usado só pelo modo automático (--tudo): gera todas as análises e os 9 gráficos."""
    lim = verificar_limiares(modelos)
    res_modelo, res_deriv, res_integ = modelo_e_limites(modelos), derivadas(modelos), integrais(modelos)
    graficos_dados(modelos, lim)
    graficos_modelo(modelos, res_modelo)
    graficos_derivadas(modelos, res_deriv)
    graficos_integrais(modelos, res_integ)
    mostrar_graficos(modelos, salvar_direto)


def configurar_terminal():
    """Garante acentos e símbolos (°, ∫, π) em qualquer terminal, inclusive Git Bash no Windows."""
    for fluxo in (sys.stdout, sys.stderr):
        try:
            fluxo.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass


def menu(base, origem, ponto, modelos, modo):
    while True:
        alvo = "relatorio" if modo == "recente" else "recente"
        texto = "Usar o período do relatório (11/2025 a 10/2026)" if alvo == "relatorio" \
            else "Voltar para os últimos 12 meses disponíveis"
        if not periodo_disponivel(base, ponto, alvo)[0]:
            texto += f" - indisponível para {ponto['nome']} (falhas do INMET)"
        cabecalho(modelos, origem, texto)
        opcao = input("Escolha uma opção: ").strip()
        match opcao:
            case "1":
                escolhido = escolher_ponto()
                if escolhido is not None and escolhido is not ponto:
                    ok, motivo, inicio, fim = periodo_disponivel(base, escolhido, modo)
                    if not ok and modo == "relatorio" and inicio is not None \
                            and periodo_disponivel(base, escolhido, "recente")[0]:
                        explicar_indisponivel(escolhido, motivo, inicio, fim)
                        print("  Por isso, este ponto usa os 12 meses completos mais recentes com dados.")
                        novo = preparar(base, escolhido, "recente", avisar=False)
                        if novo is not None:
                            modo = "recente"
                    else:
                        novo = preparar(base, escolhido, modo)
                    if novo is not None:
                        ponto, modelos = escolhido, novo
                        print(f"  ✔ Ponto {ponto['id']} - {ponto['nome']} selecionado")
            case "2":
                novo_modo = "relatorio" if modo == "recente" else "recente"
                novo = preparar(base, ponto, novo_modo)
                if novo is not None:
                    modo, modelos = novo_modo, novo
                    print(f"  ✔ Período: {modelos['modo']}")
                else:
                    fim = modelos["fim"] - timedelta(days=1)
                    print(f"  Por isso, o programa continua com {modelos['inicio']:%m/%Y} a {fim:%m/%Y},"
                          " os 12 meses completos mais recentes.")
            case "3":
                painel_sensor(ponto, modelos)
            case "4":
                graficos_dados(modelos, verificar_limiares(modelos))
                mostrar_graficos(modelos)
            case "5":
                graficos_modelo(modelos, modelo_e_limites(modelos))
                mostrar_graficos(modelos)
            case "6":
                graficos_derivadas(modelos, derivadas(modelos))
                mostrar_graficos(modelos)
            case "7":
                graficos_integrais(modelos, integrais(modelos))
                mostrar_graficos(modelos)
            case "0":
                print("Até logo! ClimaPonto - equipe Debuggers.")
                return
            case _:
                print("  Opção inválida. Digite um número de 0 a 7.")


def main():
    configurar_terminal()
    try:
        base, origem = obter_base()
        ponto, modo = PONTOS[0], "recente"
        modelos = preparar(base, ponto, modo)
        if modelos is None:
            sys.exit("Sem dados suficientes para o ponto piloto P001.")
        if "--tudo" in sys.argv:            # modo automático: roda tudo e salva os gráficos
            rodar_tudo(modelos, salvar_direto=True)
        else:
            menu(base, origem, ponto, modelos, modo)
    except (KeyboardInterrupt, EOFError):
        print("\nPrograma encerrado pelo usuário.")


if __name__ == "__main__":
    main()
