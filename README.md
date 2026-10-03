# Yajat Kanaskar Portfolio

A personal portfolio website built as a terminal-style interactive experience. It presents a developer profile, skills, projects, and contact information in a command-line-inspired interface.

## Features

- Clean opening page with an "Open terminal" button; the terminal zooms open like launching an app
- Starry outer-space background with twinkling stars and the occasional shooting star
- Terminal-inspired interface with a boot sequence
- Interactive command menu
- Project showcase with live/demo links
- About, skills, resume, and contact sections
- `neofetch` system-info card
- A few hidden commands for curious visitors
- A **← Home** button in both the terminal and the simple view (also the `exit` command) that returns to the opening page; reopening the terminal picks up where you left off
- Light and dark themes: `theme dark`, `theme light`, or the sun/moon button in the title bar (remembered between visits)
- **Simple view**: the same content as a plain, scannable page for visitors who skim. Open it with the `simple` command, the "Simple view" button, the link on the opening page, or by sharing `yoursite.com/?view=simple`
- Responsive layout for desktop and mobile
- Easy content updates through a single data file

## Project Structure

- `index.html` — page structure
- `style.css` — styling and layout (terminal, themes, simple view)
- `space.js` — starry outer-space background (canvas)
- `data.js` — portfolio content, bio, skills, and project details
- `terminal.js` — terminal behavior, commands, themes, and view switching
- `extras.js` — neofetch and the hidden commands (add your own the same way: `window.TERM.commands.mycmd = { desc, run }`)
- `simple.js` — builds the Simple view from `data.js` (no content to edit here)

## Run Locally

Because this is a static site, you can open it directly in a browser:

1. Open `index.html` in your browser, or
2. Serve the folder locally with a simple web server:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Customize the Portfolio

Edit the content in `data.js` to update:

- Name and role
- Bio text
- Skills
- Projects
- Social and contact links
- Opening page tagline
- Availability line (`availability`, shown in `neofetch`, the hire-me easter egg and the simple view; set to an empty string to hide it)
- Boot messages shown when the terminal opens

Example:

```js
window.DATA = {
  name: "Your Name",
  role: "Full-Stack Developer",
  bio: ["Your bio text here"],
  projects: [
    {
      id: "project-one",
      name: "Project One",
      desc: "Project description",
      stack: ["React", "Node.js"],
      live: "https://example.com",
      repo: "https://github.com/yourusername/project"
    }
  ]
};
```

## Before You Deploy

1. Put `Yajat-Kanaskar-Resume.pdf` next to `index.html`, and the screenshots in `images/` (`shop-ai.png`, `VC.png`, `pong.png`).
2. In `index.html`, uncomment the canonical / `og:url` / `og:image` block once you know your address, and add a 1200x630 `preview.png`. Delete the plain `twitter:card` summary line when you do.
3. Keep these in sync when your content changes, because they can't read `data.js`: the meta description, the JSON-LD block, and the `<noscript>` fallback in `index.html`.
4. Share `yoursite.com/?view=simple` with recruiters who prefer a regular page.

## Notes

- Simple view reads everything from `data.js`, so updating a project there updates both views.

- The project uses vanilla HTML, CSS, and JavaScript.
- Some content such as resume links or project images may need to be added or adjusted to match your own files.
- If you want to deploy it, you can host it on GitHub Pages, Netlify, Vercel, or any static hosting provider.

## License

This project is for personal portfolio use. Add a license if you plan to share or distribute it publicly.
