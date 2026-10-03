/* All your content lives here. Edit this file, never the engine. */
window.DATA = {
  name: "Yajat Kanaskar",
  role: "Full-Stack Developer & AI/ML Engineer",
  tagline: "I build web apps from interface to database.",   /* shown on the opening page */
  location: "Bengaluru, India",
  availability: "Open to new opportunities",          /* shown in neofetch, sudo hire-me and the simple view; set to "" to hide */
  email: "yajat.important@gmail.com",
  resume: "Yajat-Kanaskar-Resume.pdf",
  links: {
    github: "https://github.com/Yajat-kanaskar05",
    linkedin: "https://www.linkedin.com/in/yajat-kanaskar-b2167a331/"
  },
  bio: [
    "I'm a developer based in Bengaluru taking products from idea to production.",
    "I like clear code, small pull requests, and interfaces that stay usable on slow connections.",
    "Outside work, I write about what I learn and contribute to open source."
  ],
  skills: {
    Frontend: "React, Next.js, TypeScript, Tailwind",
    Backend: "Node.js, Express, Python, REST APIs, auth",
    Data: "MySQL, MongoDB, schema design",
    "ML/DL": "TensorFlow, PyTorch, scikit-learn"
  },
  projects: [
    {
      id: "shop-ai", name: "Shop AI", tagline: "AI powered e-commerce website", cat: "fullstack",
      desc: "A powerful e-commerce website for shopping with AI-powered recommendations.",
      stack: ["React", "Node.js", "MongoDB"],
      live: "https://ai-powered-e-commerce-website-swart.vercel.app/",
      repo: "https://github.com/Yajat-kanaskar05/AI-powered-E-Commerce-Website",
      img: "images/shop-ai.png"
    },
    {
      id: "video-call", name: "Video Calling App", cat: "fullstack",
      desc: "A real-time video calling application with end-to-end encryption and seamless integration across devices.",
      stack: ["Next.js", "TypeScript", "MongoDB"],
      live: "https://video-calling-app-t7i4.onrender.com/signup",
      repo: "https://github.com/Yajat-kanaskar05/Video-Calling-App",
      img: "images/VC.png"
    },
    {
      id: "ai-pong", name: "AI Ping Pong", cat: "aiml",
      desc: "A machine learning model which uses reinforcement learning to play ping pong against the computer.",
      stack: ["Python", "PyTorch", "scikit-learn"],
      live: null,
      repo: "https://github.com/Yajat-kanaskar05/AI_Plays_Ping_Pong",
      img: "images/pong.png"
    }
  ],
  /* Boot sequence shown on load: [status, message] */
  boot: [
    ["ok", "Mounting /home/yajat"],
    ["ok", "Loading profile: Yajat Kanaskar"],
    ["ok", "Indexing 3 projects"],
    ["ok", "Starting portfolio-os v1.0"]
  ]
};
