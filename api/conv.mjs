// Живая проверка многоходового диалога (ключ из переменной окружения GEMINI_API_KEY).
const worker = (await import("./src/index.js")).default;
const env = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, GEMINI_MODEL: "gemini-3.5-flash-lite", ALLOWED_ORIGINS: "https://x.test" };
const script = process.argv.slice(2);
const history = []; let n = 0;
for (const q of script) {
  const r = await worker.fetch(new Request("https://w/", { method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://x.test", "CF-Connecting-IP": "10.1.0." + (++n) },
    body: JSON.stringify({ message: q, history }) }), env);
  const { reply } = await r.json();
  console.log(`\n> ${q}\n${reply}`);
  console.log(reply.includes("WhatsApp") || reply.includes("707") ? "   [упоминает WhatsApp]" : "   [без WhatsApp]");
  history.push({ role: "user", content: q }, { role: "assistant", content: reply });
}
