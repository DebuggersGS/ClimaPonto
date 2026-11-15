"""
Testes automatizados (QA) do ClimaPonto - programa de modelagem e robô de dados.

Rodar a partir da raiz do repositório:
    python -m unittest discover -s testes -v
Testes que usam os CSVs originais do INMET procuram em dados_csv/ (ou na pasta
indicada pela variável CLIMAPONTO_CSV) e são pulados se ela não existir.
"""

import builtins
import io
import json
import math
import os
import subprocess
import sys
import tempfile
import unittest
import zipfile
from contextlib import redirect_stdout
from datetime import datetime, timedelta
from pathlib import Path
from unittest import mock

os.environ.setdefault("MPLBACKEND", "Agg")
RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "matematica"))
sys.path.insert(0, str(RAIZ / "scripts"))

import climaponto_modelagem as cp   # noqa: E402
import atualizar_dados as robo      # noqa: E402

BASE_REAL = json.loads((RAIZ / "dados" / "inmet_sp.json").read_text(encoding="utf-8"))
P001, P002 = cp.PONTOS[0], cp.PONTOS[1]


def sem_internet(*_, **__):
    raise cp.urllib.error.URLError("sem rede (teste)")


def entradas(*respostas):
    """Simula o que o usuário digita; ao acabar, se comporta como Ctrl+D (EOF)."""
    fila = list(respostas)

    def falso_input(_mensagem=""):
        if not fila:
            raise EOFError
        return fila.pop(0)
    return mock.patch.object(builtins, "input", falso_input)


def silencioso(funcao, *args):
    saida = io.StringIO()
    with redirect_stdout(saida):
        resultado = funcao(*args)
    return resultado, saida.getvalue()


class RegrasDeEstado(unittest.TestCase):
    def test_limites_exatos(self):
        casos = [(29.99, "normal"), (30.0, "atencao"), (34.99, "atencao"), (35.0, "critico"),
                 (-3.0, "normal"), (None, "sem_dados")]
        for temp, esperado in casos:
            self.assertEqual(cp.classificar_temperatura(temp), esperado, temp)

    def test_falta_de_dado_nunca_vira_normal(self):
        self.assertNotEqual(cp.classificar_temperatura(None), "normal")


class ValidacaoDosDados(unittest.TestCase):
    def test_estrutura_errada_e_recusada(self):
        for ruim in ([], "texto", {}, {"estacoes": []}, {"estacoes": {"A701": {"inicio": "x"}}}):
            with self.assertRaises(ValueError):
                cp.validar_base(ruim)

    def test_valores_invalidos_viram_hora_vazia(self):
        base = {"estacoes": {"A701": {"inicio": "2025-01-01T00:00",
                                      "temperaturas": [20.5, "999", True, 60, -40, math.inf, math.nan, None, 31]}}}
        limpa, _ = silencioso(cp.validar_base, base)
        self.assertEqual(limpa["estacoes"]["A701"]["temperaturas"],
                         [20.5, None, None, None, None, None, None, None, 31.0])

    def test_base_real_e_valida(self):
        limpa, saida = silencioso(cp.validar_base, BASE_REAL)
        self.assertIn("A701", limpa["estacoes"])
        self.assertNotIn("Aviso", saida)


class ObtencaoDosDados(unittest.TestCase):
    CSV = sorted(Path(os.environ.get("CLIMAPONTO_CSV", RAIZ / "dados_csv")).glob("*.CSV"))

    def setUp(self):
        self.cache = Path(tempfile.mkdtemp()) / "dados_cache" / "inmet_sp.json"
        self.patch = mock.patch.object(cp, "CACHE", self.cache)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()

    def resposta(self, conteudo):
        falsa = io.BytesIO(conteudo)
        return mock.MagicMock(__enter__=lambda s: falsa, __exit__=lambda *a: None)

    def test_github_ok_baixa_e_guarda_copia(self):
        conteudo = json.dumps(BASE_REAL).encode()
        with mock.patch.object(cp.urllib.request, "urlopen", lambda *a, **k: self.resposta(conteudo)):
            (base, origem), _ = silencioso(cp.obter_base)
        self.assertIn("GitHub", origem)
        self.assertEqual(set(base["estacoes"]), {"A701", "A755", "A771"})
        self.assertTrue(self.cache.exists())

    def test_sem_internet_usa_copia_local(self):
        self.cache.parent.mkdir(parents=True)
        self.cache.write_text(json.dumps(BASE_REAL), encoding="utf-8")
        with mock.patch.object(cp.urllib.request, "urlopen", sem_internet):
            (_, origem), _ = silencioso(cp.obter_base)
        self.assertIn("cópia local", origem)

    def test_github_privado_cai_para_o_inmet(self):
        if not self.CSV:
            self.skipTest("CSVs do INMET não disponíveis")
        pacote = io.BytesIO()
        with zipfile.ZipFile(pacote, "w") as z:
            z.writestr("lixo/INMET_SE_SP_A999_OUTRA.CSV", "x")
            for csv in self.CSV:
                z.write(csv, "2025/" + csv.name)
        dados = pacote.getvalue()

        def falso(pedido, timeout=0):
            url = pedido.full_url
            if "githubusercontent" in url:
                return self.resposta(b"<html>404</html>")      # repositório privado
            return self.resposta(dados if url.endswith("2025.zip") else b"erro")
        with mock.patch.object(cp.urllib.request, "urlopen", falso):
            (base, origem), saida = silencioso(cp.obter_base)
        self.assertIn("INMET", origem)
        self.assertEqual(set(base["estacoes"]), {"A701", "A755", "A771"})
        oficial = BASE_REAL["estacoes"]["A701"]
        self.assertEqual(base["estacoes"]["A701"]["inicio"], oficial["inicio"])
        self.assertEqual(base["estacoes"]["A701"]["temperaturas"], oficial["temperaturas"])
        self.assertTrue(self.cache.exists())

    def test_sem_nada_encerra_com_mensagem_clara(self):
        with mock.patch.object(cp.urllib.request, "urlopen", sem_internet):
            with self.assertRaises(SystemExit) as fim:
                silencioso(cp.obter_base)
        self.assertIn("internet", str(fim.exception))

    def test_cache_corrompido_nao_quebra(self):
        self.cache.parent.mkdir(parents=True)
        self.cache.write_text("{quebrado", encoding="utf-8")
        with mock.patch.object(cp.urllib.request, "urlopen", sem_internet):
            with self.assertRaises(SystemExit):
                silencioso(cp.obter_base)

    def test_so_aceita_https(self):
        for url in ("file:///etc/passwd", "http://exemplo.com/x.json", "ftp://x"):
            with self.assertRaises(ValueError):
                cp.abrir_https(url, 1)

    def test_resposta_gigante_e_recusada(self):
        self.cache.parent.mkdir(parents=True)
        self.cache.write_text(json.dumps(BASE_REAL), encoding="utf-8")
        with mock.patch.object(cp, "TAMANHO_MAXIMO", 100), \
                mock.patch.object(cp.urllib.request, "urlopen",
                                  lambda *a, **k: self.resposta(json.dumps(BASE_REAL).encode())):
            (_, origem), _ = silencioso(cp.obter_base)
        self.assertIn("cópia local", origem)


class Matematica(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modelos, _ = silencioso(cp.preparar, BASE_REAL, P001, "relatorio")

    def test_reproduz_numeros_do_relatorio(self):
        q1, _ = silencioso(cp.modelo_e_limites, self.modelos)
        q3, _ = silencioso(cp.integrais, self.modelos)
        self.assertAlmostEqual(q1["L1"], 0.8748, places=4)
        self.assertAlmostEqual(q3["total_ano"], 331.45, places=2)
        self.assertEqual(len(self.modelos["dados"]), 8654)

    def test_pontos_criticos_do_verao(self):
        an = cp.analisar_derivada(self.modelos["perfis"]["Verão"]["expr"])
        maximo = max(an["criticos"], key=lambda c: c["T"])
        self.assertEqual(cp.hora_formatada(maximo["t"]), "13h23")
        self.assertAlmostEqual(maximo["T"], 27.55, places=2)
        self.assertLess(maximo["d2"], 0)

    def test_bissecao_encontra_raizes_conhecidas(self):
        r = cp.raizes(cp.sp.sin(cp.sp.pi * cp.t / 12), cp.t, 0, 24)
        self.assertEqual(len(r), 2)
        self.assertAlmostEqual(r[0], 0.0, places=6)
        self.assertAlmostEqual(r[1], 12.0, places=6)

    def test_integral_exata_bate_com_trapezio(self):
        expr = self.modelos["quentes"]["Verão"]["expr"]
        total, _, conferencia = cp.graus_hora(expr, 30)
        self.assertAlmostEqual(total, conferencia, places=2)

    def test_graus_hora_zero_quando_nunca_passa_do_limiar(self):
        total, trechos, _ = cp.graus_hora(cp.sp.Float(20) + 0 * cp.t, 30)
        self.assertEqual((total, trechos), (0.0, []))

    def test_media_diaria_pela_integral(self):
        perfil = self.modelos["perfis"]["Verão"]
        area = float(cp.sp.integrate(perfil["expr"], (cp.t, 0, 24)))
        self.assertAlmostEqual(area / 24, float(perfil["coef"][0]), places=3)


class Periodo(unittest.TestCase):
    def test_ultimos_12_meses_ignora_mes_incompleto(self):
        serie = [(datetime(2026, 11, 14, 22), 20.0)]
        self.assertEqual(cp.definir_periodo(serie, "recente"), (datetime(2025, 11, 1), datetime(2026, 11, 1)))

    def test_tolera_ultimas_horas_vazias_do_mes(self):
        serie = [(datetime(2026, 10, 31, 20), 20.0)]
        self.assertEqual(cp.definir_periodo(serie, "recente")[1], datetime(2026, 11, 1))

    def test_estacao_sem_inverno_nao_quebra(self):
        base = json.loads(json.dumps(BASE_REAL))
        est = base["estacoes"]["A701"]
        inicio = datetime.strptime(est["inicio"], "%Y-%m-%dT%H:%M")
        for i in range(len(est["temperaturas"])):
            if (inicio + timedelta(hours=i)).month in (6, 7, 8):
                est["temperaturas"][i] = None
        resultado, saida = silencioso(cp.preparar, base, P001, "recente")
        self.assertIsNone(resultado)
        self.assertIn("Não dá para analisar", saida)

    def test_estacao_ausente_nao_quebra(self):
        ponto_novo = {**P002, "estacao": "A999"}
        resultado, saida = silencioso(cp.preparar, BASE_REAL, ponto_novo, "recente")
        self.assertIsNone(resultado)
        self.assertIn("ainda não estão na base", saida)


class TresPontos(unittest.TestCase):
    def test_interlagos_usa_o_mesmo_periodo_do_relatorio(self):
        modelos, _ = silencioso(cp.preparar, BASE_REAL, P002, "recente")
        self.assertEqual((modelos["inicio"], modelos["fim"]), cp.PERIODO_RELATORIO)

    def test_barueri_com_falhas_recua_para_um_ano_valido(self):
        modelos, saida = silencioso(cp.preparar, BASE_REAL, cp.PONTOS[2], "recente")
        self.assertIsNotNone(modelos)
        self.assertIn("falhas nos meses mais recentes", saida)
        ok, _ = cp.dados_suficientes(modelos["dados"], modelos["inicio"], modelos["fim"])
        self.assertTrue(ok)

    def test_barueri_no_periodo_do_relatorio_avisa_sem_quebrar(self):
        modelos, saida = silencioso(cp.preparar, BASE_REAL, cp.PONTOS[2], "relatorio")
        self.assertIsNone(modelos)
        self.assertIn("48%", saida)


class EscolhaDoPonto(unittest.TestCase):
    def escolher(self, *respostas):
        with entradas(*respostas):
            ponto, _ = silencioso(cp.escolher_ponto)
        return ponto

    def test_enter_mostra_lista_e_escolhe_numero(self):
        self.assertIs(self.escolher("", "2"), P002)

    def test_busca_por_nome_regiao_codigo_e_sem_acento(self):
        self.assertIs(self.escolher("zona sul"), P002)
        self.assertIs(self.escolher("SANTANÁ"), P001)
        self.assertIs(self.escolher("p003"), cp.PONTOS[2])
        self.assertIs(self.escolher("3"), cp.PONTOS[2])

    def test_varios_resultados_mostra_so_eles(self):
        self.assertIs(self.escolher("p00", "3"), cp.PONTOS[2])

    def test_nada_encontrado_mostra_todos(self):
        self.assertIs(self.escolher("xyz", "1"), P001)

    def test_entradas_invalidas_e_cancelar(self):
        self.assertIsNone(self.escolher("", "abc", "9", "-1", "1.5", ""))


class MenuESaida(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modelos, _ = silencioso(cp.preparar, BASE_REAL, P001, "recente")

    def rodar_menu(self, *respostas):
        with entradas(*respostas), mock.patch.object(cp, "mostrar_graficos", lambda m: cp.plt.close("all")):
            _, saida = silencioso(cp.menu, BASE_REAL, "teste", P001, self.modelos, "recente")
        return saida

    def test_opcoes_invalidas_nao_derrubam(self):
        saida = self.rodar_menu("x", "99", "", "  ", "0")
        self.assertEqual(saida.count("Opção inválida"), 4)
        self.assertIn("Até logo", saida)

    def test_ponto_sem_dados_mantem_o_atual(self):
        sem_interlagos = {**BASE_REAL, "estacoes": {"A701": BASE_REAL["estacoes"]["A701"]}}
        with entradas("1", "2", "0"), mock.patch.object(cp, "mostrar_graficos", lambda m: None):
            _, saida = silencioso(cp.menu, sem_interlagos, "teste", P001, self.modelos, "recente")
        self.assertIn("ainda não estão na base", saida)
        self.assertIn("Ponto: P001", saida.split("ainda não estão na base")[1])

    def test_alterna_periodo(self):
        saida = self.rodar_menu("2", "2", "0")
        self.assertIn("Período: período do relatório", saida)
        self.assertIn("Período: últimos 12 meses", saida)

    def test_ctrl_d_no_meio_encerra_sem_erro(self):
        with entradas("1"), mock.patch.object(cp, "obter_base", lambda: (BASE_REAL, "teste")), \
                mock.patch.object(sys, "argv", ["x"]):
            _, saida = silencioso(cp.main)
        self.assertIn("encerrado", saida)

    def test_ctrl_c_encerra_sem_erro(self):
        def ctrl_c(_=""):
            raise KeyboardInterrupt
        with mock.patch.object(builtins, "input", ctrl_c), mock.patch.object(sys, "argv", ["x"]), \
                mock.patch.object(cp, "obter_base", lambda: (BASE_REAL, "teste")):
            _, saida = silencioso(cp.main)
        self.assertIn("encerrado", saida)


class SensorESP32(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modelos, _ = silencioso(cp.preparar, BASE_REAL, P001, "recente")

    def test_leituras_de_demonstracao_seguem_contrato(self):
        leituras = cp.receber_leituras_esp32(P001, self.modelos)
        self.assertEqual(len(leituras), 6)
        instantes = [datetime.strptime(x["timestamp"], "%Y-%m-%dT%H:%M:%SZ") for x in leituras]
        self.assertTrue(all(b - a == timedelta(minutes=10) for a, b in zip(instantes, instantes[1:])))
        for x in leituras:
            self.assertEqual(set(x), {"ponto_id", "temperatura", "umidade", "estado", "origem", "timestamp"})
            self.assertEqual(x["origem"], "simulacao_esp32")
            self.assertEqual(x["estado"], cp.classificar_temperatura(x["temperatura"]))
            self.assertTrue(0 <= x["umidade"] <= 100)

    def test_validacao_da_api_filtra_lixo(self):
        leituras = [
            {"ponto_id": "P001", "temperatura": 31.0, "timestamp": "2026-11-14T17:00:00Z", "estado": "normal"},
            {"ponto_id": "P002", "temperatura": 25.0, "timestamp": "2026-11-14T17:10:00Z"},
            {"ponto_id": "P001", "temperatura": "31", "timestamp": "2026-11-14T17:10:00Z"},
            {"ponto_id": "P001", "temperatura": 99.0, "timestamp": "2026-11-14T17:10:00Z"},
            {"ponto_id": "P001", "temperatura": 25.0, "timestamp": "ontem"},
            {"ponto_id": "P001"}, "lixo", None,
        ]
        validas = cp.validar_leituras(leituras, P001)
        self.assertEqual(len(validas), 1)
        self.assertEqual(validas[0]["estado"], "atencao")   # estado recalculado, não confiado
        self.assertEqual(cp.validar_leituras({"nao": "lista"}, P001), [])

    def test_sensor_sem_leituras_mostra_sem_dados(self):
        with mock.patch.object(cp, "receber_leituras_esp32", lambda *a: []):
            _, saida = silencioso(cp.painel_sensor, P001, self.modelos)
        self.assertIn("SEM_DADOS", saida)

    def test_sensor_fora_do_ar_mostra_sem_dados(self):
        def falha(*_):
            raise cp.urllib.error.URLError("timeout")
        with mock.patch.object(cp, "receber_leituras_esp32", falha):
            _, saida = silencioso(cp.painel_sensor, P001, self.modelos)
        self.assertIn("SEM_DADOS", saida)

    def test_previsao_de_atencao_pela_derivada(self):
        leituras = [{"ponto_id": "P001", "temperatura": 28.0 + 0.3 * k, "umidade": 50.0, "estado": "normal",
                     "origem": "teste", "timestamp": f"2026-11-14T{14 + k // 6:02d}:{(k % 6) * 10:02d}:00Z"}
                    for k in range(6)]
        with mock.patch.object(cp, "receber_leituras_esp32", lambda *a: leituras):
            _, saida = silencioso(cp.painel_sensor, P001, self.modelos)
        self.assertIn("+1.80 °C/h", saida)
        self.assertIn("ATENÇÃO em cerca de 17 min", saida)


class ArquivosESistema(unittest.TestCase):
    def test_pasta_sem_permissao_nao_derruba(self):
        modelos, _ = silencioso(cp.preparar, BASE_REAL, P001, "recente")
        fig = cp.plt.figure()
        with mock.patch.object(cp.Figure if hasattr(cp, "Figure") else type(fig), "savefig",
                               side_effect=PermissionError("somente leitura")):
            _, saida = silencioso(cp.salvar, fig, modelos, "x.png")
        cp.plt.close("all")
        self.assertIn("não foi possível salvar", saida)

    def pasta_com_programa(self):
        """Só o .py + a cópia local (simula a segunda execução, sem internet no teste)."""
        pasta = Path(tempfile.mkdtemp())
        (pasta / "climaponto_modelagem.py").write_text(
            (RAIZ / "matematica" / "climaponto_modelagem.py").read_text(encoding="utf-8"), encoding="utf-8")
        (pasta / "dados_cache").mkdir()
        (pasta / "dados_cache" / "inmet_sp.json").write_text(json.dumps(BASE_REAL), encoding="utf-8")
        return pasta

    def test_terminal_windows_cp1252(self):
        pasta = self.pasta_com_programa()
        ambiente = {**os.environ, "PYTHONIOENCODING": "cp1252", "MPLBACKEND": "Agg"}
        r = subprocess.run([sys.executable, "climaponto_modelagem.py"], input="4\n6\n0\n", text=True,
                           capture_output=True, cwd=pasta, env=ambiente, encoding="utf-8", timeout=180)
        self.assertEqual(r.returncode, 0, r.stderr[-500:])
        self.assertNotIn("UnicodeEncodeError", r.stderr)

    def test_modo_tudo_gera_9_graficos(self):
        pasta = self.pasta_com_programa()
        r = subprocess.run([sys.executable, "climaponto_modelagem.py", "--tudo"], capture_output=True, text=True,
                           cwd=pasta, env={**os.environ, "MPLBACKEND": "Agg"}, encoding="utf-8", timeout=180)
        self.assertEqual(r.returncode, 0, r.stderr[-500:])
        self.assertEqual(len(list((pasta / "figuras" / "P001").glob("*.png"))), 9)


class RoboDeDados(unittest.TestCase):
    CSV = sorted(Path(os.environ.get("CLIMAPONTO_CSV", RAIZ / "dados_csv")).glob("*.CSV"))

    def setUp(self):
        self.pasta = Path(tempfile.mkdtemp())
        self.saida = self.pasta / "inmet_sp.json"
        self.saida.write_text(json.dumps(BASE_REAL), encoding="utf-8")
        self.patch = mock.patch.object(robo, "SAIDA", self.saida)
        self.patch.start()

    def tearDown(self):
        self.patch.stop()

    def rodar(self, *argv):
        with mock.patch.object(sys, "argv", ["robo", *argv]):
            return silencioso(robo.main)

    def test_inmet_fora_do_ar_mantem_base(self):
        antes = self.saida.read_text(encoding="utf-8")
        with mock.patch.object(robo.urllib.request, "urlopen", sem_internet):
            with self.assertRaises(SystemExit):
                self.rodar()
        self.assertEqual(self.saida.read_text(encoding="utf-8"), antes)

    def test_inmet_manda_html_mantem_base(self):
        antes = self.saida.read_text(encoding="utf-8")
        html = mock.MagicMock()
        html.__enter__.return_value = io.BytesIO(b"<html>manutencao</html>")
        with mock.patch.object(robo.urllib.request, "urlopen", lambda *a, **k: html):
            with self.assertRaises(SystemExit):
                self.rodar()
        self.assertEqual(self.saida.read_text(encoding="utf-8"), antes)

    def test_linhas_quebradas_sao_ignoradas(self):
        texto = "\n".join(["X:;y"] * 9 + ["2025/13/45;9999 UTC;;;;;;abc", "lixo",
                                           "2025/01/01;1200 UTC;0;0;0;0;0;25,4"])
        _, leituras = robo.ler_csv(texto)
        self.assertEqual(list(leituras.values()), [25.4])
        self.assertEqual(list(leituras), [datetime(2025, 1, 1, 9)])   # 12h UTC = 9h em Brasília

    @unittest.skipUnless(CSV, "CSVs originais não disponíveis")
    def test_regenerar_dos_csv_reproduz_a_base(self):
        self.saida.unlink()
        self.rodar("--pasta-csv", str(self.CSV[0].parent))
        nova = json.loads(self.saida.read_text(encoding="utf-8"))
        self.assertEqual(nova["estacoes"]["A701"]["temperaturas"], BASE_REAL["estacoes"]["A701"]["temperaturas"])

    @unittest.skipUnless(CSV, "CSVs originais não disponíveis")
    def test_estacao_que_falhou_continua_na_base(self):
        base = json.loads(json.dumps(BASE_REAL))
        base["estacoes"]["A771"] = {"nome": "INTERLAGOS", "inicio": "2025-01-01T00:00", "temperaturas": [20.0, 21.0]}
        self.saida.write_text(json.dumps(base), encoding="utf-8")
        so_santana = self.pasta / "csv_a701"           # simula o INMET entregando só a A701
        so_santana.mkdir()
        for csv in self.CSV:
            if "_A701_" in csv.name:
                (so_santana / csv.name).write_bytes(csv.read_bytes())
        self.rodar("--pasta-csv", str(so_santana))
        nova = json.loads(self.saida.read_text(encoding="utf-8"))
        self.assertEqual(nova["estacoes"]["A771"]["temperaturas"], [20.0, 21.0])

    def test_csv_gigante_dentro_do_zip_e_ignorado(self):
        arquivo = self.pasta / "2025.zip"
        with zipfile.ZipFile(arquivo, "w") as z:
            z.writestr("2025/INMET_SE_SP_A701_X.CSV", "a" * 2000)
        dados = arquivo.read_bytes()
        resposta = mock.MagicMock()
        resposta.__enter__.return_value = io.BytesIO(dados)
        with mock.patch.object(robo, "LIMITE_CSV", 1000), mock.patch.object(robo, "ANO_INICIAL", 2026), \
                mock.patch.object(robo.urllib.request, "urlopen", lambda *a, **k: resposta):
            arquivos, saida = silencioso(lambda: list(robo.arquivos_do_inmet()))
        self.assertEqual(arquivos, [])
        self.assertIn("limite de segurança", saida)

    def test_workflow_tem_protecoes(self):
        yml = (RAIZ / ".github" / "workflows" / "atualizar_dados.yml").read_text(encoding="utf-8")
        for trecho in ("contents: write", "concurrency:", "timeout-minutes:", "workflow_dispatch",
                       "git diff --cached --quiet", "git pull --rebase"):
            self.assertIn(trecho, yml)
        self.assertNotIn("secrets.", yml)   # nenhum segredo/senha no robô


if __name__ == "__main__":
    unittest.main(verbosity=2)
