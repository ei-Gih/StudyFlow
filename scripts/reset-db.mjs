#!/usr/bin/env node
// scripts/reset-db.mjs
// Uso: node scripts/reset-db.mjs
//
// Apaga TODOS os dados do banco e recria do zero com o seed.
// Útil durante desenvolvimento para voltar ao estado inicial.

import { spawnSync } from "child_process";
import { createInterface } from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m",
  red: "\x1b[31m", green: "\x1b[32m",
  yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m",
};

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((res) => rl.question(`  ${C.cyan}?${C.reset}  ${q} `, res));
const runVisible = (cmd) => spawnSync(cmd, { shell: true, cwd: ROOT, stdio: "inherit" });

async function main() {
  console.log(`
${C.bold}${C.red}
  ╭──────────────────────────────────────╮
  │   StudyFlow — Reset do Banco  ⚠️      │
  ╰──────────────────────────────────────╯
${C.reset}
  ${C.yellow}ATENÇÃO: Esta operação irá apagar TODOS os dados do banco.${C.reset}
  `);

  const confirm = await ask("Digite CONFIRMAR para prosseguir:");
  if (confirm !== "CONFIRMAR") {
    console.log(`\n  ${C.dim}Operação cancelada.${C.reset}\n`);
    rl.close();
    return;
  }

  console.log();

  // Reset via Prisma migrate reset (apaga + recria schema)
  console.log(`  ${C.cyan}→${C.reset}  Resetando banco de dados...`);
  const reset = runVisible("npx prisma migrate reset --force");
  if (reset.status !== 0) {
    // Fallback: db push
    console.log(`  ${C.yellow}⚠${C.reset}  migrate reset falhou, tentando db push...`);
    runVisible("npx prisma db push --force-reset");
  }

  console.log(`  ${C.cyan}→${C.reset}  Executando seed...`);
  const seed = runVisible("npx tsx prisma/seed.ts");

  if (seed.status === 0) {
    console.log(`
  ${C.green}✓${C.reset}  Banco resetado e populado com sucesso!

  ${C.dim}Login demo: demo@studyflow.app / demo1234${C.reset}
    `);
  } else {
    console.log(`\n  ${C.red}✗${C.reset}  Seed falhou após o reset.\n`);
  }

  rl.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
