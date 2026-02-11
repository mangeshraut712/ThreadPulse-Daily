# 🧩 ThreadPulse Daily (Devvit App)

**A community-powered daily word puzzle game built natively for the Reddit ecosystem.**

This is the **Devvit portion** of the ThreadPulse Daily project. It handles the Reddit-side logic, Custom Post Types, and persistence.

---

### 📍 Project Links
- **Video Demo:** [Watch the Demo on GitHub](https://github.com/mangeshraut712/ThreadPulse-Daily/blob/main/apps/devvit/assets/Demo.mov?raw=true)
- **Live Demo (Reddit):** [r/ThreadPulse2026](https://www.reddit.com/r/ThreadPulse2026)
- **Source Code:** [GitHub Repository](https://github.com/mangeshraut712/ThreadPulse-Daily)

---

## 🤝 Project Overview

ThreadPulse Daily is a complex Wordle-style daily puzzle game designed for the Reddit Daily Games Hackathon 2026. This app directory contains the **Reddit Developer Platform (Devvit)** integration.

### Devvit Features:
- **Custom Post Type** — Registers the `ThreadPulse Daily` post type for interactive subreddit threads.
- **Webview Integration** — Hosts the React/Vite game logic within a secure Reddit webview.
- **Redis Persistence** — Manages daily leaderboards and community-submitted clues.
- **Triggers** — Automated post creation on installation and moderator-only comment triggers (`!create-game`).
- **Menu Items** — Subreddit-level menu entries for easy daily puzzle deployment.

---

## 🛠 Tech Stack (Apps Layer)

| Technology | Purpose |
|---|---|
| **Devvit API 0.12.0** | Core Reddit integration framework |
| **TypeScript** | Type-safe app logic |
| **Redis** | High-performance state & leaderboard storage |
| **Asset Hosting** | Serving the built Vite game from `webroot/` |

---

## 📁 Directory Structure

```
apps/devvit/
├── devvit.json          # Devvit app configuration (schema v0.12)
├── assets/              # Static assets and demo video
├── src/
│   └── main.tsx         # Main entrypoint: triggers, menus, and custom post setup
└── webroot/             # Production build of the React game (Vite output)
```

---

## 🚀 Development & Deployment

To deploy this app to your own subreddit:

1. **Install Devvit CLI:**
   ```bash
   npm install -g @devvit/cli
   ```

2. **Login to Reddit:**
   ```bash
   devvit login
   ```

3. **Install to Subreddit:**
   ```bash
   devvit install r/YourSubreddit
   ```

4. **Playtest:**
   ```bash
   devvit playtest r/YourSubreddit
   ```

---

## 🏆 Hackathon Submission

This app was built for the **Reddit Daily Games Hackathon 2026**. It demonstrates the power of the Devvit platform by combining high-performance React UI with native Reddit backend services to create a recurring, community-driven social gaming experience.

*Made with ❤️ by u/Salt_Hyena5896*
