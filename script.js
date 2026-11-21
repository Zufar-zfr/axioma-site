/* ===== Настройки ===== */
// Номер WhatsApp в международном формате без "+" и пробелов, например "998901234567"
const WHATSAPP_NUMBER = "";
const WHATSAPP_TEXT = "Здравствуйте! Хочу обсудить задачу для моего бизнеса.";
// Ссылка на сайт проекта Mango Fruits (когда будет публичный адрес)
const MANGO_URL = "";
// Номер демонстрационного ИИ-агента в WhatsApp (кнопка «Попробовать в WhatsApp»)
const DEMO_WHATSAPP_NUMBER = "";

/* ===== Ссылки ===== */
document.querySelectorAll(".js-wa").forEach(a => {
  if (WHATSAPP_NUMBER) {
    a.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
    a.target = "_blank"; a.rel = "noopener";
  }
});
document.querySelectorAll(".js-wa-demo").forEach(a => {
  const n = DEMO_WHATSAPP_NUMBER || WHATSAPP_NUMBER;
  if (n) { a.href = `https://wa.me/${n}?text=${encodeURIComponent("Привет! Хочу попробовать ИИ-агента.")}`; a.target = "_blank"; a.rel = "noopener"; }
  else { a.href = "#demo"; }
});
document.querySelectorAll("[data-project-link]").forEach(a => {
  if (MANGO_URL) { a.href = MANGO_URL; a.target = "_blank"; a.rel = "noopener"; }
  else { a.addEventListener("click", e => e.preventDefault()); a.style.opacity = ".5"; a.style.cursor = "default"; }
});
const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

/* ===== Шапка и появление блоков ===== */
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-solid", "solid" in document.body.dataset || scrollY > window.innerHeight * 0.6);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
}), { threshold: .12 });
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el);
});

document.querySelectorAll(".card").forEach(c => c.addEventListener("pointermove", e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty("--mx", e.clientX - r.left + "px");
  c.style.setProperty("--my", e.clientY - r.top + "px");
}));

const clock = document.getElementById("hudClock");
if (clock) setInterval(() => clock.textContent = new Date().toISOString().slice(11, 19) + " UTC", 1000);

/* ===== Звёзды на первом экране ===== */
(function stars() {
  const c = document.getElementById("stars"); if (!c) return;
  const ctx = c.getContext("2d"); let w, h, pts = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function resize() {
    const r = c.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    w = c.width = r.width * d; h = c.height = r.height * d;
    pts = Array.from({ length: Math.round(r.width * r.height / 5500) }, () => ({
      x: Math.random() * w, y: Math.random() * h * 0.75, r: (Math.random() * 1.1 + 0.3) * d,
      p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2 }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      ctx.globalAlpha = 0.35 + 0.4 * Math.sin(p.p + t * 0.001 * p.s);
      ctx.fillStyle = "#cfe0ff"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  addEventListener("resize", resize); resize(); requestAnimationFrame(draw);
})();

/* ===== Фон: сеть узлов, реагирует на мышь и прокрутку ===== */
(function bgnet() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const c = document.createElement("canvas"); c.id = "bgnet";
  const prog = document.createElement("div"); prog.className = "progress";
  const o1 = document.createElement("div"); o1.className = "orb orb--a";
  const o2 = document.createElement("div"); o2.className = "orb orb--b";
  document.body.prepend(c, o1, o2, prog);
  const ctx = c.getContext("2d");
  let w, h, d, nodes = [], mx = -999, my = -999;

  function resize() {
    d = Math.min(devicePixelRatio || 1, 2);
    w = c.width = innerWidth * d; h = c.height = innerHeight * d;
    const n = Math.min(110, Math.round(innerWidth * innerHeight / 14000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h * 1.4,
      vx: (Math.random() - .5) * .25 * d, vy: (Math.random() - .5) * .25 * d,
      r: (Math.random() * 1.4 + .8) * d, z: Math.random() * .6 + .4 }));
  }
  addEventListener("resize", resize); resize();
  addEventListener("pointermove", e => { mx = e.clientX * d; my = e.clientY * d; }, { passive: true });

  function frame() {
    const sy = scrollY * d;
    ctx.clearRect(0, 0, w, h);
    const hh = h * 1.4, L = 150 * d;
    const pos = nodes.map(n => {
      if (!reduce) { n.x += n.vx; n.y += n.vy; }
      if (n.x < 0) n.x += w; if (n.x > w) n.x -= w;
      if (n.y < 0) n.y += hh; if (n.y > hh) n.y -= hh;
      let y = (n.y - sy * .35 * n.z) % hh; if (y < 0) y += hh;   // параллакс от прокрутки
      return { x: n.x, y: y - h * .2, r: n.r };
    });
    for (let i = 0; i < pos.length; i++) {
      const a = pos[i];
      for (let j = i + 1; j < pos.length; j++) {
        const b = pos[j], dx = a.x - b.x, dy = a.y - b.y, dist = Math.hypot(dx, dy);
        if (dist < L) {
          ctx.strokeStyle = `rgba(90,170,255,${(1 - dist / L) * .22})`; ctx.lineWidth = d;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mx, a.y - my), near = md < 200 * d;
      if (near) {
        ctx.strokeStyle = `rgba(125,243,255,${(1 - md / (200 * d)) * .45})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      }
      ctx.fillStyle = near ? "rgba(125,243,255,.95)" : "rgba(140,190,255,.65)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
    }
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) requestAnimationFrame(frame); });
  addEventListener("scroll", () => { if (reduce) frame(); }, { passive: true });
  frame();
})();
