#!/usr/bin/env node
// scripts/setup.mjs
// Execução: node scripts/setup.mjs
//
// Guia interativo de configuração inicial do StudyFlow.
// Verifica pré-requisitos, cria .env.local, roda migrations e seed.

import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { createInterface } from "readline";
import { randomBytes } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ─── Cores no terminal ────────────────────────────────────────────────────────

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  dim:    "\x1b[2m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  blue:   "\x1b[34m",
  white:  "\x1b[37m",
};

const ok    = (msg) => console.log(`  ${C.green}✓${C.reset}  ${msg}`);
const warn  = (msg) => console.log(`  ${C.yellow}⚠${C.reset}  ${msg}`);
const error = (msg) => console.log(`  ${C.red}✗${C.reset}  ${msg}`);
const info  = (msg) => console.log(`  ${C.cyan}→${C.reset}  ${msg}`);
const step  = (msg) => console.log(`\n${C.bold}${C.blue}${msg}${C.reset}`);
const hr    = ()    => console.log(`\n${C.dim}${"─".repeat(54)}${C.reset}`);

// ─── Readline helper ──────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(`  ${C.cyan}?${C.reset}  ${q} `, res));
const askSecret = (q) => new Promise((res) => {
  process.stdout.write(`  ${C.cyan}?${C.reset}  ${q} `);
  process.stdin.setRawMode?.(true);
  let input = "";
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  const handler = (ch) => {
    ch = ch.toString();
    if (ch === "\n" || ch === "\r" || ch === "\u0004") {
      process.stdin.setRawMode?.(false);
      process.stdin.pause();
      process.stdin.removeListener("data", handler);
      console.log();
      res(input);
    } else if (ch === "\u0003") {
      process.exit();
    } else if (ch === "\u007f") {
      input = input.slice(0, -1);
    } else {
      input += ch;
      process.stdout.write("*");
    }
  };
  process.stdin.on("data", handler);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "pipe", ...opts });
}

function runVisible(cmd) {
  return spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "inherit" });
}

function commandExists(cmd) {
  const r = run(`command -v ${cmd} 2>/dev/null || where ${cmd} 2>nul`);
  return r.status === 0;
}

function getVersion(cmd) {
  const r = run(`${cmd} --version`);
  return r.status === 0 ? r.stdout.toString().trim().split("\n")[0] : null;
}

// ─── Etapas ───────────────────────────────────────────────────────────────────

async function checkPrerequisites() {
  step("1/6  Verificando pré-requisitos");

  // Node.js
  const nodeVer = getVersion("node");
  if (!nodeVer) {
    error("Node.js não encontrado. Instale em https://nodejs.org (v18+)");
    process.exit(1);
  }
  const major = parseInt(nodeVer.match(/v?(\d+)/)?.[1] ?? "0");
  if (major < 18) {
    error(`Node.js v${major} detectado. Versão mínima: v18`);
    process.exit(1);
  }
  ok(`Node.js ${nodeVer}`);

  // npm
  const npmVer = getVersion("npm");
  if (!npmVer) { error("npm não encontrado."); process.exit(1); }
  ok(`npm ${npmVer}`);

  // git (opcional)
  const gitVer = getVersion("git");
  gitVer ? ok(`git ${gitVer}`) : warn("git não encontrado (opcional)");

  // Docker (opcional)
  const dockerVer = getVersion("docker");
  dockerVer ? ok(`Docker ${dockerVer}`) : warn("Docker não encontrado — banco de dados manual necessário");

  return { hasDocker: !!dockerVer };
}

async function installDependencies() {
  step("2/6  Instalando dependências npm");

  if (existsSync(path.join(ROOT, "node_modules"))) {
    const answer = await ask("node_modules já existe. Reinstalar? (s/N)");
    if (answer.toLowerCase() !== "s") {
      info("Pulando instalação.");
      return;
    }
  }

  info("Rodando npm install...");
  const r = runVisible("npm install");
  if (r.status !== 0) { error("npm install falhou."); process.exit(1); }
  ok("Dependências instaladas");
}

async function setupEnv() {
  step("3/6  Configurando variáveis de ambiente");

  const envPath = path.join(ROOT, ".env.local");
  const examplePath = path.join(ROOT, ".env.example");

  if (existsSync(envPath)) {
    const answer = await ask(".env.local já existe. Reconfigurar? (s/N)");
    if (answer.toLowerCase() !== "s") {
      info("Usando .env.local existente.");
      return;
    }
  }

  // Lê template
  if (!existsSync(examplePath)) {
    error(".env.example não encontrado.");
    process.exit(1);
  }
  let envContent = readFileSync(examplePath, "utf-8");

  console.log();
  info("Informe os dados do banco de dados PostgreSQL:");

  const dbHost = await ask("Host do banco    [localhost]:");
  const dbPort = await ask("Porta do banco   [5432]:");
  const dbUser = await ask("Usuário do banco [studyflow]:");
  const dbPass = await askSecret("Senha do banco   [studyflow]:");
  const dbName = await ask("Nome do banco    [studyflow_dev]:");

  const host  = dbHost  || "localhost";
  const port  = dbPort  || "5432";
  const user  = dbUser  || "studyflow";
  const pass  = dbPass  || "studyflow";
  const name  = dbName  || "studyflow_dev";

  const dbUrl = `postgresql://${user}:${pass}@${host}:${port}/${name}`;
  const secret = randomBytes(32).toString("base64");

  envContent = envContent
    .replace(/DATABASE_URL=.*/, `DATABASE_URL="${dbUrl}"`)
    .replace(/NEXTAUTH_SECRET=.*/, `NEXTAUTH_SECRET="${secret}"`)
    .replace(/NEXTAUTH_URL=.*/, `NEXTAUTH_URL="http://localhost:3000"`);

  writeFileSync(envPath, envContent);
  ok(`.env.local criado`);
  ok(`NEXTAUTH_SECRET gerado automaticamente`);
  info(`DATABASE_URL: ${dbUrl}`);
}

async function setupDatabase({ hasDocker }) {
  step("4/6  Configurando banco de dados");

  if (hasDocker) {
    const answer = await ask("Iniciar PostgreSQL + Redis via Docker Compose? (S/n)");
    if (answer.toLowerCase() !== "n") {
      info("Iniciando containers...");
      const r = runVisible("docker compose up -d db redis");
      if (r.status !== 0) {
        warn("docker compose falhou. Certifique-se que o PostgreSQL está rodando manualmente.");
      } else {
        ok("Containers iniciados (db + redis)");
        info("Aguardando PostgreSQL ficar pronto...");
        // Retry por até 15s
        let ready = false;
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 1000));
          const check = run("docker compose exec db pg_isready -U studyflow");
          if (check.status === 0) { ready = true; break; }
          process.stdout.write(".");
        }
        console.log();
        ready ? ok("PostgreSQL pronto") : warn("Timeout aguardando PostgreSQL. Continue manualmente.");
      }
    }
  } else {
    warn("Docker não disponível. Certifique-se que o PostgreSQL está rodando.");
    await ask("Pressione Enter quando o banco estiver pronto...");
  }

  // Gera Prisma Client
  info("Gerando Prisma Client...");
  const gen = runVisible("npx prisma generate");
  if (gen.status !== 0) { error("prisma generate falhou."); process.exit(1); }
  ok("Prisma Client gerado");

  // Roda migrations
  info("Rodando migrations...");
  const mig = runVisible("npx prisma migrate dev --name init");
  if (mig.status !== 0) {
    warn("migrate dev falhou — tentando db push...");
    const push = runVisible("npx prisma db push");
    if (push.status !== 0) { error("prisma db push também falhou. Verifique a DATABASE_URL."); process.exit(1); }
    ok("Schema aplicado via db push");
  } else {
    ok("Migrations aplicadas");
  }
}

async function runSeed() {
  step("5/6  Populando banco com dados de demonstração");

  const answer = await ask("Executar seed (cria usuário demo + dados de exemplo)? (S/n)");
  if (answer.toLowerCase() === "n") {
    info("Seed ignorado.");
    return;
  }

  info("Executando seed...");
  const r = runVisible("npx tsx prisma/seed.ts");
  if (r.status !== 0) { error("Seed falhou."); process.exit(1); }
}

async function finalSummary() {
  step("6/6  Tudo pronto!");

  hr();
  console.log(`
  ${C.bold}${C.green}StudyFlow configurado com sucesso!${C.reset}

  ${C.cyan}Para iniciar o servidor de desenvolvimento:${C.reset}
    ${C.bold}npm run dev${C.reset}

  ${C.cyan}Acesse em:${C.reset}
    ${C.bold}http://localhost:3000${C.reset}

  ${C.cyan}Login demo:${C.reset}
    Email: ${C.bold}demo@studyflow.app${C.reset}
    Senha: ${C.bold}demo1234${C.reset}

  ${C.cyan}Outros comandos úteis:${C.reset}
    ${C.dim}npm run db:studio${C.reset}     → Prisma Studio (GUI do banco)
    ${C.dim}npm run db:seed${C.reset}       → Recriar dados demo
    ${C.dim}npm run typecheck${C.reset}     → Verificar TypeScript
    ${C.dim}docker compose logs -f${C.reset} → Ver logs dos containers
  `);
  hr();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  console.log(`
${C.bold}${C.cyan}
  ╭─────────────────────────────────────╮
  │   StudyFlow — Setup Inicial  v1.0   │
  ╰─────────────────────────────────────╯
${C.reset}`);

  try {
    const { hasDocker } = await checkPrerequisites();
    await installDependencies();
    await setupEnv();
    await setupDatabase({ hasDocker });
    await runSeed();
    await finalSummary();
  } catch (e) {
    console.error(`\n${C.red}Erro inesperado:${C.reset}`, e);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
