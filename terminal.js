(() => {
  const D = window.DATA;
  const $ = (id) => document.getElementById(id);
  const out = $("out"), screen = $("screen"), form = $("prompt"), input = $("cmd"), skipBtn = $("skip");
  const win = $("win"), winBar = $("win-bar"), winTitle = $("win-title"), winBody = $("win-body"), winClose = $("win-close");
  const term = document.querySelector(".term"), dock = $("dock"), chipsEl = $("chips");
  const PS1 = "visitor@yajat:~$";
  const CAT = { fullstack: "Full-Stack", aiml: "AI/ML" };
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let skipped = still;

  /* Theme: saved choice, else system preference */
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  document.documentElement.dataset.theme =
    saved || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

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
    if (newTab) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }
  function cmdBtn(label, command) {                 // tappable command
    const b = el("button", "cmd-link", label);
    b.type = "button";
    b.addEventListener("click", () => run(command));
    return b;
  }
  function echo(raw) {
    line([txt(PS1, "ps1"), document.createTextNode(raw)], "echo");
  }

  /* ---------- Project window ---------- */
  function openProject(p) {
    winTitle.textContent = p.name;
    winBody.textContent = "";
    const shot = el("div", "shot");
    shot.dataset.title = p.name;
    const img = el("img");
    img.src = p.img; img.alt = `Screenshot of ${p.name}`; img.loading = "lazy";
    img.onerror = () => img.remove();                // gradient + name show instead
    shot.append(el("span", "badge", CAT[p.cat] || p.cat), img);
    const tags = el("div", "tags");
    p.stack.forEach((s) => tags.append(el("span", null, s)));
    const links = el("div", "links");
    if (p.live) links.append(anchor("Live site", p.live));
    links.append(anchor("Source code", p.repo));
    winBody.append(shot, el("p", null, p.desc), tags, links);
    win.style.cssText = "";                          // reset any dragged position
    win.hidden = false;
    win.focus();
  }
  function closeProject() { win.hidden = true; focusInput(); }
  winClose.addEventListener("click", closeProject);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !win.hidden) closeProject(); });

  /* Drag the window (desktop only; mobile uses a bottom sheet) */
  let drag = null;
  winBar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || !wide.matches) return;
    const r = win.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    winBar.setPointerCapture(e.pointerId);
  });
  winBar.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const x = Math.min(Math.max(0, e.clientX - drag.dx), innerWidth - win.offsetWidth);
    const y = Math.min(Math.max(0, e.clientY - drag.dy), innerHeight - 60);
    Object.assign(win.style, { left: x + "px", top: y + "px", transform: "none" });
  });
  winBar.addEventListener("pointerup", () => { drag = null; });

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
        Object.keys(commands).forEach((name) =>
          line([txt("  "), cmdBtn(name, name), txt(" ".repeat(Math.max(1, 11 - name.length)) + commands[name].desc)]));
        gap();
        print("Tip: Tab autocompletes, Up/Down recalls history.", "dim");
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
                txt(" ".repeat(Math.max(2, 12 - p.id.length)) + p.name + "  "), txt(`[${CAT[p.cat] || p.cat}]`, "dim")]);
          line([txt(p.desc, "dim")], "indent");
        });
        gap();
        line([txt("Tap a project, or type: "), txt("open <name>", "cmd")]);
      }
    },
    open: {
      desc: "open a project: open <name or number>",
      run(args) {
        const p = findProject(args.join(" "));
        if (!p) {
          print(args.length ? `No project matches '${args.join(" ")}'.` : "Usage: open <name or number>", "err");
          return line([txt("Try: "), ...D.projects.flatMap((x, i) => [i ? txt(", ") : "", cmdBtn(x.id, `open ${x.id}`)])]);
        }
        print(`Opening ${p.name}...`, "dim");
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
                    skill: "skills", me: "about", info: "about", "?": "help", man: "help", cls: "clear", dir: "ls" };

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

    const names = Object.keys(commands);
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
    if (parts.length === 1) pool = Object.keys(commands);
    else if (parts[0].toLowerCase() === "open" && parts.length === 2) pool = D.projects.map((p) => p.id);
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
    placePrompt();
    form.hidden = false;
    focusInput();
  }

  const skip = () => { skipped = true; };
  skipBtn.addEventListener("click", skip);
  addEventListener("keydown", () => { if (form.hidden) skip(); });

  boot();
})();
