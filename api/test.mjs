// Проверка логики Worker без интернета и без настоящего ключа: подменяем fetch к Gemini.
const worker = (await import(process.env.BUNDLE ? "./dist/worker.js" : "./src/index.js")).default;
import assert from "node:assert/strict";

const ENV = { GEMINI_API_KEY: "TEST_KEY", ALLOWED_ORIGINS: "https://zufar-zfr.github.io", GEMINI_MODEL: "gemini-2.5-flash" };
let lastCall = null, mode = "ok";
globalThis.fetch = async (url, init) => {
  lastCall = { url: String(url), init, body: JSON.parse(init.body) };
  if (mode === "error") return new Response("boom", { status: 500 });
  if (mode === "empty") return new Response(JSON.stringify({ candidates: [] }), { status: 200 });
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Привет! Расскажу про AXIOMA." }] } }] }), { status: 200 });
};
const call = (body, { origin = "https://zufar-zfr.github.io", method = "POST", ip = "1.1.1.1", env = ENV } = {}) =>
  worker.fetch(new Request("https://chat.example/", {
    method, headers: { "Content-Type": "application/json", Origin: origin, "CF-Connecting-IP": ip },
    body: method === "POST" ? JSON.stringify(body) : undefined }), env);

// 1. preflight
let r = await call(null, { method: "OPTIONS" });
assert.equal(r.status, 204); assert.equal(r.headers.get("Access-Control-Allow-Origin"), "https://zufar-zfr.github.io");

// 2. обычный запрос: ключ в заголовке, система + контент, ответ вернулся
r = await call({ message: "Сколько стоит сайт?", history: [{ role: "assistant", content: "Здравствуйте!" }, { role: "user", content: "Привет" }, { role: "assistant", content: "Чем помочь?" }] });
let j = await r.json();
assert.equal(r.status, 200); assert.match(j.reply, /AXIOMA/);
assert.equal(lastCall.init.headers["x-goog-api-key"], "TEST_KEY");
assert.ok(!lastCall.url.includes("TEST_KEY"), "ключ не должен попадать в URL");
assert.match(lastCall.body.systemInstruction.parts[0].text, /AXIOMA/);
const roles = lastCall.body.contents.map(c => c.role);
assert.equal(roles[0], "user"); assert.equal(roles.at(-1), "user");
for (let i = 1; i < roles.length; i++) assert.notEqual(roles[i], roles[i - 1]);   // роли чередуются
assert.equal(lastCall.body.contents.at(-1).parts[0].text, "Сколько стоит сайт?");
assert.equal(lastCall.body.generationConfig.thinkingConfig.thinkingBudget, 0);

// 3. чужой сайт запрещён
r = await call({ message: "hi" }, { origin: "https://evil.example" });
assert.equal(r.status, 403); assert.equal(r.headers.get("Access-Control-Allow-Origin"), null);

// 4. пустое сообщение и слишком длинное
r = await call({ message: "   " }); assert.equal(r.status, 400);
await call({ message: "я".repeat(5000) }); assert.equal(lastCall.body.contents.at(-1).parts[0].text.length, 800);

// 5. ошибка Gemini / пустой ответ → вежливая заглушка, не ошибка клиенту
mode = "error"; r = await call({ message: "привет" }, { ip: "2.2.2.2" }); j = await r.json();
assert.equal(r.status, 200); assert.match(j.reply, /WhatsApp/);
mode = "empty"; r = await call({ message: "привет" }, { ip: "2.2.2.2" }); j = await r.json(); assert.match(j.reply, /WhatsApp/);
mode = "ok";

// 6. нет ключа → заглушка (ключ не утёк и ничего не упало)
r = await call({ message: "привет" }, { env: { ...ENV, GEMINI_API_KEY: "" }, ip: "3.3.3.3" }); j = await r.json(); assert.match(j.reply, /WhatsApp/);

// 7. лимит запросов с одного адреса
let last;
for (let i = 0; i < 25; i++) last = await call({ message: "ping" }, { ip: "9.9.9.9" });
assert.equal(last.status, 429);

// 8. GET запрещён
r = await call(null, { method: "GET" }); assert.equal(r.status, 405);

console.log("Все проверки пройдены");
