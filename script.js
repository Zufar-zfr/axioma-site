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

/* ===== Цветовая тема: оттенок плавно меняется по ходу прокрутки ===== */
const PALETTE = [210];   // один синий оттенок
let hue = 210;
const HUE = () => hue;
function theme() {
  const secs = [...document.querySelectorAll(".hero, .page-head, main > section")];
  if (!secs.length) return;
  const y = scrollY + innerHeight * 0.45;
  const pts = secs.map((el, i) => ({ y: el.offsetTop + el.offsetHeight / 2, h: PALETTE[i % PALETTE.length] }));
  let target = pts[0].h;
  if (y >= pts[pts.length - 1].y) target = pts[pts.length - 1].h;
  else for (let i = 0; i < pts.length - 1; i++) if (y >= pts[i].y && y < pts[i + 1].y) {
    const t = (y - pts[i].y) / (pts[i + 1].y - pts[i].y), e = t * t * (3 - 2 * t);
    target = pts[i].h + (pts[i + 1].h - pts[i].h) * e; break;
  }
  hue += (target - hue) * 0.08;
  document.documentElement.style.setProperty("--h", hue.toFixed(1));
}

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
          ctx.strokeStyle = `hsla(${HUE()},100%,66%,${(1 - dist / L) * .22})`; ctx.lineWidth = d;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mx, a.y - my), near = md < 200 * d;
      if (near) {
        ctx.strokeStyle = `hsla(${HUE() + 25},100%,72%,${(1 - md / (200 * d)) * .45})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke();
      }
      ctx.fillStyle = near ? `hsla(${HUE() + 25},100%,75%,.95)` : `hsla(${HUE() + 10},100%,76%,.65)`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
    }
    theme();
    const max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) requestAnimationFrame(frame); });
  addEventListener("scroll", () => { if (reduce) frame(); }, { passive: true });
  frame();
})();

/* ===== 3D-шар Земли на чистом WebGL (без библиотек): карта на сфере, вращение вокруг оси ===== */
(function globe() {
  const hero = document.querySelector(".hero"), canvas = document.getElementById("globe");
  if (!hero || !canvas) return;
  const fail = e => { console.warn("Земля: запасной режим", e); hero.classList.add("no-webgl"); };
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl || !window.EARTH_LO) return fail("no webgl");

  const VS = `attribute vec3 p; attribute vec2 t; uniform mat3 R; uniform mat4 P; uniform float S; uniform vec3 O;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv=t; vN=R*p; vec3 v=R*(p*S)+O; vV=normalize(-v); gl_Position=P*vec4(v,1.); }`;
  const EARTH_FS = `precision mediump float; uniform sampler2D map; uniform vec3 tint; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      vec3 c=texture2D(map,vUv).rgb;
      vec3 col=vec3(0.012,0.025,0.06)+tint*0.05+c*mix(vec3(2.0),vec3(2.0)*(0.55+tint),0.35);
      float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),3.5);
      gl_FragColor=vec4(col+tint*f*0.9,1.); }`;
  const ATMO_FS = `precision mediump float; uniform vec3 tint; varying vec3 vN; varying vec3 vV;
    void main(){ float d=-dot(normalize(vN),normalize(vV)); float i=pow(smoothstep(0.0,0.5,d),2.2);
      gl_FragColor=vec4(tint*i*0.6,i*0.6); }`;

  function prog(fs) {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(pr, 0, "p"); gl.bindAttribLocation(pr, 1, "t"); gl.linkProgram(pr);
    const u = {}; ["R", "P", "S", "O", "map", "tint"].forEach(n => u[n] = gl.getUniformLocation(pr, n)); return { pr, u };
  }
  let earth, atmo;
  try { earth = prog(EARTH_FS); atmo = prog(ATMO_FS); } catch (e) { return fail(e); }

  // сфера: u — долгота, v — широта
  const N = 96, pos = [], uv = [], idx = [];
  for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) {
    const u = x / N, v = y / N, phi = u * 2 * Math.PI, th = v * Math.PI;
    pos.push(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)); uv.push(u, 1 - v);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = y * (N + 1) + x, b = a + N + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const buf = (data, T, A) => { const b = gl.createBuffer(); gl.bindBuffer(T, b); gl.bufferData(T, new A(data), gl.STATIC_DRAW); return b; };
  const bPos = buf(pos, gl.ARRAY_BUFFER, Float32Array), bUv = buf(uv, gl.ARRAY_BUFFER, Float32Array), bIdx = buf(idx, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

  // текстура: сначала лёгкая версия, затем полная
  const tex = gl.createTexture(); let texReady = false;
  function setTex(src) {
    const img = new Image();
    img.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const ext = gl.getExtension("EXT_texture_filter_anisotropic");
      if (ext) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      texReady = true;
    };
    img.onerror = () => { if (!texReady) fail("texture"); };
    img.src = src;
  }
  setTex(window.EARTH_LO);
  const hi = document.createElement("script"); hi.src = "assets/earth-hi.js";
  hi.onload = () => { if (window.EARTH_HI) setTex(window.EARTH_HI); };
  addEventListener("load", () => document.head.appendChild(hi));

  // матрицы
  const FOV = 35 * Math.PI / 180, CAMZ = 5;
  const P = new Float32Array(16); let S = 1, Oy = 0;
  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2), w = hero.clientWidth, h = hero.clientHeight;
    canvas.width = w * d; canvas.height = h * d; gl.viewport(0, 0, canvas.width, canvas.height);
    const a = w / h, f = 1 / Math.tan(FOV / 2), n = 0.1, fa = 100;
    P.set([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]);
    const vh = 2 * CAMZ * Math.tan(FOV / 2), vw = vh * a;
    S = Math.max(vw * 0.72, vh * 0.7);
    Oy = (vh / 2 - vh * (w < 700 ? 0.58 : 0.46)) - S;
  }
  addEventListener("resize", resize); resize();

  function mul(a, b) { const r = new Array(9); for (let c = 0; c < 3; c++) for (let rr = 0; rr < 3; rr++) { let s = 0; for (let k = 0; k < 3; k++) s += a[k * 3 + rr] * b[c * 3 + k]; r[c * 3 + rr] = s; } return r; }
  function rot(ax, ay, az) {                        // R = Rx * Ry * Rz (столбцы, как в three.js)
    const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
    const Rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx], Ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy], Rz = [cz, sz, 0, -sz, cz, 0, 0, 0, 1];
    return new Float32Array(mul(Rx, mul(Ry, Rz)));
  }
  function draw(pg, R, tint, atmosphere) {
    gl.useProgram(pg.pr);
    gl.uniformMatrix3fv(pg.u.R, false, R); gl.uniformMatrix4fv(pg.u.P, false, P);
    gl.uniform1f(pg.u.S, atmosphere ? S * 1.1 : S); gl.uniform3f(pg.u.O, 0, Oy, -CAMZ);
    gl.uniform3f(pg.u.tint, tint[0], tint[1], tint[2]);
    if (!atmosphere) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(pg.u.map, 0); }
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  }

  const tint = [0.07, 0.40, 1.0];                   // синий оттенок свечения
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ry = -2.1, last = performance.now(), visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(hero);
  (function loop(t) {
    requestAnimationFrame(loop);
    if (!visible || !texReady) { last = t; return; }
    const dt = (t - last) / 1000; last = t;
    if (!reduce) ry += dt * 0.05;                   // вращение вокруг оси с запада на восток
    const R = rot(-0.3, ry, -0.08);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND); gl.cullFace(gl.BACK); gl.depthMask(true);
    draw(earth, R, tint, false);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.cullFace(gl.FRONT); gl.depthMask(false);
    draw(atmo, R, tint, true);
  })(last);
})();
