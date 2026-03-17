#!/usr/bin/env node
// scripts/health-check.mjs
// Uso: node scripts/health-check.mjs
//
// Verifica se todos os serviços estão saudáveis antes de iniciar o servidor.
// Ideal para usar no CMD do Dockerfile ou no CI.

import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  red: "\x1b[31m", green: "\x1b[32m",
  yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m",
};

let allOk = true;
const ok   = (msg) => console.log(`  ${C.green}✓${C.reset}  ${msg}`);
const fail = (msg) => { console.log(`  ${C.red}✗${C.reset}  ${msg}`); allOk = false; };
const warn = (msg) => console.log(`  ${C.yellow}⚠${C.reset}  ${msg}`);

function run(cmd) {
  return spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "pipe" });
}

function checkEnvVar(name, required = true) {
  const val = process.env[name];
  if (!val) {
    required ? fail(`${name} não definida`) : warn(`${name} não definida (opcional)`);
    return false;
  }
  ok(`${name} = ${val.startsWith("postgresql") ? val.split("@")[1] ?? "***" : "***"}`);
  return true;
}

async function main() {
  console.log(`\n${C.bold}${C.cyan}  StudyFlow — Health Check${C.reset}\n`);

  // ── 1. Variáveis de ambiente ────────────────────────────────────────────────
  console.log(`${C.bold}  Variáveis de ambiente:${C.reset}`);

  // Carrega .env.local se existir
  const envPath = path.join(ROOT, ".env.local");
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const [key, ...rest] = line.split("=");
      if (key && !key.startsWith("#") && rest.length) {
        process.env[key.trim()] = rest.join("=").replace(/^["']|["']$/g, "").trim();
      }
    }
  }

  checkEnvVar("DATABASE_URL");
  checkEnvVar("NEXTAUTH_SECRET");
  checkEnvVar("NEXTAUTH_URL");
  checkEnvVar("GOOGLE_CLIENT_ID", false);
  checkEnvVar("REDIS_URL", false);

  // ── 2. Arquivos essenciais ──────────────────────────────────────────────────
  console.log(`\n${C.bold}  Arquivos essenciais:${C.reset}`);

  const required = [
    "prisma/schema.prisma",
    "package.json",
    "next.config.ts",
  ];

  for (const file of required) {
    const full = path.join(ROOT, file);
    existsSync(full) ? ok(file) : fail(`${file} não encontrado`);
  }

  // ── 3. Banco de dados ───────────────────────────────────────────────────────
  console.log(`\n${C.bold}  Conexão com banco de dados:${C.reset}`);

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // Tenta fazer uma query simples via Prisma
    const r = run(
      `node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.$queryRaw\`SELECT 1\`.then(()=>{console.log('ok');process.exit(0)}).catch(e=>{console.error(e.message);process.exit(1)}).finally(()=>p.$disconnect())"`
    );

    if (r.status === 0) {
      ok("PostgreSQL conectado e respondendo");
    } else {
      const errMsg = r.stderr.toString().split("\n")[0];
      fail(`PostgreSQL indisponível: ${errMsg}`);
    }
  } else {
    fail("DATABASE_URL não definida — não foi possível testar conexão");
  }

  // ── 4. Prisma Client gerado ─────────────────────────────────────────────────
  console.log(`\n${C.bold}  Prisma Client:${C.reset}`);

  const prismaClientPath = path.join(ROOT, "node_modules/.prisma/client/index.js");
  existsSync(prismaClientPath)
    ? ok("Prisma Client gerado")
    : fail("Prisma Client não gerado — rode: npx prisma generate");

  // ── 5. Build do Next.js (apenas em produção) ────────────────────────────────
  if (process.env.NODE_ENV === "production") {
    console.log(`\n${C.bold}  Build Next.js:${C.reset}`);
    const nextBuild = path.join(ROOT, ".next/standalone/server.js");
    existsSync(nextBuild)
      ? ok("Build de produção encontrado")
      : fail("Build não encontrado — rode: npm run build");
  }

  // ── Resultado ────────────────────────────────────────────────────────────────
  console.log(`\n  ${"─".repeat(42)}`);
  if (allOk) {
    console.log(`  ${C.green}${C.bold}Todos os checks passaram. Pronto para iniciar!${C.reset}\n`);
    process.exit(0);
  } else {
    console.log(`  ${C.red}${C.bold}Alguns checks falharam. Corrija antes de iniciar.${C.reset}\n`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
