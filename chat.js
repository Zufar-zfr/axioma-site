/*
 * AI-ассистент на сайте AXIOMA.
 * Встраивается в каждый элемент с атрибутом data-chat.
 *
 * Пока window.AXIOMA_CONFIG.chatApiUrl пустой — отвечает заготовленными ответами.
 * Когда укажете URL в config.js — сообщения уходят на ваш API:
 *
 *   POST {chatApiUrl}   Content-Type: application/json
 *   { "sessionId": "…", "message": "текст посетителя",
 *     "history": [ {"role":"user"|"assistant","content":"…"} ] }
 *
 *   Ответ 200: { "reply": "текст ассистента" }
 */
(function () {
  const CFG = window.AXIOMA_CONFIG || {};
  const sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();

  /* ---------- заготовленные ответы (пока нет API) ---------- */
  const rules = [
    { re: /mango|манго|пример|портфол|проект|кейс|делали/i,
      a: "Mango Fruits — iOS-приложение доставки фруктов и продуктов по Алматы: каталог с поиском, избранное, корзина, оплата картой и панель администратора. И сайт медицинского кабинета nephromed.kz с онлайн-записью на приём. Подробнее — в разделе «Проекты»." },
    { re: /сайт|веб|лендинг|интернет-магазин|магазин/i,
      a: "Делаем сайты по техническому заданию — от лендинга до интернет-магазина и веб-сервиса — и помогаем внедрить их в работу компании. Расскажите, для какого бизнеса сайт и что он должен уметь?" },
    { re: /приложен|мобил|ios|android|платформ|карт|доставк|оплат/i,
      a: "Создаём приложения, где клиент выбирает товар или услугу, смотрит точки на карте и оплачивает заказ. Какие функции нужны вам в первую очередь?" },
    { re: /агент|бот|ии|нейросет|ai|звон|голос|возражен|допродаж|повторн/i,
      a: "Настраиваем AI-агентов под продукты, цены и правила компании: агент выясняет потребность, отрабатывает возражения, продаёт и предлагает дополнительное, фиксирует обращение и передаёт менеджеру. Через время сам напоминает о себе для повторной продажи. Голосовые агенты принимают звонки. Подробнее — на странице «AI-агенты»." },
    { re: /автоматиз|процесс|qr|меню|кафе|ресторан|учёт|учет|интеграц/i,
      a: "Связываем этапы работы: обращение клиента, заказ, оплату, доставку и учёт. Для кафе и ресторанов делаем QR-меню. Что сейчас в вашей работе делается вручную?" },
    { re: /цен|стоим|сколько|прайс|бюджет/i,
      a: "Стоимость зависит от задачи и состава функций. Опишите, что нужно, — а точный расчёт подготовит команда. Быстрее всего — написать нам в WhatsApp." },
    { re: /срок|когда|долго|быстро/i,
      a: "Сроки зависят от объёма работ — команда оценит их после обсуждения задачи." },
    { re: /менеджер|человек|связ|контакт|позвон|whatsapp|ватсап|вотсап|телефон/i,
      a: "С вами на связи будет команда AXIOMA — напишите нам в WhatsApp, кнопка рядом с чатом." },
    { re: /^(прив|здрав|добр|hello|hi|салам|ассалам)/i,
      a: "Здравствуйте! Чем можем помочь — сайт, приложение, AI-агент или автоматизация процессов?" },
  ];
  let fallbackUsed = false;
  function localReply(text) {
    const r = rules.find(x => x.re.test(text));
    if (r) return r.a;
    if (!fallbackUsed) { fallbackUsed = true; return "Уточните, пожалуйста: вас интересует сайт, мобильное приложение, AI-агент или автоматизация процессов?"; }
    return "Чтобы обсудить детали, напишите нам в WhatsApp — ответит команда AXIOMA."
  }

  async function getReply(text, history) {
    if (!CFG.chatApiUrl) {
      await new Promise(r => setTimeout(r, 650 + Math.min(text.length * 8, 800)));
      return localReply(text);
    }
    try {
      const res = await fetch(CFG.chatApiUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text, history: history.slice(0, -1) }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return (await res.json()).reply || "…";
    } catch (e) {
      console.warn("Chat API error", e);
      return "Не удалось получить ответ. Попробуйте ещё раз или напишите нам в WhatsApp.";
    }
  }

  /* ---------- интерфейс ---------- */
  function mount(root) {
    const history = [];
    root.innerHTML = `
      <div class="chat__head">
        <div class="chat__ava">A</div>
        <div><b>AI-ассистент AXIOMA</b><small>на сайте, отвечает сразу</small></div>
      </div>
      <div class="chat__log" aria-live="polite"></div>
      <div class="chat__quick"></div>
      <form class="chat__form" autocomplete="off">
        <input type="text" placeholder="Напишите, что вам нужно" aria-label="Сообщение">
        <button type="submit">Отправить</button>
      </form>
      ${CFG.chatApiUrl ? "" : '<p class="chat__note">Ответы ассистента ознакомительные. Точные условия обсудим в WhatsApp.</p>'}`;
    const log = root.querySelector(".chat__log"), quick = root.querySelector(".chat__quick");
    const form = root.querySelector(".chat__form"), input = form.querySelector("input");
    let busy = false;

    const add = (text, who) => {
      const d = document.createElement("div");
      d.className = "msg msg--" + who; d.textContent = text;
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      history.push({ role: who === "me" ? "user" : "assistant", content: text });
    };
    const typing = () => {
      const t = document.createElement("div");
      t.className = "msg msg--bot typing"; t.innerHTML = "<i></i><i></i><i></i>";
      log.appendChild(t); log.scrollTop = log.scrollHeight;
      return () => t.remove();
    };
    async function send(text) {
      text = text.trim(); if (!text || busy) return;
      busy = true; add(text, "me"); input.value = "";
      const stop = typing(); const reply = await getReply(text, history);
      stop(); add(reply, "bot"); busy = false;
    }
    form.addEventListener("submit", e => { e.preventDefault(); send(input.value); });
    ["Нужен сайт", "Мобильное приложение", "AI-агент для бизнеса", "Сколько стоит?"].forEach(q => {
      const b = document.createElement("button"); b.type = "button"; b.textContent = q;
      b.onclick = () => send(q); quick.appendChild(b);
    });
    add("Здравствуйте! Я AI-ассистент AXIOMA. Расскажу, что мы делаем, и помогу сформулировать задачу. Выберите вариант ниже или напишите свой вопрос.", "bot");
  }

  document.querySelectorAll("[data-chat]").forEach(mount);
})();
