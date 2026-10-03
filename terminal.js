(() => {
  const D = window.DATA;
  const $ = (id) => document.getElementById(id);
  const out = $("out"), screen = $("screen"), form = $("prompt"), input = $("cmd"), skipBtn = $("skip");
  const scrim = $("scrim");
  const term = document.querySelector(".term"), dock = $("dock"), chipsEl = $("chips");
  const PS1 = "visitor@yajat:~$";
  const sr = $("sr");                              // screen-reader announcements (visually hidden)
  const announce = (m) => { sr.textContent = ""; setTimeout(() => { sr.textContent = m; }, 60); };
  const CAT = { fullstack: "Full-Stack", aiml: "AI/ML" };
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let skipped = still;

  /* Theme: saved choice, else system preference */
  const root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

  const curTheme = () => root.dataset.theme;
  function syncThemeBtns() {                       // every [data-theme-btn] shows the theme you'd switch TO
    const dark = curTheme() === "dark";
    document.querySelectorAll("[data-theme-btn]").forEach((b) => {
      b.textContent = (dark ? "\u2600\uFE0E" : "\u263E\uFE0E") + (b.dataset.long ? (dark ? " Light" : " Dark") : "");
      b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      b.title = dark ? "Light theme" : "Dark theme";
    });
  }
  function setTheme(t) {
    root.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch (e) {}
    syncThemeBtns();
    announce(`${t} theme`);
  }

  /* ---------- Viewport: phone vs desktop ---------- */
  const wide = matchMedia("(min-width:40.01rem)");
  const mobile = matchMedia("(max-width:40rem)");
  // On phones, auto-focusing the input pops the keyboard over the content, so only focus on desktop.
  const focusInput = () => { if (wide.matches) input.focus({ preventScroll: true }); };

  /* ---------- DOM helpers ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, skipped ? 0 : ms));
  const toBottom = () => { screen.scrollTop = screen.scrollHeight; };
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const txt = (t, cls) => (cls ? el("span", cls, t) : document.createTextNode(t));

  function line(nodes, cls = "") {                  // build a line from nodes/strings (safe)
    const d = el("div", "line " + cls);
    d.append(...[].concat(nodes));
    out.appendChild(d); toBottom();
    return d;
  }
  const print = (t = "", cls = "") => line(document.createTextNode(t), cls);
  function printHTML(html, cls = "") {              // trusted strings only (your own data)
    const d = el("div", "line " + cls);
    d.innerHTML = html;
    out.appendChild(d); toBottom();
    return d;
  }
  const gap = () => print("", "gap");

  function anchor(label, href, newTab = true) {
    const a = el("a", null, label);
    a.href = href;
    if (newTab) { a.target = "_blank"; a.rel = "noopener"; a.append(el("span", "sr-only", " (opens in new tab)")); }
    return a;
  }
  function cmdBtn(label, command, extra = "") {     // tappable, highlighted command
    const b = el("button", "cmd-link" + (extra ? " " + extra : ""), label);
    b.type = "button";
    b.addEventListener("click", () => run(command));
    return b;
  }
  function echo(raw) {
    line([txt(PS1, "ps1"), document.createTextNode(raw)], "echo");
  }

  /* ---------- Project windows (several at once, terminal stays usable) ---------- */
  const wins = new Map();                          // project id -> { id, el, closing, timer }
  let zTop = 30;
  const live = () => [...wins.values()].filter((w) => !w.closing);
  const syncScrim = () => { scrim.hidden = !live().length; };
  const raise = (rec) => { rec.el.style.zIndex = ++zTop; };

  function openProject(p) {
    const old = wins.get(p.id);
    if (old && !old.closing) {                     // already open: bring it to the front
      raise(old);
      if (!still) old.el.animate(
        [{ boxShadow: "0 0 0 0 var(--cyan)" }, { boxShadow: "0 0 0 .8rem transparent" }],
        { duration: 450, easing: "ease-out" });
      focusInput();
      return;
    }
    if (old) { clearTimeout(old.timer); old.el.remove(); wins.delete(p.id); }   // was mid-close

    const w = el("div", "win");
    w.setAttribute("role", "dialog");
    w.setAttribute("aria-labelledby", `win-title-${p.id}`);
    w.tabIndex = -1;

    const bar = el("div", "win-bar");
    const title = el("span", null, p.name); title.id = `win-title-${p.id}`;
    const x = el("button", null, "\u00d7"); x.type = "button";
    x.setAttribute("aria-label", `Close ${p.name}`);
    bar.append(title, x);

    const body = el("div", "win-body");
    const shot = el("div", "shot");
    shot.dataset.title = p.name;
    const img = el("img");
    img.src = p.img; img.alt = `Screenshot of ${p.name}`; img.loading = "lazy";
    img.onerror = () => img.remove();              // gradient + name show instead
    shot.append(el("span", "badge", CAT[p.cat] || p.cat), img);
    const tags = el("div", "tags");
    p.stack.forEach((s, i) => { const t = el("span", null, s); t.style.setProperty("--i", i); tags.append(t); });
    const links = el("div", "links");
    [p.live && ["Live site", p.live], ["Source code", p.repo]].filter(Boolean).forEach(([label, href], i) => {
      const a = anchor(label, href); a.style.setProperty("--i", i); links.append(a);
    });
    // --i drives the staggered entrance in CSS
    [shot, el("p", null, p.desc), tags, links].forEach((n, i) => { n.style.setProperty("--i", i); body.append(n); });
    w.append(bar, body);

    const rec = { id: p.id, name: p.name, opener: document.activeElement, el: w, closing: false, timer: 0 };
    wins.set(p.id, rec);
    document.body.append(w);

    // Cascade each new window so they never sit exactly on top of each other
    const off = ((live().length - 1) % 6) * 28;
    const ww = w.offsetWidth;
    const left = Math.min(Math.max(8, (innerWidth - ww) / 2 + off - 70), Math.max(8, innerWidth - ww - 8));
    const top = Math.min(Math.max(8, innerHeight * 0.1 + off), Math.max(8, innerHeight - 140));
    w.style.left = left + "px"; w.style.top = top + "px";
    raise(rec);
    syncScrim();
    announce(`${p.name} project window opened. Press Escape to close it.`);

    x.addEventListener("click", () => closeWin(rec));
    w.addEventListener("pointerdown", () => raise(rec), true);   // click anywhere = to front

    // Drag by the title bar (mouse and touch)
    let drag = null;
    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button")) return;
      const r = w.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      bar.setPointerCapture(e.pointerId);
    });
    bar.addEventListener("pointermove", (e) => {
      if (!drag) return;
      w.style.left = Math.min(Math.max(0, e.clientX - drag.dx), Math.max(0, innerWidth - w.offsetWidth)) + "px";
      w.style.top = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - 60) + "px";
    });
    const endDrag = () => { drag = null; };
    bar.addEventListener("pointerup", endDrag);
    bar.addEventListener("pointercancel", endDrag);

    focusInput();                                  // keep typing in the terminal
  }

  function closeWin(rec) {
    if (rec.closing) return;
    rec.closing = true;
    syncScrim();
    const done = () => {
      rec.el.remove(); wins.delete(rec.id);
      const o = rec.opener;                        // give focus back to whatever opened the window
      if (o && o !== document.body && o.isConnected) o.focus({ preventScroll: true }); else focusInput();
      announce(`${rec.name} closed.`);
    };
    if (still) return done();
    rec.el.classList.add("closing");
    rec.timer = setTimeout(done, 190);
  }

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {                      // close only the topmost window
      const top = live().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
      if (top) closeWin(top);
      return;
    }
    // If focus ended up on a popup/page after clicking it, typing goes back to the terminal
    if (!wide.matches || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || form.hidden || root.dataset.view === "simple") return;
    const a = document.activeElement;
    if (a === document.body || (a && a.closest && a.closest(".win"))) input.focus({ preventScroll: true });
  });

  /* ---------- Projects lookup ---------- */
  function findProject(q) {
    q = q.toLowerCase().trim();
    if (!q) return null;
    if (/^\d+$/.test(q)) return D.projects[+q - 1] || null;
    return D.projects.find((p) => p.id === q || p.name.toLowerCase() === q) ||
           D.projects.find((p) => p.id.includes(q) || p.name.toLowerCase().includes(q)) || null;
  }

  /* ---------- Commands ---------- */
  const commands = {
    help: {
      desc: "list available commands",
      run() {
        print("Available commands (tap or type):", "dim");
        Object.keys(commands).filter((n) => !commands[n].hidden).forEach((name) =>
          line([txt("  "), cmdBtn(name, name, "col"), txt("  " + commands[name].desc)]));
        gap();
        print("Tip: Tab autocompletes, Up/Down recalls history.", "dim");
        print("There are a few hidden commands too. Good luck.", "dim");
      }
    },
    about: {
      desc: "who I am",
      run() { D.bio.forEach((b) => { print(b); gap(); }); }
    },
    skills: {
      desc: "my tech stack",
      run() {
        Object.entries(D.skills).forEach(([k, v]) =>
          line([txt(k.padEnd(10), "hl"), txt(v)]));
      }
    },
    projects: {
      desc: "list projects (try: projects aiml)",
      run(args) {
        const f = (args[0] || "").toLowerCase();
        const list = D.projects.map((p, i) => ({ p, i })).filter(({ p }) => !f || p.cat === f);
        if (!list.length) return print(`No projects in '${f}'. Try: ${Object.keys(CAT).join(", ")}`, "err");
        list.forEach(({ p, i }) => {
          line([txt(`${i + 1}. `, "dim"), cmdBtn(p.id, `open ${p.id}`),
                txt("  " + (p.tagline || p.name) + "  "), txt(`[${CAT[p.cat] || p.cat}]`, "dim")]);
          line([txt(p.desc, "dim")], "indent");
        });
        gap();
        line([txt("Tap a project, or type: "), txt("open <name>", "cmd")]);
      }
    },
    open: {
      desc: "open a project: open <name or number>",
      async run(args) {
        const p = findProject(args.join(" "));
        if (!p) {
          print(args.length ? `No project matches '${args.join(" ")}'.` : "Usage: open <name or number>", "err");
          return line([txt("Try: "), ...D.projects.flatMap((x, i) => [i ? txt(", ") : "", cmdBtn(x.id, `open ${x.id}`)])]);
        }
        const bar = el("span", "ok");
        line([txt(`Opening ${p.name} `, "dim"), bar]);
        const N = 12;
        for (let i = 0; i <= N; i++) {
          bar.textContent = `[${"█".repeat(i)}${"░".repeat(N - i)}]`;
          if (!still) await new Promise((r) => setTimeout(r, 28));
        }
        openProject(p);
      }
    },
    contact: {
      desc: "email and social links",
      run() {
        line([txt("email".padEnd(10), "hl"), anchor(D.email, `mailto:${D.email}`, false)]);
        line([txt("github".padEnd(10), "hl"), anchor(D.links.github.replace("https://", ""), D.links.github)]);
        line([txt("linkedin".padEnd(10), "hl"), anchor("linkedin.com/in/yajat-kanaskar", D.links.linkedin)]);
      }
    },
    resume: {
      desc: "open my resume (PDF)",
      run() {
        line([txt("Opening resume... "), anchor("Open it manually", D.resume)]);
        window.open(D.resume, "_blank", "noopener");
      }
    },
    ls: {
      desc: "list what's here",
      run(args) {
        if ((args[0] || "").replace("/", "") === "projects") return commands.projects.run([]);
        const items = ["about", "skills", "projects", "contact", "resume"];
        line(items.flatMap((n) => [cmdBtn(n, n), txt("   ")]));
      }
    },
    theme: {
      desc: "switch theme: theme dark|light",
      run(args) {
        const a = (args[0] || "").toLowerCase();
        if (a === "dark" || a === "light") { setTheme(a); return line([txt("Theme set to "), txt(a, "hl"), txt(".")]); }
        if (a) return print(`Unknown theme '${args[0]}'. Options: dark, light.`, "err");
        line([txt("Current theme: "), txt(curTheme(), "hl")]);
        line([txt("Switch to: "), cmdBtn("theme dark", "theme dark"), txt(" "), cmdBtn("theme light", "theme light")]);
      }
    },
    simple: {
      desc: "switch to the plain page view",
      run() { print("Switching to simple view...", "dim"); setTimeout(() => setView("simple"), 250); }
    },
    exit: {
      desc: "back to the home page",
      run() { print("logout", "dim"); setTimeout(goHome, 250); }
    },
    whoami: {
      desc: "who are you?",
      run() { print("visitor. Thanks for stopping by."); }
    },
    history: {
      desc: "commands you've run",
      run() { hist.forEach((h, i) => print(`${String(i + 1).padStart(3)}  ${h}`, "dim")); }
    },
    clear: {
      desc: "clear the screen",
      run() { out.textContent = ""; }
    }
  };

  const aliases = { work: "projects", project: "projects", hire: "contact", email: "contact", cv: "resume",
                    skill: "skills", me: "about", info: "about", "?": "help", man: "help", cls: "clear", dir: "ls",
                    plain: "simple", mode: "theme", themes: "theme",
                    home: "exit", quit: "exit", back: "exit", logout: "exit" };

  function dist(a, b) {                              // Levenshtein, for "Did you mean...?"
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }

  const hist = [];
  let hi = 0;

  function run(raw) {
    echo(raw);
    if (!raw) return;
    if (hist[hist.length - 1] !== raw) hist.push(raw);
    hi = hist.length;
    const [name, ...args] = raw.split(/\s+/);
    let key = name.toLowerCase();
    if (Object.hasOwn(aliases, key)) key = aliases[key];
    if (Object.hasOwn(commands, key)) return commands[key].run(args);

    const names = Object.keys(commands).filter((n) => !commands[n].hidden);
    const best = names.map((n) => [n, n.startsWith(key) ? 0 : dist(key, n)]).sort((a, b) => a[1] - b[1])[0];
    if (best && best[1] <= 2) {
      line([txt(`command not found: ${name}. Did you mean `, "err"), cmdBtn(best[0], best[0]), txt("?", "err")]);
    } else {
      print(`command not found: ${name}. Type 'help' to see what's available.`, "err");
    }
  }

  /* ---------- Input: submit, history, Tab, Ctrl+L ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    input.value = "";
    run(raw);
  });
  screen.addEventListener("click", () => { if (!getSelection().toString()) focusInput(); });
  input.addEventListener("focus", () => setTimeout(toBottom, 300));   // keep the prompt visible above the keyboard

  function complete() {
    const parts = input.value.split(/\s+/);
    const last = parts[parts.length - 1].toLowerCase();
    let pool = [];
    if (parts.length === 1) pool = Object.keys(commands).filter((n) => !commands[n].hidden);
    else if (parts[0].toLowerCase() === "open" && parts.length === 2) pool = D.projects.map((p) => p.id);
    else if (parts[0].toLowerCase() === "theme" && parts.length === 2) pool = ["dark", "light"];
    const matches = pool.filter((n) => n.startsWith(last));
    if (!matches.length) return;
    let prefix = matches[0];
    matches.forEach((m) => { while (!m.startsWith(prefix)) prefix = prefix.slice(0, -1); });
    parts[parts.length - 1] = prefix;
    input.value = parts.join(" ") + (matches.length === 1 ? " " : "");
    if (matches.length > 1) { echo(input.value); print(matches.join("   "), "dim"); }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (hi > 0) hi--;
      input.value = hist[hi] || "";
      requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hi = Math.min(hi + 1, hist.length);
      input.value = hist[hi] || "";
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      commands.clear.run();
    }
  });

  /* ---------- Quick-command chips + mobile input bar ---------- */
  ["about", "projects", "skills", "resume", "contact", "help"].forEach((c) => {
    const b = el("button", "chip", c);
    b.type = "button";
    b.addEventListener("click", () => run(c));        // no input focus, so no keyboard on phones
    chipsEl.append(b);
  });

  function placePrompt() {                            // phones: input docked at the bottom
    (mobile.matches ? dock : screen).append(form);
    toBottom();
  }
  mobile.addEventListener("change", placePrompt);

  function syncHeight() {                             // shrink to the visible area when the keyboard opens
    if (mobile.matches && window.visualViewport) {
      term.style.height = visualViewport.height + "px";
      scrollTo(0, 0);
    } else term.style.height = "";
    toBottom();
  }
  if (window.visualViewport) visualViewport.addEventListener("resize", syncHeight);
  mobile.addEventListener("change", syncHeight);
  syncHeight();

  /* ---------- Boot sequence ---------- */
  function welcome() {
    printHTML(`<span class="hl">${D.name}</span> <span class="dim">/</span> ${D.role}`);
    print(D.location, "dim");
    gap();
    print(D.bio[0]);
    gap();
    line([txt("Try "), cmdBtn("projects", "projects"), txt(", "), cmdBtn("about", "about"), txt(" or "),
          cmdBtn("help", "help"), txt(".")]);
    gap();
  }

  async function boot() {
    skipBtn.hidden = false;
    for (const [state, msg] of D.boot) {
      printHTML(`<span class="${state}">[ OK ]</span> ${msg}`);
      await sleep(260);
    }
    await sleep(350);
    skipBtn.hidden = true;
    out.textContent = "";
    welcome();
    dock.hidden = false;
    const nudge = chipsEl.querySelector(".chip:nth-child(2)");   // "projects"
    if (nudge && !still) {
      nudge.classList.add("nudge");
      nudge.addEventListener("animationend", () => nudge.classList.remove("nudge"), { once: true });
    }
    placePrompt();
    form.hidden = false;
    focusInput();
  }

  const skip = () => { skipped = true; };
  skipBtn.addEventListener("click", skip);

  /* ---------- Opening page: button -> terminal zooms open, then boots ---------- */
  const hero = $("hero"), openBtn = $("open");
  let booting = false, opening = false;
  addEventListener("keydown", () => { if (booting && form.hidden) skip(); });

  $("h-name").textContent = D.name;
  $("h-role").textContent = D.role;
  if (D.tagline) $("h-tag").prepend(D.tagline);

  function launch() {
    if (opening || !term.classList.contains("pre")) return;   // already open (or opening)
    opening = true;
    const resume = booting;                        // opened before: pick up where the visitor left off
    booting = true;
    const done = () => {
      term.classList.remove("opening"); hero.hidden = true; opening = false;
      if (resume) { toBottom(); focusInput(); } else boot();
    };
    if (still) { term.classList.remove("pre"); done(); return; }   // reduced motion: swap instantly
    // Zoom out of the button: aim the animation's origin at it
    const t = term.getBoundingClientRect(), b = openBtn.getBoundingClientRect();
    term.style.setProperty("--ox", (b.left + b.width / 2 - t.left) + "px");
    term.style.setProperty("--oy", (b.top + b.height / 2 - t.top) + "px");
    hero.classList.add("leaving");
    term.classList.remove("pre");
    term.classList.add("opening");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true; term.removeEventListener("animationend", onEnd); done();
    };
    const onEnd = (e) => { if (e.target === term) finish(); };
    term.addEventListener("animationend", onEnd);
    setTimeout(finish, 1000);                      // safety net
  }

  /* ---------- Back to the home (opening) page, from the terminal or the simple view ---------- */
  function closeAllWindows() {
    wins.forEach((r) => { clearTimeout(r.timer); r.el.remove(); });
    wins.clear(); syncScrim();
  }
  function showHero() {
    hero.hidden = false; hero.classList.remove("leaving");
    term.classList.remove("opening", "closing-term"); term.classList.add("pre");
  }
  function goHome() {
    if (opening) return;
    closeAllWindows();
    if (root.dataset.view === "simple") {          // simple view -> home page (instant)
      setView("terminal");                         // also clears ?view=simple from the address bar
      showHero(); scrollTo(0, 0);
      openBtn.focus({ preventScroll: true });
      announce("Home page");
      return;
    }
    if (term.classList.contains("pre")) return;    // already home
    if (still) { showHero(); openBtn.focus({ preventScroll: true }); announce("Home page"); return; }
    opening = true;
    hero.hidden = false; hero.style.visibility = "hidden";        // measure the button before revealing the page
    hero.classList.remove("leaving");
    const t = term.getBoundingClientRect(), b = openBtn.getBoundingClientRect();
    term.style.setProperty("--ox", (b.left + b.width / 2 - t.left) + "px");
    term.style.setProperty("--oy", (b.top + b.height / 2 - t.top) + "px");
    term.classList.add("closing-term");            // the terminal shrinks back into the button...
    setTimeout(() => { hero.style.visibility = ""; }, 180);        // ...while the home page fades in
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true; term.removeEventListener("animationend", onEnd);
      hero.style.visibility = "";
      term.classList.remove("closing-term"); term.classList.add("pre");
      opening = false;
      openBtn.focus({ preventScroll: true });
      announce("Home page");
    };
    const onEnd = (e) => { if (e.target === term) finish(); };
    term.addEventListener("animationend", onEnd);
    setTimeout(finish, 700);                       // safety net
  }
  $("home-btn").addEventListener("click", goHome);
  openBtn.addEventListener("click", launch);

  /* ---------- Simple view: the same content as a plain, scannable page ---------- */
  window.renderSimple($("simple"), D, CAT);
  syncThemeBtns();

  function setView(v, byUser = true) {
    const simple = v === "simple";
    if (simple) {                                  // drop any open project windows
      wins.forEach((r) => { clearTimeout(r.timer); r.el.remove(); });
      wins.clear(); syncScrim();
    }
    root.dataset.view = simple ? "simple" : "terminal";
    document.dispatchEvent(new CustomEvent("viewchange", { detail: root.dataset.view }));
    if (byUser) announce(simple ? "Simple view" : "Terminal view");
    if (!byUser) return;
    try {                                          // keep the address bar shareable: ?view=simple
      const u = new URL(location.href);
      if (simple) u.searchParams.set("view", "simple"); else u.searchParams.delete("view");
      history.replaceState(null, "", u);
    } catch (e) {}
    if (simple) { scrollTo(0, 0); $("s-main").focus({ preventScroll: true }); }
    else if (booting) focusInput();
    else openBtn.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-theme-btn]")) setTheme(curTheme() === "dark" ? "light" : "dark");
    else if (e.target.closest('[data-act="terminal"]')) { setView("terminal"); launch(); }
    else if (e.target.closest('[data-act="home"]')) goHome();
  });
  $("simple-btn").addEventListener("click", () => setView("simple"));
  $("h-simple").addEventListener("click", () => setView("simple"));

  if (root.dataset.view !== "simple") openBtn.focus({ preventScroll: true });

  /* Small API so extras.js can register commands without touching this file */
  window.TERM = { commands, aliases, D, still, line, print, gap, txt, el, cmdBtn, anchor, run, curTheme, focusInput,
                  wait: (ms) => new Promise((r) => setTimeout(r, still ? 0 : ms)) };
})();
