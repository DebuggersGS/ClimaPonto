"""
ClimaPonto - atualização automática da base de dados meteorológicos.

Roda nos servidores do GitHub (GitHub Actions, uma vez por mês) para que o
usuário final nunca precise baixar os arquivos pesados do INMET:

  1. baixa os arquivos anuais oficiais do INMET (todas as estações do Brasil);
  2. separa só as estações de referência dos pontos do ClimaPonto;
  3. converte o horário de UTC para o horário de Brasília (UTC-3);
  4. junta com a base anterior (nunca apaga dados já publicados) e grava
     dados/inmet_sp.json.

Se o INMET estiver fora do ar ou mandar um arquivo inválido, a base anterior
fica intacta e o robô termina com erro (aparece em vermelho na aba Actions).

Uso:
    python scripts/atualizar_dados.py                  # baixa do INMET
    python scripts/atualizar_dados.py --pasta-csv DIR  # usa CSVs já baixados

Só biblioteca padrão do Python.
"""

import json
import math
import os
import sys
import tempfile
import urllib.request
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

URL_INMET = "https://portal.inmet.gov.br/uploads/dadoshistoricos/{ano}.zip"
ANO_INICIAL = 2025
ESTACOES = {  # código INMET -> referência de qual ponto do ClimaPonto
    "A701": "São Paulo - Mirante de Santana (Zona Norte)",
    "A771": "São Paulo - Interlagos (Zona Sul)",
    "A755": "Barueri (Grande São Paulo)",
}
SAIDA = Path(__file__).resolve().parent.parent / "dados" / "inmet_sp.json"
FUSO = timedelta(hours=-3)
LIMITE_DOWNLOAD = 2 * 1024 ** 3     # 2 GB por arquivo anual
LIMITE_CSV = 50 * 1024 ** 2         # 50 MB por CSV dentro do ZIP (proteção contra ZIP malicioso)


def numero(texto):
    texto = (texto or "").strip().replace(",", ".")
    if texto in ("", "-9999", "-9999.0"):
        return None
    try:
        valor = float(texto)
    except ValueError:
        return None
    return valor if math.isfinite(valor) else None


def ler_csv(texto):
    """Devolve (metadados, {instante_local: temperatura}) de um CSV do INMET.
    Linhas mal formadas são ignoradas em vez de interromper o processamento."""
    linhas = texto.splitlines()
    meta = {}
    for linha in linhas[:8]:
        chave, _, valor = linha.partition(";")
        meta[chave.rstrip(":").strip()] = valor.strip()
    leituras = {}
    for linha in linhas[9:]:
        p = linha.split(";")
        if len(p) < 8:
            continue
        try:
            utc = datetime.strptime(p[0].replace("-", "/") + p[1][:2], "%Y/%m/%d%H")
        except ValueError:
            continue
        temp = numero(p[7])
        if temp is not None and not (-5 <= temp <= 45):
            temp = None  # valor fisicamente impossível = falha do sensor
        leituras[utc + FUSO] = temp
    return meta, leituras


def arquivos_do_inmet():
    """Gera (nome, texto) de cada CSV das estações, ano a ano, direto do INMET."""
    ano_atual = datetime.now(timezone.utc).year
    for ano in range(ANO_INICIAL, ano_atual + 1):
        url = URL_INMET.format(ano=ano)
        print(f"Baixando {url} ...")
        pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (ClimaPonto)"})
        with tempfile.TemporaryFile() as tmp:
            try:
                baixados = 0
                with urllib.request.urlopen(pedido, timeout=300) as resp:  # nosec B310 - URL fixa https do INMET
                    while bloco := resp.read(1 << 20):
                        baixados += len(bloco)
                        if baixados > LIMITE_DOWNLOAD:
                            raise ValueError("arquivo maior que o limite de segurança")
                        tmp.write(bloco)
                tmp.seek(0)
                with zipfile.ZipFile(tmp) as pacote:
                    for info in pacote.infolist():
                        nome = info.filename
                        if not nome.lower().endswith(".csv") or not any(f"_{c}_" in nome for c in ESTACOES):
                            continue
                        if info.file_size > LIMITE_CSV:
                            print(f"  ignorando {nome}: maior que o limite de segurança")
                            continue
                        yield nome, pacote.read(info).decode("latin-1")
            except (OSError, ValueError, zipfile.BadZipFile) as erro:  # ano não publicado, HTML de erro...
                print(f"  pulando {ano}: {erro}")


def arquivos_locais(pasta):
    for caminho in sorted(Path(pasta).rglob("*")):
        if caminho.suffix.lower() == ".csv" and any(f"_{c}_" in caminho.name for c in ESTACOES):
            yield caminho.name, caminho.read_text(encoding="latin-1")


def carregar_base_anterior():
    """Leituras já publicadas, para nunca perder dados se o INMET falhar ou atrasar."""
    try:
        base = json.loads(SAIDA.read_text(encoding="utf-8"))
        series = {}
        for codigo, est in base["estacoes"].items():
            inicio = datetime.strptime(est["inicio"], "%Y-%m-%dT%H:%M")
            series[codigo] = {inicio + timedelta(hours=i): v for i, v in enumerate(est["temperaturas"])}
        return series, {c: e for c, e in base["estacoes"].items()}
    except (OSError, ValueError, KeyError, TypeError):
        return {}, {}


def main():
    fonte = arquivos_locais(sys.argv[2]) if len(sys.argv) == 3 and sys.argv[1] == "--pasta-csv" \
        else arquivos_do_inmet()
    series, anteriores = carregar_base_anterior()
    metas, novas = {}, 0
    for nome, texto in fonte:
        meta, leituras = ler_csv(texto)
        codigo = meta.get("CODIGO (WMO)") if meta.get("CODIGO (WMO)") in ESTACOES \
            else next(c for c in ESTACOES if f"_{c}_" in nome)
        metas[codigo] = meta
        serie = series.setdefault(codigo, {})
        for instante, valor in leituras.items():
            if valor is not None or instante not in serie:   # nunca troca leitura boa por vazio
                serie[instante] = valor
        novas += sum(v is not None for v in leituras.values())
        print(f"  {codigo}: {nome} ({len(leituras)} horas)")
    if novas == 0:
        sys.exit("Nenhum dado novo obtido do INMET. A base atual foi mantida sem alterações.")

    base = {"fonte": "INMET - Dados Históricos Anuais (portal.inmet.gov.br/dadoshistoricos)",
            "fuso": "America/Sao_Paulo (UTC-3)", "variavel": "temperatura do ar, bulbo seco (°C)",
            "atualizado_em": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
            "estacoes": {}}
    for codigo, leituras in sorted(series.items()):
        validas = [t for t, v in leituras.items() if v is not None]
        if not validas:
            continue
        inicio, fim = min(validas), max(validas)
        horas = int((fim - inicio).total_seconds() // 3600) + 1
        m, anterior = metas.get(codigo, {}), anteriores.get(codigo, {})
        base["estacoes"][codigo] = {
            "nome": m.get("ESTACAO") or anterior.get("nome") or ESTACOES.get(codigo, codigo),
            "latitude": numero(m.get("LATITUDE")) if m else anterior.get("latitude"),
            "longitude": numero(m.get("LONGITUDE")) if m else anterior.get("longitude"),
            "altitude_m": numero(m.get("ALTITUDE")) if m else anterior.get("altitude_m"),
            "inicio": inicio.strftime("%Y-%m-%dT%H:00"),
            "temperaturas": [None if v is None else round(v, 1)
                             for v in (leituras.get(inicio + timedelta(hours=i)) for i in range(horas))],
        }
        print(f"{codigo}: {inicio:%d/%m/%Y %Hh} a {fim:%d/%m/%Y %Hh}, {len(validas)} leituras válidas")
    faltando = [c for c in ESTACOES if c not in base["estacoes"]]
    if faltando:
        print(f"ATENÇÃO: estações não encontradas: {', '.join(faltando)}")
    SAIDA.parent.mkdir(exist_ok=True)
    temporario = SAIDA.with_suffix(".tmp")
    temporario.write_text(json.dumps(base, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    os.replace(temporario, SAIDA)   # troca atômica: nunca fica um JSON pela metade
    print(f"Gravado {SAIDA} ({SAIDA.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
