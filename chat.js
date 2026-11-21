/*
 * Чат с ИИ-агентом «Аксиомы».
 *
 * Режимы:
 *  - Пока window.AXIOMA_CONFIG.chatApiUrl пустой — отвечает локальный демо-сценарий (без сервера).
 *  - Когда укажете URL в config.js — каждое сообщение уходит на ваш API:
 *
 *    POST {chatApiUrl}
 *    Content-Type: application/json
 *    { "sessionId": "abc123",
 *      "message": "текст клиента",
 *      "history": [ {"role":"user"|"assistant","content":"..."} ] }
 *
 *    Ответ 200 JSON:
 *    { "reply": "текст агента",
 *      "crm": { "topic": "...", "contact": "...", "status": "..." }   // необязательно
 *    }
 */
(function () {
  const CFG = window.AXIOMA_CONFIG || {};
  const sessionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
  const history = [];

  /* ---------- Локальный демо-агент ---------- */
  const topics = [
    { re: /сайт|веб|лендинг|интернет-магазин|магазин/i, name: "Сайт / веб-сервис",
      reply: "Делаем сайты по вашему техническому заданию и внедряем в работу компании. Для какого бизнеса сайт и нужна ли онлайн-оплата?" },
    { re: /приложен|мобил|платформ|карт|доставк/i, name: "Приложение / платформа",
      reply: "Создаём приложения: клиент выбирает товар или услугу, смотрит точки на карте, оплачивает и оформляет доставку. Какие функции нужны в первую очередь?" },
    { re: /агент|бот|whatsapp|ватсап|instagram|инстаграм|чат|звон|голос/i, name: "ИИ-агент",
      reply: "Настроим агента под ваши продукты, цены и правила, подключим к CRM, WhatsApp и Instagram. Через какой канал вам чаще всего пишут клиенты?" },
    { re: /crm|цифров|автоматиз|qr|меню|кафе|ресторан|процесс/i, name: "Цифровизация процессов",
      reply: "Свяжем обращение клиента, заказ, оплату, доставку и учёт в CRM. Что сейчас в вашей работе делается вручную?" },
  ];
  const price = /цен|стоим|сколько|прайс/i;
  const human = /менеджер|человек|оператор|позвон/i;
  const hello = /^(прив|здрав|добрый|hello|hi|салам|ассалам)/i;
  let asked = false, hasTopic = false;

  function localReply(text) {
    const phone = text.match(/(\+?\d[\d\s\-()]{8,})/);
    if (phone) return { reply: "Спасибо, контакт записал. Менеджер увидит ваш запрос и всю переписку в CRM и свяжется с вами.", crm: { contact: phone[1].trim() } };
    if (human.test(text)) return { reply: "Передаю диалог менеджеру — он увидит всю историю переписки. Оставьте номер телефона, и он свяжется с вами.", crm: hasTopic ? { status: "Передано менеджеру" } : {} };
    const t = topics.find(x => x.re.test(text));
    if (t) { hasTopic = true; return { reply: t.reply, crm: { topic: t.name, status: "Новая сделка" } }; }
    if (price.test(text)) return { reply: "Стоимость зависит от задачи и состава функций. Опишите, что нужно, — зафиксирую запрос, и менеджер подготовит расчёт." };
    if (hello.test(text.trim())) return { reply: "Здравствуйте! Чем помочь вашему бизнесу — сайт, приложение, ИИ-агент или автоматизация процессов?" };
    if (!asked) { asked = true; return { reply: "Уточню, чтобы ничего не перепутать: вас интересует сайт, приложение, ИИ-агент или автоматизация процессов?" }; }
    return { reply: "Записал. Если нужно, передам диалог менеджеру — напишите «менеджер»." };
  }

  async function getReply(text) {
    if (!CFG.chatApiUrl) {
      await new Promise(r => setTimeout(r, 700 + Math.min(text.length * 8, 900)));
      return localReply(text);
    }
    try {
      const res = await fetch(CFG.chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, history: history.slice(0, -1) }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return { reply: data.reply || "…", crm: data.crm };
    } catch (e) {
      console.warn("Chat API error", e);
      return { reply: "Не удалось связаться с агентом. Попробуйте ещё раз или напишите нам в WhatsApp." };
    }
  }

  /* ---------- Интерфейс ---------- */
  function build(root, { onCrm, onCount } = {}) {
    root.innerHTML = `
      <div class="chat__head">
        <div class="chat__ava">A</div>
        <div><b>ИИ-агент «Аксиомы»</b><small>● онлайн</small></div>
        <button type="button" class="chat__close" aria-label="Закрыть" hidden>×</button>
      </div>
      <div class="chat__log" aria-live="polite"></div>
      <div class="chat__quick"></div>
      <form class="chat__form" autocomplete="off">
        <input type="text" placeholder="Напишите сообщение…" aria-label="Сообщение">
        <button type="submit">Отправить</button>
      </form>`;
    const log = root.querySelector(".chat__log");
    const quick = root.querySelector(".chat__quick");
    const form = root.querySelector(".chat__form");
    const input = form.querySelector("input");
    let busy = false, count = 0;

    function add(text, who) {
      const d = document.createElement("div");
      d.className = "msg msg--" + who; d.textContent = text;
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      history.push({ role: who === "me" ? "user" : "assistant", content: text });
      onCount && onCount(++count);
    }
    function typing() {
      const t = document.createElement("div");
      t.className = "msg msg--bot typing"; t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      return () => t.remove();
    }
    async function send(text) {
      text = text.trim(); if (!text || busy) return;
      busy = true; add(text, "me"); input.value = "";
      const stop = typing();
      const r = await getReply(text);
      stop(); add(r.reply, "bot");
      if (r.crm && onCrm) onCrm(r.crm);
      busy = false; input.focus();
    }
    form.addEventListener("submit", e => { e.preventDefault(); send(input.value); });
    ["Нужен сайт", "Хочу ИИ-агента", "Сколько стоит?", "Позвать менеджера"].forEach(q => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = q;
      b.onclick = () => send(q); quick.appendChild(b);
    });
    add("Здравствуйте! Я ИИ-агент «Аксиомы». Расскажите о задаче вашего бизнеса или выберите вариант ниже.", "bot");
    return { input, root };
  }

  /* ---------- Встроенный чат (страница агентов) ---------- */
  const inline = document.getElementById("chatMount");
  if (inline) {
    const $ = id => document.getElementById(id);
    build(inline, {
      onCount: n => { $("crmCount").textContent = n; if (n > 1) { $("crmChannel").textContent = "Сайт (демо)"; $("crmChannel").classList.add("is-set"); } },
      onCrm: c => {
        if (c.topic) { $("crmTopic").textContent = c.topic; $("crmTopic").classList.add("is-set"); }
        if (c.contact) { $("crmContact").textContent = c.contact; $("crmContact").classList.add("is-set"); }
        if (c.status) { $("crmStatus").textContent = c.status; $("crmStatus").classList.toggle("is-new", /нов/i.test(c.status)); }
      },
    });
    return;
  }

  /* ---------- Плавающий чат на остальных страницах ---------- */
  const fab = document.createElement("button");
  fab.className = "chat-fab"; fab.type = "button";
  fab.innerHTML = '<span class="chat-fab__dot"></span>Спросить ИИ-агента';
  const panel = document.createElement("div");
  panel.className = "chat chat--float"; panel.hidden = true;
  document.body.append(fab, panel);
  let ui = null;
  const toggle = open => {
    panel.hidden = !open; fab.classList.toggle("is-open", open);
    if (open && !ui) {
      ui = build(panel);
      const x = panel.querySelector(".chat__close"); x.hidden = false; x.onclick = () => toggle(false);
    }
    if (open) setTimeout(() => ui.input.focus(), 50);
  };
  fab.onclick = () => toggle(panel.hidden);
})();
