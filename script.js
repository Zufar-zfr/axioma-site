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

/* ===== Земля на чистом WebGL: ночная карта, рельеф, облачный слой, атмосфера ===== */
(function globe() {
  const hero = document.querySelector(".hero"), canvas = document.getElementById("globe");
  if (!hero || !canvas) return;
  const fail = e => { console.warn("Земля: запасной режим", e); hero.classList.add("no-webgl"); };
  const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
  if (!gl || !window.EARTH_LO) return fail("no webgl");

  const PREC = `#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    const vec3 MOON = vec3(-0.55, 0.58, 0.60);   // направление мягкого света (в системе камеры)
    uniform vec3 O; uniform float PS; uniform mat3 R; uniform float time;
  `;
  const VS = `attribute vec3 p; attribute vec2 t; uniform mat3 R; uniform mat4 P; uniform float S; uniform vec3 O;
    varying vec2 vUv; varying vec3 vObj; varying vec3 vN; varying vec3 vP;
    void main(){ vUv=t; vObj=p; vN=R*p; vec3 v=R*(p*S)+O; vP=v; gl_Position=P*vec4(v,1.); }`;

  // шум, облака (трёхмерная плотность) и атмосфера (объёмное рассеяние вдоль луча)
  const COMMON = `
    float hash(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float noise(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm5(vec3 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*noise(p); p=p*2.07+vec3(1.7,9.2,3.1); a*=.5; } return s; }
    float fbm4(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p=p*2.07+vec3(1.7,9.2,3.1); a*=.5; } return s; }
    float dither(){ return (fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)/255.0; }

    // облака чуть смещаются относительно земли (медленнее и в ту же сторону, что вращение)
    vec3 cdir(vec3 o){ float ca=-time*0.0012, cs=sin(ca), cc=cos(ca); return vec3(cc*o.x+cs*o.z,o.y,-cs*o.x+cc*o.z); }
    vec3 cwarp(vec3 o){ vec3 q=cdir(o)*vec3(1.6,2.4,1.6); return vec3(fbm5(q),fbm5(q+5.2),fbm5(q+9.1))-0.5; }
    float cdens(vec3 o,float alt,vec3 w){
      vec3 q=cdir(o)*vec3(2.4,3.4,2.4)+w*1.4+vec3(0.0,0.0,alt*2.5);
      return smoothstep(0.40,0.62,fbm4(q)*0.95);
    }

    // объёмная атмосфера: накопление света вдоль луча через оболочку (всё в радиусах планеты)
    vec3 atmosphere(vec3 dir){
      vec3 oc=-O/PS; float Ra=1.14;
      float b=dot(oc,dir), cc=dot(oc,oc)-Ra*Ra, disc=b*b-cc;
      if(disc<0.0) return vec3(0.0);
      float sq=sqrt(disc), t0=max(-b-sq,0.0), t1=-b+sq;
      float dp=b*b-(dot(oc,oc)-1.0);
      if(dp>0.0){ float tp=-b-sqrt(dp); if(tp>0.0) t1=min(t1,tp); }
      float dt=(t1-t0)/12.0; vec3 acc=vec3(0.0);
      for(int i=0;i<12;i++){
        vec3 p=oc+dir*(t0+(float(i)+0.5)*dt);
        float alt=length(p)-1.0;
        float dens=exp(-alt*38.0);
        float lit=0.28+0.72*smoothstep(-0.3,0.9,dot(normalize(p),normalize(vec3(-0.5,0.6,0.62))));
        vec3 col=mix(vec3(0.62,0.82,1.0),vec3(0.10,0.28,0.95),smoothstep(0.0,0.07,alt));
        acc+=dens*dt*col*lit;
      }
      return acc*0.85;
    }
  `;

  const EARTH_FS = PREC + `
    uniform sampler2D map; uniform sampler2D rel;
    varying vec2 vUv; varying vec3 vObj; varying vec3 vN; varying vec3 vP;` + COMMON + `
    void main(){
      vec3 n=normalize(vN), V=normalize(-vP);
      vec3 c=texture2D(map,vUv).rgb;
      vec3 glow=texture2D(map,vUv,3.5).rgb;
      vec4 r=texture2D(rel,vUv); float h=r.r; float water=r.g; float land=1.0-water;

      // рельеф: наклон нормали по карте высот, свет сбоку даёт объём
      float d=1.0/2048.0;
      float hx=texture2D(rel,vUv+vec2(d,0.)).r-texture2D(rel,vUv-vec2(d,0.)).r;
      float hy=texture2D(rel,vUv+vec2(0.,d)).r-texture2D(rel,vUv-vec2(0.,d)).r;
      vec3 eo=normalize(cross(vec3(0.,1.,0.),vObj)); vec3 no=cross(vObj,eo);
      vec3 nb=normalize(R*normalize(vObj-4.5*(hx*eo+hy*no)));
      float shade=dot(nb,MOON)-dot(n,MOON);

      vec3 col=mix(vec3(0.020,0.030,0.062),vec3(0.003,0.009,0.030),water);
      col+=c*0.95;
      col+=land*(h*vec3(0.05,0.07,0.12)+shade*vec3(0.42,0.54,0.88));

      // облака над этим местом: приглушают огни, отбрасывают тень
      vec3 w=cwarp(vObj);
      float cl=cdens(vObj,0.35,w);
      float lum=max(c.r,max(c.g,c.b));
      float lights=smoothstep(0.22,0.85,lum);
      col+=(lights*vec3(1.0,0.74,0.42)*0.62+glow*vec3(1.0,0.72,0.45)*0.95)*(1.0-cl*0.6);
      float sh=cdens(normalize(vObj+vec3(0.014,-0.012,0.0)),0.0,w);
      col*=1.0-0.35*sh;

      // океан: холодный блик и отражение неба на скользящем угле
      vec3 H=normalize(MOON+V); float ndv=max(dot(n,V),0.0);
      col+=water*(pow(max(dot(n,H),0.0),90.0)*vec3(0.30,0.48,0.90)*0.8+pow(1.0-ndv,3.0)*vec3(0.03,0.08,0.20));

      // атмосфера между камерой и поверхностью: плавно переходит в свечение за краем
      col+=atmosphere(normalize(vP));

      col=1.0-exp(-col*1.2);
      gl_FragColor=vec4(col+dither(),1.0);
    }`;

  // облачный слой: настоящий объём — луч проходит через толщу облаков, поэтому у края они не плоские
  const CLOUD_FS = PREC + `
    varying vec2 vUv; varying vec3 vObj; varying vec3 vN; varying vec3 vP;` + COMMON + `
    void main(){
      vec3 dir=normalize(vP);
      vec3 oc=-O/PS; float Ro=1.035;
      float b=dot(oc,dir), disc=b*b-(dot(oc,oc)-Ro*Ro);
      if(disc<0.0){ gl_FragColor=vec4(0.0); return; }
      float sq=sqrt(disc), t0=max(-b-sq,0.0), t1=-b+sq;
      float dp=b*b-(dot(oc,oc)-1.0);
      if(dp>0.0){ float tp=-b-sqrt(dp); if(tp>0.0) t1=min(t1,tp); }
      t1=min(t1,t0+0.10);
      float dt=(t1-t0)/7.0;
      vec3 w=cwarp(normalize(vObj));
      vec3 acc=vec3(0.0); float T=1.0;
      for(int i=0;i<7;i++){
        vec3 p=oc+dir*(t0+(float(i)+0.5)*dt);
        float alt=clamp((length(p)-1.0)/0.035,0.0,1.0);
        float prof=smoothstep(0.0,0.25,alt)*(1.0-smoothstep(0.65,1.0,alt));
        vec3 od=normalize(p*R);                                       // направление в системе планеты
        float dens=cdens(od,alt,w)*prof;
        vec3 np=normalize(p);
        float lit=0.30+0.70*max(dot(np,MOON),0.0)+0.25*alt;
        vec3 cc=vec3(0.55,0.63,0.80)*lit+vec3(0.10,0.22,0.5)*pow(1.0-max(dot(np,-dir),0.0),3.0)*0.6;
        float a=1.0-exp(-dens*dt*70.0);
        acc+=T*a*cc; T*=1.0-a;
      }
      gl_FragColor=vec4(acc*0.95+dither()*(1.0-T),1.0-T);
    }`;

  const ATMO_FS = PREC + `
    varying vec3 vP;` + COMMON + `
    void main(){
      vec3 col=atmosphere(normalize(vP));
      col+=dither();
      gl_FragColor=vec4(max(col,0.0),clamp((col.r+col.g+col.b)*0.30,0.0,1.0));
    }`;

  function prog(fs) {
    const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = gl.createProgram(); gl.attachShader(pr, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(pr, 0, "p"); gl.bindAttribLocation(pr, 1, "t"); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    const u = {}; ["R", "P", "S", "O", "PS", "map", "rel", "time"].forEach(n => u[n] = gl.getUniformLocation(pr, n)); return { pr, u };
  }
  let earth, atmo, cloud;
  try { earth = prog(EARTH_FS); cloud = prog(CLOUD_FS); atmo = prog(ATMO_FS); } catch (e) { return fail(e); }

  // сфера: u — долгота, v — широта
  const N = 128, pos = [], uv = [], idx = [];
  for (let y = 0; y <= N; y++) for (let x = 0; x <= N; x++) {
    const u = x / N, v = y / N, phi = u * 2 * Math.PI, th = v * Math.PI;
    pos.push(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)); uv.push(u, 1 - v);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const a = y * (N + 1) + x, b = a + N + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const buf = (data, T, A) => { const b = gl.createBuffer(); gl.bindBuffer(T, b); gl.bufferData(T, new A(data), gl.STATIC_DRAW); return b; };
  const bPos = buf(pos, gl.ARRAY_BUFFER, Float32Array), bUv = buf(uv, gl.ARRAY_BUFFER, Float32Array), bIdx = buf(idx, gl.ELEMENT_ARRAY_BUFFER, Uint16Array);

  // текстуры: ночная карта, дневная карта, рельеф+вода. Сначала лёгкие версии, потом тяжёлые
  const texMap = gl.createTexture(), texRel = gl.createTexture();
  let mapReady = false;
  const flat = (tex, rgb) => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(rgb)); };
  flat(texRel, [0, 128, 0]);
  function setTex(tex, src, onDone) {
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
      onDone && onDone();
    };
    img.onerror = () => { if (!mapReady) fail("texture"); };
    img.src = src;
  }
  const load = (file, then) => { const s = document.createElement("script"); s.src = "assets/" + file; s.onload = then; document.head.appendChild(s); };
  setTex(texMap, window.EARTH_LO, () => { mapReady = true; });
  const start = () => {
    load("earth-relief.js", () => window.EARTH_REL && setTex(texRel, window.EARTH_REL));
    load("earth-hi.js", () => window.EARTH_HI && setTex(texMap, window.EARTH_HI));
  };
  document.readyState === "loading" ? addEventListener("DOMContentLoaded", start) : start();
  // самая чёткая ночная карта 8192×4096 — только для больших экранов и сильных видеокарт
  addEventListener("load", () => {
    if (gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 8192 && innerWidth >= 1200)
      setTimeout(() => load("earth-xl.js", () => window.EARTH_XL && setTex(texMap, window.EARTH_XL)), 1200);
  });

  // камера и положение шара
  const FOV = 35 * Math.PI / 180, CAMZ = 5;
  const P = new Float32Array(16); let S = 1, Oy = 0;
  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2), w = hero.clientWidth, h = hero.clientHeight;
    canvas.width = Math.round(w * d); canvas.height = Math.round(h * d); gl.viewport(0, 0, canvas.width, canvas.height);
    const a = w / h, f = 1 / Math.tan(FOV / 2), n = 0.1, fa = 100;
    P.set([f / a, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0]);
    const vh = 2 * CAMZ * Math.tan(FOV / 2), vw = vh * a;
    S = Math.max(vw * 0.72, vh * 0.7);
    Oy = (vh / 2 - vh * (w < 700 ? 0.58 : 0.46)) - S;
  }
  addEventListener("resize", resize); resize();

  function mul(a, b) { const r = new Array(9); for (let c = 0; c < 3; c++) for (let rr = 0; rr < 3; rr++) { let s = 0; for (let k = 0; k < 3; k++) s += a[k * 3 + rr] * b[c * 3 + k]; r[c * 3 + rr] = s; } return r; }
  // вращение вокруг своей оси (spin), затем наклон оси (tilt), затем угол обзора (pitch)
  function rot(pitch, tilt, spin) {
    const cx = Math.cos(pitch), sx = Math.sin(pitch), cz = Math.cos(tilt), sz = Math.sin(tilt), cy = Math.cos(spin), sy = Math.sin(spin);
    const Rx = [1, 0, 0, 0, cx, sx, 0, -sx, cx], Rz = [cz, sz, 0, -sz, cz, 0, 0, 0, 1], Ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy];
    return new Float32Array(mul(Rx, mul(Rz, Ry)));
  }
  function draw(pg, R, scale, time, mode) {
    gl.useProgram(pg.pr);
    gl.uniformMatrix3fv(pg.u.R, false, R); gl.uniformMatrix4fv(pg.u.P, false, P);
    gl.uniform1f(pg.u.S, scale); gl.uniform3f(pg.u.O, 0, Oy, -CAMZ);
    gl.uniform1f(pg.u.time, time); gl.uniform1f(pg.u.PS, S);
    if (mode === "earth") {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texMap); gl.uniform1i(pg.u.map, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texRel); gl.uniform1i(pg.u.rel, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bPos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bUv); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  }

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spin = -2.4, time = 0, last = performance.now(), visible = true;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(hero);
  (function loop(t) {
    requestAnimationFrame(loop);
    if (!visible || !mapReady) { last = t; return; }
    const dt = Math.min((t - last) / 1000, 0.1); last = t;
    if (!reduce) { spin += dt * 0.009; time += dt; }         // очень медленное вращение с запада на восток
    const R = rot(-0.25, -0.41, spin);                       // наклон оси 23,4°
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    gl.disable(gl.BLEND); gl.cullFace(gl.BACK); gl.depthMask(true);
    draw(earth, R, S, time, "earth");
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    draw(cloud, R, S * 1.035, time, "cloud");        // облака над поверхностью
    gl.cullFace(gl.FRONT);
    draw(atmo, R, S * 1.45, time, "atmo");
  })(last);
})();
