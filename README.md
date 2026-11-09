# ClimaPonto

Protótipo de monitoramento inteligente de condições ambientais em pontos de ônibus de São Paulo — **Global Solution FIAP 2026.2**.

O objetivo é coletar leituras de temperatura e umidade com ESP32, processar estados ambientais (ex.: calor extremo) e apresentá-los em uma aplicação web, ajudando a identificar pontos de ônibus com condições desconfortáveis ou de risco para quem espera o transporte.

> **Situação atual:** fundação do front-end (Etapa 1). A aplicação exibe apenas **dados demonstrativos** — ainda não há integração com sensores, API ou banco de dados.

## Equipe

| Integrante | Responsabilidade |
| --- | --- |
| Enrico | Front-end Design e Web Development |
| Vini | Software & Total Experience Design e Storytelling |
| Gui | Computational Thinking with Python e Differentiated Problem Solving |
| Thiago | Edge Computing & Computer Systems |

## Tecnologias

- [React](https://react.dev/) 19 com [Vite](https://vite.dev/) 8 (JavaScript/JSX)
- [Tailwind CSS](https://tailwindcss.com/) 4 (plugin `@tailwindcss/vite`)
- [React Router](https://reactrouter.com/) 8 (navegação entre páginas)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter) (lint, padrão do template atual do Vite)

## Pré-requisitos

- Node.js 20.19+ ou 22.12+ (desenvolvido com Node.js 24.18.1)
- npm (desenvolvido com npm 11.16.0)

## Instalação e execução

A aplicação fica na pasta `web/`:

```bash
cd web
npm install
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`).

### Scripts disponíveis (dentro de `web/`)

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com recarregamento automático |
| `npm run build` | Gera a versão de produção em `web/dist/` |
| `npm run preview` | Serve localmente a versão gerada pelo build |
| `npm run lint` | Analisa o código com Oxlint |

## Estrutura do projeto

```
GLOBAL-SOLUTION/
├── README.md
├── AI.md                    # Registro do uso de IA no projeto
├── .gitignore
└── web/                     # Aplicação React (Vite)
    ├── index.html
    ├── vite.config.js
    ├── .oxlintrc.json
    ├── public/
    └── src/
        ├── main.jsx         # Ponto de entrada (Router + estilos)
        ├── App.jsx          # Definição das rotas
        ├── components/
        │   ├── layout/      # AppLayout, Header, MainNav
        │   └── ui/          # Card, PageHeader, EmptyState, DemoNotice
        ├── pages/           # Dashboard, Pontos, Histórico, 404
        ├── hooks/           # Custom Hooks (useStops, useDocumentTitle)
        ├── services/        # Acesso a dados (hoje: dados locais)
        ├── data/            # Dados demonstrativos
        └── styles/          # CSS global e tokens do Tailwind
```

**Separação de responsabilidades:**

- `components/` e `pages/` — apresentação visual.
- `hooks/` — lógica e estado da interface (`useState`, `useEffect`).
- `services/` — acesso aos dados. Hoje lê `data/demoStops.js`; quando a API for definida, apenas esta camada muda.

A pasta `utils/` será criada quando houver funções utilitárias reais (ex.: formatação de temperatura e datas).

## O que já funciona

- Identidade inicial "ClimaPonto" no cabeçalho.
- Navegação entre **Dashboard**, **Pontos** e **Histórico**, com indicação da página ativa e página 404.
- Layout responsivo (celular, tablet e desktop).
- Aviso permanente de que os dados são demonstrativos.
- Lista de pontos de ônibus demonstrativos, carregada pela cadeia `service → hook → página`, com estados de carregamento, erro e lista vazia.
- Recursos de acessibilidade: idioma `pt-BR`, link "Pular para o conteúdo", `aria-label` na navegação, título da aba por página e foco visível.

## Pendente

- Definição e consumo da API externa com CRUD completo de pontos.
- Leituras reais de temperatura e umidade (integração com o ESP32 / back-end).
- Estados ambientais e alertas no Dashboard.
- Histórico de leituras (e eventual gráfico).
- Design definitivo, alinhado com Total Experience Design.
- Deploy.
