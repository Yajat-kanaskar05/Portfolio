/* Easter eggs and showpieces: neofetch, sudo hire-me, matrix.
   Registers commands through window.TERM (see the end of terminal.js). */
(() => {
  if (!window.TERM) return;
  const { commands, aliases, D, still, line, print, gap, txt, el, cmdBtn, anchor, run, curTheme, focusInput, wait } = window.TERM;

  /* ---------- neofetch ---------- */
  const Y = [String.raw`__   __`, String.raw`\ \ / /`, String.raw` \ V / `, String.raw`  | |  `, String.raw`  |_|  `];
  const K = [String.raw` _  __`, String.raw`| |/ /`, String.raw`| ' / `, String.raw`|  <  `, String.raw`|_|\_\ `.trimEnd()];
  const LOGO = Y.map((r, i) => r + "  " + K[i]).join("\n");

  commands.neofetch = {
    desc: "system info, portfolio edition",
    run() {
      const logo = el("pre", "nf-logo", LOGO);
      logo.setAttribute("aria-hidden", "true");
      const info = el("div", "nf-info");
      const who = el("div", "nf-title");
      who.append(txt("visitor", "ok"), txt("@"), txt("yajat", "hl"));
      info.append(who, el("div", "dim", "-------------"));

      const secs = Math.round(performance.now() / 1000);
      const rows = [
        ["OS", "portfolio-os v1.0"],
        ["Host", D.location],
        ["Role", D.role],
        ...(D.availability ? [["Status", D.availability]] : []),
        ["Shell", "terminal.js (vanilla JS)"],
        ...Object.entries(D.skills),
        ["Projects", `${D.projects.length} shipped`],
        ["Theme", curTheme()],
        ["Uptime", `${Math.floor(secs / 60)}m ${secs % 60}s`],
        ["Contact", D.email]
      ];
      rows.forEach(([k, v]) => {
        const r = el("div", "row");
        r.append(txt(k, "k"), txt(": " + v));
        info.append(r);
      });
      const pal = el("div", "row nf-pal");
      ["red", "yellow", "green", "cyan", "purple", "pink", "ink", "muted"].forEach((c) => {
        const sw = el("span", "sw"); sw.style.background = `var(--${c})`; pal.append(sw);
      });
      info.append(pal);
      line([logo, info], "nf");
    }
  };
  aliases.fetch = "neofetch"; aliases.specs = "neofetch";

  /* ---------- sudo hire-me ---------- */
  function confetti() {
    if (still) return;
    const colors = ["#50fa7b", "#8be9fd", "#bd93f9", "#ff79c6", "#f1fa8c"];
    for (let i = 0; i < 34; i++) {
      const p = document.createElement("i");
      Object.assign(p.style, { position: "fixed", left: "50%", top: "55%", width: "8px", height: "12px", zIndex: 95,
        pointerEvents: "none", background: colors[i % colors.length], borderRadius: "2px" });
      document.body.append(p);
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 260;
      p.animate(
        [{ transform: "translate(-50%,-50%) rotate(0)", opacity: 1 },
         { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 140}px)) rotate(${Math.random() * 720}deg)`, opacity: 0 }],
        { duration: 1000 + Math.random() * 700, easing: "cubic-bezier(.2,.8,.3,1)" }
      ).onfinish = () => p.remove();
    }
  }

  async function hireMe() {
    const pw = el("span");
    line([txt("[sudo] password for visitor: "), pw]);
    for (let i = 1; i <= 7; i++) { pw.textContent = "*".repeat(i); await wait(90); }
    await wait(250);
    print("Authentication successful.", "ok");
    for (const m of ["Checking references... OK", "Running background check... clean", "Compiling offer letter... done"]) {
      await wait(380);
      line([txt("\u2714 ", "ok"), txt(m)]);
    }
    await wait(450);
    gap();
    print("Access granted.", "ok");
    if (D.availability) print(D.availability + ".");
    line([txt("Next: "), anchor(D.email, `mailto:${D.email}`, false), txt("  "), cmdBtn("resume", "resume"), txt("  "), cmdBtn("contact", "contact")]);
    confetti();
  }

  commands.sudo = {
    hidden: true, desc: "run a command as superuser",
    run(args) {
      const cmd = args.join(" ").trim().toLowerCase();
      if (!cmd) return print("usage: sudo <command>", "dim");
      if (cmd === "hire-me" || cmd === "hire me") return hireMe();
      if (/^rm\s/.test(cmd)) return print("Nice try. Everything here is read-only, and I have backups.", "err");
      print("visitor is not in the sudoers file. This incident will be reported.", "err");
    }
  };
  commands["hire-me"] = { hidden: true, desc: "", run() { print("hire-me: permission denied. Maybe try sudo?", "err"); } };

  /* ---------- matrix ---------- */
  let matrixOn = false;
  commands.matrix = {
    hidden: true, desc: "wake up",
    run() {
      if (still) return print("matrix: skipped because reduced motion is on.", "dim");
      if (matrixOn) return;
      const c = document.createElement("canvas");
      const ctx = c.getContext && c.getContext("2d");
      if (!ctx) return print("matrix: canvas isn't available here.", "err");
      matrixOn = true;
      print("Wake up, visitor...", "ok");
      c.className = "matrix"; c.setAttribute("aria-hidden", "true");
      const hint = el("div", "matrix-hint", "Press any key or tap to exit");
      document.body.append(c, hint);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = innerWidth, h = innerHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const size = 16, glyphs = [..."\uFF71\uFF72\uFF73\uFF74\uFF75\uFF76\uFF77\uFF78\uFF79\uFF7A\uFF7B\uFF7C\uFF7D0123456789{}<>/=+*#"];
      const drops = Array.from({ length: Math.ceil(w / size) }, () => Math.random() * -40);
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
      ctx.font = `${size}px ${getComputedStyle(document.body).fontFamily}`;

      let raf = 0, last = 0, timer = 0;
      const frame = (t) => {
        if (t - last > 45) {
          last = t;
          ctx.fillStyle = "rgba(0,8,0,.12)"; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#50fa7b";
          drops.forEach((y, i) => {
            ctx.fillText(glyphs[(Math.random() * glyphs.length) | 0], i * size, y * size);
            drops[i] = y * size > h && Math.random() > 0.975 ? 0 : y + 1;
          });
        }
        raf = requestAnimationFrame(frame);
      };
      const end = (e) => {
        if (!matrixOn) return;
        matrixOn = false;
        if (e && e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
        cancelAnimationFrame(raf); clearTimeout(timer);
        removeEventListener("keydown", end, true); removeEventListener("pointerdown", end, true); removeEventListener("resize", end);
        hint.remove(); c.classList.add("out");
        setTimeout(() => { c.remove(); print("Welcome back.", "dim"); focusInput(); }, 400);
      };
      raf = requestAnimationFrame(frame);
      timer = setTimeout(end, 8000);
      setTimeout(() => {                           // short grace period so the Enter that ran the command doesn't exit it
        addEventListener("keydown", end, true); addEventListener("pointerdown", end, true); addEventListener("resize", end);
      }, 350);
    }
  };
})();
