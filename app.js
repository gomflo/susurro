// Susurro · landing. JavaScript sin dependencias; sin él, la página se lee completa.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const easeOut = (t) => 1 - Math.pow(1 - t, 4);

  /* ---------------- navegación ---------------- */
  const nav = $("#nav"), menu = $("#navMenu"), links = $("#navLinks");
  const onScroll = () => nav.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const setMenu = (open) => { menu.setAttribute("aria-expanded", String(open)); links.classList.toggle("open", open); };
  menu.addEventListener("click", () => setMenu(menu.getAttribute("aria-expanded") !== "true"));
  links.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // Marca en el menú la sección que ocupa el tercio superior.
  const navMap = new Map($$("a", links).map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const a = navMap.get(e.target.id);
      if (a && e.isIntersecting) { navMap.forEach((x) => x.removeAttribute("aria-current")); a.setAttribute("aria-current", "true"); }
    }
  }, { rootMargin: "-30% 0px -65% 0px" });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------------- pestañas ---------------- */
  $$("[data-tabs]").forEach((box) => {
    const tabs = $$('[role="tab"]', box);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        select(tabs[(map[e.key] + tabs.length) % tabs.length], true);
      });
    });
  });

  /* ---------------- tu tecla ---------------- */
  // La tecla de dictado se elige en la app (fn o un modificador derecho); aquí se refleja en toda la página.
  const KEYS = {
    fn: { sym: "fn", word: "", note: "La de fábrica. Cámbiala en Ajustes." },
    option: { sym: "⌥", word: "option", note: "⌥ del lado derecho, en lugar de fn." },
    command: { sym: "⌘", word: "command", note: "⌘ del lado derecho, en lugar de fn." },
    control: { sym: "⌃", word: "control", note: "⌃ del lado derecho, en lugar de fn." },
    shift: { sym: "⇧", word: "shift", note: "⇧ del lado derecho, en lugar de fn." },
  };
  const picks = $$("[data-pick]");
  function setKey(id, focus) {
    const k = KEYS[id];
    picks.forEach((b) => {
      const on = b.dataset.pick === id;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    $$("[data-key]").forEach((el) => (el.textContent = k.sym));
    const label = $("#fnLabel"), word = $("#fnWord"), globe = $("#fnGlobe"), note = $("#keyPickNote");
    if (label) label.textContent = k.sym;
    if (word) { word.textContent = k.word; word.hidden = !k.word; }
    if (globe) globe.style.display = k.word ? "none" : "";
    if (note) note.textContent = k.note;
  }
  picks.forEach((b, i) => {
    b.addEventListener("click", () => setKey(b.dataset.pick));
    b.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      setKey(picks[(i + step + picks.length) % picks.length].dataset.pick, true);
    });
  });

  /* ---------------- letras de anillos ---------------- */
  // Cada palabra se pinta varias veces con trazos de grosor decreciente, tinta y papel alternados:
  // quedan líneas concéntricas alrededor de la letra. --a abre o cierra los anillos.
  let uid = 0;
  function ringWord(svg) {
    const src = $(".rw-src", svg);
    if (!src) return;
    const n = Number(svg.dataset.rings) || 3;
    const id = `rw${++uid}`;
    src.id = id;
    const defs = document.createElementNS(NS, "defs");
    defs.append(src);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "rw-g");
    const use = (cls, k) => {
      const u = document.createElementNS(NS, "use");
      u.setAttribute("href", `#${id}`);
      u.setAttribute("class", cls);
      u.style.setProperty("--k", k);
      return u;
    };
    for (let k = n; k >= 1; k--) g.append(use("ring", k), use("gap", k));
    g.append(use("core", 0));
    svg.prepend(defs);
    svg.append(g);
    svg._fit = () => {
      const b = src.getBBox();
      const gap = parseFloat(getComputedStyle(svg).getPropertyValue("--g")) || 14;
      const pad = n * gap + 6;
      svg.setAttribute("viewBox", `${(b.x - pad).toFixed(1)} ${(b.y - pad).toFixed(1)} ${(b.width + 2 * pad).toFixed(1)} ${(b.height + 2 * pad).toFixed(1)}`);
    };
  }
  const words = $$(".rw");
  words.forEach(ringWord);
  // Se ajusta ya, en el mismo cuadro en que aparecen los anillos: esperar a fonts.ready deja
  // pintar un cuadro con el viewBox del HTML y la palabra se ve más grande. Luego se reajusta
  // por si la fuente llegó después.
  const fitWords = () => words.forEach((w) => w._fit && w._fit());
  fitWords();
  document.fonts.ready.then(fitWords);

  const setA = (el, a) => el.style.setProperty("--a", a.toFixed(3));

  // Las líneas de la voz, con la misma forma que la píldora de la app (src/overlay.rs):
  // campanas que nacen del borde inferior; la de afuera es la más alta y ancha.
  // sweep: al pulir, la cresta se angosta y recorre el ancho.
  function voiceLines(svg, n) {
    const path = svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "path"));
    let W = 0, H = 0;
    new ResizeObserver(() => { W = svg.clientWidth; H = svg.clientHeight; }).observe(svg);
    return (now, lvl, sweep) => {
      let d = "";
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / n;
        const wobble = Math.sin(now * .007 + i * 1.3) * .5 + .5;
        const a = Math.min(1, lvl * (.8 + .2 * wobble)) * (H - 6) * Math.pow(k, .85);
        const s = W * (sweep ? .08 + .1 * k : .12 + .16 * k);
        const cx = W / 2 + (sweep ? Math.sin(now * .0032 - i * .18) * .26 : Math.sin(now * .0011 + i * .45) * .035) * W;
        for (let j = 0; j <= 48; j++) {
          const x = W * j / 48, u = (x - cx) / s;
          d += (j ? "L" : "M") + x.toFixed(1) + " " + (H + 1 - a * Math.exp(-u * u)).toFixed(1);
        }
      }
      path.setAttribute("d", d);
    };
  }
  function tweenA(el, from, to, ms) {
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      setA(el, from + (to - from) * easeOut(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Los anillos de los números y del cierre se abren una vez, al entrar en pantalla.
  if (!reduceMQ.matches) {
    const enter = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        enter.unobserve(e.target);
        tweenA(e.target, 0, 1, 1400);
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    $$(".rw-num, .rw-final").forEach((w) => {
      if (w.getBoundingClientRect().top < innerHeight * .85) return;
      setA(w, 0);
      enter.observe(w);
    });
  }

  /* ---------------- privacidad: ondas que no cruzan el borde ---------------- */
  const bound = $("#bound"), ringsG = $("#boundRings");
  if (bound && ringsG) {
    for (let i = 1; i <= 14; i++) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "96"); c.setAttribute("cy", "170"); c.setAttribute("r", String(i * 36));
      c.style.transitionDelay = `${i * 70}ms`;
      ringsG.append(c);
    }
    new IntersectionObserver(([e], o) => {
      if (e.isIntersecting) { bound.classList.add("on"); o.disconnect(); }
    }, { threshold: .35 }).observe(bound);
  }

  /* ---------------- hero: la tecla fn dicta ---------------- */
  const EX = [
    {
      app: "Mail", head: "<span>Para</span>Laura Méndez",
      raw: "eh hola Laura este quería ver si podemos mover la junta al martes no mejor al jueves a las diez y pues ahí revisamos el presupuesto",
      out: ["Hola, Laura:", "¿Podemos mover la junta al jueves a las 10:00? Ahí revisamos el presupuesto."],
      said: "Hola, Laura: ¿Podemos mover la junta al jueves a las 10:00? Ahí revisamos el presupuesto.",
    },
    {
      app: "Slack", head: "<span>#</span>lanzamiento",
      raw: "o sea ya quedó el deploy eh nada más falta que jimena revise los textos y lo anunciamos",
      out: ["Ya quedó el deploy. Nada más falta que Ximena revise los textos y lo anunciamos."],
      said: "Ya quedó el deploy. Nada más falta que Ximena revise los textos y lo anunciamos.",
    },
    {
      app: "Mensajes", head: "<span>Para</span>Diego",
      raw: "ya voy saliendo llego como en quince minutos mmm si quieres pide tú los tacos",
      out: ["Ya voy saliendo, llego en unos 15 minutos. Si quieres, pide tú los tacos."],
      said: "Ya voy saliendo, llego en unos 15 minutos. Si quieres, pide tú los tacos.",
    },
    {
      app: "Cursor", head: "<span>Chat</span>auth.ts",
      raw: "haz que la función de login regrese un error si el correo viene vacío",
      out: ["Haz que <code>login()</code> regrese un error si <code>email</code> viene vacío."],
      said: "Haz que login() regrese un error si email viene vacío.",
    },
  ];

  const demo = $("#demo");
  if (demo) {
    const key = $("#fnKey"), body = $("#sheetBody"), head = $("#sheetHead"), status = $("#fnStatus"), hint = $("#fnHint");
    const hero = $("#heroWord");
    const appBtns = $$("[data-ex]", demo);
    let ex = 0, state = "idle", timers = [], queue = [], amp = 0, raf = 0, autoplay = true, lineLvl = 0;
    const lines = voiceLines($("#sheetLines"), 6);
    const IDLE = "Mantén presionada la tecla para dictar";

    const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const setStatus = (t) => { status.textContent = t; };

    function showDone(i) {
      const e = EX[i];
      head.innerHTML = e.head;
      body.classList.remove("polishing");
      body.innerHTML = e.out.map((p) => `<p>${p}</p>`).join("");
    }

    // La onda de la voz: los anillos de «Habla.» y las líneas de la hoja respiran con lo que dices.
    function voiceLoop(now) {
      const on = state === "listening", polishing = state === "polishing";
      const wave = Math.sin(now / 140) * Math.sin(now / 330);
      const target = on ? .95 + .35 * wave + amp : 1;
      const cur = parseFloat(hero.style.getPropertyValue("--a")) || 1;
      setA(hero, cur + (target - cur) * .22);
      const lineTarget = on ? .5 + .22 * wave + amp : polishing ? .38 : 0;
      lineLvl += (lineTarget - lineLvl) * (lineTarget > lineLvl ? .2 : .1);
      lines(now, lineLvl, polishing);
      amp *= .9;
      if (on || polishing || Math.abs(cur - 1) > .01 || lineLvl > .004) raf = requestAnimationFrame(voiceLoop);
      else { setA(hero, 1); lineLvl = 0; lines(now, 0, false); raf = 0; }
    }
    const startVoice = () => { if (!raf && !reduceMQ.matches) raf = requestAnimationFrame(voiceLoop); };

    function addWord(w) {
      const caret = $(".listen-caret", body);
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      caret.before(s);
      amp = .35;
      if (!reduceMQ.matches) s.animate({ opacity: [0, 1], transform: ["translateY(6px) scale(1.15)", "none"] }, { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
    }

    function press() {
      if (state === "listening" || state === "polishing") return;
      clearTimers();
      autoplay = false;
      state = "listening";
      key.classList.add("down");
      hint.classList.add("listening");
      hero.classList.add("speaking");
      setStatus("Escuchando… suelta para escribir");
      const e = EX[ex];
      head.innerHTML = e.head;
      body.classList.remove("polishing");
      body.innerHTML = '<p><span class="listen-caret"></span></p>';
      queue = e.raw.split(" ");
      let at = 120;
      queue.forEach((w, i) => {
        later(() => { queue.shift(); addWord(w); }, at);
        at += reduceMQ.matches ? 0 : 150 + w.length * 34;
        if (i === queue.length - 1) later(() => { if (state === "listening") setStatus("Suelta la tecla para escribir"); }, at + 200);
      });
      if (reduceMQ.matches) lines(0, .5, false);
      startVoice();
    }

    function release() {
      if (state !== "listening") return;
      clearTimers();
      // Lo que faltaba de la frase llega de golpe: el modelo ya lo había oído.
      queue.forEach(addWord);
      queue = [];
      state = "polishing";
      key.classList.remove("down");
      hint.classList.remove("listening");
      hero.classList.remove("speaking");
      body.classList.add("polishing");
      if (reduceMQ.matches) lines(0, 0, false);
      $(".listen-caret", body)?.remove();
      setStatus("Puliendo…");
      later(() => {
        const e = EX[ex];
        const ws = $$(".w", body);
        if (reduceMQ.matches) { finish(); return; }
        ws.forEach((w, i) => w.animate({ opacity: [1, 0], filter: ["blur(0)", "blur(4px)"] }, { duration: 220, delay: i * 12, fill: "forwards" }));
        later(finish, 220 + ws.length * 12);
        function finish() {
          showDone(ex);
          if (!reduceMQ.matches) $$("p", body).forEach((p, i) => p.animate({ opacity: [0, 1], filter: ["blur(6px)", "blur(0)"], transform: ["translateY(6px)", "none"] }, { duration: 520, delay: i * 90, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }));
          state = "idle";
          setStatus(`Listo. Se escribió en ${e.app}: «${e.said}»`);
          later(() => { if (state === "idle") setStatus(IDLE); }, 6000);
        }
      }, reduceMQ.matches ? 0 : 520);
    }

    key.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      key.setPointerCapture?.(e.pointerId);
      key.focus({ preventScroll: true });
      press();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => key.addEventListener(t, release));
    key.addEventListener("keydown", (e) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!e.repeat) press();
    });
    key.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") release(); });
    key.addEventListener("blur", release);
    key.addEventListener("contextmenu", (e) => e.preventDefault());
    key.addEventListener("click", (e) => e.preventDefault());

    appBtns.forEach((b) => b.addEventListener("click", () => {
      if (state === "listening" || state === "polishing") return;
      clearTimers();
      autoplay = false;
      ex = Number(b.dataset.ex);
      appBtns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      showDone(ex);
      setStatus(IDLE);
    }));

    // Una sola vez al cargar, la tecla se presiona sola para mostrar el gesto.
    if (!reduceMQ.matches) {
      const io = new IntersectionObserver(([e], o) => {
        if (!e.isIntersecting) return;
        o.disconnect();
        later(() => {
          if (!autoplay) return;
          press();
          autoplay = false;
          const total = EX[0].raw.split(" ").reduce((t, w) => t + 150 + w.length * 34, 120);
          later(release, total + 450);
        }, 900);
      }, { threshold: .6 });
      document.fonts.ready.then(() => io.observe(demo));
    }
  }

  /* ---------------- galera de corrección ---------------- */
  const galera = $("#galera");
  if (galera) {
    const stage = $(".gl-stage"), lineEl = $("#glLine"), marksEl = $("#glMarks"), notesEl = $("#glNotes"), pill = $("#glPill"), clock = $("#glClock");
    const pauseBtn = $("#glPause"), pauseLabel = $("#glPauseLabel");

    // r: lo dicho; c: lo escrito (sin c, se queda igual; en muletillas y autocorrecciones, desaparece).
    // mark: la marca de corrector. caret = signo de inserción con el carácter que falta.
    const LINES = [
      [{ r: "eh", t: "fill", mark: "oval", note: "muletilla" }, { r: "ya", c: "Ya" }, "quedó", "la", "presentación", "para", "el",
        { r: "cliente", c: "cliente.", t: "punct", mark: "caret", note: "." }],
      [{ r: "se", c: "Se" }, "la", "mando", "el", { r: "martes no mejor el", t: "fix", mark: "strike", note: "autocorrección" }, { r: "jueves", t: "fix" },
        "a", "las", { r: "diez", c: "10:00.", t: "punct", mark: "under", note: "10:00" }],
      [{ r: "o sea", t: "fill", mark: "oval", note: "muletilla" }, { r: "le", c: "Le" }, "pido", "a", { r: "jimena", c: "Ximena", t: "dict", mark: "wave", note: "Ximena" },
        "que", "cheque", "los", { r: "números", c: "números.", t: "punct", mark: "caret", note: "." }],
      [{ r: "y", c: "Y" }, "si", "puedes", { r: "este", t: "fill", mark: "oval", note: "muletilla" }, "mándamela", { r: "antes", c: "antes,", t: "punct", mark: "caret", note: "," },
        { r: "por favor", c: "por favor.", t: "punct", mark: "caret", note: "." }],
    ];
    const STATIC_LINE = 1;

    let reduce = reduceMQ.matches, paused = false, visible = false, gen = 0;

    // Todo se mueve con Web Animations: así pausar es pausar las animaciones del escenario, esperas incluidas.
    const anim = (el, kf, o) => el.animate(kf, { fill: "both", easing: "cubic-bezier(.2,.8,.2,1)", ...o });
    const sleep = (ms) => clock.animate({ opacity: [0, 0] }, { duration: ms }).finished.catch(() => {});
    // Web Animations no resuelve bien var() en todos los navegadores: se pasa el color ya calculado.
    const rgb = (el, v) => { const p = document.createElement("i"); p.style.color = v; el.append(p); const c = getComputedStyle(p).color; p.remove(); return c; };
    const halted = () => paused || !visible;
    function applyHalt() {
      for (const a of stage.getAnimations({ subtree: true })) {
        if (halted() && a.playState === "running") a.pause();
        else if (!halted() && a.playState === "paused") a.play();
      }
    }

    function build(spec) {
      lineEl.replaceChildren(); marksEl.replaceChildren(); notesEl.replaceChildren();
      lineEl.classList.remove("heard");
      lineEl.getAnimations().forEach((a) => a.cancel());
      return spec.map((raw, i) => {
        const tk = typeof raw === "string" ? { r: raw } : { ...raw };
        tk.c ??= tk.t === "fill" || (tk.t === "fix" && tk.mark) ? "" : tk.r;
        const sp = i < spec.length - 1 ? " " : "";
        const el = document.createElement("span");
        el.className = "tk";
        if (tk.t) el.dataset.t = tk.t;
        el.innerHTML = '<span class="r"><span class="core"></span></span><span class="c"></span>';
        $(".core", el).textContent = tk.r;
        $(".r", el).append(sp);
        $(".c", el).textContent = tk.c ? tk.c + sp : "";
        lineEl.append(el);
        return { ...tk, el, rEl: $(".r", el), cEl: $(".c", el), core: $(".core", el) };
      });
    }

    // Marcas de corrector en línea doble, como el resto de la página.
    const pts = (list) => "M" + list.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");
    function shape(mark, b) {
      const { x, y, w, h } = b;
      if (mark === "oval") {
        const cx = x + w / 2, cy = y + h * .55, rx = w / 2 + 9, ry = h * .5 + 2, out = [];
        for (let i = 0; i <= 72; i++) { const a = -Math.PI / 2 + (i / 72) * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
        return pts(out);
      }
      if (mark === "strike") return pts([[x - 4, y + h * .62], [x + w + 4, y + h * .5]]);
      if (mark === "under") return pts([[x - 2, y + h * .95], [x + w + 3, y + h * .95]]);
      if (mark === "wave") {
        const out = [];
        for (let px = 0; px <= w + 4; px += 2) out.push([x - 2 + px, y + h * .98 + Math.sin(px / 3.4) * 2.6]);
        return pts(out);
      }
      // caret: la «v» invertida bajo el renglón, justo donde falta el signo
      const cx = x + w + 2, by = y + h * .98;
      return pts([[cx - 8, by + 10], [cx, by - 2], [cx + 8, by + 10]]);
    }

    function boxOf(t) {
      const s = stage.getBoundingClientRect(), r = t.core.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }

    function markUp(t, instant) {
      const b = boxOf(t), d = shape(t.mark, b);
      const paths = ["mk-o", "mk-i"].map((cls) => {
        const p = document.createElementNS(NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("pathLength", "1");
        p.setAttribute("class", cls);
        p.style.strokeDasharray = "1";
        marksEl.append(p);
        return p;
      });
      const note = document.createElement("span");
      note.className = "gl-note" + (t.mark === "caret" ? (t.note === "." ? " big dot" : " big") : "");
      note.dataset.t = t.t;
      note.textContent = t.note;
      const caret = t.mark === "caret";
      note.style.left = `${caret ? b.x + b.w + 2 : b.x + b.w / 2}px`;
      note.style.top = `${caret ? b.y + 4 : b.y - (t.mark === "oval" ? 4 : 8)}px`;
      notesEl.append(note);
      if (instant) { paths.forEach((p) => (p.style.strokeDashoffset = "0")); return; }
      const dur = t.mark === "oval" ? 620 : t.mark === "caret" ? 280 : 480;
      paths.forEach((p) => anim(p, { strokeDashoffset: [1, 0] }, { duration: dur, easing: "cubic-bezier(.45,.05,.3,1)" }));
      anim(note, { opacity: [0, 1], translate: ["0 6px", "0 0"] }, { duration: 360, delay: dur * .55 });
      return dur;
    }

    // Una frase completa: voz → corrección → en limpio.
    async function run(spec, my) {
      const toks = build(spec);
      const live = () => my === gen;

      // 1. Voz: cada palabra llega en líneas, al ritmo de quien habla.
      pill.classList.remove("quiet", "polishing");
      let at = 0;
      for (const t of toks) {
        anim(t.rEl, { opacity: [0, 1], transform: ["translateY(12px) scale(1.12)", "none"] }, { duration: 520, delay: at });
        at += 110 + t.r.length * 38 + (t.t === "fill" ? 160 : 0);
      }
      await sleep(at + 500); if (!live()) return;

      // 2. Corrección: la voz se asienta en gris y aparecen las marcas, una a la vez.
      pill.classList.add("polishing");
      lineEl.classList.add("heard");
      await sleep(450); if (!live()) return;
      for (const t of toks) {
        if (!t.mark) continue;
        const d = markUp(t);
        await sleep(d + 420); if (!live()) return;
      }
      await sleep(600); if (!live()) return;

      // 3. En limpio: se van las marcas, se cierra el hueco y cada palabra pasa a tinta, de izquierda a derecha.
      for (const el of [...marksEl.children, ...notesEl.children]) anim(el, { opacity: [1, 0] }, { duration: 260 });
      const widths = toks.map((t) => [t.el.getBoundingClientRect().width, t.cEl.getBoundingClientRect().width]);
      toks.forEach((t, i) => {
        const delay = i * 55, gone = !t.c;
        anim(t.el, { width: [`${widths[i][0]}px`, `${widths[i][1]}px`] }, { duration: 620, delay: gone ? 120 : delay + 80 });
        anim(t.rEl, { opacity: [1, 0], filter: ["blur(0)", "blur(5px)"] }, { duration: gone ? 220 : 300, delay: gone ? 0 : delay });
        if (gone) return;
        const changed = t.t && t.c !== t.r || t.t === "fix";
        const ink = rgb(t.el, "var(--ink)"), c = changed ? rgb(t.el, "var(--c)") : ink;
        anim(t.cEl, { opacity: [0, 1], filter: ["blur(5px)", "blur(0)"], translate: ["0 5px", "0 0"] }, { duration: 420, delay: delay + 120 });
        anim(t.cEl, { color: [c, c, ink] }, { duration: 2600, delay: delay + 120, easing: "linear" });
      });
      pill.classList.remove("polishing");
      pill.classList.add("quiet");
      await sleep(toks.length * 55 + 2900); if (!live()) return;

      // 4. La frase limpia se aparta para la siguiente.
      await anim(lineEl, { opacity: [1, 0], translate: ["0 0", "0 -16px"] }, { duration: 500, fill: "none" }).finished.catch(() => {});
      if (!live()) return;
      lineEl.style.opacity = "0";
    }

    async function loop(start) {
      const my = ++gen;
      for (let i = start; ; i = (i + 1) % LINES.length) {
        lineIdx = i;
        lineEl.style.opacity = "";
        await run(LINES[i], my);
        if (my !== gen) return;
        await sleep(350);
        if (my !== gen) return;
      }
    }

    // Con movimiento reducido queda fija la frase más ilustrativa, ya marcada.
    function still() {
      gen++;
      stage.getAnimations({ subtree: true }).forEach((a) => a.cancel());
      lineEl.style.opacity = "";
      pill.classList.add("quiet");
      pill.classList.remove("polishing");
      const toks = build(LINES[STATIC_LINE]);
      lineEl.classList.add("heard");
      for (const t of toks) if (t.mark) markUp(t, true);
    }

    let lineIdx = 0;
    function start(i = 0) {
      lineIdx = i;
      if (reduce) return still();
      stage.getAnimations({ subtree: true }).filter((a) => !(a instanceof CSSAnimation)).forEach((a) => a.cancel());
      loop(i);
      applyHalt();
    }

    function setPaused(p) {
      paused = p;
      pauseBtn.setAttribute("aria-pressed", String(p));
      pauseLabel.textContent = p ? "Reanudar" : "Pausar";
      applyHalt();
    }
    pauseBtn.addEventListener("click", () => setPaused(!paused));
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; applyHalt(); }).observe(stage);
    reduceMQ.addEventListener("change", () => { reduce = reduceMQ.matches; pauseBtn.hidden = reduce; start(lineIdx); });
    pauseBtn.hidden = reduce;
    addEventListener("resize", () => reduce && still());

    // La píldora de la galera: escucha, pule (cresta que recorre) y vuelve a reposo.
    const pillLines = voiceLines($("svg", pill), 4);
    let pillLvl = 0;
    (function pillLoop(now) {
      requestAnimationFrame(pillLoop);
      if (reduce) { if (pillLvl) pillLines(0, pillLvl = 0, false); return; }
      if (halted()) return;
      const quiet = pill.classList.contains("quiet"), polishing = pill.classList.contains("polishing");
      if (quiet && !pillLvl) return;
      const target = quiet ? 0 : polishing ? .5 : .6 + .35 * Math.sin(now / 140) * Math.sin(now / 330);
      pillLvl += (target - pillLvl) * .15;
      if (quiet && pillLvl < .004) pillLvl = 0;
      pillLines(now, pillLvl, polishing);
    })(0);

    document.fonts.ready.then(() => start(0));
  }
})();
