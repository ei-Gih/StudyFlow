# 📚 StudyFlow

> Plataforma completa de gerenciamento de estudos — single-file HTML, zero backend, deploy instantâneo.

![Versão](https://img.shields.io/badge/versão-3.0-6c8eff?style=flat-square)
![Tecnologia](https://img.shields.io/badge/tecnologia-HTML%20%2B%20CSS%20%2B%20JS-22d3a0?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-Netlify-a78bfa?style=flat-square)
![Licença](https://img.shields.io/badge/licença-MIT-f5a623?style=flat-square)

---

## 📋 Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Estrutura de Dados](#4-estrutura-de-dados-schema)
5. [Funcionalidades](#5-funcionalidades)
6. [Módulos e Componentes](#6-módulos-e-componentes)
7. [Sistema de Gamificação](#7-sistema-de-gamificação)
8. [Fluxos Principais](#8-fluxos-principais)
9. [Configurações e Preferências](#9-configurações-e-preferências)
10. [Deploy e Hospedagem](#10-deploy-e-hospedagem)
11. [Roadmap](#11-roadmap--evoluções-futuras)
12. [Glossário](#12-glossário)

---

## 1. Visão Geral

O **StudyFlow** é uma plataforma web completa de gerenciamento de estudos construída como uma aplicação **single-file HTML**. Funciona inteiramente no navegador — sem servidor, sem banco de dados externo, sem instalação de dependências.

O projeto une planejamento, execução (Pomodoro), revisão (Flashcards), calendário e analytics em um único lugar, com gamificação integrada para manter a motivação.

### Filosofia de design

| Princípio | Descrição |
|---|---|
| ⚡ Zero servidor | Toda a lógica roda no browser |
| 💾 Dados locais | Persistência via `localStorage` |
| 🚀 Deploy simples | Um único arquivo `.html` |
| 🎮 Gamificação | XP, níveis, conquistas, streak |
| 🌙 Dark mode | Tema escuro padrão com opção clara |
| 🔒 Privacidade | Dados ficam apenas no dispositivo |

### Métricas do projeto

| Métrica | Valor |
|---|---|
| Linhas de código | ~923 |
| Funções JavaScript | 83 |
| Páginas / abas | 7 |
| Conquistas | 12 |
| Peso final | < 60 KB |
| Dependências externas | 2 (Google Fonts + Chart.js via CDN) |

---

## 2. Arquitetura do Sistema

O StudyFlow adota uma arquitetura **client-side pura**. Toda a lógica de negócio, persistência de dados e renderização ocorre diretamente no browser.

### Diagrama

```
┌──────────────────────────────────────────────────────┐
│                   BROWSER (Cliente)                  │
├──────────────────┬───────────────────┬───────────────┤
│    UI Layer      │    Logic Layer    │   Data Layer  │
│   HTML + CSS     │    JavaScript     │  localStorage │
│  7 pages/views   │   83 functions    │ JSON persisted│
└──────────────────┴───────────────────┴───────────────┘
                           ▲
            ┌──────────────┴──────────────┐
       CDN (Chart.js)             Google Fonts
```

### Padrão de renderização

O app usa um padrão de **SPA manual**, sem frameworks. Cada "página" é uma `<div>` com `id` único. A navegação troca classes CSS (`active`) e chama a função de renderização correspondente.

### Fluxo de dados

```
Usuário interage com a UI
        ↓
Função JS é chamada
        ↓
Objeto DB em memória é atualizado
        ↓
save() → serializa para localStorage (JSON)
        ↓
Função de render da página atual re-executa
        ↓
DOM é reescrito com os novos dados
```

### Camadas da aplicação

| Camada | Responsabilidade | Tecnologia |
|---|---|---|
| Apresentação | Renderização HTML, CSS, animações | HTML5, CSS3, CSS Variables |
| Lógica | Cálculos, gamificação, timer, SRS | JavaScript ES2022 |
| Persistência | Armazenamento e recuperação de dados | localStorage (JSON) |
| Visualização | Gráficos e charts | Chart.js 4.4.1 (CDN) |
| Notificação | Alertas ao fim do Pomodoro | Web Notifications API + Web Audio API |

---

## 3. Stack Tecnológica

### Frontend (única camada)

| Tecnologia | Versão | Uso | Carregamento |
|---|---|---|---|
| HTML5 | — | Estrutura e marcação | Inline |
| CSS3 | — | Estilo, animações, variáveis | `<style>` inline |
| JavaScript | ES2022 | Toda a lógica da aplicação | `<script>` inline |
| Chart.js | 4.4.1 | Gráficos de analytics | CDN (cdnjs) |
| Syne | Google Fonts | Fonte de display / títulos | CDN |
| DM Sans | Google Fonts | Fonte principal de corpo | CDN |

### APIs do browser utilizadas

- **`localStorage`** — persistência de todos os dados do usuário
- **`Web Audio API`** — geração de som (beep ao fim do Pomodoro)
- **`Web Notifications API`** — alertas mesmo com aba minimizada
- **`Canvas API`** — animação de confetti ao completar módulo
- **`CSS Custom Properties`** — sistema de temas dark/light

### Sem backend

Por design, o StudyFlow **não usa nenhum servidor**. Isso garante:

- 🔒 **Privacidade total** — dados ficam apenas no dispositivo
- 💰 **Zero custo** — hospedagem gratuita em qualquer CDN estático
- 📴 **Offline first** — funciona sem internet após o primeiro load
- 🚫 **Sem auth** — não há senhas ou contas a gerenciar

---

## 4. Estrutura de Dados (Schema)

Todos os dados são armazenados em um único objeto JSON no `localStorage`, na chave `studyflow_v4`.

### Objeto raiz — `DB`

```json
{
  "user": {},
  "plans": [],
  "modules": [],
  "topics": [],
  "tasks": [],
  "pomodoro": [],
  "flashcards": [],
  "reviews": [],
  "sessions": [],
  "achievements": [],
  "activityLog": [],
  "notes": {},
  "prefs": {}
}
```

### Entidade: `User`

```json
{
  "name": "Estudante",
  "xp": 0,
  "level": 1,
  "streak": 0,
  "lastStudied": "2026-03-17"
}
```

### Hierarquia do Planejador

A estrutura de estudo segue a hierarquia: **Plan → Module → Topic → Task**

```
Plan
 └── Module (planId)
      └── Topic (moduleId)
           └── Task (topicId)
```

#### `Plan`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID único |
| `title` | `string` | Nome do plano |
| `description` | `string` | Descrição opcional |
| `color` | `string (hex)` | Cor de identificação (ex: `#6c8eff`) |
| `createdAt` | `ISO 8601` | Data de criação |

#### `Task` — campos de prioridade

| Prioridade | Valor | XP concedido |
|---|---|---|
| Alta | `ALTA` | +15 XP |
| Média | `MEDIA` | +12 XP |
| Baixa | `BAIXA` | +10 XP |
| Sem prioridade | `null` | +10 XP |

### Entidade: `Pomodoro`

```json
{
  "id": "abc123",
  "type": "FOCUS",
  "date": "2026-03-17",
  "topicId": "xyz",
  "createdAt": "2026-03-17T10:30:00.000Z"
}
```

> `type` pode ser: `FOCUS` | `SHORT_BREAK` | `LONG_BREAK`

### Entidade: `Flashcard` + `Review`

```json
// Flashcard
{
  "id": "abc",
  "front": "O que é uma Promise?",
  "back": "Objeto que representa uma operação assíncrona.",
  "tags": ["JavaScript", "async"],
  "topicId": "xyz"
}

// Review (revisão espaçada)
{
  "id": "rev1",
  "fcId": "abc",
  "difficulty": "EASY",
  "reviewedAt": "2026-03-17T...",
  "nextReview": "2026-03-24"
}
```

### Algoritmo SRS (revisão espaçada)

| Avaliação | Intervalo | Próxima revisão |
|---|---|---|
| 😰 Difícil (`HARD`) | +1 dia | Amanhã |
| 🤔 Médio (`MEDIUM`) | +3 dias | Em 3 dias |
| 😊 Fácil (`EASY`) | +7 dias | Na próxima semana |

---

## 5. Funcionalidades

### 🏠 Dashboard

- 4 métricas em cards — progresso geral, tempo hoje, tarefas pendentes, streak
- Planos com barra de progresso e **estimativa de conclusão** no ritmo atual
- **Checklist rápido** — marcar tarefas sem sair do dashboard (ordenadas por prioridade)
- **Sugestão de IA local** — baseada em flashcards vencidos e tarefas pendentes
- **Mini calendário de streak** — últimos 30 dias com indicadores visuais
- Barra de XP com nível e grade de conquistas
- Gráfico de horas estudadas nos últimos 7 dias

### 📋 Planejador de Estudos

- Sistema hierárquico: **Plano → Módulo → Tópico → Tarefa**
- Criação de planos com título, descrição e cor personalizada
- Módulos e tópicos **colapsáveis**
- Tarefas com **prioridade**, tempo estimado e XP variável
- **Edição inline** — duplo clique em qualquer nome para renomear no lugar
- **Notas por tópico** com área de texto persistida
- Progresso calculado automaticamente em todos os níveis
- **Tempo de foco** por tópico exibido (integrado com o Pomodoro)
- **Confetti** ao completar um módulo inteiro

### ⏱️ Timer Pomodoro

- Anel SVG animado com arco colorido por fase
  - 🔵 Azul — Foco
  - 🟢 Verde — Pausa curta
  - 🟣 Roxo — Pausa longa
- 4 ciclos com indicadores (dots) — pausa longa a cada 4 pomodoros
- Seleção de tópico para rastrear onde o tempo vai
- **Modo Foco** — tela cheia imersiva com partículas animadas
- **Mini widget flutuante** — timer visível ao navegar para outra aba
- **Som ao completar** (3 bipes via Web Audio API)
- **Notificações do browser** mesmo com aba minimizada
- `Espaço` para pausar/continuar
- Gráfico de produtividade **por hora do dia**
- Lista de **tempo total por tópico**
- Durações **configuráveis** (5–60 min foco, 1–30 min pausas)

### 🃏 Flashcards com Revisão Espaçada

- Criação com frente, verso, **tags** e tópico associado
- Algoritmo SRS: Difícil +1d / Médio +3d / Fácil +7d
- Fila de revisão filtrada por vencimento
- **Animação flip 3D** ao virar o card
- **Filtro por tags** com pills clicáveis
- Badge indicando quantos estão vencidos hoje

### 📅 Calendário

- Navegação mensal com indicadores de dias com atividade
- Registro manual de sessões com título, data e duração
- Listagem em ordem cronológica inversa
- Dia de hoje destacado em azul

### 📊 Analytics

- Métricas totais: horas, tarefas, streak, revisões
- Gráfico de **rosca** — progresso por plano
- Gráfico de **barras horizontais** — tempo por tópico
- Gráfico de **linha** — tarefas concluídas em 7 dias
- **Heatmap de atividade** — 56 dias com 3 intensidades

### ⚙️ Configurações

- Nome de usuário personalizável
- Alternância **dark / light mode**
- Ativar/desativar som, notificações, widget flutuante
- Sliders para durações do Pomodoro
- **Exportar / Importar** backup JSON
- Reset completo dos dados

---

## 6. Módulos e Componentes

### Organização do JavaScript

| Módulo | Responsabilidade | Funções principais |
|---|---|---|
| `DATA` | Persistência | `load`, `save`, `uid` |
| `ACH / XP` | Gamificação | `grantXP`, `checkAch`, `updateStreak` |
| `NAV` | Navegação entre páginas | `goto`, `renderPage` |
| `DASHBOARD` | Renderização da home | `renderDash`, `getSug` |
| `PLANNER` | Hierarquia Plan→Task | `renderPlanner`, `toggleTask`, `inlineEdit` |
| `POMODORO` | Timer, fases, modo foco | `pomodoroToggle`, `completePhase`, `enterFocus` |
| `FLASHCARDS` | SRS, revisão, tags | `startReview`, `rateCard`, `filterFC` |
| `CALENDAR` | Calendário mensal | `renderCal`, `calNav` |
| `ANALYTICS` | Gráficos Chart.js | `renderAnalytics`, `renderTopicTime` |
| `SETTINGS` | Preferências, tema | `renderSettings`, `toggleTheme`, `exportData` |
| `MODAL` | Sistema de modais | `openModal`, `buildMB`, `saveModal` |
| `SEARCH` | Busca global Ctrl+K | `openSearch`, `renderSearch` |
| `CONFETTI` | Animação canvas | `launchConfetti` |
| `KEYBOARD` | Atalhos globais | `keydown` event listener |

### Sistema de CSS com Custom Properties

```css
/* Fundos em camadas */
--bg, --bg2, --bg3, --bg4

/* Bordas e divisores */
--border, --border2

/* Hierarquia tipográfica */
--text, --text2, --text3

/* Cor principal */
--accent, --accent2

/* Cores semânticas */
--green, --amber, --red, --pink, --purple
```

O tema claro é ativado via `body.light` que sobrescreve todas as variáveis.

### Componentes CSS reutilizáveis

| Componente | Classe CSS | Uso |
|---|---|---|
| Card | `.card` | Container de conteúdo |
| Badge | `.badge .badge-*` | Labels coloridos |
| Button | `.btn .btn-primary .btn-danger` | Botões com variantes |
| Metric | `.metric` | Cards de métricas do dashboard |
| Toast | `.toast-item` | Notificações temporárias |
| Progress Bar | `.prog-bar .prog-fill` | Barra animada |
| XP Bar | `.xp-bar-wrap` | Barra de experiência |
| Achievement | `.ach-item .locked .unlocked` | Cards de conquistas |
| Priority Badge | `.prio .prio-alta/media/baixa` | Badges de prioridade |

---

## 7. Sistema de Gamificação

### XP por ação

| Ação | XP Ganho |
|---|---|
| Completar tarefa (sem/baixa prioridade) | +10 XP |
| Completar tarefa (prioridade média) | +12 XP |
| Completar tarefa (prioridade alta) | +15 XP |
| Completar um Pomodoro de foco | +20 XP |
| Completar um módulo inteiro | +100 XP |
| Revisar flashcard | +5 XP |

> **Fórmula do nível:** `level = Math.floor(xp / 100) + 1`  
> A cada 100 XP o usuário sobe de nível.

### Streak de estudo

O streak é incrementado automaticamente quando o usuário realiza qualquer ação que concede XP em um novo dia. Se pular um dia, volta a 1.

```
Se lastStudied === ontem → streak++
Se lastStudied < ontem   → streak = 1
Se lastStudied === hoje  → (sem mudança)
```

### As 12 Conquistas

| # | Ícone | Nome | Condição |
|---|---|---|---|
| 1 | ✅ | 1ª Tarefa | Completar pelo menos 1 tarefa |
| 2 | 🔥 | Streak 3x | Streak ≥ 3 dias seguidos |
| 3 | 🔥 | Semana de Fogo | Streak ≥ 7 dias seguidos |
| 4 | ⏱️ | 10 Pomodoros | 10 sessões de foco concluídas |
| 5 | 💎 | 50 Pomodoros | 50 sessões de foco concluídas |
| 6 | 🃏 | 10 Flashcards | Criar 10 flashcards |
| 7 | 📚 | Planejador | Criar pelo menos 1 plano |
| 8 | 🏆 | Módulo Concluído | Todas as tarefas de um módulo concluídas |
| 9 | ⚡ | 100 XP | Acumular 100 XP |
| 10 | ⚡ | 500 XP | Acumular 500 XP |
| 11 | 💪 | 20 Tarefas | Completar 20 tarefas |
| 12 | 🦉 | Coruja Noturna | Estudar entre 22h e 04h |

---

## 8. Fluxos Principais

### Fluxo de criação de conteúdo

```
1. Criar Plano (título + cor)
2. Criar Módulo dentro do plano
3. Criar Tópico dentro do módulo
4. Criar Tarefas (com prioridade e tempo estimado)
5. Opcional: criar Flashcards associados ao tópico
```

### Fluxo de uma sessão de estudo

```
1. Abrir o Pomodoro → selecionar tópico
2. Iniciar o timer (ou pressionar Espaço)
3. Opcional: ativar Modo Foco (tela cheia imersiva)
4. Timer termina → som + notificação + XP
5. Passa automaticamente para a fase de pausa
6. Voltar ao Planejador → marcar tarefas concluídas
7. XP adicional por cada tarefa marcada
```

### Fluxo de revisão de flashcards

```
1. Abrir Flashcards → badge mostra quantos vencidos
2. Clicar em "Revisar agora"
3. Card exibe a pergunta
4. Clicar para virar → ver resposta
5. Avaliar: Difícil (+1d) / Médio (+3d) / Fácil (+7d)
6. nextReview calculado → card sai da fila
7. +5 XP por cada revisão
```

### Fluxo de estimativa de conclusão

A estimativa de cada plano é calculada em tempo real:

```js
// Média de pomodoros/dia nos últimos 7 dias
pomosPerDay = last7days.reduce(count) / 7

// Minutos pendentes estimados
estMins = pendingTasks.reduce(sum of t.mins || 25)

// Pomodoros necessários
pomosNeeded = ceil(estMins / focusMins)

// Dias restantes
daysLeft = ceil(pomosNeeded / pomosPerDay)

// Data estimada
eta = today + daysLeft
```

### Fluxo de backup e restauração

```
Exportar: Configurações → "Exportar JSON"
          → studyflow-YYYY-MM-DD.json é baixado

Importar: Configurações → "Importar backup"
          → selecionar arquivo JSON
          → dados substituídos → página recarrega
```

---

## 9. Configurações e Preferências

### Objeto `DB.prefs`

| Chave | Tipo | Padrão | Descrição |
|---|---|---|---|
| `sound` | `boolean` | `true` | Som ao completar pomodoro |
| `miniWidget` | `boolean` | `true` | Widget flutuante do timer |
| `focusMins` | `number` | `25` | Duração do foco em minutos |
| `shortMins` | `number` | `5` | Duração da pausa curta |
| `longMins` | `number` | `15` | Duração da pausa longa |
| `light` | `boolean` | `false` | Tema claro ativado |
| `notifications` | `boolean` | `false` | Notificações do browser |

### Atalhos de teclado

| Atalho | Ação |
|---|---|
| `Ctrl+K` / `Cmd+K` | Abre a busca global |
| `Espaço` | Pausar/continuar Pomodoro (quando na página do Pomodoro) |
| `Escape` | Fechar modal / busca / modo foco |

---

## 10. Deploy e Hospedagem

O StudyFlow **não requer configuração de build** — é um arquivo HTML estático puro.

### ✅ Deploy no Netlify (recomendado)

**Método 1 — Drag & Drop (mais simples)**

1. Acesse [app.netlify.com](https://app.netlify.com)
2. Vá em **Sites** → role até o final
3. Arraste o arquivo `studyflow.html` para a área de drag & drop
4. URL pública gerada em segundos ✨

**Método 2 — Via Git**

1. Crie um repositório no GitHub com o arquivo HTML
2. No Netlify: `Add new site` → `Import an existing project`
3. Conecte ao repositório
4. Configure:
   - **Build command:** *(deixar vazio)*
   - **Publish directory:** `.`
5. Clique em `Deploy site`

> ⚠️ **Erro comum:** Se aparecer `ENOENT: package.json not found`, é porque o Netlify está tentando rodar `npm run build`. Limpe o campo Build command e deixe vazio.

### Outros serviços compatíveis

| Serviço | Plano gratuito |
|---|---|
| Netlify | ✅ |
| Vercel | ✅ |
| GitHub Pages | ✅ (repositório público) |
| Cloudflare Pages | ✅ |
| Surge.sh | ✅ |
| Qualquer servidor web (Apache, Nginx) | Varia |

### Executar localmente

```bash
# Abrir diretamente no browser (mais simples)
# Apenas dê duplo clique no arquivo studyflow.html

# Via Python 3
python -m http.server 8080

# Via Node.js
npx serve .
```

Acesse: `http://localhost:8080`

### Considerações sobre os dados

- Os dados ficam **apenas no `localStorage`** do browser do usuário
- Não há transmissão de dados para nenhum servidor
- Use o **backup periódico** (exportar JSON) para evitar perda de dados
- `localStorage` pode ser apagado se o usuário limpar os dados do site no browser

---

## 11. Roadmap & Evoluções Futuras

### 🟢 Curto prazo (v3.x)

- [ ] Sincronização com Google Drive para backup automático
- [ ] Modo de revisão avançado com algoritmo SM-2 completo
- [ ] Importar flashcards via CSV ou Anki (`.apkg`)
- [ ] Meta diária de horas de estudo com progresso visual
- [ ] Estatísticas de produtividade por dia da semana

### 🟡 Médio prazo (v4.0)

- [ ] Compartilhamento de planos via link (JSON comprimido na URL)
- [ ] PWA — instalável no celular, funcionamento offline total
- [ ] Suporte a LaTeX/Markdown nos flashcards
- [ ] Múltiplos perfis de usuário no mesmo browser
- [ ] Áudio TTS para estudo auditivo de flashcards

### 🔴 Longo prazo (v5.0 — com backend)

- [ ] Autenticação + sincronização na nuvem (Supabase / Firebase)
- [ ] Colaboração — compartilhar planos e flashcards com outras pessoas
- [ ] Integração com IA para geração automática de flashcards a partir de texto
- [ ] App mobile nativo (React Native)
- [ ] Integração com Google Calendar

---

## 12. Glossário

| Termo | Definição |
|---|---|
| **SRS** | Spaced Repetition System — sistema de repetição espaçada para memorização eficiente |
| **Pomodoro** | Técnica de produtividade com ciclos de 25min de foco + 5min de pausa |
| **Streak** | Sequência de dias consecutivos com atividade de estudo registrada |
| **XP** | Experience Points — pontos de experiência da gamificação |
| **localStorage** | API do browser para armazenamento de dados locais no dispositivo |
| **SPA** | Single Page Application — app de página única com navegação virtual |
| **SM-2** | Algoritmo SuperMemo 2 — base dos sistemas de revisão espaçada modernos |
| **Inline** | CSS e JS embutidos no próprio arquivo HTML, sem arquivos externos |
| **CDN** | Content Delivery Network — rede de distribuição para bibliotecas externas |
| **Heatmap** | Mapa de calor visual mostrando intensidade de atividade por período |
| **Mini widget** | Timer flutuante visível ao navegar para outras abas com o Pomodoro rodando |
| **Confetti** | Animação de celebração com partículas coloridas em canvas |
| **Dark mode** | Tema escuro da interface, padrão no StudyFlow |
| **Estimativa** | Previsão de conclusão do plano baseada no ritmo atual de pomodoros |

---

## Estrutura do arquivo

```
studyflow.html
├── <head>
│   ├── Meta tags e viewport
│   ├── Google Fonts (Syne + DM Sans)
│   └── Chart.js (CDN)
├── <style>
│   ├── CSS Variables (dark/light theme)
│   ├── Layout (sidebar + main)
│   ├── Componentes (card, btn, badge, metric...)
│   ├── Pages (dashboard, planner, pomodoro...)
│   └── Animations & Responsive
├── <body>
│   ├── Focus Mode Overlay
│   ├── Confetti Canvas
│   ├── Search Overlay
│   ├── Mini Pomo Widget
│   ├── Sidebar (nav)
│   ├── Main
│   │   ├── Topbar
│   │   └── Pages (7 divs)
│   └── Modal
└── <script>
    ├── DATA — persistência
    ├── GAMIFICATION — XP, ACH, streak
    ├── NAV — roteamento
    ├── DASHBOARD — renderização
    ├── PLANNER — hierarquia
    ├── POMODORO — timer
    ├── FLASHCARDS — SRS
    ├── CALENDAR — calendário
    ├── ANALYTICS — charts
    ├── SETTINGS — preferências
    ├── MODAL — formulários
    ├── SEARCH — busca global
    ├── CONFETTI — animação
    ├── KEYBOARD — atalhos
    └── BOOT — seed + init
```

---

<div align="center">

**StudyFlow v3.0** — Feito com 💙 para estudantes que levam o aprendizado a sério.

*Estude com foco. Revise com inteligência. Evolua todos os dias.*

</div>