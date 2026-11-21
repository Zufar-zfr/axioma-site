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

/* ===== Вращающаяся Земля ===== */
(function globe() {
  const hero = document.querySelector(".hero");
  const canvas = document.getElementById("globe");
  if (!hero || !canvas) return;
  try {
    if (typeof THREE === "undefined") throw new Error("no three");
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.z = 5;

    const loader = new THREE.TextureLoader();
    const tex = loader.load("assets/earth-night.jpg", () => renderer.capabilities && (tex.anisotropy = renderer.capabilities.getMaxAnisotropy()));
    tex.encoding = THREE.sRGBEncoding;
    const photo = loader.load("assets/earth-photo.jpg");
    photo.encoding = THREE.sRGBEncoding;
    photo.generateMipmaps = false; photo.minFilter = THREE.LinearFilter;
    photo.anisotropy = 4;

    const group = new THREE.Group();
    scene.add(group);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 128),
      new THREE.ShaderMaterial({
        uniforms: { map: { value: tex }, photo: { value: photo } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          void main(){ vUv=uv; vN=normalize(normalMatrix*normal);
          vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `uniform sampler2D map; uniform sampler2D photo; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
          const float PI=3.14159265;
          void main(){
            // запасная карта ночной Земли для сторон, которых нет на фото
            vec3 col=vec3(0.012,0.03,0.08)+texture2D(map,vUv).rgb*1.6;
            // перепроекция фото (ортографический вид на Америку) на сферу
            float lon=(vUv.x-0.5)*2.*PI; float lat=(vUv.y-0.5)*PI;
            float dl=lon; dl=mod(dl+PI,2.*PI)-PI;
            float x=cos(lat)*sin(dl); float y=sin(lat); float z=cos(lat)*cos(dl);
            vec2 puv=vec2(0.5+x*0.4835,0.5+y*0.4835);
            float w=smoothstep(0.12,0.45,z);
            vec3 ph=texture2D(photo,puv).rgb*1.9;
            col=mix(col,ph,w);
            float f=pow(1.-max(dot(normalize(vN),normalize(vV)),0.),4.5);
            col+=vec3(0.15,0.45,1.0)*f*0.7;
            gl_FragColor=vec4(col,1.);
          }`
      })
    );
    group.add(earth);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 96, 96),
      new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: `varying vec3 vN; varying vec3 vV;
          void main(){ vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `varying vec3 vN; varying vec3 vV;
          void main(){ float d=-dot(normalize(vN),normalize(vV));
          float i=pow(smoothstep(0.0,0.5,d),2.2)*(1.0-smoothstep(0.42,0.5,d)*0.0);
          gl_FragColor=vec4(0.22,0.52,1.0,1.)*i*0.9; }`
      })
    );
    scene.add(atmo);

    // звёзды
    const N = 900, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 30 + Math.random() * 30, a = Math.random() * 6.283, b = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(b) * Math.cos(a), r * Math.sin(b) * Math.sin(a), -Math.abs(r * Math.cos(b)) - 10], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xbcd4ff, size: 0.09, transparent: true, opacity: .75, sizeAttenuation: true }));
    scene.add(stars);

    group.rotation.x = -0.3; group.rotation.z = -0.08; group.rotation.y = -2.0;

    function resize() {
      const w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const vw = vh * camera.aspect;
      const s = Math.max(vw * 0.95, vh * 0.9);           // радиус, чтобы горизонт был широкой дугой
      const topY = vh / 2 - vh * (w < 700 ? 0.58 : 0.46); // верх земли на ~55% высоты экрана
      group.scale.setScalar(s); atmo.scale.setScalar(s);
      group.position.y = atmo.position.y = topY - s;
    }
    addEventListener("resize", resize); resize();

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now(), visible = true;
    new IntersectionObserver(e => visible = e[0].isIntersecting).observe(hero);
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!visible) { last = t; return; }
      const dt = (t - last) / 1000; last = t;
      if (!reduce) { group.rotation.y += dt * 0.04; stars.rotation.z += dt * 0.002; }
      renderer.render(scene, camera);
    })(last);
  } catch (err) {
    console.warn("WebGL недоступен, показываем статичный баннер", err);
    hero.classList.add("no-webgl");
    canvas.style.display = "none";
  }
})();
