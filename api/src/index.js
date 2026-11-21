// AI-ассистент AXIOMA — Cloudflare Worker.
// Принимает сообщение с сайта, добавляет «знания» и ключ Gemini (хранится в секретах Cloudflare, не в коде)
// и возвращает ответ. Формат: POST { sessionId, message, history[] } → { reply }.

import { SYSTEM_PROMPT, FALLBACK_REPLY } from "./knowledge.js";

const MAX_MESSAGE = 800;        // символов в одном сообщении посетителя
const MAX_HISTORY = 12;         // сколько последних реплик передаём модели
const MAX_OUTPUT_TOKENS = 450;  // длина ответа
const LIMIT_PER_WINDOW = 20;    // запросов с одного адреса…
const WINDOW_MS = 10 * 60_000;  // …за 10 минут (мягкий лимит; основной — правило Cloudflare, см. README)
const TIMEOUT_MS = 20_000;

const hits = new Map();         // ip -> [timestamps]; живёт в памяти экземпляра Worker

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
}

function corsHeaders(origin, env) {
  const ok = origin && allowedOrigins(env).includes(origin);
  return ok
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" }
    : { "Vary": "Origin" };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
  });
}

function rateLimited(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < WINDOW_MS)) hits.delete(k);
  return list.length > LIMIT_PER_WINDOW;
}

function buildContents(history, message) {
  const turns = [];
  for (const h of Array.isArray(history) ? history.slice(-MAX_HISTORY) : []) {
    const text = String(h?.content ?? "").slice(0, MAX_MESSAGE * 2).trim();
    const role = h?.role === "assistant" ? "model" : h?.role === "user" ? "user" : null;
    if (!role || !text) continue;
    if (turns.length && turns[turns.length - 1].role === role) { turns[turns.length - 1].parts[0].text += "\n" + text; continue; }
    turns.push({ role, parts: [{ text }] });
  }
  while (turns.length && turns[0].role !== "user") turns.shift();      // диалог должен начинаться с реплики пользователя
  if (turns.length && turns[turns.length - 1].role === "user") turns.pop(); // последняя реплика пользователя идёт отдельно ниже
  turns.push({ role: "user", parts: [{ text: message }] });
  return turns;
}

async function askGemini(env, contents) {
  const model = env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const generationConfig = { temperature: 0.5, topP: 0.9, maxOutputTokens: MAX_OUTPUT_TOKENS };
  if (/2\.5/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };   // быстрый ответ без «размышлений»
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST", signal: ctrl.signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents, generationConfig,
        safetySettings: ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"]
          .map(category => ({ category, threshold: "BLOCK_MEDIUM_AND_ABOVE" })),
      }),
    });
    if (!res.ok) { console.error("Gemini HTTP", res.status, (await res.text()).slice(0, 300)); return null; }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    return text || null;
  } catch (e) {
    console.error("Gemini error", String(e)); return null;
  } finally { clearTimeout(timer); }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
    if (!origin || !cors["Access-Control-Allow-Origin"]) return json({ error: "forbidden_origin" }, 403, cors);
    if (!env.GEMINI_API_KEY) return json({ reply: FALLBACK_REPLY }, 200, cors);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (rateLimited(ip)) return json({ reply: "Слишком много сообщений подряд. Напишите, пожалуйста, нашей команде в WhatsApp: +7 707 507 7121." }, 429, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: "bad_json" }, 400, cors); }
    const message = String(body?.message ?? "").trim().slice(0, MAX_MESSAGE);
    if (!message) return json({ error: "empty_message" }, 400, cors);

    const reply = await askGemini(env, buildContents(body?.history, message));
    return json({ reply: reply || FALLBACK_REPLY }, 200, cors);
  },
};
