/* Susurro: la píldora, la luz y el movimiento del sitio.
   Un solo reloj (gsap.ticker) mueve el scroll, la luz y los dictados. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  // Sin GSAP el sitio sigue completo: nada queda escondido esperando un revelado.
  if (!G || !ST) root.classList.remove("motion");
  const motion = root.classList.contains("motion");
  if (G && ST) G.registerPlugin(ST, ...(window.SplitText ? [window.SplitText] : []));

  const ticker = {
    add(fn) {
      if (G) return G.ticker.add(fn);
      const loop = (ms) => { fn(ms / 1000); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    },
  };

  /* ---------- Scroll ---------- */

  let lenis = null;
  const scrollFns = new Set();
  const scroll = { y: scrollY, v: 0 };
  const publish = () => scrollFns.forEach((fn) => fn(scroll));
  if (motion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, touchMultiplier: 1.2 });
    lenis.on("scroll", (l) => { scroll.y = l.scroll; scroll.v = l.velocity; ST.update(); publish(); });
    G.ticker.add((t) => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
  } else {
    addEventListener("scroll", () => { scroll.v = scrollY - scroll.y; scroll.y = scrollY; publish(); }, { passive: true });
  }

  // Anclas: con Lenis el salto es suave, y el foco siempre llega al destino.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.getElementById(id.slice(1));
    if (!target) return;
    e.preventDefault();
    closeMenu(false);
    if (lenis) lenis.scrollTo(target, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    history.pushState(null, "", id);
  });

  /* ---------- Menú en teléfono ---------- */

  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  function closeMenu(restore = true) {
    if (!root.classList.contains("menu-open")) return;
    root.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    lenis?.start();
    if (restore) menuBtn.focus();
  }
  menuBtn?.addEventListener("click", () => {
    if (root.classList.contains("menu-open")) return closeMenu();
    root.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    lenis?.stop();
    $("a", nav).focus();
  });
  document.addEventListener("keydown", (e) => {
    if (!root.classList.contains("menu-open")) return;
    if (e.key === "Escape") return closeMenu();
    if (e.key !== "Tab") return;
    const stops = [...$$("a", nav), menuBtn];
    const i = stops.indexOf(document.activeElement);
    const next = e.shiftKey ? (i <= 0 ? stops.length - 1 : i - 1) : (i === stops.length - 1 ? 0 : i + 1);
    e.preventDefault();
    stops[next].focus();
  });

  /* ---------- El encabezado y la píldora se apartan al bajar ---------- */

  let lastY = scroll.y;
  scrollFns.add(({ y }) => {
    if (Math.abs(y - lastY) < 6 || root.classList.contains("menu-open")) return;
    const away = y > 240 && y > lastY;
    root.classList.toggle("frame-away", away);
    root.classList.toggle("scrolled", y > 40);
    lastY = y;
    refreshPill();
    pickContext();
  });

  /* ---------- Revelados: suben como luz, se asientan como tinta ---------- */

  const intro = G ? G.timeline({ paused: true }) : null;
  if (motion) {
    const SplitText = window.SplitText;
    $$("[data-split]").forEach((el) => {
      const isIntro = el.hasAttribute("data-intro");
      const delay = parseFloat(el.dataset.delay || "0");
      if (!SplitText) { G.set(el, { visibility: "visible" }); return; }
      const s = { done: false, requested: false, tl: null };
      SplitText.create(el, {
        type: "lines", mask: "lines", autoSplit: true, linesClass: "split-line",
        onSplit(self) {
          G.set(el, { visibility: "visible" });
          if (s.done) return;
          s.tl = G.timeline({
            delay,
            paused: isIntro && !s.requested,
            onComplete: () => { s.done = true; },
            scrollTrigger: isIntro ? undefined : { trigger: el, start: "top 88%", once: true },
          })
            .from(self.lines, { yPercent: 110, rotate: 1.5, duration: 1.2, stagger: 0.08, ease: "expo.out" }, 0)
            .from(self.lines, { color: "#FF3D99", duration: 1.6, stagger: 0.08, ease: "power2.out", clearProps: "color" }, 0.1);
          return s.tl;
        },
      });
      if (isIntro) intro.add(() => { s.requested = true; s.tl?.play(); }, 0);
    });

    $$("[data-reveal]").forEach((el) => {
      const isIntro = el.hasAttribute("data-intro");
      const kind = el.dataset.reveal || "up";
      const delay = parseFloat(el.dataset.delay || "0");
      const from = kind === "fade" ? { autoAlpha: 0, y: 24 }
        : kind === "clip" ? { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 }
        : { y: 40, autoAlpha: 0 };
      const to = { y: 0, autoAlpha: 1, duration: kind === "fade" ? 1.4 : 1.2, ease: "expo.out", delay, paused: isIntro };
      // Al terminar, sin recorte: la sombra y las esquinas de la captura vuelven a verse.
      if (kind === "clip") { to.clipPath = "inset(0% 0% 0% 0%)"; to.clearProps = "clipPath"; }
      if (!isIntro) to.scrollTrigger = { trigger: el, start: "top 90%", once: true };
      const tw = G.fromTo(el, from, to);
      if (isIntro) intro.add(() => tw.play(), 0);
    });

    // «Habla.» llega primero, como luz.
    const said = $(".hero-said");
    // Visible desde el primer cuadro (es el LCP): solo se asienta.
    if (said) intro.add(G.from(said, { yPercent: 14, scale: 0.97, transformOrigin: "0% 100%", duration: 1.4, ease: "expo.out" }), 0);
    requestAnimationFrame(() => { ST.refresh(); intro.play(); });
  }

  /* ---------- La luz ---------- */

  const SLOTS = [-0.62, -0.2, 0.22, 0.6];
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function makeGlow(el) {
    el.innerHTML = "<i></i><i></i><i></i><i></i><i></i><b></b>";
    const g = { el, blobs: $$("i", el), rim: $("b", el), h: [0, 0, 0, 0, 0], w: 0, ht: 0 };
    g.measure = () => { g.w = el.clientWidth; g.ht = el.clientHeight; };
    g.measure();
    return g;
  }

  // levels: cinco alturas 0..1. o: { cx, spread, scale, alpha, rim, t }.
  function drawGlow(g, levels, o) {
    const half = g.w / 2;
    const cx = o.cx ?? half;
    const inner = half * (o.spread ?? 1);
    let sum = 0;
    for (let i = 0; i < 5; i++) {
      const target = levels[i];
      g.h[i] += (target - g.h[i]) * (target > g.h[i] ? 0.55 : 0.18);
      const v = Math.min(g.h[i] * 1.35, 1);
      sum += v;
      let x, w, h, op;
      if (i < 4) {
        x = cx + (SLOTS[i] + Math.sin(o.t * 0.9 + i * 1.7) * 0.05) * inner;
        w = inner * (0.95 + 0.2 * v);
        h = 2 * g.ht * (0.25 + 0.6 * v) * (o.scale ?? 1);
        op = 0.4 + 0.45 * v;
      } else {
        x = cx;
        w = inner * 0.6;
        h = 2 * g.ht * (0.12 + 0.4 * v) * (o.scale ?? 1);
        op = 0.2 + 0.4 * v;
      }
      op *= smooth(0.004, 0.12, v) * (o.alpha ?? 1);
      const b = g.blobs[i];
      b.style.transform = `translate3d(${(x - 50).toFixed(1)}px,0,0) scale(${(w / 100).toFixed(3)},${(h / 100).toFixed(3)})`;
      b.style.opacity = op.toFixed(3);
    }
    g.rim.style.opacity = ((0.3 + 0.7 * sum / 5) * (o.rim ?? 1)).toFixed(3);
  }

  const voiceEl = $("#voice");
  const pill = $("#pill");
  const pillText = $("#pillText");
  const pillStatus = $("#pillStatus");
  const edge = makeGlow($("#edge"));
  const pillGlow = makeGlow($("#pillGlow"));
  const screenEl = $("#screenGlow");
  const screenGlow = screenEl ? makeGlow(screenEl) : null;
  addEventListener("resize", () => { edge.measure(); screenGlow?.measure(); placeMark(); });

  const voice = { level: 0, target: 0 };
  const pointer = { x: 0, aim: 0 };
  if (fine && !reduced) addEventListener("pointermove", (e) => { pointer.aim = e.clientX / innerWidth - 0.5; }, { passive: true });

  /* ---------- Dictados de ejemplo ---------- */

  const EX = [
    {
      app: "Mail", head: "<span>Para</span> Laura Méndez",
      raw: "eh hola Laura este quería ver si podemos mover la junta al martes no mejor al jueves a las diez y pues ahí revisamos el presupuesto",
      out: ["Hola, Laura:", "¿Podemos mover la junta al jueves a las 10:00? Ahí revisamos el presupuesto."],
    },
    {
      app: "Slack", head: "<span>#</span>lanzamiento",
      raw: "o sea ya quedó el deploy eh nada más falta que jimena revise los textos y lo anunciamos",
      out: ["Ya quedó el deploy. Nada más falta que Ximena revise los textos y lo anunciamos."],
    },
    {
      app: "Mensajes", head: "<span>Para</span> Diego",
      raw: "ya voy saliendo llego como en quince minutos mmm si quieres pide tú los tacos",
      out: ["Ya voy saliendo, llego en unos 15 minutos. Si quieres, pide tú los tacos."],
    },
    {
      app: "Cursor", head: "<span>Chat</span> auth.ts",
      raw: "haz que la función de login regrese un error si el correo viene vacío",
      out: ["Haz que <code>login()</code> regrese un error si <code>email</code> viene vacío."],
    },
  ];
  const CMDS = [
    { raw: "hazlo más formal", out: "Mañana no me será posible. ¿Podríamos revisarlo el lunes?", next: "Ahora pide «tradúcelo al inglés»." },
    { raw: "tradúcelo al inglés", out: "I can’t make it tomorrow. Could we go over it on Monday?", next: "Ahora pide «hazlo casual otra vez»." },
    { raw: "hazlo casual otra vez", out: "nel, mañana no puedo, ¿lo vemos el lunes?", next: "Mantenla y pide «hazlo más formal»." },
  ];
  const SCRIPTS = {
    hero: () => ({ ...EX[app], target: "hero" }),
    tones: () => ({ raw: "oye no voy a llegar a la junta de las nueve se me complicó algo la movemos a la tarde", target: "tones" }),
    command: () => ({ ...CMDS[cmd], target: "command", mode: "cmd" }),
    final: () => ({ raw: "eh ya me convenciste lo voy a descargar", out: ["Ya me convenciste, lo voy a descargar."] }),
    home: () => ({ raw: "eh llévame al inicio", target: "home" }),
    none: () => ({ raw: "eh nos vemos el martes no mejor el jueves a las diez", out: ["Nos vemos el jueves a las 10:00."] }),
  };
  const plain = (html) => html.replace(/<[^>]+>/g, "");

  // La sección de la que habla la píldora: la que cruza el centro de la pantalla.
  const dictateSections = $$("[data-dictate]");
  let context = dictateSections[0]?.dataset.dictate || "none";
  function pickContext() {
    const mid = innerHeight * 0.55;
    const hit = dictateSections.find((s) => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom >= mid; });
    const next = hit ? hit.dataset.dictate : "none";
    if (next === context) return;
    context = next;
    // El ejemplo automático es solo para el primer vistazo.
    if (dict?.source === "auto") cancel("");
    if (!dict) voiceEl.classList.toggle("cmd", context === "command");
    refreshPill();
  }

  let app = 0;
  let cmd = 0;
  let dict = null;      // dictado en curso
  let phase = "rest";   // rest | listening | processing | message
  let messageUntil = 0;
  let live = "";

  const say = (text) => { pillStatus.textContent = text; };

  function refreshPill() {
    let text = "";
    if (phase === "listening") text = live ? (live.length > 44 ? "…" + live.slice(-43) : live) : "Escuchando…";
    else if (phase === "message") text = pillMsg;
    else if (phase === "rest") text = context === "command" ? "Mantén para el comando" : "Mantén para dictar";
    if (pillText.textContent !== text) pillText.textContent = text;
    pill.classList.toggle("is-on", phase !== "rest");
    if (!dict) voiceEl.classList.toggle("cmd", context === "command");
    // Fuera de las secciones con ventana, la píldora reposa pequeña para no tapar texto.
    const roomy = ["hero", "command", "final", "home"].includes(context) && !root.classList.contains("frame-away");
    const mini = phase === "rest" && !roomy && document.activeElement !== pill && !pill.matches(":hover");
    pill.classList.toggle("is-mini", mini);
  }
  let pillMsg = "";
  function message(text, ms = 2600) {
    phase = "message";
    pillMsg = text;
    messageUntil = performance.now() + ms;
    say(text);
    refreshPill();
  }

  function start(source) {
    if (dict && dict.source === "auto") { dict = null; }
    if (dict || phase === "processing") return;
    const script = SCRIPTS[context] ? SCRIPTS[context]() : SCRIPTS.none();
    dict = { source, script, words: script.raw.split(" "), i: 0, next: performance.now() + 260, ctx: context };
    voiceEl.classList.toggle("cmd", script.mode === "cmd");
    phase = "listening";
    live = "";
    voice.target = 0.2;
    say(script.mode === "cmd" ? "Escuchando en modo comando." : "Escuchando.");
    refreshPill();
    if (script.target === "hero") showCaret();
  }

  function cancel(text = "Cancelado") {
    if (!dict) return;
    dict = null;
    voice.target = 0;
    if (text) message(text, 1600);
    else { phase = "rest"; refreshPill(); }
    restoreHero();
  }

  function stop() {
    if (!dict) return;
    const d = dict;
    dict = null;
    voice.target = 0;
    if (d.i < Math.ceil(d.words.length * 0.5)) {
      message("Sigue hablando: suelta al terminar la frase");
      restoreHero();
      return;
    }
    phase = "processing";
    say("Puliendo.");
    refreshPill();
    setTimeout(() => write(d), reduced ? 120 : 520);
  }

  function write(d) {
    const s = d.script;
    phase = "rest";
    if (s.target === "hero") {
      body.innerHTML = s.out.map((p) => `<p class="fresh">${p}</p>`).join("");
      say(`Se escribió en ${s.app}: ${plain(s.out.join(" "))}`);
      refreshPill();
    } else if (s.target === "command") {
      const t = $("#cmdText");
      t.textContent = s.out;
      t.classList.remove("fresh"); void t.offsetWidth; t.classList.add("fresh");
      $("#cmdCap").textContent = s.next;
      cmd = (cmd + 1) % CMDS.length;
      say(`Listo: ${s.out}`);
      refreshPill();
    } else if (s.target === "tones") {
      $$(".tone-out").forEach((el, i) => {
        el.classList.remove("fresh"); void el.offsetWidth;
        el.style.animationDelay = `${i * 90}ms`;
        el.classList.add("fresh");
      });
      message("Escrito en cuatro tonos");
    } else if (s.target === "home") {
      if (body) body.innerHTML = '<p class="fresh">Llévame al inicio.</p>';
      message("Te llevo al inicio", 900);
      setTimeout(() => { location.href = $(".lost .btn")?.href || "./"; }, 700);
    } else {
      // Sin campo de texto a la vista: como la app, queda en el portapapeles.
      const text = plain(s.out.join(" "));
      const done = () => message("Sin campo de texto: quedó en tu portapapeles", 3200);
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => message("Sin campo de texto a la vista", 2600));
      else message("Sin campo de texto a la vista", 2600);
    }
    window.umami?.track?.("Dictado", { lugar: d.ctx, origen: d.source });
  }

  /* ---------- La ventana del hero ---------- */

  const body = $("#winBody");
  const head = $("#winHead");
  const tabs = $$(".app-tab");
  const mark = $(".tab-mark");
  let heroSnapshot = body?.innerHTML;
  function placeMark() {
    const on = tabs.find((t) => t.getAttribute("aria-pressed") === "true");
    if (!on || !mark) return;
    mark.style.width = `${on.offsetWidth}px`;
    mark.style.translate = `${on.offsetLeft}px 0`;
  }
  function showCaret() {
    if (!body.querySelector(".caret")) heroSnapshot = body.innerHTML;
    body.innerHTML = '<p><span class="caret" aria-hidden="true"></span></p>';
  }
  function restoreHero() {
    if (body && body.querySelector(".caret")) body.innerHTML = heroSnapshot;
  }
  tabs.forEach((t) => t.addEventListener("click", () => {
    if (dict) cancel("");
    app = +t.dataset.app;
    tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    head.innerHTML = EX[app].head;
    body.innerHTML = EX[app].out.map((p) => `<p class="fresh">${p}</p>`).join("");
    placeMark();
  }));
  if (mark) {
    $(".win-bar").classList.add("has-mark");
    placeMark();
    document.fonts?.ready.then(placeMark);
  }

  /* ---------- Mantener: puntero, Espacio o una tecla derecha ---------- */

  let downAt = 0;
  pill.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    pill.setPointerCapture?.(e.pointerId);
    downAt = performance.now();
    start("puntero");
  });
  pill.addEventListener("pointerup", () => {
    if (!dict || dict.source !== "puntero") return;
    if (performance.now() - downAt < 300) { cancel(""); message("Mantenla presionada mientras hablas"); return; }
    stop();
  });
  pill.addEventListener("pointercancel", () => { if (dict?.source === "puntero") cancel(""); });
  pill.addEventListener("contextmenu", (e) => e.preventDefault());
  pill.addEventListener("keydown", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (!e.repeat) start("teclado");
  });
  pill.addEventListener("keyup", (e) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (dict?.source === "teclado") stop();
  });
  pill.addEventListener("pointerenter", refreshPill);
  pill.addEventListener("pointerleave", () => setTimeout(refreshPill, 60));
  pill.addEventListener("focus", refreshPill);
  pill.addEventListener("blur", () => { if (dict?.source === "teclado") cancel(""); refreshPill(); });

  // Las teclas que la app acepta además de fn. fn no llega al navegador.
  const KEYS = new Set(["AltRight", "MetaRight", "ControlRight", "ShiftRight"]);
  let held = null;
  let heldTimer = 0;
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dict) { cancel(); return; }
    if (e.repeat) return;
    if (KEYS.has(e.code) && !held && !dict) {
      held = e.code;
      // Un instante de espera: ⇧ + Tab no debe encender la píldora.
      heldTimer = setTimeout(() => { if (held) start("tecla"); }, 180);
      return;
    }
    if (held && e.code !== held) {
      // Tecla + otra tecla era un atajo: se ignora, como en la app.
      clearTimeout(heldTimer);
      held = null;
      if (dict?.source === "tecla") cancel("");
    }
  });
  addEventListener("keyup", (e) => {
    if (e.code !== held) return;
    clearTimeout(heldTimer);
    held = null;
    if (dict?.source === "tecla") stop();
  });
  addEventListener("blur", () => { clearTimeout(heldTimer); held = null; if (dict && dict.source !== "auto") cancel(""); });

  /* ---------- El reloj ---------- */

  const levels = [0, 0, 0, 0, 0];
  let screenOn = false;
  let screenP = 0;
  // En la 404 no hay nada que leer: el borde queda encendido, esperando.
  let restEdge = $(".lost") ? 0.3 : 0.03;

  ticker.add((t) => {
    const now = performance.now();
    const tt = reduced ? 0 : t;

    // Palabras dichas a ritmo de voz; cada una sube el nivel.
    if (dict) {
      if (dict.i < dict.words.length && now >= dict.next) {
        const w = dict.words[dict.i++];
        live = live ? `${live} ${w}` : w;
        dict.next = now + 150 + w.length * 34;
        voice.target = 0.55 + Math.random() * 0.45;
        refreshPill();
        if (dict.source === "auto" && dict.i === dict.words.length) setTimeout(() => { if (dict?.source === "auto") stop(); }, 420);
      }
      voice.target = Math.max(0.12, voice.target * 0.93);
    }
    if (phase === "message" && now > messageUntil) { phase = "rest"; refreshPill(); }
    voice.level += (voice.target - voice.level) * 0.3;

    // Con el puntero o el foco encima, la píldora ya enseña un poco de luz.
    const hint = phase === "rest" && (pill.matches(":hover") || pill.matches(":focus-visible")) ? 0.32 : 0;
    for (let i = 0; i < 5; i++) {
      if (phase === "processing") levels[i] = 0.32 + 0.22 * Math.sin(tt * 6 - i * 0.9);
      else levels[i] = Math.max(voice.level, hint) * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(tt * (3.1 + i * 0.7) + i * 2.1)));
    }

    pillGlow.measure();
    drawGlow(pillGlow, levels, { t: tt, rim: phase === "rest" ? 0.6 : 1 });

    pointer.x += (pointer.aim - pointer.x) * 0.05;
    const cx = innerWidth / 2 + pointer.x * innerWidth * 0.16;
    const breathe = reduced ? 1 : 0.85 + 0.15 * Math.sin(tt * 0.7);
    const el = levels.map((l, i) => Math.max(l * 0.85, restEdge * breathe * (0.8 + 0.2 * Math.sin(tt * 0.5 + i))));
    drawGlow(edge, el, { t: tt, cx, spread: innerWidth < 760 ? 1.1 : 0.85, scale: 0.75, alpha: 0.9 });

    if (screenGlow && screenOn) {
      const sl = levels.map((l, i) => Math.max(screenP * (0.75 + 0.25 * Math.sin(tt * 0.8 + i * 1.3)), l));
      drawGlow(screenGlow, sl, { t: tt, scale: 0.8, alpha: 0.95 });
    }
  });

  /* ---------- Secciones ---------- */

  if (motion) {
    // Qué tan encendido está el borde en reposo: más en el cierre, donde termina la página.
    const fin = $(".final");
    if (fin) ST.create({ trigger: fin, start: "top 70%", end: "bottom bottom", onUpdate: (s) => { restEdge = 0.03 + s.progress * 0.42; }, onLeaveBack: () => { restEdge = 0.03; } });

    // Cómo funciona: cada verbo se enciende al llegar.
    $$(".step").forEach((s) => ST.create({ trigger: s, start: "top 72%", onEnter: () => s.classList.add("is-on"), onLeaveBack: () => s.classList.remove("is-on") }));

    // La pantalla de privacidad: la luz sube hasta chocar con el borde.
    const screen = $("#screen");
    if (screen) ST.create({
      trigger: screen, start: "top bottom", end: "bottom top",
      onToggle: (s) => { screenOn = s.isActive; if (screenOn) screenGlow.measure(); },
      onUpdate: (s) => { screenP = smooth(0.15, 0.55, s.progress) * 0.95; },
    });

    // Nav: la sección actual queda marcada.
    $$(".nav-a").forEach((a) => {
      const href = a.getAttribute("href");
      const sec = href.startsWith("#") && $(href);
      if (sec) ST.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => (s.isActive ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")) });
    });

    initChapters();
  }

  // Lo dicho, lo escrito: el scroll pasa cada caso de luz a tinta.
  function initChapters() {
    const track = $("#swTrack");
    if (!track) return;
    const cases = $$(".sw-case", track);
    const index = $$(".sw-index li", track);
    const said = cases.map((c) => {
      const p = $(".sw-said", c);
      const wrap = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) frag.append(part);
              else { const s = document.createElement("span"); s.className = "wd"; s.textContent = part; frag.append(s); }
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && !n.classList.contains("sw-tag")) wrap(n);
        });
      };
      wrap(p);
      return { p, words: $$(".wd", p), out: $(".sw-out", c) };
    });
    const n = cases.length;
    const apply = (prog) => {
      const k = Math.min(n - 1, Math.floor(prog * n));
      const q = Math.min(1, prog * n - k);
      cases.forEach((c, i) => c.classList.toggle("is-on", i === k));
      index.forEach((li, i) => { li.classList.toggle("is-on", i === k); li.style.setProperty("--q", i < k ? 1 : i === k ? smooth(0, 0.85, q) : 0); });
      const s = said[k];
      const m = s.words.length;
      s.words.forEach((w, i) => w.classList.toggle("on", q >= 0.04 + (i / m) * 0.4));
      s.p.classList.toggle("cut", q >= 0.5);
      s.out.classList.toggle("in", q >= 0.62);
    };
    apply(0);
    ST.create({ trigger: track, start: "top top", end: "bottom bottom", onUpdate: (s) => apply(s.progress) });
  }

  /* ---------- Primer vistazo: la píldora dicta sola una vez ---------- */

  pickContext();
  refreshPill();
  if (motion && body) {
    setTimeout(() => {
      if (dict || phase !== "rest" || scroll.y > 80 || context !== "hero") return;
      start("auto");
    }, 2200);
  }
})();
