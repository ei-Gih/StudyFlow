import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

// ── Study Plans ───────────────────────────────────────────────────────────────

export const createStudyPlanSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  totalHours: z.number().int().min(1).max(10000).optional(),
  deadline: z.string().datetime().optional(),
});

export const updateStudyPlanSchema = createStudyPlanSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ── Modules ───────────────────────────────────────────────────────────────────

export const createModuleSchema = z.object({
  studyPlanId: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateModuleSchema = createModuleSchema.omit({ studyPlanId: true }).partial();

// ── Topics ────────────────────────────────────────────────────────────────────

export const createTopicSchema = z.object({
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  estimatedMin: z.number().int().min(1).max(480).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateTopicSchema = createTopicSchema.omit({ moduleId: true }).partial().extend({
  completed: z.boolean().optional(),
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  topicId: z.string().uuid(),
  description: z.string().min(1).max(300),
  estimatedMin: z.number().int().min(1).max(240).optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  description: z.string().min(1).max(300).optional(),
  estimatedMin: z.number().int().min(1).max(240).optional(),
  completed: z.boolean().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

// ── Sessions ──────────────────────────────────────────────────────────────────

export const createStudySessionSchema = z.object({
  topicId: z.string().uuid().optional(),
  durationMin: z.number().int().min(1).max(600),
  notes: z.string().max(500).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
});

// ── Pomodoro ──────────────────────────────────────────────────────────────────

export const createPomodoroSchema = z.object({
  topicId: z.string().uuid().optional(),
  focusMin: z.number().int().min(1).max(90).default(25),
  breakMin: z.number().int().min(1).max(30).default(5),
  cycles: z.number().int().min(1).max(20),
  completed: z.boolean().default(false),
  date: z.string().datetime().optional(),
});

// ── Flashcards ────────────────────────────────────────────────────────────────

export const createFlashcardSchema = z.object({
  topicId: z.string().uuid().optional(),
  front: z.string().min(1).max(1000),
  back: z.string().min(1).max(2000),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
});

export const updateFlashcardSchema = createFlashcardSchema.omit({ topicId: true }).partial();

// ── Reviews ───────────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  flashcardId: z.string().uuid(),
  result: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
});
