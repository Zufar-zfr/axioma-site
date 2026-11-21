// Собирает один файл dist/worker.js — его можно вставить прямо в редактор Cloudflare (без wrangler).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const knowledge = readFileSync("src/knowledge.js", "utf8").replace(/^export const /gm, "const ");
const index = readFileSync("src/index.js", "utf8").replace(/^import .*$/m, "");
mkdirSync("dist", { recursive: true });
writeFileSync("dist/worker.js", `// Сгенерировано командой: npm run build\n${knowledge}\n${index}`);
console.log("dist/worker.js готов");
