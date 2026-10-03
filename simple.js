/* Simple view: a plain, scannable page built from data.js (same content as the terminal). */
window.renderSimple = (root, D, CAT) => {
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const link = (label, href, cls = "s-btn", ext = true) => {
    const a = el("a", cls, label);
    a.href = href;
    if (ext) { a.target = "_blank"; a.rel = "noopener"; a.append(el("span", "sr-only", " (opens in new tab)")); }
    return a;
  };
  const section = (id, title) => {
    const s = el("section", "s-sec"), h = el("h2", null, title);
    s.id = id; h.id = id + "-h";
    s.setAttribute("aria-labelledby", h.id);
    s.append(h);
    return s;
  };

  const wrap = el("div", "s-wrap");

  /* Header: brand, section links, theme + back-to-terminal */
  const top = el("header", "s-top");
  const nav = el("nav", "s-nav");
  nav.setAttribute("aria-label", "Sections");
  [["About", "s-about"], ["Skills", "s-skills"], ["Projects", "s-projects"], ["Contact", "s-contact"]]
    .forEach(([t, id]) => nav.append(link(t, "#" + id, "", false)));
  const acts = el("div", "s-actions");
  const themeBtn = el("button", "s-btn ghost"); themeBtn.type = "button";
  themeBtn.dataset.themeBtn = ""; themeBtn.dataset.long = "1";
  const termBtn = el("button", "s-btn ghost", "Open terminal >_"); termBtn.type = "button";
  termBtn.dataset.act = "terminal";
  const homeBtn = el("button", "s-btn ghost", "\u2190 Home"); homeBtn.type = "button";
  homeBtn.dataset.act = "home"; homeBtn.setAttribute("aria-label", "Back to home page");
  acts.append(homeBtn, themeBtn, termBtn);
  top.append(el("span", "s-brand", D.name), nav, acts);

  const main = el("main"); main.id = "s-main"; main.tabIndex = -1;

  /* Intro */
  const hero = el("section", "s-hero");
  hero.append(el("h1", null, D.name), el("p", "s-role", D.role), el("p", "s-loc", D.location));
  if (D.availability) hero.append(el("p", "s-avail", "\u25CF " + D.availability));
  if (D.tagline) hero.append(el("p", "s-tag", D.tagline));
  const heroActs = el("div", "s-acts");
  heroActs.append(
    link("Resume", D.resume, "s-btn solid"),
    link("GitHub", D.links.github),
    link("LinkedIn", D.links.linkedin),
    link("Email me", `mailto:${D.email}`, "s-btn", false));
  hero.append(heroActs);

  /* About */
  const about = section("s-about", "About");
  D.bio.forEach((b) => about.append(el("p", null, b)));

  /* Skills */
  const skills = section("s-skills", "Skills");
  const dl = el("dl", "s-skills");
  Object.entries(D.skills).forEach(([k, v]) => {
    const row = el("div");
    const tags = el("dd");
    v.split(",").forEach((t) => tags.append(el("span", "s-tag-chip", t.trim())));
    row.append(el("dt", null, k), tags);
    dl.append(row);
  });
  skills.append(dl);

  /* Projects */
  const projects = section("s-projects", "Projects");
  const grid = el("div", "s-grid");
  D.projects.forEach((p) => {
    const card = el("article", "s-card");
    const shot = el("div", "s-shot"); shot.dataset.title = p.name;
    const img = el("img");
    img.src = p.img; img.alt = `Screenshot of ${p.name}`; img.loading = "lazy"; img.decoding = "async";
    img.onerror = () => img.remove();
    shot.append(img);
    const body = el("div", "s-card-body");
    const head = el("div", "s-card-head");
    head.append(el("h3", null, p.name), el("span", "s-badge", CAT[p.cat] || p.cat));
    const tags = el("div", "s-tags");
    p.stack.forEach((t) => tags.append(el("span", "s-tag-chip", t)));
    const links = el("div", "s-links");
    if (p.live) links.append(link("Live site", p.live));
    links.append(link("Source code", p.repo, "s-btn ghost"));
    body.append(head, el("p", null, p.desc), tags, links);
    card.append(shot, body);
    grid.append(card);
  });
  projects.append(grid);

  /* Contact */
  const contact = section("s-contact", "Contact");
  const row = el("div", "s-acts");
  row.append(
    link(D.email, `mailto:${D.email}`, "s-btn", false),
    link("GitHub", D.links.github),
    link("LinkedIn", D.links.linkedin));
  contact.append(row);

  main.append(hero, about, skills, projects, contact);
  const foot = el("footer", "s-foot", `\u00A9 ${new Date().getFullYear()} ${D.name}`);
  const skip = link("Skip to content", "#s-main", "s-skip", false);
  top.prepend(skip);                                // inside the banner landmark
  wrap.append(top, main, foot);
  root.textContent = "";
  root.append(wrap);
};
