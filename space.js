/* Starry outer-space background: twinkling stars, slow drift, rare shooting star. */
(() => {
  const c = document.getElementById("space");
  if (!c) return;
  const ctx = c.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORS = ["#ffffff", "#cfe3ff", "#ffe9c4", "#e3d4ff"];
  let w = 0, h = 0, stars = [], shoot = null, nextShoot = 0, last = 0, raf = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(280, Math.max(90, (w * h) / 6500)));
    stars = Array.from({ length: n }, () => {
      const z = Math.random() ** 2;                 // most stars are small and faint
      return {
        x: Math.random() * w, y: Math.random() * h,
        r: 0.35 + z * 1.5, base: 0.35 + z * 0.6,
        tw: 0.6 + Math.random() * 1.8, ph: Math.random() * 6.28,
        vx: 1.5 + z * 7,                            // px per second, bigger = closer = faster
        col: COLORS[(Math.random() * COLORS.length) | 0]
      };
    });
    draw(performance.now());
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    const s = t / 1000;
    for (const st of stars) {
      const a = st.base * (still ? 0.85 : 0.68 + 0.32 * Math.sin(s * st.tw + st.ph));
      ctx.fillStyle = st.col;
      if (st.r > 1.2) {                             // soft halo on the brightest stars
        ctx.globalAlpha = a * 0.18;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r * 3.2, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (shoot) {
      const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.dx * 120, shoot.y - shoot.dy * 120);
      g.addColorStop(0, `rgba(255,255,255,${shoot.a})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(shoot.x, shoot.y);
      ctx.lineTo(shoot.x - shoot.dx * 120, shoot.y - shoot.dy * 120);
      ctx.stroke();
    }
  }

  function tick(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    for (const st of stars) {
      st.x += st.vx * dt;
      if (st.x > w + 4) { st.x = -4; st.y = Math.random() * h; }
    }
    if (shoot) {
      shoot.x += shoot.dx * 620 * dt; shoot.y += shoot.dy * 620 * dt; shoot.a -= dt * 0.9;
      if (shoot.a <= 0 || shoot.x > w + 150 || shoot.y > h + 150) shoot = null;
    } else if (t > nextShoot) {
      const ang = 0.5 + Math.random() * 0.3;         // heads down and to the right
      shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.35, dx: Math.cos(ang), dy: Math.sin(ang), a: 0.9 };
      nextShoot = t + 7000 + Math.random() * 9000;
    }
    draw(t);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (still || raf || document.documentElement.dataset.view === "simple") return;
    last = 0; nextShoot = performance.now() + 4000;
    raf = requestAnimationFrame(tick);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  document.addEventListener("viewchange", (e) => (e.detail === "simple" ? stop() : start()));
  resize();
  start();
})();
