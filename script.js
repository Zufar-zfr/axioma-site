/* =========================================================
   AXIOMA — поведение страницы
   ========================================================= */
const CFG = window.AXIOMA_CONFIG || {};
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DPR = () => Math.min(devicePixelRatio || 1, 2);

/* ---------- WhatsApp и год ---------- */
document.querySelectorAll(".js-wa").forEach(a => {
  if (CFG.whatsappNumber) {
    a.href = `https://wa.me/${CFG.whatsappNumber}?text=${encodeURIComponent(CFG.whatsappText || "")}`;
    a.target = "_blank"; a.rel = "noopener";
  } else {
    a.addEventListener("click", e => { e.preventDefault(); console.warn("Укажите whatsappNumber в config.js"); });
  }
});
const yr = document.getElementById("year"); if (yr) yr.textContent = new Date().getFullYear();

/* ---------- небо за контентом: звёзды с параллаксом и редкие кометы ---------- */
const sky = (function () {
  const c = document.createElement("canvas"); c.className = "sky"; c.setAttribute("aria-hidden", "true");
  const prog = document.createElement("div"); prog.className = "progress";
  document.body.prepend(c, prog);
  const ctx = c.getContext("2d");
  let w, h, d, stars = [], comets = [], lastComet = 0;

  function resize() {
    d = DPR(); w = c.width = innerWidth * d; h = c.height = innerHeight * d;
    const n = Math.round(innerWidth * innerHeight / 5200);
    stars = Array.from({ length: n }, () => {
      const z = Math.random();                                  // глубина: дальние мельче и медленнее
      return { x: Math.random() * w, y: Math.random() * h, z, r: (.45 + z * 1.15) * d, p: Math.random() * 6.28, s: .2 + Math.random() * .8,
        flash: Math.random() < .14 ? 4000 + Math.random() * 9000 : 0, off: Math.random() * 20000 };   // часть звёзд время от времени вспыхивает
    });
  }
  function comet(force) {
    const now = performance.now();
    if (REDUCE || (!force && now - lastComet < 3500)) return;
    lastComet = now;
    const dir = Math.random() < .5 ? -1 : 1;                    // слева направо или справа налево
    const ang = (dir > 0 ? 0.42 : Math.PI - 0.42) + (Math.random() - .5) * .25;
    const sp = (900 + Math.random() * 600) * d;
    comets.push({
      x: dir > 0 ? Math.random() * w * .5 : w * .5 + Math.random() * w * .5,
      y: Math.random() * h * .35,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      len: (140 + Math.random() * 140) * d, life: 0, max: .9 + Math.random() * .5
    });
  }
  (function schedule() { setTimeout(() => { comet(); schedule(); }, 7000 + Math.random() * 7000); })();

  let last = performance.now();
  function frame(t) {
    const dt = Math.min((t - last) / 1000, .05); last = t;
    ctx.clearRect(0, 0, w, h);
    const sy = scrollY * d;
    ctx.fillStyle = "#cfe0ff";
    for (const s of stars) {
      let y = (s.y - sy * (.04 + s.z * .12)) % h; if (y < 0) y += h;
      let a = (.4 + s.z * .55) * (.78 + .22 * Math.sin(s.p + t * .0009 * s.s)), r = s.r;
      if (s.flash && !REDUCE) {                                  // короткая вспышка раз в несколько секунд
        const ph = ((t + s.off) % s.flash) / s.flash;
        if (ph < .12) { const k = Math.sin(ph / .12 * Math.PI); a = Math.min(1, a + k * .7); r *= 1 + k * 1.1;
          if (k > .5) { ctx.globalAlpha = k * .35; ctx.fillRect(s.x - r * 4, y - .4 * d, r * 8, .8 * d); ctx.fillRect(s.x - .4 * d, y - r * 4, .8 * d, r * 8); } }
      }
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(s.x, y, r, 0, 6.283); ctx.fill();
    }
    for (let i = comets.length - 1; i >= 0; i--) {
      const k = comets[i]; k.life += dt; k.x += k.vx * dt; k.y += k.vy * dt;
      if (k.life > k.max) { comets.splice(i, 1); continue; }
      const a = Math.sin(Math.min(k.life / k.max, 1) * Math.PI);  // плавно появляется и гаснет
      const sp = Math.hypot(k.vx, k.vy), tx = k.x - k.vx / sp * k.len, ty = k.y - k.vy / sp * k.len;
      const g = ctx.createLinearGradient(k.x, k.y, tx, ty);
      g.addColorStop(0, `rgba(255,244,225,${.9 * a})`); g.addColorStop(.25, `rgba(160,200,255,${.35 * a})`); g.addColorStop(1, "rgba(160,200,255,0)");
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.2 * d; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(k.x, k.y); ctx.lineTo(tx, ty); ctx.stroke();
      const hg = ctx.createRadialGradient(k.x, k.y, 0, k.x, k.y, 6 * d);
      hg.addColorStop(0, `rgba(255,240,215,${a})`); hg.addColorStop(1, "rgba(255,240,215,0)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(k.x, k.y, 6 * d, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#cfe0ff";
    }
    ctx.globalAlpha = 1;
    if (!REDUCE && !document.hidden) requestAnimationFrame(frame);
  }
  addEventListener("resize", resize); resize();
  document.addEventListener("visibilitychange", () => { if (!document.hidden && !REDUCE) { last = performance.now(); requestAnimationFrame(frame); } });
  requestAnimationFrame(frame);
  return { comet, prog };
})();

/* ---------- навигация: фон, мобильное меню, подсветка текущего раздела ---------- */
const nav = document.getElementById("nav");
const links = [...document.querySelectorAll('.nav__links a[href^="#"]')];
const bar = document.querySelector(".nav__bar");
const spySections = links.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
const burger = document.querySelector(".nav__burger");
if (burger) {
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open"); burger.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".nav__links a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open"); burger.setAttribute("aria-expanded", false);
  }));
}
let activeLink = null;
function setActive(a) {
  if (a === activeLink) return;
  activeLink?.classList.remove("is-active");
  activeLink = a;
  if (a) a.classList.add("is-active");
  if (!bar) return;
  if (!a) { bar.classList.remove("is-on"); return; }
  bar.style.width = a.offsetWidth - 28 + "px";
  bar.style.transform = `translateX(${a.offsetLeft + 14}px)`;
  bar.classList.add("is-on");
}
function spy() {
  nav.classList.toggle("is-solid", "solid" in document.body.dataset || scrollY > innerHeight * 0.55);
  if (spySections.length !== links.length) return;
  const line = innerHeight * 0.35;
  let cur = null;
  spySections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) cur = links[i]; });
  if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = links[links.length - 1];
  setActive(cur);
}
addEventListener("resize", () => { const a = activeLink; activeLink = null; setActive(a); });

/* ---------- появление блоков ---------- */
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add("is-in"); io.unobserve(e.target);
  if (e.target.classList.contains("sec-head")) sky.comet();      // вход в новый раздел — иногда пролетает комета
}), { threshold: .15, rootMargin: "0px 0px -6% 0px" });
document.querySelectorAll(".reveal").forEach(el => {
  const sib = [...el.parentElement.children].filter(x => x.classList.contains("reveal"));
  el.style.transitionDelay = Math.min(sib.indexOf(el), 5) * 80 + "ms";
  io.observe(el);
});

/* подсветка карточек услуг за курсором */
document.querySelectorAll(".svc").forEach(c => c.addEventListener("pointermove", e => {
  const r = c.getBoundingClientRect();
  c.style.setProperty("--mx", e.clientX - r.left + "px");
  c.style.setProperty("--my", e.clientY - r.top + "px");
}));

/* ---------- звёзды на первом экране ---------- */
(function heroStars() {
  const c = document.getElementById("heroStars"); if (!c) return;
  const ctx = c.getContext("2d"); let w, h, pts = [];
  function resize() {
    const r = c.getBoundingClientRect(), d = DPR();
    w = c.width = r.width * d; h = c.height = r.height * d;
    pts = Array.from({ length: Math.round(r.width * r.height / 5200) }, () => ({
      x: Math.random() * w, y: Math.random() * h * .72, r: (Math.random() ** 2 * 1.2 + .35) * d,
      p: Math.random() * 6.28, s: .3 + Math.random() }));
  }
  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#d8e6ff";
    for (const p of pts) {
      ctx.globalAlpha = .45 + .5 * (.5 + .5 * Math.sin(p.p + t * .0011 * p.s));
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    if (!REDUCE) requestAnimationFrame(draw);
  }
  addEventListener("resize", resize); resize(); requestAnimationFrame(draw);
})();

/* ---------- всё, что зависит от прокрутки: один проход за кадр ---------- */
const steps = document.getElementById("steps");
const stepItems = steps ? [...steps.querySelectorAll("li")] : [];
const stepLine = steps ? steps.querySelector(".steps__line i") : null;
const phones = [...document.querySelectorAll("[data-depth]")];
let ticking = false;
function onScroll() {
  ticking = false;
  spy();
  const max = document.documentElement.scrollHeight - innerHeight;
  sky.prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;

  if (steps) {                                                 // линия этапов заполняется по мере прокрутки
    const r = steps.getBoundingClientRect();
    const p = Math.min(Math.max((innerHeight * .78 - r.top) / (innerHeight * .45), 0), 1);
    if (stepLine) stepLine.style.setProperty("--p", p.toFixed(3));
    const stacked = innerWidth <= 1020;
    stepItems.forEach((li, i) => li.classList.toggle("is-lit",
      stacked ? li.getBoundingClientRect().top < innerHeight * .7 : p >= (i + .15) / stepItems.length));
  }
  if (!REDUCE) phones.forEach(ph => {                          // лёгкий параллакс телефонов в кейсе
    const r = ph.parentElement.getBoundingClientRect();
    const off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(ph.dataset.depth);
    ph.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
  });
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
addEventListener("resize", onScroll);
addEventListener("load", onScroll);
onScroll();

/* ---------- видео Земли: старт над Украиной/Турцией, пауза вне экрана ---------- */
(function earthVideo() {
  const v = document.querySelector(".earth__video"); if (!v || REDUCE) return;   // при «уменьшить анимацию» остаётся постер
  const START = 136;                       // секунда ролика: в центре Чёрное море и огни Европы
  let inView = true;
  const play = () => { if (inView) v.play().catch(() => {}); };
  const begin = () => { v.currentTime = START; v.addEventListener("seeked", play, { once: true }); };
  v.readyState >= 1 ? begin() : v.addEventListener("loadedmetadata", begin, { once: true });
  new IntersectionObserver(e => { inView = e[0].isIntersecting; inView ? play() : v.pause(); }).observe(document.querySelector(".hero"));
})();
