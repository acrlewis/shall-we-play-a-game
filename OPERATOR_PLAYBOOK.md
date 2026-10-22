# OPERATOR PLAYBOOK: "SHALL WE PLAY A GAME?"
### Live Technology Team-Building Competition & Hackathon Management Guide

---

## 1. Executive Summary & Event Architecture

**"SHALL WE PLAY A GAME?"** is a time-boxed, live engineering competition platform inspired by the classic 1983 film *WarGames*. It challenges participants across three technical disciplines:
- **Tier A:** Web Scavenger Hunt & OSINT (DevTools, DOM traversal, HTTP response headers, robots directives)
- **Tier B:** Systems Architecture & Trivia (POSIX signals, CAP theorem, regex pattern recognition, RFC standards)
- **Tier C:** Cryptography & Code Debugging (ROT13, multi-stage Hex/Base64 pipelines, off-by-one algorithmic debugging)

### Architecture Highlights
- **Front-End:** 100% static client-side SPA (HTML5, Tailwind CSS, Vanilla ES6+ modules, Web Audio API sound synthesizer).
- **Hosting:** Zero-cost static delivery on **GitHub Pages**, Cloudflare Pages, or Netlify.
- **Backend (BaaS):** Ephemeral **Supabase Free Tier** (PostgreSQL, Row Level Security, Realtime WebSocket subscriptions, stored procedures).
- **Standalone Fallback:** Zero-config local demo mode with `BroadcastChannel` multi-tab synchronization and simulated competitor bots.

---

## 2. Pre-Event Setup Guide (15 Minutes)

### Step 1: Fork & Deploy to GitHub Pages
1. Fork or clone this repository to your GitHub organization or personal account:
   ```bash
   git clone https://github.com/your-org/shall-we-play-a-game.git
   ```
2. In GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment**:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `root`
4. Click **Save**. Your site will be live at:
   `https://<your-username>.github.io/shall-we-play-a-game/`

---

### Step 2: Initialize Free Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a free account.
2. Click **New Project**:
   - **Name:** `shall-we-play-a-game`
   - **Database Password:** (Generate a strong password and save it)
   - **Region:** Select the closest region to your participants.
3. Once the database is provisioned (approx. 2 minutes), navigate to the **SQL Editor** in the left sidebar.
4. Open the file [`supabase/schema.sql`](file:///Users/acrlewis/workspace/shall-we-play-a-game/supabase/schema.sql) from this repository, copy the entire SQL text, paste it into the Supabase SQL Editor, and click **Run**.
   - This creates tables (`rooms`, `teams`, `challenges`, `submissions`), security policies (RLS), real-time publication subscriptions, and the anti-cheat stored procedure `submit_challenge_answer`.
5. Navigate to **Project Settings** > **API**:
   - Copy your **Project URL** (e.g. `https://xyzcompany.supabase.co`)
   - Copy your **Project API anon public key** (e.g. `eyJhbGciOiJIUzI1Ni...`)

---

### Step 3: Configure Event Room & Access PIN
The database is pre-seeded with room `DEFCON-1983`. To create a custom room PIN (e.g., `HACK-2026`):
Run this query in Supabase SQL Editor:
```sql
INSERT INTO rooms (room_code, name, is_active, duration_minutes)
VALUES ('HACK-2026', 'Engineering Fall Hackathon', TRUE, 90)
ON CONFLICT (room_code) DO NOTHING;
```

---

## 3. Participant Distribution (Zero-Friction Access)

To onboard participants without requiring them to input database credentials, construct a pre-configured onboarding URL with query parameters:

```text
https://<your-org>.github.io/shall-we-play-a-game/?supabase_url=YOUR_SUPABASE_URL&supabase_key=YOUR_ANON_KEY&room=HACK-2026
```

### What Participants Experience:
1. They click the link and arrive directly at the W.O.P.R. interface.
2. A single registration modal appears asking for:
   - **Team Name / Handle** (e.g., `KernelPanic`)
   - **Access PIN** (Pre-populated from the URL)
   - **Engineering Track** (e.g., `Full-Stack`, `DevOps`, `SecOps`, `QA`, `Data`)
3. Once submitted, session state is persisted in `localStorage`. If a participant accidentally closes their tab or refreshes, their score, progress, and hints are restored immediately.

---

## 4. Game Master Operations: Live Event Execution

### The Projector Screen View
For central presentation monitors, overhead projectors, or Zoom/Teams screenshares:
1. Open the application and append `#projector` to the URL:
   ```text
   https://<your-org>.github.io/shall-we-play-a-game/#projector
   ```
2. Press `F11` (or `Cmd+Ctrl+F` on macOS) for full-screen mode.
3. The Projector View displays:
   - **Mission Countdown Clock**
   - **DEFCON 1 Status Indicator**
   - **Illuminated 3-Tier Podium** with animated crowns and trophies for 1st, 2nd, and 3rd place
   - **Live Telemetry Ticker Tape** streaming real-time solve events across the room
   - Automatic particle confetti whenever any team reaches Rank 1

---

### Operator Mission Control (`#admin`)
Navigate to `#admin` in the header or browse to `index.html#admin`:
- **Status Indicator:** Shows whether connected to Supabase or Standalone engine.
- **Seed Demo Bot:** Spawns simulated competitors with progressive scores (useful for pre-event dry runs or warming up the leaderboard).
- **Export Final Leaderboard (CSV):** Downloads a clean, formatted CSV containing rank, team name, track, solved count, total points, and last solve timestamp.
- **Reset All Data:** Clears team sessions and submissions for a fresh restart.

---

## 5. Scoring & Hint Strategy Breakdown

| Challenge ID | Tier | Category | Base Points | Hint 1 Penalty | Hint 2 Penalty | Max Solvable Points |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **CHAL-01** | A | DOM & Elements | 100 PTS | -10% (90 PTS) | -25% (65 PTS) | 100 PTS |
| **CHAL-02** | A | Web Security & Crawlers | 150 PTS | -10% (135 PTS) | -25% (98 PTS) | 150 PTS |
| **CHAL-03** | A | HTTP Telemetry | 175 PTS | -10% (158 PTS) | -25% (114 PTS) | 175 PTS |
| **CHAL-04** | B | POSIX & Systems | 125 PTS | -10% (113 PTS) | -25% (81 PTS) | 125 PTS |
| **CHAL-05** | B | Distributed Systems | 150 PTS | -10% (135 PTS) | -25% (98 PTS) | 150 PTS |
| **CHAL-06** | B | Regex & Network Logs | 150 PTS | -10% (135 PTS) | -25% (98 PTS) | 150 PTS |
| **CHAL-07** | B | RFC & Protocols | 100 PTS | -10% (90 PTS) | -25% (65 PTS) | 100 PTS |
| **CHAL-08** | C | Ciphers & Cryptanalysis | 200 PTS | -10% (180 PTS) | -25% (130 PTS) | 200 PTS |
| **CHAL-09** | C | Multi-Stage Decoding | 250 PTS | -10% (225 PTS) | -25% (163 PTS) | 250 PTS |
| **CHAL-10** | C | Debugging & Logic | 300 PTS | -10% (270 PTS) | -25% (195 PTS) | 300 PTS |
| **TOTAL** | — | — | **1,700 PTS** | — | — | **1,700 PTS** |

### Anti-Cheat Mechanism
- **Rate-Limiting:** If a team submits an incorrect answer, a 3-second cooldown is enforced both client-side and in the database stored procedure before the next attempt is permitted.
- **Zero Raw Answer Leaks:** The front-end bundle stores only SHA-256 hashes of canonicalized uppercase answers. The actual answer text is never exposed in the client source.

---

## 6. Post-Event Teardown & Archiving

1. **Award Announcements:** Switch to `#projector` and announce the 1st, 2nd, and 3rd place champions.
2. **Export Results:** Go to `#admin` and click **"Export Final Leaderboard (CSV)"**.
3. **Database Reset (Optional):**
   Run in Supabase SQL Editor to wipe participant submissions for future reuse:
   ```sql
   TRUNCATE submissions, teams CASCADE;
   ```
4. **Archive Repository:** If finished, turn off GitHub Pages or update the Room PIN to deactivate public access.
