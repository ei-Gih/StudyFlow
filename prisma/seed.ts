// prisma/seed.ts
// Execução: npm run db:seed  ou  npx tsx prisma/seed.ts
//
// O seed cria:
//   • 1 usuário demo (demo@studyflow.app / demo1234)
//   • 2 planos de estudo completos com módulos, tópicos e tarefas
//   • Flashcards com datas de revisão variadas
//   • Sessões de estudo e pomodoro dos últimos 14 dias
//   • Todas as conquistas disponíveis no sistema
//   • Stats iniciais com XP, nível e streak

import { PrismaClient, Difficulty, ReviewResult } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Dados dos planos ─────────────────────────────────────────────────────────

const PLAN_FULLSTACK = {
  title: "Full Stack Web Development",
  description: "Do zero ao deploy — dominar React, Node.js, bancos de dados e DevOps.",
  totalHours: 200,
  deadline: daysFromNow(120),
  modules: [
    {
      title: "Fundamentos de JavaScript",
      topics: [
        {
          title: "Tipos, variáveis e escopo",
          estimatedMin: 45,
          completed: true,
          tasks: [
            { description: "Ler MDN: var, let e const", completed: true },
            { description: "Exercícios de escopo e hoisting", completed: true },
            { description: "Praticar com closures", completed: true },
          ],
        },
        {
          title: "Funções e arrow functions",
          estimatedMin: 40,
          completed: true,
          tasks: [
            { description: "Diferença entre function declaration e expression", completed: true },
            { description: "Callbacks e higher-order functions", completed: true },
            { description: "Exercício: implementar map, filter, reduce do zero", completed: true },
          ],
        },
        {
          title: "Promises e async/await",
          estimatedMin: 60,
          completed: false,
          tasks: [
            { description: "Entender o event loop", completed: true },
            { description: "Criar uma Promise do zero", completed: true },
            { description: "Converter callbacks para async/await", completed: false },
            { description: "Tratamento de erros com try/catch", completed: false },
          ],
        },
        {
          title: "Módulos ES6 e bundlers",
          estimatedMin: 30,
          completed: false,
          tasks: [
            { description: "import/export named e default", completed: false },
            { description: "Entender o que é tree-shaking", completed: false },
          ],
        },
      ],
    },
    {
      title: "React & Ecossistema",
      topics: [
        {
          title: "Componentes e Props",
          estimatedMin: 50,
          completed: true,
          tasks: [
            { description: "Criar componente funcional com TypeScript", completed: true },
            { description: "Props obrigatórias vs opcionais", completed: true },
            { description: "children e composition pattern", completed: true },
          ],
        },
        {
          title: "useState e useEffect",
          estimatedMin: 60,
          completed: false,
          tasks: [
            { description: "Gerenciar estado local com useState", completed: true },
            { description: "Efeitos colaterais e cleanup", completed: true },
            { description: "Dependências do useEffect", completed: false },
            { description: "Criar um custom hook", completed: false },
          ],
        },
        {
          title: "Context API e Zustand",
          estimatedMin: 45,
          completed: false,
          tasks: [
            { description: "Criar um Context com Provider", completed: false },
            { description: "Zustand: store básica", completed: false },
            { description: "Comparar Context vs Zustand", completed: false },
          ],
        },
        {
          title: "Next.js App Router",
          estimatedMin: 90,
          completed: false,
          tasks: [
            { description: "Entender Server vs Client Components", completed: false },
            { description: "Dynamic routes e params", completed: false },
            { description: "Route Groups e layouts aninhados", completed: false },
            { description: "API Routes com Route Handlers", completed: false },
            { description: "Metadata e SEO", completed: false },
          ],
        },
      ],
    },
    {
      title: "Banco de Dados & Prisma",
      topics: [
        {
          title: "SQL essencial",
          estimatedMin: 60,
          completed: false,
          tasks: [
            { description: "SELECT, WHERE, JOIN, GROUP BY", completed: false },
            { description: "Índices e performance de queries", completed: false },
            { description: "Transações e ACID", completed: false },
          ],
        },
        {
          title: "Prisma ORM",
          estimatedMin: 75,
          completed: false,
          tasks: [
            { description: "Configurar schema.prisma", completed: false },
            { description: "CRUD com Prisma Client", completed: false },
            { description: "Relações 1:N e N:M", completed: false },
            { description: "Migrations em produção", completed: false },
          ],
        },
      ],
    },
  ],
};

const PLAN_ALGORITHMS = {
  title: "Algoritmos & Estruturas de Dados",
  description: "Preparação para entrevistas técnicas e pensamento computacional.",
  totalHours: 80,
  deadline: daysFromNow(60),
  modules: [
    {
      title: "Complexidade e Big O",
      topics: [
        {
          title: "Notação Big O",
          estimatedMin: 40,
          completed: true,
          tasks: [
            { description: "O(1), O(n), O(n²) — exemplos práticos", completed: true },
            { description: "Análise de loops aninhados", completed: true },
            { description: "Exercícios de classificação de algoritmos", completed: true },
          ],
        },
        {
          title: "Space complexity",
          estimatedMin: 30,
          completed: false,
          tasks: [
            { description: "Memória de stack vs heap", completed: true },
            { description: "Recursão e memória", completed: false },
          ],
        },
      ],
    },
    {
      title: "Arrays & Strings",
      topics: [
        {
          title: "Two pointers",
          estimatedMin: 45,
          completed: false,
          tasks: [
            { description: "Problema: Two Sum", completed: true },
            { description: "Problema: Container with Most Water", completed: false },
            { description: "Problema: Valid Palindrome", completed: false },
          ],
        },
        {
          title: "Sliding Window",
          estimatedMin: 50,
          completed: false,
          tasks: [
            { description: "Máximo em janela deslizante", completed: false },
            { description: "Substring sem repetição", completed: false },
          ],
        },
      ],
    },
    {
      title: "Estruturas de Dados",
      topics: [
        {
          title: "Stack e Queue",
          estimatedMin: 40,
          completed: false,
          tasks: [
            { description: "Implementar Stack com array", completed: false },
            { description: "Implementar Queue com linked list", completed: false },
            { description: "Valid Parentheses com Stack", completed: false },
          ],
        },
        {
          title: "Hash Maps",
          estimatedMin: 45,
          completed: false,
          tasks: [
            { description: "Colisões e chaining", completed: false },
            { description: "Frequency counter pattern", completed: false },
          ],
        },
      ],
    },
  ],
};

// ─── Flashcards ───────────────────────────────────────────────────────────────

const FLASHCARDS = [
  // JavaScript
  {
    front: "O que é closure em JavaScript?",
    back: "Uma closure é a combinação de uma função com as referências ao ambiente léxico ao redor dela. Permite que funções internas acessem variáveis de funções externas mesmo depois que a externa terminou de executar.",
    difficulty: "MEDIUM" as Difficulty,
    nextReviewAt: daysAgo(1),   // atrasado — deve aparecer na fila
  },
  {
    front: "Qual a diferença entre == e === em JavaScript?",
    back: "== faz coerção de tipo antes de comparar (1 == '1' é true). === não faz coerção (1 === '1' é false). Use === por padrão para evitar comportamentos inesperados.",
    difficulty: "EASY" as Difficulty,
    nextReviewAt: daysFromNow(5),
  },
  {
    front: "O que é o Event Loop no JavaScript?",
    back: "O Event Loop monitora a Call Stack e a Callback Queue. Quando a Call Stack está vazia, move callbacks da fila para a stack. Isso permite JavaScript ser non-blocking apesar de ser single-threaded.",
    difficulty: "HARD" as Difficulty,
    nextReviewAt: daysAgo(0),   // hoje
  },
  {
    front: "O que é hoisting em JavaScript?",
    back: "Hoisting move declarações (não inicializações) para o topo do escopo durante a compilação. var é içada e inicializada como undefined. let e const são içadas mas ficam em 'temporal dead zone'.",
    difficulty: "MEDIUM" as Difficulty,
    nextReviewAt: daysFromNow(2),
  },
  // React
  {
    front: "Quando usar useMemo vs useCallback?",
    back: "useMemo memoriza o resultado de uma computação cara. useCallback memoriza a referência de uma função. Use useMemo para valores derivados custosos; useCallback quando passa funções como prop para componentes filhos que usam React.memo.",
    difficulty: "HARD" as Difficulty,
    nextReviewAt: daysAgo(2),   // atrasado
  },
  {
    front: "O que é reconciliation no React?",
    back: "Processo pelo qual o React atualiza o DOM. O React compara a virtual DOM anterior com a nova (diffing), e aplica apenas as mudanças mínimas necessárias no DOM real. Usa a key prop para identificar elementos em listas.",
    difficulty: "MEDIUM" as Difficulty,
    nextReviewAt: daysFromNow(3),
  },
  // Algoritmos
  {
    front: "Qual a complexidade de tempo de um Binary Search?",
    back: "O(log n). A cada iteração descarta metade do espaço de busca. Requer array ordenado. Iterativo usa O(1) de espaço; recursivo usa O(log n) de espaço na call stack.",
    difficulty: "EASY" as Difficulty,
    nextReviewAt: daysFromNow(7),
  },
  {
    front: "Como funciona o algoritmo QuickSort?",
    back: "Escolhe um pivot, particiona o array em elementos menores e maiores que o pivot, e recursivamente ordena cada partição. Complexidade média O(n log n), pior caso O(n²). In-place (sem array auxiliar).",
    difficulty: "HARD" as Difficulty,
    nextReviewAt: daysAgo(1),   // atrasado
  },
  // TypeScript
  {
    front: "Qual a diferença entre interface e type no TypeScript?",
    back: "Ambos descrevem shapes de objetos. interface pode ser estendida com declaration merging e extends; type usa intersections (&) e pode representar unions, primitives e tuples. Para objetos, interface é geralmente preferida; para unions/transformações, use type.",
    difficulty: "MEDIUM" as Difficulty,
    nextReviewAt: daysAgo(3),   // atrasado
  },
  {
    front: "O que são Generic Types no TypeScript?",
    back: "Permitem criar código que funciona com múltiplos tipos mantendo tipagem forte. Ex: function identity<T>(arg: T): T. O TypeScript infere T do argumento ou você pode passar explicitamente: identity<string>('hello').",
    difficulty: "MEDIUM" as Difficulty,
    nextReviewAt: daysFromNow(1),
  },
];

// ─── Conquistas disponíveis no sistema ────────────────────────────────────────

const ACHIEVEMENTS = [
  { key: "FIRST_TASK",    title: "Primeira tarefa!",       description: "Completou sua primeira tarefa.",            icon: "✅", xpReward: 25  },
  { key: "TASKS_10",      title: "10 tarefas concluídas",  description: "Completou 10 tarefas.",                     icon: "🎯", xpReward: 50  },
  { key: "TASKS_100",     title: "Centurião",               description: "100 tarefas concluídas. Impressionante!",   icon: "💯", xpReward: 200 },
  { key: "FIRST_POMODORO",title: "Primeiro foco!",          description: "Completou sua primeira sessão Pomodoro.",   icon: "🍅", xpReward: 30  },
  { key: "POMODORO_10",   title: "10 Pomodoros",            description: "10 sessões de foco concluídas.",            icon: "⏱",  xpReward: 75  },
  { key: "STREAK_3",      title: "3 dias seguidos",         description: "Estudou por 3 dias consecutivos.",          icon: "🔥", xpReward: 50  },
  { key: "STREAK_7",      title: "Semana perfeita",         description: "7 dias consecutivos de estudo.",            icon: "⚡", xpReward: 150 },
  { key: "STREAK_30",     title: "Mês de dedicação",        description: "30 dias seguidos! Você é incrível.",        icon: "🏆", xpReward: 500 },
  { key: "FIRST_MODULE",  title: "Módulo completo!",        description: "Completou seu primeiro módulo.",            icon: "📦", xpReward: 100 },
  { key: "NIGHT_OWL",     title: "Coruja noturna",          description: "Estudou após meia-noite.",                  icon: "🦉", xpReward: 30  },
  { key: "EARLY_BIRD",    title: "Madrugador",              description: "Estudou antes das 7h da manhã.",            icon: "🌅", xpReward: 30  },
  { key: "FLASHCARD_50",  title: "Mestre dos flashcards",   description: "Revisou 50 flashcards.",                    icon: "🃏", xpReward: 75  },
];

// ─── Main seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Iniciando seed do StudyFlow...\n");

  // Limpa dados existentes mantendo ordem de FK
  console.log("🗑️  Limpando dados anteriores...");
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.flashcard.deleteMany(),
    prisma.pomodoroSession.deleteMany(),
    prisma.studySession.deleteMany(),
    prisma.userAchievement.deleteMany(),
    prisma.userStats.deleteMany(),
    prisma.task.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.module.deleteMany(),
    prisma.studyPlan.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("   ✓ Dados limpos\n");

  // ── 1. Conquistas ──────────────────────────────────────────────────────────
  console.log("🏆  Criando conquistas...");
  const createdAchievements = await Promise.all(
    ACHIEVEMENTS.map((a) =>
      prisma.achievement.create({ data: a })
    )
  );
  console.log(`   ✓ ${createdAchievements.length} conquistas criadas\n`);

  // ── 2. Usuário demo ────────────────────────────────────────────────────────
  console.log("👤  Criando usuário demo...");
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.create({
    data: {
      name: "Lucas Dev",
      email: "demo@studyflow.app",
      passwordHash,
    },
  });
  console.log(`   ✓ Usuário criado: ${user.email}\n`);

  // ── 3. Plano Full Stack ────────────────────────────────────────────────────
  console.log("📚  Criando Plano: Full Stack Web Development...");
  const plan1 = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      title: PLAN_FULLSTACK.title,
      description: PLAN_FULLSTACK.description,
      totalHours: PLAN_FULLSTACK.totalHours,
      deadline: PLAN_FULLSTACK.deadline,
      isActive: true,
    },
  });

  let totalTasks1 = 0, completedTasks1 = 0;

  for (let mi = 0; mi < PLAN_FULLSTACK.modules.length; mi++) {
    const modData = PLAN_FULLSTACK.modules[mi];
    const mod = await prisma.module.create({
      data: {
        studyPlanId: plan1.id,
        title: modData.title,
        orderIndex: mi,
      },
    });

    for (let ti = 0; ti < modData.topics.length; ti++) {
      const topicData = modData.topics[ti];
      const topic = await prisma.topic.create({
        data: {
          moduleId: mod.id,
          title: topicData.title,
          estimatedMin: topicData.estimatedMin,
          completed: topicData.completed,
          completedAt: topicData.completed ? daysAgo(randomBetween(1, 14)) : null,
          orderIndex: ti,
        },
      });

      for (let ki = 0; ki < topicData.tasks.length; ki++) {
        const taskData = topicData.tasks[ki];
        await prisma.task.create({
          data: {
            topicId: topic.id,
            description: taskData.description,
            estimatedMin: randomBetween(10, 30),
            completed: taskData.completed,
            completedAt: taskData.completed ? daysAgo(randomBetween(1, 10)) : null,
            orderIndex: ki,
          },
        });
        totalTasks1++;
        if (taskData.completed) completedTasks1++;
      }
    }
  }
  console.log(`   ✓ Plano criado: ${completedTasks1}/${totalTasks1} tarefas concluídas\n`);

  // ── 4. Plano Algoritmos ────────────────────────────────────────────────────
  console.log("📚  Criando Plano: Algoritmos & Estruturas de Dados...");
  const plan2 = await prisma.studyPlan.create({
    data: {
      userId: user.id,
      title: PLAN_ALGORITHMS.title,
      description: PLAN_ALGORITHMS.description,
      totalHours: PLAN_ALGORITHMS.totalHours,
      deadline: PLAN_ALGORITHMS.deadline,
      isActive: true,
    },
  });

  let totalTasks2 = 0, completedTasks2 = 0;

  for (let mi = 0; mi < PLAN_ALGORITHMS.modules.length; mi++) {
    const modData = PLAN_ALGORITHMS.modules[mi];
    const mod = await prisma.module.create({
      data: {
        studyPlanId: plan2.id,
        title: modData.title,
        orderIndex: mi,
      },
    });

    for (let ti = 0; ti < modData.topics.length; ti++) {
      const topicData = modData.topics[ti];
      const topic = await prisma.topic.create({
        data: {
          moduleId: mod.id,
          title: topicData.title,
          estimatedMin: topicData.estimatedMin,
          completed: topicData.completed,
          completedAt: topicData.completed ? daysAgo(randomBetween(1, 7)) : null,
          orderIndex: ti,
        },
      });

      for (let ki = 0; ki < topicData.tasks.length; ki++) {
        const taskData = topicData.tasks[ki];
        await prisma.task.create({
          data: {
            topicId: topic.id,
            description: taskData.description,
            estimatedMin: randomBetween(15, 45),
            completed: taskData.completed,
            completedAt: taskData.completed ? daysAgo(randomBetween(1, 6)) : null,
            orderIndex: ki,
          },
        });
        totalTasks2++;
        if (taskData.completed) completedTasks2++;
      }
    }
  }
  console.log(`   ✓ Plano criado: ${completedTasks2}/${totalTasks2} tarefas concluídas\n`);

  // ── 5. Flashcards ──────────────────────────────────────────────────────────
  console.log("🃏  Criando flashcards...");
  const createdCards = await Promise.all(
    FLASHCARDS.map((fc) =>
      prisma.flashcard.create({
        data: {
          userId: user.id,
          front: fc.front,
          back: fc.back,
          difficulty: fc.difficulty,
          nextReviewAt: fc.nextReviewAt,
          reviewCount: randomBetween(0, 8),
        },
      })
    )
  );
  console.log(`   ✓ ${createdCards.length} flashcards criados\n`);

  // Cria algumas reviews passadas para os flashcards
  console.log("📝  Criando histórico de revisões...");
  const results: ReviewResult[] = ["AGAIN", "HARD", "GOOD", "EASY"];
  let reviewCount = 0;

  for (const card of createdCards.slice(0, 6)) {
    const numReviews = randomBetween(2, 5);
    for (let r = 0; r < numReviews; r++) {
      await prisma.review.create({
        data: {
          flashcardId: card.id,
          userId: user.id,
          result: results[randomBetween(0, 3)],
          reviewedAt: daysAgo(randomBetween(1, 14)),
        },
      });
      reviewCount++;
    }
  }
  console.log(`   ✓ ${reviewCount} revisões criadas\n`);

  // ── 6. Sessões de estudo (últimos 14 dias) ─────────────────────────────────
  console.log("⏱️  Criando sessões de estudo (14 dias)...");
  const sessionDurations = [30, 45, 25, 60, 45, 30, 50, 40, 35, 55, 25, 45, 60, 30];

  for (let day = 13; day >= 0; day--) {
    // Pula alguns dias para simular streak não perfeita
    if (day === 9 || day === 4) continue;

    const sessionDate = daysAgo(day);
    const durationMin = sessionDurations[day] ?? 30;
    const startHour = randomBetween(18, 22);

    const startedAt = new Date(sessionDate);
    startedAt.setHours(startHour, 0, 0, 0);
    const endedAt = new Date(startedAt.getTime() + durationMin * 60 * 1000);

    await prisma.studySession.create({
      data: {
        userId: user.id,
        durationMin,
        startedAt,
        endedAt,
        notes: day === 0 ? "Foco total hoje!" : null,
      },
    });
  }
  console.log(`   ✓ Sessões de estudo criadas\n`);

  // ── 7. Sessões Pomodoro (últimos 10 dias) ──────────────────────────────────
  console.log("🍅  Criando sessões pomodoro...");
  const pomodoroDays = [0, 1, 2, 3, 5, 6, 7, 8, 10, 11];

  for (const day of pomodoroDays) {
    const cycles = randomBetween(2, 4);
    await prisma.pomodoroSession.create({
      data: {
        userId: user.id,
        focusMin: 25,
        breakMin: 5,
        cycles,
        completed: true,
        date: daysAgo(day),
      },
    });
  }
  console.log(`   ✓ ${pomodoroDays.length} sessões pomodoro criadas\n`);

  // ── 8. Stats do usuário ────────────────────────────────────────────────────
  console.log("📊  Criando stats do usuário...");

  const totalCompletedTasks = completedTasks1 + completedTasks2;
  const totalXp =
    totalCompletedTasks * 10 +          // tarefas
    pomodoroDays.length * 3 * 20 +      // pomodoro (média 3 ciclos)
    reviewCount * 5 +                   // flashcards
    25 + 50 + 30 + 50 + 75 + 50;        // conquistas

  const level = Math.floor(totalXp / 300) + 1;

  await prisma.userStats.create({
    data: {
      userId: user.id,
      totalXp,
      level,
      streak: 8,
      longestStreak: 12,
      lastStudyDate: new Date(),
      totalMinutes: sessionDurations.reduce((a, b) => a + b, 0) + pomodoroDays.length * 3 * 25,
      tasksCompleted: totalCompletedTasks,
      pomodoroCount: pomodoroDays.length * 3,
      modulesCompleted: 1,
    },
  });
  console.log(`   ✓ Stats criadas — Nível ${level}, ${totalXp} XP, streak 8 dias\n`);

  // ── 9. Conquistas desbloqueadas ────────────────────────────────────────────
  console.log("🏆  Desbloqueando conquistas do demo...");
  const toUnlock = ["FIRST_TASK", "TASKS_10", "FIRST_POMODORO", "STREAK_3", "FIRST_MODULE"];

  for (const key of toUnlock) {
    const achievement = createdAchievements.find((a) => a.key === key);
    if (!achievement) continue;
    await prisma.userAchievement.create({
      data: {
        userId: user.id,
        achievementId: achievement.id,
        unlockedAt: daysAgo(randomBetween(1, 12)),
      },
    });
  }
  console.log(`   ✓ ${toUnlock.length} conquistas desbloqueadas\n`);

  // ── Resumo final ───────────────────────────────────────────────────────────
  console.log("─".repeat(52));
  console.log("✅  Seed concluído com sucesso!\n");
  console.log("   📧 Email:  demo@studyflow.app");
  console.log("   🔑 Senha:  demo1234");
  console.log(`   ⭐ XP:     ${totalXp} (Nível ${level})`);
  console.log(`   🔥 Streak: 8 dias`);
  console.log(`   ✅ Tarefas: ${totalCompletedTasks} concluídas`);
  console.log(`   🃏 Cards pendentes: ${FLASHCARDS.filter(f => f.nextReviewAt <= new Date()).length}`);
  console.log("─".repeat(52) + "\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed falhou:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
