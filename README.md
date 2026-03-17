# StudyFlow

Plataforma avançada de gerenciamento de estudos — planos, pomodoro, flashcards com revisão espaçada, gamificação e analytics.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 · React 18 · TypeScript · TailwindCSS |
| Estado | Zustand |
| Backend | Next.js App Router (API Routes) |
| Banco | PostgreSQL 16 |
| ORM | Prisma 5 |
| Auth | NextAuth.js (credentials + Google OAuth) |
| Gráficos | Recharts |
| Validação | Zod |
| Infra | Docker · Docker Compose · Vercel |

---

## Início rápido

### Opção 1 — Setup automático (recomendado)

```bash
git clone <repo>
cd studyflow
node scripts/setup.mjs
```

O script irá:
1. Verificar pré-requisitos (Node 18+, npm, Docker)
2. Instalar dependências
3. Criar `.env.local` interativamente
4. Subir PostgreSQL + Redis via Docker Compose
5. Rodar migrations Prisma
6. Popular banco com dados demo

Depois:

```bash
npm run dev
```

Acesse `http://localhost:3000` — login demo: `demo@studyflow.app` / `demo1234`

---

### Opção 2 — Setup manual

**1. Instalar dependências**

```bash
npm install
```

**2. Configurar ambiente**

```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

Variáveis obrigatórias:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/studyflow_dev"
NEXTAUTH_SECRET="string-aleatória-forte"
NEXTAUTH_URL="http://localhost:3000"
```

**3. Subir banco de dados**

```bash
docker compose up -d db redis
```

Ou instale PostgreSQL manualmente e crie o banco:

```sql
CREATE DATABASE studyflow_dev;
CREATE USER studyflow WITH PASSWORD 'studyflow';
GRANT ALL PRIVILEGES ON DATABASE studyflow_dev TO studyflow;
```

**4. Migrations e seed**

```bash
npm run db:generate   # Gera Prisma Client
npm run db:migrate    # Aplica migrations
npm run db:seed       # Popula com dados demo
```

**5. Iniciar servidor**

```bash
npm run dev
```

---

## Scripts disponíveis

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run start            # Servidor de produção
npm run lint             # ESLint
npm run typecheck        # Verificação de tipos TypeScript

npm run db:generate      # Gera Prisma Client após mudanças no schema
npm run db:migrate       # Cria e aplica nova migration
npm run db:push          # Sync direto do schema (sem migration history)
npm run db:studio        # Prisma Studio — GUI para o banco
npm run db:seed          # Popula banco com dados demo

node scripts/setup.mjs         # Setup inicial interativo
node scripts/reset-db.mjs      # Apaga todos os dados e refaz seed
node scripts/health-check.mjs  # Verifica saúde do ambiente
```

---

## Estrutura do projeto

```
studyflow/
├── app/
│   ├── (auth)/           # Login, Register
│   ├── (app)/            # Páginas autenticadas
│   └── api/              # API Routes
│       ├── auth/
│       ├── users/
│       ├── study-plans/
│       ├── modules/
│       ├── topics/
│       ├── tasks/
│       ├── sessions/
│       ├── pomodoro/
│       ├── flashcards/
│       ├── reviews/
│       ├── analytics/
│       └── ai/suggest/
├── components/           # Componentes React
├── lib/
│   ├── prisma.ts         # Singleton Prisma
│   ├── auth.ts           # Config NextAuth
│   ├── gamification.ts   # XP, streak, conquistas
│   ├── spaced-repetition.ts  # Algoritmo SM-2
│   ├── ai-suggest.ts     # Motor de sugestões
│   ├── validations.ts    # Schemas Zod
│   └── utils.ts          # Helpers
├── store/                # Zustand stores
├── prisma/
│   ├── schema.prisma     # Schema do banco
│   └── seed.ts           # Dados demo
├── scripts/
│   ├── setup.mjs         # Setup inicial
│   ├── reset-db.mjs      # Reset do banco
│   └── health-check.mjs  # Health check
├── middleware.ts          # Proteção de rotas
├── docker-compose.yml
└── Dockerfile
```

---

## Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel:
- `DATABASE_URL` (use Supabase, Neon ou Railway)
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (sua URL de produção)

### Docker

```bash
# Build
docker build -t studyflow .

# Run
docker compose up -d
```

---

## API — Referência rápida

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/users` | Cadastro |
| GET | `/api/users` | Perfil atual |
| GET/POST | `/api/study-plans` | Planos de estudo |
| GET/PATCH/DELETE | `/api/study-plans/:id` | Plano específico |
| GET/POST | `/api/modules` | Módulos |
| GET/POST | `/api/topics` | Tópicos |
| GET/POST | `/api/tasks` | Tarefas |
| PATCH/DELETE | `/api/tasks/:id` | Toggle conclusão (+XP) |
| GET/POST | `/api/sessions` | Sessões de estudo |
| GET/POST | `/api/pomodoro` | Sessões pomodoro |
| GET/POST | `/api/flashcards` | Flashcards |
| GET | `/api/flashcards/due` | Fila de revisão do dia |
| POST | `/api/reviews` | Registrar revisão (SM-2) |
| GET | `/api/analytics?range=7` | Métricas do período |
| GET | `/api/ai/suggest?minutes=30` | Sugestões de estudo |

Todas as rotas (exceto `POST /api/users` e auth) exigem autenticação.

---

## Usuário demo

Criado pelo seed para testes e demonstração:

```
Email: demo@studyflow.app
Senha: demo1234
```

Inclui:
- 2 planos de estudo ativos com progresso variado
- 10 flashcards com datas de revisão espalhadas
- 14 dias de histórico de sessões de estudo
- 5 conquistas desbloqueadas
- Streak de 8 dias
- Nível 6+ com XP acumulado

---

## Licença

MIT
