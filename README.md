# SHALL WE PLAY A GAME?
### Production-Ready Live Technology Competition & Hackathon Platform

[![Hosting: GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-blue.svg)](https://pages.github.com/)
[![Backend: Supabase](https://img.shields.io/badge/Backend-Supabase%20Free%20Tier-emerald.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Zero-Cost Serverless](https://img.shields.io/badge/Infrastructure-Zero--Cost-brightgreen.svg)](#)

> *"A strange game. The only winning move is not to play. How about a nice game of chess?"*  
> — W.O.P.R. / Joshua, *WarGames* (1983)

---

## ⚡ Overview

**"SHALL WE PLAY A GAME?"** is an ephemeral, production-ready competition web application engineered for company hackathons, engineering offsites, and technical team-building events (1–3 hours duration).

Participants solve 10 multi-tier engineering challenges ranging from browser DevTools scavenger hunts and distributed systems trivia to multi-stage cryptography and algorithmic debugging.

The platform runs 100% as a client-side Single Page Application (SPA) deployable via **GitHub Pages**, paired with a zero-cost serverless backend (**Supabase Free Tier**) or an instant offline demo engine.

---

## 🚀 Key Features

- **Zero-Friction Team Onboarding:** No email verification loops. Teams register with a Team Name, Access PIN (`DEFCON-1983`), and Engineering Track.
- **Progressive Challenge Engine:** 10 diverse technical challenges across 3 distinct tiers:
  - **Tier A: Web Scavenger & OSINT** (DOM inspection, `robots.txt`, simulated HTTP response headers)
  - **Tier B: Tech Trivia & Architecture** (POSIX signals, CAP theorem, regex logs, RFC status codes)
  - **Tier C: Code-Breaking & Cryptography** (ROT13 ciphers, Hex/Base64 pipelines, off-by-one JS debugging)
- **Built-in W.O.P.R. Terminal & DevTools Simulator:** Embedded CLI (`cat`, `curl`, `rot13`, `hexdump`, `base64`, `hash`), mock network packet sniffer, and DOM inspector for participants on restricted enterprise laptops.
- **Anti-Cheat & SHA-256 Validation:** Client-side canonicalization and hashing prevent answer leakage in source code; 3-second lockout rate limiter throttles brute-force submissions.
- **Real-Time Leaderboard & Projector Mode (`#projector`):** Dedicated presentation view for central 4K/1080p screens featuring an animated 3-tier illuminated podium, live ticker tape, mission countdown clock, and victory confetti.
- **Web Audio API Procedural Sound Engine:** Melodic chimes, radar pings, and access alarms synthesized directly in the browser with zero external audio assets.
- **One-Click Post-Event Data Export:** Download the final audited results as a CSV directly from the Operator Control Panel (`#admin`).

---

## 🛠️ Technology Stack

- **Front-End:** HTML5, Modern CSS3 (Glassmorphism, CRT scanline overlay, neon glows), Tailwind CSS via CDN.
- **Application Logic:** Modular Vanilla ES6+ JavaScript (`js/app.js`, `js/crypto.js`, `js/audio.js`, `js/storage.js`, `js/challenges.js`, `js/terminal-simulator.js`, `js/supabase-client.js`).
- **Backend / Realtime Layer:** Supabase Free Tier (PostgreSQL with Row Level Security, Realtime WebSocket broadcast channels, and PostgreSQL stored procedures).
- **Offline / Standalone Fallback:** `localStorage` state persistence + `BroadcastChannel` API cross-tab synchronization with simulated competitor bots.

---

## 📋 Quick Start (Local Run)

You can run the application locally with any static HTTP file server:

```bash
# Clone the repository
git clone https://github.com/your-username/shall-we-play-a-game.git
cd shall-we-play-a-game

# Start a local static server
python3 -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080` in your web browser.

---

## 📖 Deployment & Operator Playbook

For step-by-step instructions on forking the repository, enabling GitHub Pages, linking Supabase in 5 minutes, configuring custom room PINs, and projecting the live leaderboard, read the full **[OPERATOR PLAYBOOK](OPERATOR_PLAYBOOK.md)**.

---

## 🔐 Database Schema & Security

See [`supabase/schema.sql`](file:///Users/acrlewis/workspace/shall-we-play-a-game/supabase/schema.sql) for the complete database schema, Row-Level Security (RLS) policies, and the anti-cheat stored procedure `submit_challenge_answer`.
