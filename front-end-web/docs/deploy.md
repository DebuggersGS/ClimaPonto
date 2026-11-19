# Deploy na Vercel — ClimaPonto

> **Status:** publicado em 18/11/2026 em **https://climaponto.vercel.app** (projeto `climaponto` na Vercel). O deploy foi feito pela Vercel CLI a partir da pasta `web/` (`vercel deploy --prod`), com as três variáveis da seção 2 cadastradas em *Production*. O projeto não está ligado ao GitHub: um push não publica sozinho. Para atualizar o site, rode `npx vercel deploy --prod` dentro de `web/`.

## 1. O que já está no repositório

`web/vercel.json` define:

| Item | Valor | Motivo |
| --- | --- | --- |
| Framework | `vite` | Detecção correta pela Vercel. |
| Instalação | `npm ci` | Usa exatamente o `package-lock.json`. |
| Build | `npm run build` | Gera `dist/`. |
| Saída | `dist` | Pasta servida. |
| Rewrite | `/(.*)` → `/index.html` | Fallback do React Router: `/pontos`, `/admin/pontos` etc. funcionam ao recarregar ou abrir link direto. Arquivos existentes (ex.: `/assets/*`) são servidos antes do rewrite. |
| `Content-Security-Policy` | `default-src 'self'`; scripts e estilos só do próprio domínio; `connect-src 'self' https://*.supabase.co`; `frame-ancestors 'none'`; `object-src 'none'` | Limita de onde a página carrega código e para onde envia dados. |
| `X-Content-Type-Options` | `nosniff` | Evita interpretação incorreta de tipos de arquivo. |
| `X-Frame-Options` | `DENY` | Impede a página dentro de iframes (clickjacking). |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Não envia caminhos completos a outros domínios. |
| `Permissions-Policy` | câmera, microfone, geolocalização, pagamento e USB desativados | A aplicação não usa esses recursos. |
| `Cache-Control` em `/assets/*` | `max-age=31536000, immutable` | Os arquivos têm hash no nome; o `index.html` não é cacheado assim. |

## 2. Configuração do projeto na Vercel (ao executar o deploy)

1. *Add New › Project* e importar o repositório privado `DebuggersGS/ClimaPonto-Web` (a conta da Vercel precisa ter acesso à organização DebuggersGS no GitHub).
2. **Root Directory:** `web`. O restante vem do `vercel.json`.
3. **Environment Variables** (Production e Preview):
   - `VITE_SUPABASE_URL` = URL do projeto Supabase.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = chave **publishable** (`sb_publishable_...`).

   - `VITE_DATA_MODE` = `supabase`. Obrigatório em produção: o padrão `auto` usa o dataset de demonstração quando as chaves faltam, e `supabase` faz a falta de configuração aparecer como erro claro, nunca como dados fictícios.

   Essas três são as **únicas** variáveis. Elas são públicas por natureza: vão para o código do navegador, e as permissões são garantidas pelo RLS. **Nunca** cadastre a *secret key* ou a *service role key* como variável `VITE_*`.
4. Deploy.

## 3. Supabase Auth em produção

- **Site URL e Redirect URLs** (*Authentication › URL Configuration*): definir a URL final da Vercel. O login atual é por e-mail e senha, sem links de redirecionamento, mas a configuração correta evita problemas futuros (recuperação de senha, convites).
- **Cadastro público:** precisa estar **desativado** (*Authentication › Sign In / Providers › Allow new users to sign up*). Ver pendências no README.
- Apenas o provedor **E-mail** está ativo. Telefone e login anônimo estão desativados (verificado em 10/11/2026 pelo endpoint público `/auth/v1/settings`).

## 4. Dados demonstrativos × produção

- O protótipo usa **um único projeto Supabase**. Pontos fictícios são marcados com `is_demo = true`, e a interface os identifica com o selo "Demonstrativo" e o aviso de dados demonstrativos.
- Leituras de origem `test` não aparecem para visitantes (RLS); `simulation` aparece e é sinalizada como simulação.
- Sem as variáveis `VITE_SUPABASE_*`, a aplicação mostra dados demonstrativos **locais**, e a interface informa a fonte. Em produção as variáveis são obrigatórias.
- Se no futuro houver dados reais de campo, recomenda-se um projeto Supabase separado para homologação/demonstração.

## 5. Validação realizada (sem deploy)

Um servidor local aplicou as mesmas regras do `vercel.json` sobre o build de produção, e o Chrome headless verificou:

- fallback de 6 rotas (inclusive inexistente), com HTTP 200 e `index.html`;
- presença dos 5 cabeçalhos de segurança e do cache imutável em `/assets`;
- páginas renderizando **com a CSP ativa**, sem violações nem erros de console, incluindo as chamadas reais ao Supabase remoto;
- acessibilidade (axe-core, regras WCAG 2.1 A/AA e boas práticas): 0 violações nas páginas públicas e no login, em desktop e mobile.

Essa validação local foi confirmada depois no deploy real (seção 6).

## 6. Validação no deploy real (18/11/2026)

- As rotas `/`, `/pontos`, `/pontos/P001`, `/historico`, `/admin/login` e uma rota inexistente respondem HTTP 200 (fallback do React Router).
- Os cabeçalhos `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` e `Permissions-Policy` chegam ao navegador.
- No Chrome (sem interface, 1366 px), a Visão geral, o Ponto 360° do P001 e o login mostram "Dados do Supabase" e os pontos P001 a P003, sem mensagem de erro.
- **Não validado aqui:** o mapa (o MapLibre precisa de WebGL, que o Chrome sem interface não tem) e o login administrativo com conta real.
