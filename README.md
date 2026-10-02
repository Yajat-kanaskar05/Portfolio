# Yajat Kanaskar Portfolio

A personal portfolio website built as a terminal-style interactive experience. It presents a developer profile, skills, projects, and contact information in a command-line-inspired interface.

## Features

- Terminal-inspired landing page
- Interactive command menu
- Project showcase with live/demo links
- About, skills, resume, and contact sections
- Responsive layout for desktop and mobile
- Easy content updates through a single data file

## Project Structure

- `index.html` — page structure
- `style.css` — styling and layout
- `data.js` — portfolio content, bio, skills, and project details
- `terminal.js` — terminal behavior and interactions

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
- Boot messages shown on load

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

## Notes

- The project uses vanilla HTML, CSS, and JavaScript.
- Some content such as resume links or project images may need to be added or adjusted to match your own files.
- If you want to deploy it, you can host it on GitHub Pages, Netlify, Vercel, or any static hosting provider.

## License

This project is for personal portfolio use. Add a license if you plan to share or distribute it publicly.
