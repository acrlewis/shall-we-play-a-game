/* SHALL WE PLAY A GAME — BUNDLED SPA RUNTIME */
(function() {
"use strict";

// --- File: js/config.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CONFIGURATION MODULE
 * Dynamic runtime config supporting URL params, localStorage, or environment keys
 * ==============================================================================
 */

const CONFIG = {
  // App Identity
  APP_NAME: "SHALL WE PLAY A GAME?",
  SYSTEM_CODE: "W.O.P.R. / JOSHUA PROTOCOL",
  VERSION: "1.0.0",

  // Default Event Settings
  DEFAULT_ROOM_CODE: "DEFCON-1983",
  DEFAULT_DURATION_MINUTES: 90,
  SUBMISSION_COOLDOWN_MS: 3000, // 3-second anti-brute-force rate limit
  SPEED_BONUS_MINUTES: 5,       // Extra points if solved within first 5 mins of unlock

  // Supabase Configuration
  SUPABASE_URL: "https://aducxgzbeokdqtbpiboo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_cHLS3f-BIARNMyVeRrs5tA_qblq0T5X",

  // Audio configuration
  SOUND_DEFAULT_ENABLED: true,

  // Load from environment / storage
  init() {
    const params = new URLSearchParams(window.location.search);
    
    // Check URL overrides
    const urlSb = params.get("supabase_url");
    const urlKey = params.get("supabase_key") || params.get("publishable_key");
    const urlRoom = params.get("room") || params.get("pin");

    if (urlSb && urlKey) {
      this.SUPABASE_URL = urlSb;
      this.SUPABASE_ANON_KEY = urlKey;
      localStorage.setItem("swpag_supabase_url", urlSb);
      localStorage.setItem("swpag_supabase_key", urlKey);
    } else {
      const storedUrl = localStorage.getItem("swpag_supabase_url");
      const storedKey = localStorage.getItem("swpag_supabase_key");
      if (storedUrl) this.SUPABASE_URL = storedUrl;
      if (storedKey) this.SUPABASE_ANON_KEY = storedKey;
    }

    if (urlRoom) {
      this.DEFAULT_ROOM_CODE = urlRoom.toUpperCase();
    }
  },

  getParticipantOnboardingUrl() {
    const base = window.location.origin + window.location.pathname;
    return `${base}?room=${encodeURIComponent(this.DEFAULT_ROOM_CODE)}&supabase_url=${encodeURIComponent(this.SUPABASE_URL)}&supabase_key=${encodeURIComponent(this.SUPABASE_ANON_KEY)}`;
  },

  isSupabaseConfigured() {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY && this.SUPABASE_URL.startsWith("https://"));
  },

  saveSupabaseConfig(url, key) {
    this.SUPABASE_URL = url.trim();
    this.SUPABASE_ANON_KEY = key.trim();
    localStorage.setItem("swpag_supabase_url", this.SUPABASE_URL);

    localStorage.setItem("swpag_supabase_key", this.SUPABASE_ANON_KEY);
  },

  clearSupabaseConfig() {
    this.SUPABASE_URL = "";
    this.SUPABASE_ANON_KEY = "";
    localStorage.removeItem("swpag_supabase_url");
    localStorage.removeItem("swpag_supabase_key");
  }
};

CONFIG.init();


// --- File: js/crypto.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CRYPTOGRAPHIC & NORMALIZATION UTILITIES
 * Client-side SHA-256 hashing, string canonicalization, and cipher helpers
 * ==============================================================================
 */

const CRYPTO = {
  /**
   * Normalizes participant input:
   * - Trims whitespace
   * - Condenses consecutive whitespace to single space
   * - Converts to uppercase for deterministic case-insensitive matching
   */
  normalize(input) {
    if (typeof input !== "string") return "";
    return input.trim().toUpperCase().replace(/\s+/g, " ");
  },

  /**
   * Computes SHA-256 hexadecimal hash using native Web Crypto API.
   * Returns a 64-character lowercase hex string.
   */
  async hash(input) {
    const canonical = this.normalize(input);
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  },

  /**
   * ROT13 cipher implementation for challenge 8 / terminal tooling
   */
  rot13(str) {
    if (typeof str !== "string") return "";
    return str.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      const isUpper = code >= 65 && code <= 90;
      const base = isUpper ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  },

  /**
   * Converts Hex string to UTF-8 ASCII text
   */
  hexToAscii(hex) {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
    let output = "";
    for (let i = 0; i < cleanHex.length; i += 2) {
      output += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
    }
    return output;
  },

  /**
   * Converts ASCII string to Hex
   */
  asciiToHex(str) {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex;
  },

  /**
   * Decodes Base64 to string safely handling UTF-8
   */
  base64Decode(b64) {
    try {
      return decodeURIComponent(
        atob(b64.trim())
          .split("")
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } catch {
      return atob(b64.trim());
    }
  }
};


// --- File: js/audio.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — WEB AUDIO API PROCEDURAL SOUND GENERATOR
 * Synthesizes retro terminal bleeps, chimes, and alarms without external assets
 * ==============================================================================
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem("swpag_sound_muted") !== "true";
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem("swpag_sound_muted", String(!this.enabled));
    if (this.enabled) {
      this.playBeep(880, 0.08, "square");
    }
    return this.enabled;
  }

  playTone(freq, duration, type = "sine", gainVal = 0.15) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playBeep(freq = 600, duration = 0.05, type = "square") {
    this.playTone(freq, duration, type, 0.08);
  }

  playKeypress() {
    this.playTone(1200 + Math.random() * 400, 0.02, "triangle", 0.03);
  }

  playHint() {
    if (!this.enabled) return;
    this.ensureContext();
    this.playTone(520, 0.1, "sine", 0.2);
    setTimeout(() => this.playTone(440, 0.15, "triangle", 0.18), 100);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, "sine", 0.2);
      }, idx * 80);
    });
  }

  playError() {
    if (!this.enabled) return;
    this.ensureContext();
    this.playTone(180, 0.15, "sawtooth", 0.25);
    setTimeout(() => {
      this.playTone(140, 0.25, "sawtooth", 0.3);
    }, 120);
  }

  playRadarBlip() {
    if (!this.enabled) return;
    this.playTone(1400, 0.04, "sine", 0.05);
  }

  playVictory() {
    if (!this.enabled) return;
    this.ensureContext();
    const fanfare = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 150 },
      { f: 783.99, d: 0.2, t: 300 },
      { f: 1046.50, d: 0.4, t: 500 }
    ];
    fanfare.forEach(note => {
      setTimeout(() => {
        this.playTone(note.f, note.d, "square", 0.2);
      }, note.t);
    });
  }
}

const SOUND = new SoundEngine();


// --- File: js/storage.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — LOCAL STORAGE & SESSION STATE MACHINE
 * Handles resilient session recovery, hint tracking, and anti-cheat rate limiting
 * ==============================================================================
 */


const STORAGE_KEY = "swpag_session_v1";

class StorageManager {
  constructor() {
    this.session = this.loadSession();
  }

  loadSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn("Error parsing saved session:", err);
    }
    return null;
  }

  saveSession(sessionData) {
    this.session = { ...this.session, ...sessionData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.session));
    return this.session;
  }

  initTeamSession(roomCode, teamName, roleTag, avatar, existingId = null) {
    const sessionData = {
      teamId: existingId || (crypto.randomUUID ? crypto.randomUUID() : `team-${Date.now()}`),
      roomCode: roomCode.trim().toUpperCase(),
      teamName: teamName.trim(),
      roleTag: roleTag || "Full-Stack",
      avatar: avatar || "terminal-green",
      solvedChallenges: {},
      unlockedHints: {},
      lastSubmissionTime: 0,
      totalScore: 0,
      joinedAt: new Date().toISOString()
    };
    return this.saveSession(sessionData);
  }

  isAuthenticated() {
    return Boolean(this.session && this.session.teamName && this.session.roomCode);
  }

  getSession() {
    return this.session;
  }

  clearSession() {
    this.session = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  // Check rate limit: 3-second lockout
  checkRateLimit() {
    if (!this.session) return { allowed: true, remainingMs: 0 };
    const now = Date.now();
    const elapsed = now - (this.session.lastSubmissionTime || 0);
    if (elapsed < CONFIG.SUBMISSION_COOLDOWN_MS) {
      return { 
        allowed: false, 
        remainingMs: CONFIG.SUBMISSION_COOLDOWN_MS - elapsed 
      };
    }
    return { allowed: true, remainingMs: 0 };
  }

  recordSubmissionAttempt() {
    if (this.session) {
      this.session.lastSubmissionTime = Date.now();
      this.saveSession(this.session);
    }
  }

  isChallengeSolved(challengeId) {
    if (!this.session || !this.session.solvedChallenges) return false;
    return Boolean(this.session.solvedChallenges[challengeId]);
  }

  recordSolve(challengeId, pointsAwarded, hintsUsed) {
    if (!this.session) return;
    if (!this.session.solvedChallenges) this.session.solvedChallenges = {};
    
    this.session.solvedChallenges[challengeId] = {
      points: pointsAwarded,
      hintsUsed: hintsUsed,
      solvedAt: new Date().toISOString()
    };
    
    // Recalculate total score
    this.session.totalScore = Object.values(this.session.solvedChallenges).reduce(
      (sum, item) => sum + (item.points || 0), 0
    );
    
    this.saveSession(this.session);
  }

  getUnlockedHints(challengeId) {
    if (!this.session || !this.session.unlockedHints) return [];
    return this.session.unlockedHints[challengeId] || [];
  }

  unlockHint(challengeId, hintId) {
    if (!this.session) return [];
    if (!this.session.unlockedHints) this.session.unlockedHints = {};
    if (!this.session.unlockedHints[challengeId]) {
      this.session.unlockedHints[challengeId] = [];
    }
    if (!this.session.unlockedHints[challengeId].includes(hintId)) {
      this.session.unlockedHints[challengeId].push(hintId);
      this.saveSession(this.session);
    }
    return this.session.unlockedHints[challengeId];
  }
}

const STORAGE = new StorageManager();


// --- File: js/challenges.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CHALLENGES DATA STORE & PROGRESSIVE UNLOCK
 * 10 Authoritative Technical Challenges across 3 Tiers
 * ==============================================================================
 */

const CHALLENGES = [
  {
    id: "CHAL-01",
    tier: "A",
    tierName: "Tier A: Web Scavenger & OSINT",
    category: "DOM & Elements",
    title: "Ghost in the DOM",
    points: 100,
    hash: "8937c905c3fff1b71bef90820a542a89aff496b4c6a59496b009d1448d564992",
    prompt: "A rogue W.O.P.R. systems engineer left a clandestine debug marker embedded directly inside the document object model of this application. Inspect the page markup using browser DevTools or the embedded Terminal Simulator.",
    clue: "Open browser DevTools (Ctrl+Shift+I or Cmd+Option+I) and inspect the root <body> element, or toggle the W.O.P.R. Terminal tool and inspect the DOM tab.",
    inputPlaceholder: "FLAG{...}",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Check HTML comments near the main container element or footer in the source."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "Search the Elements panel or DOM Inspector for 'SECRET_FLAG'."
      }
    ]
  },
  {
    id: "CHAL-02",
    tier: "A",
    tierName: "Tier A: Web Scavenger & OSINT",
    category: "Web Security & Crawlers",
    title: "Robots & Disallowed Vectors",
    points: 150,
    hash: "f5fa62cfa32620be876f5fa094cf3d9bce88983fc9cea32bff8d769f7b4cbdd6",
    prompt: "Before automated web scrapers index search engines, they query standard compliance directives to determine forbidden sectors. Check the host's crawler policy to locate the hidden perimeter flag.",
    clue: "Direct your browser to /robots.txt or type 'cat /robots.txt' in the W.O.P.R. Console.",
    inputPlaceholder: "FLAG{...}",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Every compliant web server hosts a plain text file at the root path detailing crawler permissions."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "Check the last Disallow directive or read the notice in /robots.txt."
      }
    ]
  },
  {
    id: "CHAL-03",
    tier: "A",
    tierName: "Tier A: Web Scavenger & OSINT",
    category: "HTTP Telemetry",
    title: "The Secret Header",
    points: 175,
    hash: "129a1e533ccacf4309657b9d6502cae8ba9287b212f58ed12e2a9a2ab668d3d5",
    prompt: "When our simulated internal auth handshake initiates, the server attaches a non-standard military response header: X-WOPR-DEFCON-KEY. Inspect the simulated network traffic on /api/v1/auth/handshake to retrieve the key.",
    clue: "Open the W.O.P.R. Terminal Simulator -> Network tab, or run 'curl /api/v1/auth/handshake' in the terminal.",
    inputPlaceholder: "JOSHUA-XXXX-DEFCON-X",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "The custom header begins with 'X-WOPR-DEFCON-KEY'."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "Format: JOSHUA-1983-DEFCON-1. Check the simulated headers table in the Network tab."
      }
    ]
  },
  {
    id: "CHAL-04",
    tier: "B",
    tierName: "Tier B: Tech Trivia & Architecture",
    category: "POSIX & Systems",
    title: "POSIX Signal Mastery",
    points: 125,
    hash: "71757acbda69de04e219cf2cc4c27facceb4179313526d105e680aa0afb8009e",
    prompt: "When a systems engineer triggers [Ctrl] + [C] in a standard POSIX shell (bash/zsh), which asynchronous inter-process termination signal name is sent to the foreground process group?",
    clue: "Provide the standard uppercase signal name (e.g. SIGKILL, SIGHUP, SIGTERM, ...).",
    inputPlaceholder: "SIG...",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "It has signal integer number 2 on standard Linux x86/ARM."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "The signal stands for 'Signal Interrupt'."
      }
    ]
  },
  {
    id: "CHAL-05",
    tier: "B",
    tierName: "Tier B: Tech Trivia & Architecture",
    category: "Distributed Systems",
    title: "The CAP Conundrum",
    points: 150,
    hash: "84810bfea2375dab1b1c8417b8eed248488f55b002f091f4d4ef37dffca3b307",
    prompt: "According to Eric Brewer's CAP Theorem, a distributed data store can guarantee at most two of three properties during network partitioning. When an active network partition occurs, systems like Apache Cassandra or Amazon Dynamo configured for high availability choose Availability over Consistency. What is the standard 2-letter classification for this architectural posture?",
    clue: "Enter the 2-letter uppercase acronym (e.g., CP, CA, or AP).",
    inputPlaceholder: "XX",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Partition tolerance (P) is mandatory on real networks. Which property did the system preserve?"
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "Availability (A) + Partition Tolerance (P)."
      }
    ]
  },
  {
    id: "CHAL-06",
    tier: "B",
    tierName: "Tier B: Tech Trivia & Architecture",
    category: "Regex & Network Logs",
    title: "The Regex Network Hunter",
    points: 150,
    hash: "2534c564adcb9b4274f7694696cc7691b63533367ea690dd5d44b9ddb6f9d066",
    prompt: "An anomalous telemetry record appeared in the W.O.P.R. gateway logs:\n2026-10-22T06:14:02.812Z [ROUTER-CORE] Ingress packet dropped from 172.16.4.99; Internal default gateway route assigned to 31 30 2e 32 34 30 2e 31 36 2e 31 via interface vlan100; MAC 00:1A:2B:3C:4D:5E\nWhat is the IP address of the internal default gateway in this log message?",
    clue: "The IP address is listed in the log message in hexadecimal format. Extract the exact IPv4 address matching the gateway clause with hexdump in the terminal.",
    inputPlaceholder: "XXX.XXX.XXX.XXX",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Look closely at the clause 'Internal default gateway route assigned to ...'."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "It belongs to the private RFC 1918 Class A 10.x.x.x block."
      }
    ]
  },
  {
    id: "CHAL-07",
    tier: "B",
    tierName: "Tier B: Tech Trivia & Architecture",
    category: "RFC & Protocols",
    title: "Rate Limit Standards",
    points: 100,
    hash: "2d1007980f49215311f7f1012e84f99b801eb5daeca04dedea3ada41cc45353b",
    prompt: "Under RFC 6585 (Additional HTTP Status Codes), what 3-digit HTTP status code must an API gateway return when a client has exceeded its allotted request quota ('Too Many Requests')?",
    clue: "Enter the 3-digit numeric HTTP status code.",
    inputPlaceholder: "4XX",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "It is in the 4xx Client Error series."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "It is exactly 429."
      }
    ]
  },
  {
    id: "CHAL-08",
    tier: "C",
    tierName: "Tier C: Code-Breaking & Cryptography",
    category: "Ciphers & Cryptanalysis",
    title: "Caesar of the Mainframe",
    points: 200,
    hash: "7852c608776bcb23d270a3f2439255d6d4862206d03caaaa568912cd208c64dd",
    prompt: "Intercepted encrypted broadcast from Joshua's primary communications relay:\nJUB-JBHYQ-LBH-YVXR-GB-CYNL-N-TNZR\nCryptanalysis indicates a classical ROT13 (Caesar cipher shifted 13 positions). Decode the transmission.",
    clue: "Preserve hyphens. You can use the terminal command 'rot13 <string>' in the W.O.P.R. console.",
    inputPlaceholder: "XXX-XXXXX-XXX-XXXX-XX-XXXX-X-XXXX",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Rotating J by 13 gives W (10 + 13 = 23 -> W). First word is 'WHO'."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "The decoded phrase is 'WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME'."
      }
    ]
  },
  {
    id: "CHAL-09",
    tier: "C",
    tierName: "Tier C: Code-Breaking & Cryptography",
    category: "Multi-Stage Decoding",
    title: "The Layered Capsule",
    points: 250,
    hash: "ad81339fd2ed2d3099869eda8ee8bf832a5c96187a416790850a6316aa4aa7f4",
    prompt: "A critical system payload was multi-tier encapsulated for transmission:\n5530684254457767563055675545784257534242494564425455552f\nConvert this Hex byte string to ASCII text. The resulting text is a Base64-encoded string. Decode that Base64 string to extract the original clearance sentence (including punctuation).",
    clue: "Stage 1: Hex -> ASCII (yields Base64). Stage 2: Base64 -> Plaintext string.",
    inputPlaceholder: "Clearance phrase...",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Hex '5530...' in ASCII starts with 'U0hBTEwgV0Ug...'."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "It is the iconic inquiry from the W.O.P.R. computer: 'SHALL WE PLAY A GAME?'"
      }
    ]
  },
  {
    id: "CHAL-10",
    tier: "C",
    tierName: "Tier C: Code-Breaking & Cryptography",
    category: "Debugging & Logic Verification",
    title: "The Off-By-One Quantum Gate",
    points: 300,
    hash: "73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049",
    prompt: "A missile silo consensus module crashes with NaN due to an off-by-one bug in this JavaScript logic:\nfunction calculateQuantumChecksum(matrix) {\n  let total = 0;\n  for (let i = 0; i <= matrix.length; i++) {\n    total += matrix[i] * (i + 1);\n  }\n  return total;\n}\nWhen you fix the off-by-one loop condition so it iterates only over valid elements (i < matrix.length), what is the exact return value of calculateQuantumChecksum([2, 4, 4, 5])?",
    clue: "Calculate (2*1) + (4*2) + (4*3) + (5*4).",
    inputPlaceholder: "Numeric result",
    hints: [
      {
        id: 1,
        penaltyPct: 10,
        text: "Multiply each element by its 1-based index: 2*1=2, 4*2=8, 4*3=12, 5*4=20."
      },
      {
        id: 2,
        penaltyPct: 25,
        text: "Sum: 2 + 8 + 12 + 20 = 42."
      }
    ]
  }
];

function getChallengeById(id) {
  return CHALLENGES.find(c => c.id === id);
}

function calculatePoints(challenge, hintsUsedCount = 0) {
  let penalty = 0;
  if (hintsUsedCount === 1) penalty = 0.10;
  else if (hintsUsedCount >= 2) penalty = 0.35;
  return Math.max(10, Math.round(challenge.points * (1 - penalty)));
}


// --- File: js/terminal-simulator.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — W.O.P.R. TERMINAL & DEVTOOLS SIMULATOR
 * Built-in hacker console providing an interactive CLI, mock network requests,
 * and DOM inspector for OSINT/Scavenger challenges
 * ==============================================================================
 */



class TerminalSimulator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.history = [];
    this.historyIndex = -1;
    this.activeTab = "terminal"; // 'terminal' | 'network' | 'dom'
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="glass-panel rounded-xl overflow-hidden border border-cyan-500/40 shadow-2xl flex flex-col h-[520px]">
        <!-- Terminal Header & Tabs -->
        <div class="bg-slate-900/90 border-b border-cyan-500/30 px-4 py-2.5 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="flex space-x-1.5">
              <span class="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-green-500/80 inline-block"></span>
            </div>
            <span class="text-xs font-mono text-cyan-400 font-semibold tracking-wider flex items-center gap-1.5">
              <span class="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              W.O.P.R. DEFENSE MAINFRAME // CLI v2.4
            </span>
          </div>

          <!-- Mode Tabs -->
          <div class="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button id="term-tab-btn" class="px-3 py-1 rounded transition-colors ${this.activeTab === 'terminal' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}">
              &gt;_ Terminal
            </button>
            <button id="net-tab-btn" class="px-3 py-1 rounded transition-colors ${this.activeTab === 'network' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}">
              ⇄ Network
            </button>
            <button id="dom-tab-btn" class="px-3 py-1 rounded transition-colors ${this.activeTab === 'dom' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'}">
              &lt;/&gt; DOM Tree
            </button>
          </div>
        </div>

        <!-- Tab 1: Terminal Shell -->
        <div id="term-view" class="${this.activeTab === 'terminal' ? 'flex' : 'hidden'} flex-col flex-1 bg-slate-950/90 font-mono text-xs overflow-hidden">
          <div id="term-output" class="flex-1 p-4 overflow-y-auto space-y-2 text-slate-300">
            <div class="text-cyan-400 font-bold">W.O.P.R. (WAR OPERATION PLAN RESPONSE) ONLINE</div>
            <div class="text-slate-400">NORAD DEFENSE MAINFRAME // CHEYENNE MOUNTAIN COMPLEX</div>
            <div class="text-slate-500">Type <span class="text-cyan-300 font-semibold">'help'</span> for available diagnostics, or <span class="text-cyan-300 font-semibold">'games'</span>.</div>
            <div class="border-b border-slate-800 pb-2"></div>
          </div>
          
          <div class="bg-slate-900/60 border-t border-slate-800 p-2.5 flex items-center space-x-2">
            <span class="text-cyan-400 font-bold">WOPR:/></span>
            <input 
              id="term-input" 
              type="text" 
              autocomplete="off" 
              spellcheck="false" 
              class="flex-1 bg-transparent text-cyan-200 focus:outline-none font-mono text-xs caret-cyan-400"
              placeholder="Enter command (e.g., help, cat /robots.txt, curl /api/v1/auth/handshake)..."
            />
          </div>
        </div>

        <!-- Tab 2: Network Inspector -->
        <div id="net-view" class="${this.activeTab === 'network' ? 'flex' : 'hidden'} flex-col flex-1 bg-slate-950/90 font-mono text-xs overflow-hidden p-4">
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div class="text-cyan-400 font-bold">MOCK TELEMETRY PACKET SNIFFER</div>
            <button id="net-refresh-btn" class="px-2.5 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded hover:bg-cyan-900 transition-colors">
              ↻ Capture Traffic
            </button>
          </div>

          <div class="flex-1 overflow-y-auto mt-3 space-y-3">
            <div class="bg-slate-900/80 border border-slate-800 rounded p-3">
              <div class="flex items-center justify-between text-xs">
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                <span class="text-cyan-300 font-bold">/api/v1/auth/handshake</span>
                <span class="text-slate-400">200 OK (24ms)</span>
              </div>
              <div class="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <div class="font-bold text-slate-300 mb-1">HTTP Response Headers:</div>
                <div class="grid grid-cols-2 gap-1 bg-slate-950/80 p-2 rounded border border-slate-800/80">
                  <span class="text-slate-400">Content-Type:</span>
                  <span class="text-slate-300">application/json</span>
                  <span class="text-amber-400 font-bold">X-WOPR-DEFCON-KEY:</span>
                  <span class="text-emerald-400 font-bold">JOSHUA-1983-DEFCON-1</span>
                  <span class="text-slate-400">X-Mainframe-Cluster:</span>
                  <span class="text-slate-300">NORAD-COLORADO-SPRINGS-NODE-04</span>
                </div>
                <div class="font-bold text-slate-300 mt-2 mb-1">Response Body:</div>
                <pre class="bg-slate-950 p-2 rounded text-slate-300 text-[11px] overflow-x-auto">{"status": "AUTHENTICATED", "defcon": 1, "protocol": "JOSHUA", "message": "GREETINGS PROFESSOR FALKEN"}</pre>
              </div>
            </div>

            <div class="bg-slate-900/80 border border-slate-800 rounded p-3">
              <div class="flex items-center justify-between text-xs">
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">GET</span>
                <span class="text-cyan-300 font-bold">/robots.txt</span>
                <span class="text-slate-400">200 OK (12ms)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: DOM Tree Inspector -->
        <div id="dom-view" class="${this.activeTab === 'dom' ? 'flex' : 'hidden'} flex-col flex-1 bg-slate-950/90 font-mono text-xs overflow-hidden p-4">
          <div class="text-cyan-400 font-bold pb-2 border-b border-slate-800">DOCUMENT OBJECT MODEL INSPECTOR</div>
          <div class="flex-1 overflow-y-auto mt-2 space-y-1 text-slate-400">
            <div>&lt;<span class="text-pink-400">html</span> <span class="text-amber-300">lang</span>="<span class="text-emerald-300">en</span>"&gt;</div>
            <div class="pl-4">&lt;<span class="text-pink-400">head</span>&gt; ... &lt;/<span class="text-pink-400">head</span>&gt;</div>
            <div class="pl-4">&lt;<span class="text-pink-400">body</span> <span class="text-amber-300">class</span>="<span class="text-emerald-300">bg-slate-950</span>"&gt;</div>
            <div class="pl-8 text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-800/60 my-2">
              &lt;!-- SECRET_FLAG: FLAG{dom_c0mm3nt_inspected_42} // DEVELOPER OVERRIDE TOKEN --&gt;
            </div>
            <div class="pl-8">&lt;<span class="text-pink-400">main</span> <span class="text-amber-300">id</span>="<span class="text-emerald-300">app-root</span>"&gt; ... &lt;/<span class="text-pink-400">main</span>&gt;</div>
            <div class="pl-4">&lt;/<span class="text-pink-400">body</span>&gt;</div>
            <div>&lt;/<span class="text-pink-400">html</span>&gt;</div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const termTab = document.getElementById("term-tab-btn");
    const netTab = document.getElementById("net-tab-btn");
    const domTab = document.getElementById("dom-tab-btn");

    if (termTab) termTab.onclick = () => this.switchTab("terminal");
    if (netTab) netTab.onclick = () => this.switchTab("network");
    if (domTab) domTab.onclick = () => this.switchTab("dom");

    const input = document.getElementById("term-input");
    if (input) {
      input.addEventListener("keydown", (e) => {
        SOUND.playKeypress();
        if (e.key === "Enter") {
          const val = input.value;
          input.value = "";
          this.execute(val);
        }
      });
    }

    const netRefresh = document.getElementById("net-refresh-btn");
    if (netRefresh) {
      netRefresh.onclick = () => {
        SOUND.playBeep(900, 0.05);
        this.writeOutput("Network packets captured: 4 requests logged.");
      };
    }
  }

  switchTab(tab) {
    this.activeTab = tab;
    SOUND.playBeep(700, 0.04);
    this.render();
  }

  writeOutput(html, isCmd = false) {
    const out = document.getElementById("term-output");
    if (!out) return;
    const line = document.createElement("div");
    if (isCmd) {
      line.className = "text-cyan-300 font-bold pt-1";
      line.innerHTML = `<span class="text-cyan-500">WOPR:/></span> ${html}`;
    } else {
      line.className = "text-slate-300 leading-relaxed";
      line.innerHTML = html;
    }
    out.appendChild(line);
    out.scrollTop = out.scrollHeight;
  }

  execute(rawCmd) {
    const cmd = rawCmd.trim();
    if (!cmd) return;

    this.writeOutput(cmd, true);
    const parts = cmd.split(" ");
    const bin = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (bin) {
      case "help":
        this.writeOutput(`
          <div class="text-cyan-400 font-bold mb-1">AVAILABLE MAINFRAME COMMANDS:</div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-300">
            <div><span class="text-emerald-400 font-bold">cat &lt;path&gt;</span> : Display file (e.g. cat /robots.txt)</div>
            <div><span class="text-emerald-400 font-bold">curl &lt;url&gt;</span> : Query internal HTTP endpoint</div>
            <div><span class="text-emerald-400 font-bold">rot13 &lt;text&gt;</span> : Encode or decode ROT13 string</div>
            <div><span class="text-emerald-400 font-bold">hexdump &lt;hex&gt;</span> : Convert Hex to ASCII text</div>
            <div><span class="text-emerald-400 font-bold">base64 &lt;str&gt;</span> : Decode Base64 string to ASCII</div>
            <div><span class="text-emerald-400 font-bold">hash &lt;str&gt;</span> : Compute SHA-256 hash of string</div>
            <div><span class="text-emerald-400 font-bold">defcon</span> : Display nuclear defense readiness</div>
            <div><span class="text-emerald-400 font-bold">games</span> : List strategic simulation games</div>
            <div><span class="text-emerald-400 font-bold">clear</span> : Clear terminal output window</div>
          </div>
        `);
        break;

      case "clear":
        const out = document.getElementById("term-output");
        if (out) out.innerHTML = "";
        break;

      case "cat":
        const path = args[0] || "";
        if (path === "/robots.txt" || path === "robots.txt") {
          this.writeOutput(`
            <pre class="bg-slate-900 p-2 rounded border border-slate-800 text-emerald-400 font-mono text-[11px]">
# ==============================================================================
# W.O.P.R. DEFENSE MAINFRAME CRAWLER POLICY
# SYSTEM CLASSIFICATION: TOP SECRET // JOSHUA-RESTRICTED
# ==============================================================================
User-agent: *
Disallow: /admin/
Disallow: /telemetry/launch-codes/
Disallow: /wopr/internal-diagnostics/
Disallow: /vault/flag-r0b0ts-disallow/

# ACCESS GRANTED TO DISALLOWED SECTOR:
# FLAG{r0b0ts_txt_disallow_vault}
            </pre>
          `);
        } else {
          this.writeOutput(`<span class="text-red-400">cat: ${path}: No such file or directory. Try 'cat /robots.txt'</span>`);
        }
        break;

      case "curl":
        const url = args[0] || "";
        if (url.includes("/api/v1/auth/handshake")) {
          this.writeOutput(`
            <div class="bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
              <div class="text-emerald-400">HTTP/1.1 200 OK</div>
              <div class="text-slate-400">Content-Type: application/json</div>
              <div class="text-amber-300 font-bold">X-WOPR-DEFCON-KEY: JOSHUA-1983-DEFCON-1</div>
              <div class="text-slate-400">Server: WOPR-OS/1983</div>
              <div class="text-slate-300 mt-2 font-mono">{"status": "AUTHENTICATED", "defcon": 1, "protocol": "JOSHUA"}</div>
            </div>
          `);
        } else {
          this.writeOutput(`<span class="text-red-400">curl: Endpoint '${url}' not found. Try 'curl /api/v1/auth/handshake'</span>`);
        }
        break;

      case "rot13":
        const text = args.join(" ");
        if (!text) {
          this.writeOutput(`<span class="text-yellow-400">Usage: rot13 &lt;string&gt;</span>`);
        } else {
          const result = CRYPTO.rot13(text);
          this.writeOutput(`<span class="text-slate-400">ROT13 Result:</span> <span class="text-emerald-400 font-bold">${result}</span>`);
        }
        break;

      case "hexdump":
        const hex = args.join("");
        if (!hex) {
          this.writeOutput(`<span class="text-yellow-400">Usage: hexdump &lt;hex-string&gt;</span>`);
        } else {
          const ascii = CRYPTO.hexToAscii(hex);
          this.writeOutput(`<span class="text-slate-400">ASCII Decoded:</span> <span class="text-emerald-400 font-bold">${ascii}</span>`);
        }
        break;

      case "base64":
        const b64 = args.join("");
        if (!b64) {
          this.writeOutput(`<span class="text-yellow-400">Usage: base64 &lt;base64-string&gt;</span>`);
        } else {
          try {
            const dec = CRYPTO.base64Decode(b64);
            this.writeOutput(`<span class="text-slate-400">Base64 Decoded:</span> <span class="text-emerald-400 font-bold">${dec}</span>`);
          } catch {
            this.writeOutput(`<span class="text-red-400">Error: Invalid base64 sequence</span>`);
          }
        }
        break;

      case "hash":
        const inputStr = args.join(" ");
        if (!inputStr) {
          this.writeOutput(`<span class="text-yellow-400">Usage: hash &lt;string&gt;</span>`);
        } else {
          CRYPTO.hash(inputStr).then(h => {
            this.writeOutput(`<span class="text-slate-400">SHA-256 (Normalized):</span> <span class="text-cyan-400 font-mono">${h}</span>`);
          });
        }
        break;

      case "defcon":
        this.writeOutput(`
          <div class="text-red-400 font-bold">DEFCON 1 // MAXIMUM READINESS</div>
          <div class="text-slate-400">ALL SYSTEMS ARMED // JOSHUA AWAITING INPUT</div>
        `);
        break;

      case "games":
        this.writeOutput(`
          <div class="text-cyan-300 font-bold mb-1">SHALL WE PLAY A GAME?</div>
          <ul class="list-disc list-inside text-slate-300 space-y-0.5">
            <li>CHESS</li>
            <li>POKER</li>
            <li>FIGHTER COMBAT</li>
            <li>GUERRILLA ENGAGEMENT</li>
            <li>DESERT WARFARE</li>
            <li>AIR-TO-GROUND ACTIONS</li>
            <li>THEATERWIDE TACTICAL WARFARE</li>
            <li class="text-red-400 font-bold">GLOBAL THERMONUCLEAR WAR</li>
          </ul>
        `);
        break;

      default:
        this.writeOutput(`<span class="text-red-400">Unknown command: '${bin}'. Type 'help' for diagnostics.</span>`);
        break;
    }
  }
}


// --- File: js/supabase-client.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — SUPABASE REALTIME CLIENT & OFFLINE ENGINE
 * Dual-Mode: Supabase Postgres + Realtime with zero-config BroadcastChannel fallback
 * ==============================================================================
 */




class SupabaseClientManager {
  constructor() {
    this.client = null;
    this.realtimeChannel = null;
    this.listeners = [];
    this.broadcastChannel = null;
    this.mockTeams = [];
    this.isMockMode = true;

    this.initBroadcastChannel();
    this.initClient();
  }

  initBroadcastChannel() {
    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel("swpag_live_competition");
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === "SCORE_UPDATE") {
          this.notifyListeners(event.data.payload);
        }
      };
    }
  }

  broadcastLocalUpdate(payload) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: "SCORE_UPDATE", payload });
    }
    this.notifyListeners(payload);
  }

  onLeaderboardUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error("Listener error:", e); }
    });
  }

  initClient() {
    if (CONFIG.isSupabaseConfigured() && window.supabase) {
      try {
        this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        this.isMockMode = false;
        this.subscribeRealtime();
      } catch (err) {
        console.warn("Failed to init Supabase client, defaulting to local engine:", err);
        this.isMockMode = true;
      }
    } else {
      this.isMockMode = true;
      this.loadMockTeams();
    }
  }

  subscribeRealtime() {
    if (!this.client) return;

    this.realtimeChannel = this.client
      .channel("public-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          this.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE).then(data => {
            this.notifyListeners(data);
          });
        }
      )
      .subscribe();
  }

  // ----------------------------------------------------------------------------
  // Mock Engine (Zero-Config Standalone & Multi-Tab Broadcast)
  // ----------------------------------------------------------------------------
  loadMockTeams() {
    const saved = localStorage.getItem("swpag_mock_teams");
    if (saved !== null) {
      try {
        this.mockTeams = JSON.parse(saved);
        return;
      } catch {
        // Fallback
      }
    }
    // Initial mock competitors for demo immersion
    this.mockTeams = [
      {
        id: "mock-1",
        team_name: "ByteBandits",
        role_tag: "SecOps",
        avatar: "avatar-cyber",
        total_score: 550,
        challenges_solved: 4,
        last_submission_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        room_code: CONFIG.DEFAULT_ROOM_CODE
      },
      {
        id: "mock-2",
        team_name: "NullPointers",
        role_tag: "Full-Stack",
        avatar: "avatar-robot",
        total_score: 425,
        challenges_solved: 3,
        last_submission_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        room_code: CONFIG.DEFAULT_ROOM_CODE
      },
      {
        id: "mock-3",
        team_name: "KernelPanics",
        role_tag: "DevOps",
        avatar: "avatar-terminal",
        total_score: 275,
        challenges_solved: 2,
        last_submission_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        room_code: CONFIG.DEFAULT_ROOM_CODE
      }
    ];
    this.saveMockTeams();
  }

  saveMockTeams() {
    localStorage.setItem("swpag_mock_teams", JSON.stringify(this.mockTeams));
  }

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // API Methods (Supabase with Automatic Mock Fallback & Strict Timeouts)
  // ----------------------------------------------------------------------------
  async registerTeam(roomCode, teamName, roleTag = "Full-Stack", avatar = "terminal-green") {
    if (!this.isMockMode && this.client) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase register timeout")), 4000)
        );

        const checkPromise = this.client
          .from("teams")
          .select("*")
          .eq("room_code", roomCode)
          .eq("team_name", teamName)
          .maybeSingle();

        const { data: existing } = await Promise.race([checkPromise, timeoutPromise]);
        if (existing) {
          return { success: true, team: existing };
        }

        // Insert new team
        const insertPromise = this.client
          .from("teams")
          .insert([
            {
              room_code: roomCode,
              team_name: teamName,
              role_tag: roleTag,
              avatar: avatar,
              total_score: 0,
              challenges_solved: 0
            }
          ])
          .select()
          .single();

        const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
        if (error) throw error;
        if (data) return { success: true, team: data };
      } catch (err) {
        console.warn("Supabase register error, using local session:", err);
      }
    }

    // Local / Mock Mode Fallback
    let team = this.mockTeams.find(
      t => t.room_code === roomCode && t.team_name.toLowerCase() === teamName.toLowerCase()
    );

    if (!team) {
      team = {
        id: `local-${Date.now()}`,
        room_code: roomCode,
        team_name: teamName,
        role_tag: roleTag,
        avatar: avatar,
        total_score: 0,
        challenges_solved: 0,
        last_submission_at: new Date().toISOString()
      };
      this.mockTeams.push(team);
      this.saveMockTeams();
      this.fetchLeaderboard(roomCode).then(lb => this.broadcastLocalUpdate(lb));
    }

    return { success: true, team };
  }

  async fetchLeaderboard(roomCode = CONFIG.DEFAULT_ROOM_CODE) {
    if (!this.isMockMode && this.client) {
      try {
        // 4-second timeout wrapper so UI never hangs
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase leaderboard timeout")), 4000)
        );
        const fetchPromise = this.client
          .from("leaderboard_view")
          .select("*")
          .eq("room_code", roomCode)
          .order("rank", { ascending: true });

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
        if (!error && Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn("Supabase leaderboard fetch fallback to local:", err);
      }
    }

    // Local / Mock Leaderboard fallback
    const filtered = this.mockTeams.filter(t => t.room_code === roomCode);
    filtered.sort((a, b) => {
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score;
      }
      return new Date(a.last_submission_at) - new Date(b.last_submission_at);
    });

    return filtered.map((t, idx) => ({
      ...t,
      rank: idx + 1
    }));
  }

  async submitAnswer(roomCode, teamId, challengeId, rawAnswer, hintsUsedCount = 0) {
    const normalized = CRYPTO.normalize(rawAnswer);
    const answerHash = await CRYPTO.hash(rawAnswer);

    // Validate if teamId is a valid Postgres UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(teamId || ''));

    // If live Supabase is connected and teamId is a valid UUID, execute stored procedure with 5s timeout
    if (!this.isMockMode && this.client && isUuid) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Verification request timed out. Please try again.")), 5000)
        );

        const rpcPromise = this.client.rpc("submit_challenge_answer", {
          p_room_code: roomCode,
          p_team_id: teamId,
          p_challenge_id: challengeId,
          p_answer_hash: answerHash,
          p_hints_used: hintsUsedCount
        });

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);

        if (error) throw error;
        if (data) {
          if (data.success) {
            const updatedLeaderboard = await this.fetchLeaderboard(roomCode);
            this.broadcastLocalUpdate(updatedLeaderboard);
          }
          return data;
        }
      } catch (err) {
        console.warn("Supabase stored procedure submission failed, evaluating locally:", err);
      }
    }

    // Local / Offline Evaluation
    const challenge = getChallengeById(challengeId);
    if (!challenge) {
      return { success: false, error: "CHALLENGE_NOT_FOUND", message: "Challenge ID not recognized." };
    }

    // Verify hash match
    if (answerHash.toLowerCase() !== challenge.hash.toLowerCase()) {
      return { 
        success: false, 
        error: "INCORRECT_ANSWER", 
        message: "Access Denied: Hash verification failed." 
      };
    }

    // Calculate score
    const points = calculatePoints(challenge, hintsUsedCount);

    // Update mock team record
    let team = this.mockTeams.find(t => t.id === teamId || t.team_name === teamId);
    if (!team) {
      team = {
        id: teamId || `local-${Date.now()}`,
        room_code: roomCode,
        team_name: teamId || "Operator",
        role_tag: "Full-Stack",
        avatar: "terminal-green",
        total_score: 0,
        challenges_solved: 0,
        last_submission_at: new Date().toISOString()
      };
      this.mockTeams.push(team);
    }

    team.total_score += points;
    team.challenges_solved += 1;
    team.last_submission_at = new Date().toISOString();
    this.saveMockTeams();

    const updatedLeaderboard = await this.fetchLeaderboard(roomCode);
    this.broadcastLocalUpdate(updatedLeaderboard);

    return {
      success: true,
      challenge_id: challengeId,
      points_awarded: points,
      total_score: team.total_score,
      challenges_solved: team.challenges_solved,
      message: "AUTHENTICATION GRANTED // ACCESS CODES VERIFIED"
    };
  }

  // Operator Actions
  async resetAllState(roomCode = CONFIG.DEFAULT_ROOM_CODE) {
    if (!this.isMockMode && this.client) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Supabase reset RPC timeout")), 5000)
        );

        // 1. Invoke atomic reset stored procedure
        const rpcPromise = this.client.rpc("reset_room_data", {
          p_room_code: roomCode
        });

        const { data, error } = await Promise.race([rpcPromise, timeoutPromise]);
        if (error) {
          console.warn("RPC reset warning, attempting direct table deletions:", error);
          await this.client.from("submissions").delete().eq("room_code", roomCode);
          await this.client.from("teams").delete().eq("room_code", roomCode);
        }
      } catch (err) {
        console.warn("Supabase resetAllState warning:", err);
        try {
          await this.client.from("submissions").delete().eq("room_code", roomCode);
          await this.client.from("teams").delete().eq("room_code", roomCode);
        } catch (delErr) {
          console.error("Direct table deletion fallback failed:", delErr);
        }
      }
    }

    this.mockTeams = [];
    localStorage.setItem("swpag_mock_teams", JSON.stringify([]));
    localStorage.removeItem("swpag_session_v1");
    this.broadcastLocalUpdate([]);
    return { success: true };
  }

  async seedDemoBot(roomCode = CONFIG.DEFAULT_ROOM_CODE) {
    const botNames = ["CyberValkyries", "CircuitBreakers", "ZeroDayKnights", "CryptoWizards", "GhostPackets", "BinaryBandits"];
    const roles = ["SecOps", "DevOps", "Full-Stack", "QA", "SRE"];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)] + "-" + Math.floor(Math.random() * 90 + 10);
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const score = Math.floor(Math.random() * 500 + 100);
    const solved = Math.floor(Math.random() * 4 + 1);

    if (!this.isMockMode && this.client) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Bot seed timeout")), 4000)
        );

        const insertPromise = this.client
          .from("teams")
          .insert([
            {
              room_code: roomCode,
              team_name: randomName,
              role_tag: randomRole,
              avatar: "avatar-robot",
              total_score: score,
              challenges_solved: solved,
              last_submission_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        const { data, error } = await Promise.race([insertPromise, timeoutPromise]);
        if (!error && data) {
          const lb = await this.fetchLeaderboard(roomCode);
          this.broadcastLocalUpdate(lb);
          return { success: true, team: data };
        }
      } catch (err) {
        console.warn("Error inserting demo bot into Supabase:", err);
      }
    }

    // Local / Offline fallback
    const bot = {
      id: `bot-${Date.now()}`,
      room_code: roomCode,
      team_name: randomName,
      role_tag: randomRole,
      avatar: "avatar-robot",
      total_score: score,
      challenges_solved: solved,
      last_submission_at: new Date().toISOString()
    };
    this.mockTeams.push(bot);
    this.saveMockTeams();
    const lb = await this.fetchLeaderboard(roomCode);
    this.broadcastLocalUpdate(lb);
    return { success: true, team: bot };
  }
}

const SUPABASE = new SupabaseClientManager();


// --- File: js/app.js ---
/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — MASTER APPLICATION CONTROLLER
 * Routing, Onboarding Modal, Dynamic Challenge Renderer, Projector View & HUD
 * ==============================================================================
 */








class App {
  constructor() {
    this.currentView = "game"; // 'game' | 'leaderboard' | 'projector' | 'admin' | 'rules'
    this.selectedTier = "ALL";
    this.terminal = null;
    this.timerInterval = null;
    this.eventEndTime = null;
    this.confettiActive = false;

    this.init();
  }

  async init() {
    this.initTimer();
    this.initConfetti();
    this.bindGlobalNavigation();
    this.bindSoundToggle();
    this.bindOnboardingTriggers();

    // Setup terminal simulator
    this.terminal = new TerminalSimulator("terminal-container");

    // Listen for leaderboard broadcasts
    SUPABASE.onLeaderboardUpdate((leaderboard) => {
      this.updateLeaderboardViews(leaderboard);
      this.updateLiveTicker(leaderboard);
    });

    // Check routing hash (e.g. #projector)
    this.handleRouteHash();
    window.addEventListener("hashchange", () => this.handleRouteHash());

    // Always initialize HUD, challenges, and terminal so content is immediately visible
    this.updateUserHud();
    this.renderChallenges();
    if (this.terminal) this.terminal.render();

    // Check Onboarding
    if (!STORAGE.isAuthenticated() && this.currentView !== "projector") {
      this.showOnboardingModal();
    }

    // Initial leaderboard fetch
    const activeRoom = STORAGE.getSession()?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
    const initialLb = await SUPABASE.fetchLeaderboard(activeRoom);
    this.updateLeaderboardViews(initialLb);
    this.updateLiveTicker(initialLb);
  }

  // ----------------------------------------------------------------------------
  // Routing & Views
  // ----------------------------------------------------------------------------
  handleRouteHash() {
    const hash = (window.location.hash || "").replace("#", "").toLowerCase();
    if (["game", "leaderboard", "projector", "admin", "rules"].includes(hash)) {
      this.switchView(hash);
    } else if (!hash) {
      this.switchView("game");
    }
  }

  switchView(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;
    SOUND.playBeep(600, 0.03);

    // Toggle view containers
    const views = ["game", "leaderboard", "projector", "admin", "rules"];
    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === viewName) {
          el.classList.remove("hidden");
        } else {
          el.classList.add("hidden");
        }
      }
    });

    // Toggle active nav tab highlights
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.getAttribute("data-view") === viewName) {
        link.className = "nav-link px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm";
      } else {
        link.className = "nav-link px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors";
      }
    });

    // View-specific actions
    const currentRoom = STORAGE.getSession()?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
    if (viewName === "game") {
      this.renderChallenges();
      if (this.terminal) this.terminal.render();
    } else if (viewName === "projector") {
      SUPABASE.fetchLeaderboard(currentRoom).then(lb => this.updateProjectorView(lb));
    } else if (viewName === "leaderboard") {
      SUPABASE.fetchLeaderboard(currentRoom).then(lb => this.updateLeaderboardTable(lb));
    } else if (viewName === "admin") {
      this.renderAdminPanel();
    }
  }

  bindGlobalNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = link.getAttribute("data-view");
        this.switchView(targetView);
      });
    });

    // Terminal Drawer Toggle
    const termToggle = document.getElementById("terminal-toggle-btn");
    const termSection = document.getElementById("terminal-wrapper");
    if (termToggle && termSection) {
      termToggle.addEventListener("click", () => {
        termSection.classList.toggle("hidden");
        SOUND.playBeep(800, 0.04);
        termToggle.innerText = termSection.classList.contains("hidden") 
          ? "Show Mainframe Console" 
          : "Hide Mainframe Console";
      });
    }
  }

  bindSoundToggle() {
    const soundBtn = document.getElementById("sound-toggle-btn");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const isEnabled = SOUND.toggleSound();
        soundBtn.innerHTML = isEnabled 
          ? `<span class="text-emerald-400">🔊 AUDIO ON</span>` 
          : `<span class="text-slate-500">🔇 AUDIO OFF</span>`;
      });
    }
  }

  bindOnboardingTriggers() {
    // Open Onboarding Modal from Header or Banner
    const openBtns = [
      document.getElementById("open-onboarding-btn"),
      document.getElementById("hero-onboard-btn")
    ];
    openBtns.forEach(btn => {
      if (btn) {
        btn.addEventListener("click", () => {
          SOUND.playBeep(800, 0.04);
          this.showOnboardingModal();
        });
      }
    });

    // Close Modal Button
    const closeBtn = document.getElementById("close-onboarding-modal-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        SOUND.playBeep(400, 0.03);
        document.getElementById("onboarding-modal")?.classList.add("hidden");
      });
    }

    // Copy Onboarding Link Button
    const copyBtn = document.getElementById("copy-onboard-link-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const url = CONFIG.getParticipantOnboardingUrl();
        try {
          await navigator.clipboard.writeText(url);
          SOUND.playCorrect();
          const copyText = document.getElementById("copy-text");
          const copyIcon = document.getElementById("copy-icon");
          if (copyText) copyText.innerText = "Link Copied!";
          if (copyIcon) copyIcon.innerText = "✓";
          copyBtn.classList.add("bg-emerald-950", "border-emerald-500", "text-emerald-300");
          setTimeout(() => {
            if (copyText) copyText.innerText = "Copy Onboard Link";
            if (copyIcon) copyIcon.innerText = "📋";
            copyBtn.classList.remove("bg-emerald-950", "border-emerald-500", "text-emerald-300");
          }, 3000);
        } catch {
          prompt("Copy this participant onboarding link:", url);
        }
      });
    }
  }

  // ----------------------------------------------------------------------------
  // HUD & Timer
  // ----------------------------------------------------------------------------
  updateUserHud() {
    const session = STORAGE.getSession();
    const activeRoom = (session && session.roomCode) ? session.roomCode : CONFIG.DEFAULT_ROOM_CODE;

    const headerRoomEl = document.getElementById("header-room-badge");
    if (headerRoomEl) headerRoomEl.innerText = `ROOM: ${activeRoom}`;

    const hudRoomEl = document.getElementById("hud-room-code");
    if (hudRoomEl) hudRoomEl.innerText = activeRoom;

    const teamEl = document.getElementById("hud-team-name");
    const scoreEl = document.getElementById("hud-total-score");
    const roleEl = document.getElementById("hud-role-tag");
    const solvedEl = document.getElementById("hud-solved-count");

    if (teamEl) teamEl.innerText = session ? session.teamName : "Unregistered";
    if (scoreEl) scoreEl.innerText = `${session ? session.totalScore : 0} PTS`;
    if (roleEl) roleEl.innerText = session ? session.roleTag : "Full-Stack";
    if (solvedEl) solvedEl.innerText = `${Object.keys(session?.solvedChallenges || {}).length} / ${CHALLENGES.length}`;
  }

  initTimer() {
    // 90-minute countdown synchronized to localStorage or current session
    let storedEnd = localStorage.getItem("swpag_timer_end");
    if (!storedEnd) {
      storedEnd = Date.now() + CONFIG.DEFAULT_DURATION_MINUTES * 60 * 1000;
      localStorage.setItem("swpag_timer_end", String(storedEnd));
    }
    this.eventEndTime = parseInt(storedEnd, 10);

    const updateDisplay = () => {
      const now = Date.now();
      const remaining = Math.max(0, this.eventEndTime - now);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((remaining % (1000 * 60)) / 1000);

      const formatted = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

      const timerEls = document.querySelectorAll(".live-countdown");
      timerEls.forEach(el => { el.innerText = formatted; });

      if (remaining <= 0 && this.timerInterval) {
        clearInterval(this.timerInterval);
        timerEls.forEach(el => { el.innerText = "00:00:00 (EVENT CONCLUDED)"; });
      }
    };

    updateDisplay();
    this.timerInterval = setInterval(updateDisplay, 1000);
  }

  // ----------------------------------------------------------------------------
  // Onboarding Modal
  // ----------------------------------------------------------------------------
  showOnboardingModal() {
    const modal = document.getElementById("onboarding-modal");
    if (!modal) return;
    modal.classList.remove("hidden");

    // Close modal on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    };

    // Pre-populate active room code from config if not already set
    const roomInput = document.getElementById("input-room-code");
    if (roomInput && (!roomInput.value || roomInput.value === "DEFCON-1983")) {
      roomInput.value = CONFIG.DEFAULT_ROOM_CODE;
    }

    const form = document.getElementById("onboarding-form");
    const errBox = document.getElementById("onboarding-error");

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const roomCode = document.getElementById("input-room-code").value.trim().toUpperCase();
        const teamName = document.getElementById("input-team-name").value.trim();
        const roleTag = document.getElementById("select-role-tag").value;
        const avatar = document.querySelector('input[name="avatar-choice"]:checked')?.value || "terminal-green";

        if (!roomCode || !teamName) {
          errBox.innerText = "Please specify both Team Name and Access PIN.";
          errBox.classList.remove("hidden");
          SOUND.playError();
          return;
        }

        // Register team with Supabase / Local engine
        const regRes = await SUPABASE.registerTeam(roomCode, teamName, roleTag, avatar);
        if (!regRes.success) {
          errBox.innerText = regRes.error || "Failed to register team. Check PIN.";
          errBox.classList.remove("hidden");
          SOUND.playError();
          return;
        }

        STORAGE.initTeamSession(roomCode, teamName, roleTag, avatar, regRes.team?.id);
        SOUND.playCorrect();

        modal.classList.add("hidden");
        this.updateUserHud();
        this.renderChallenges();
        this.terminal.render();
      };
    }
  }

  // ----------------------------------------------------------------------------
  // Challenge Grid & Card Renderer
  // ----------------------------------------------------------------------------
  renderChallenges() {
    const container = document.getElementById("challenges-grid");
    if (!container) return;

    // Filter controls
    const filterContainer = document.getElementById("tier-filters");
    if (filterContainer) {
      filterContainer.innerHTML = `
        <div class="flex items-center space-x-2 text-xs font-mono">
          <button data-tier="ALL" class="tier-filter-btn px-3 py-1.5 rounded-lg border transition-all ${this.selectedTier === 'ALL' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800'}">
            ALL TIERS (10)
          </button>
          <button data-tier="A" class="tier-filter-btn px-3 py-1.5 rounded-lg border transition-all ${this.selectedTier === 'A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800'}">
            TIER A: SCAVENGER
          </button>
          <button data-tier="B" class="tier-filter-btn px-3 py-1.5 rounded-lg border transition-all ${this.selectedTier === 'B' ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800'}">
            TIER B: TRIVIA & ARCH
          </button>
          <button data-tier="C" class="tier-filter-btn px-3 py-1.5 rounded-lg border transition-all ${this.selectedTier === 'C' ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 font-bold' : 'bg-slate-900/60 text-slate-400 border-slate-800'}">
            TIER C: CRYPTO & CODE
          </button>
        </div>
      `;

      filterContainer.querySelectorAll(".tier-filter-btn").forEach(btn => {
        btn.onclick = () => {
          this.selectedTier = btn.getAttribute("data-tier");
          SOUND.playBeep(700, 0.03);
          this.renderChallenges();
        };
      });
    }

    const filtered = this.selectedTier === "ALL" 
      ? CHALLENGES 
      : CHALLENGES.filter(c => c.tier === this.selectedTier);

    container.innerHTML = "";

    filtered.forEach(chal => {
      const isSolved = STORAGE.isChallengeSolved(chal.id);
      const unlockedHints = STORAGE.getUnlockedHints(chal.id);
      const card = document.createElement("div");

      // Dynamic color by tier
      let borderGlow = "border-cyan-500/30";
      let tierColor = "text-cyan-400 bg-cyan-950/60 border-cyan-800/80";
      if (chal.tier === "A") {
        borderGlow = isSolved ? "border-emerald-500/60 shadow-emerald-950/30" : "border-emerald-500/30";
        tierColor = "text-emerald-400 bg-emerald-950/60 border-emerald-800/80";
      } else if (chal.tier === "B") {
        borderGlow = isSolved ? "border-amber-500/60 shadow-amber-950/30" : "border-amber-500/30";
        tierColor = "text-amber-400 bg-amber-950/60 border-amber-800/80";
      } else if (chal.tier === "C") {
        borderGlow = isSolved ? "border-purple-500/60 shadow-purple-950/30" : "border-purple-500/30";
        tierColor = "text-purple-400 bg-purple-950/60 border-purple-800/80";
      }

      card.className = `glass-panel rounded-xl p-5 border ${borderGlow} flex flex-col justify-between transition-all hover:scale-[1.01] ${isSolved ? 'bg-slate-900/90' : ''}`;

      card.innerHTML = `
        <div>
          <!-- Header: Category & Points -->
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-1 rounded text-[11px] font-mono font-bold border ${tierColor}">
              ${chal.id} // ${chal.category}
            </span>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-800/50">
                +${chal.points} PTS
              </span>
              ${isSolved ? `
                <span class="px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                  ✓ SOLVED
                </span>
              ` : ''}
            </div>
          </div>

          <!-- Title & Prompt -->
          <h3 class="text-base font-bold text-slate-100 mb-2 font-mono flex items-center gap-2">
            ${chal.title}
          </h3>
          <p class="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-line">
            ${chal.prompt}
          </p>

          ${chal.clue ? `
            <div class="text-[11px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-900/40 p-2.5 rounded-lg mb-4">
              <span class="font-bold text-cyan-300">INVESTIGATION LEAD:</span> ${chal.clue}
            </div>
          ` : ''}

          <!-- Hints System -->
          <div class="border-t border-slate-800/80 pt-3 mb-4">
            <div class="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span>HINTS & PENALTIES:</span>
              <span class="text-[11px] text-slate-500">${unlockedHints.length} / ${chal.hints.length} Unlocked</span>
            </div>
            <div class="space-y-2">
              ${chal.hints.map(h => {
                const isUnlocked = unlockedHints.includes(h.id);
                return `
                  <div class="text-xs p-2 rounded border ${isUnlocked ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-950/50 border-slate-800/60 text-slate-400'}">
                    <div class="flex items-center justify-between">
                      <span class="font-mono text-[11px] text-amber-400 font-semibold">Hint ${h.id} (-${h.penaltyPct}% penalty)</span>
                      ${!isUnlocked && !isSolved ? `
                        <button data-chal="${chal.id}" data-hint="${h.id}" class="unlock-hint-btn text-[11px] px-2 py-0.5 rounded bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 transition-colors">
                          Reveal Clue
                        </button>
                      ` : ''}
                    </div>
                    ${isUnlocked ? `
                      <p class="mt-1 text-slate-300 font-mono text-[11px]">${h.text}</p>
                    ` : ''}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>

        <!-- Submission Input Form -->
        <div class="border-t border-slate-800 pt-3 mt-2">
          ${isSolved ? `
            <div class="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-center text-xs font-mono text-emerald-400">
              AUTHENTICATION OVERRIDE COMPLETE // REWARD CREDITED
            </div>
          ` : `
            <form data-chal="${chal.id}" class="submission-form flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  name="answer" 
                  placeholder="${chal.inputPlaceholder || 'Enter solution...'}" 
                  autocomplete="off" 
                  class="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 text-slate-100 text-xs px-3 py-2 rounded-lg font-mono focus:outline-none placeholder-slate-600"
                />
                <button 
                  type="submit" 
                  class="submit-btn px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  TRANSMIT
                </button>
              </div>
              <div class="feedback-msg text-[11px] font-mono hidden pt-1"></div>
            </form>
          `}
        </div>
      `;

      container.appendChild(card);
    });

    this.bindChallengeInteractions();
  }

  bindChallengeInteractions() {
    // Unlock Hint button handlers
    document.querySelectorAll(".unlock-hint-btn").forEach(btn => {
      btn.onclick = () => {
        const chalId = btn.getAttribute("data-chal");
        const hintId = parseInt(btn.getAttribute("data-hint"), 10);
        SOUND.playHint();
        STORAGE.unlockHint(chalId, hintId);
        this.renderChallenges();
      };
    });

    // Submission form handlers
    document.querySelectorAll(".submission-form").forEach(form => {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const chalId = form.getAttribute("data-chal");
        const input = form.querySelector('input[name="answer"]');
        const feedback = form.querySelector(".feedback-msg");
        const submitBtn = form.querySelector(".submit-btn");

        const rawValue = input.value.trim();
        if (!rawValue) return;

        // Anti-Cheat: 3-second rate limit check
        const rateCheck = STORAGE.checkRateLimit();
        if (!rateCheck.allowed) {
          SOUND.playError();
          feedback.className = "feedback-msg text-[11px] font-mono text-amber-400";
          feedback.innerText = `Anti-Cheat Throttle: Please wait ${Math.ceil(rateCheck.remainingMs / 1000)}s before next attempt.`;
          feedback.classList.remove("hidden");
          return;
        }

        // Lock button during verification
        submitBtn.disabled = true;
        submitBtn.innerText = "VERIFYING...";
        STORAGE.recordSubmissionAttempt();

        let session = STORAGE.getSession();
        const roomCode = session?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
        let teamId = session?.teamId;

        // Auto-provision guest operator team if user submitted before registering
        if (!teamId || !session) {
          try {
            const guestName = "Operator-" + Math.floor(1000 + Math.random() * 9000);
            const regRes = await SUPABASE.registerTeam(roomCode, guestName, "Full-Stack", "terminal-green");
            teamId = regRes.team?.id;
            STORAGE.initTeamSession(roomCode, guestName, "Full-Stack", "terminal-green", teamId);
            session = STORAGE.getSession();
            this.updateUserHud();
          } catch (regErr) {
            console.warn("Guest team auto-provision warning:", regErr);
          }
        }

        const unlockedHints = STORAGE.getUnlockedHints(chalId);

        try {
          const result = await SUPABASE.submitAnswer(
            roomCode,
            teamId,
            chalId,
            rawValue,
            unlockedHints.length
          );

          if (result && result.success) {
            SOUND.playCorrect();
            this.triggerConfetti();
            STORAGE.recordSolve(chalId, result.points_awarded, unlockedHints.length);

            feedback.className = "feedback-msg text-[11px] font-mono text-emerald-400";
            feedback.innerText = `✓ ACCESS GRANTED: +${result.points_awarded} Points awarded!`;
            feedback.classList.remove("hidden");

            setTimeout(() => {
              this.updateUserHud();
              this.renderChallenges();
            }, 800);
          } else {
            SOUND.playError();
            feedback.className = "feedback-msg text-[11px] font-mono text-red-400";
            feedback.innerText = `✗ ${result?.message || 'Incorrect response. Verification failed.'}`;
            feedback.classList.remove("hidden");
          }
        } catch (err) {
          SOUND.playError();
          feedback.className = "feedback-msg text-[11px] font-mono text-red-400";
          feedback.innerText = `System error: ${err.message || 'Unable to transmit'}`;
          feedback.classList.remove("hidden");
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = "TRANSMIT";
        }
      };
    });
  }

  // ----------------------------------------------------------------------------
  // Leaderboard & Live Views
  // ----------------------------------------------------------------------------
  updateLeaderboardViews(leaderboard) {
    if (this.currentView === "leaderboard") {
      this.updateLeaderboardTable(leaderboard);
    } else if (this.currentView === "projector") {
      this.updateProjectorView(leaderboard);
    }
  }

  updateLiveTicker(leaderboard) {
    const ticker = document.getElementById("live-ticker-content");
    if (!ticker) return;

    if (!leaderboard || leaderboard.length === 0) {
      ticker.innerText = "W.O.P.R. TELEMETRY: ALL SECTORS NOMINAL // NO RECENT INTRUSIONS";
      return;
    }

    const items = leaderboard.slice(0, 5).map(t => {
      return `[#${t.rank}] ${t.team_name} (${t.total_score} PTS - ${t.challenges_solved} SOLVED)`;
    });

    ticker.innerText = `DEFCON 1 STATUS // TOP TRANSMITTERS: ${items.join("  ✦  ")}`;
  }

  updateLeaderboardTable(leaderboard) {
    const tbody = document.getElementById("leaderboard-tbody");
    if (!tbody) return;

    if (!leaderboard || leaderboard.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-500 font-mono text-xs">NO ACTIVE TEAMS REGISTERED YET</td></tr>`;
      return;
    }

    const session = STORAGE.getSession();
    const myTeamId = session?.teamId;

    tbody.innerHTML = leaderboard.map(team => {
      const isMe = team.team_id === myTeamId || team.id === myTeamId;
      let rankBadge = `<span class="font-mono text-slate-400">#${team.rank}</span>`;
      if (team.rank === 1) rankBadge = `<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">🥇 #1</span>`;
      else if (team.rank === 2) rankBadge = `<span class="px-2 py-0.5 rounded bg-slate-400/20 text-slate-300 border border-slate-400/40 font-bold">🥈 #2</span>`;
      else if (team.rank === 3) rankBadge = `<span class="px-2 py-0.5 rounded bg-amber-700/20 text-amber-500 border border-amber-700/40 font-bold">🥉 #3</span>`;

      return `
        <tr class="border-b border-slate-800/80 hover:bg-slate-900/50 transition-colors ${isMe ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400' : ''}">
          <td class="px-4 py-3 text-xs">${rankBadge}</td>
          <td class="px-4 py-3 text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
            ${team.team_name}
            ${isMe ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300">YOU</span>' : ''}
          </td>
          <td class="px-4 py-3 text-xs">
            <span class="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
              ${team.role_tag || 'Team'}
            </span>
          </td>
          <td class="px-4 py-3 text-xs font-mono text-cyan-400">${team.challenges_solved} / 10</td>
          <td class="px-4 py-3 text-xs font-mono font-bold text-amber-400">${team.total_score} PTS</td>
          <td class="px-4 py-3 text-[11px] font-mono text-slate-500">
            ${team.last_submission_at ? new Date(team.last_submission_at).toLocaleTimeString() : '—'}
          </td>
        </tr>
      `;
    }).join("");
  }

  updateProjectorView(leaderboard) {
    const podiumContainer = document.getElementById("projector-podium");
    const listContainer = document.getElementById("projector-roster");
    if (!podiumContainer || !listContainer) return;

    if (!leaderboard || leaderboard.length === 0) {
      podiumContainer.innerHTML = `<div class="text-slate-500 font-mono text-sm">AWAITING SYSTEM INTRUSIONS...</div>`;
      listContainer.innerHTML = "";
      return;
    }

    const first = leaderboard[0];
    const second = leaderboard[1];
    const third = leaderboard[2];

    podiumContainer.innerHTML = `
      <!-- Rank 2 -->
      <div class="flex flex-col items-center flex-1 order-1">
        ${second ? `
          <div class="text-xs font-mono text-slate-400 mb-1 font-bold">2ND PLACE</div>
          <div class="glass-panel podium-2 w-full p-4 rounded-xl flex flex-col items-center shadow-lg">
            <span class="text-2xl mb-1">🥈</span>
            <div class="text-base font-bold font-mono text-slate-200 text-center">${second.team_name}</div>
            <div class="text-xs font-mono text-slate-400 mt-1">${second.role_tag}</div>
            <div class="text-lg font-extrabold font-mono text-amber-400 mt-2">${second.total_score} PTS</div>
            <div class="text-[11px] font-mono text-emerald-400 mt-0.5">${second.challenges_solved} Solved</div>
          </div>
        ` : '<div class="text-slate-600 font-mono text-xs">Awaiting Team...</div>'}
      </div>

      <!-- Rank 1 (Tallest Center) -->
      <div class="flex flex-col items-center flex-1 order-2 transform -translate-y-4">
        ${first ? `
          <div class="text-xs font-mono text-amber-400 mb-1 font-extrabold tracking-wider animate-pulse">👑 CHAMPION</div>
          <div class="glass-panel podium-1 w-full p-5 rounded-xl flex flex-col items-center shadow-2xl border-amber-500/50">
            <span class="text-4xl mb-1">🥇</span>
            <div class="text-lg font-black font-mono text-amber-300 text-center glow-amber">${first.team_name}</div>
            <div class="text-xs font-mono text-slate-300 mt-1">${first.role_tag}</div>
            <div class="text-2xl font-black font-mono text-amber-400 mt-2">${first.total_score} PTS</div>
            <div class="text-xs font-mono text-emerald-400 font-bold mt-1">${first.challenges_solved} Solved</div>
          </div>
        ` : ''}
      </div>

      <!-- Rank 3 -->
      <div class="flex flex-col items-center flex-1 order-3">
        ${third ? `
          <div class="text-xs font-mono text-amber-600 mb-1 font-bold">3RD PLACE</div>
          <div class="glass-panel podium-3 w-full p-4 rounded-xl flex flex-col items-center shadow-lg">
            <span class="text-2xl mb-1">🥉</span>
            <div class="text-base font-bold font-mono text-slate-200 text-center">${third.team_name}</div>
            <div class="text-xs font-mono text-slate-400 mt-1">${third.role_tag}</div>
            <div class="text-lg font-extrabold font-mono text-amber-400 mt-2">${third.total_score} PTS</div>
            <div class="text-[11px] font-mono text-emerald-400 mt-0.5">${third.challenges_solved} Solved</div>
          </div>
        ` : '<div class="text-slate-600 font-mono text-xs">Awaiting Team...</div>'}
      </div>
    `;

    // Render remaining ranks (4th+)
    const rest = leaderboard.slice(3);
    listContainer.innerHTML = rest.map(t => `
      <div class="glass-panel p-3 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div class="flex items-center space-x-3">
          <span class="text-slate-500 font-bold w-6">#${t.rank}</span>
          <span class="font-bold text-slate-200">${t.team_name}</span>
          <span class="text-slate-400 text-[11px] px-2 py-0.5 bg-slate-900 rounded">${t.role_tag}</span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-slate-400">${t.challenges_solved} Solved</span>
          <span class="font-bold text-amber-400">${t.total_score} PTS</span>
        </div>
      </div>
    `).join("");
  }

  // ----------------------------------------------------------------------------
  // Admin & Operator Panel
  // ----------------------------------------------------------------------------
  renderAdminPanel() {
    const sbUrlInput = document.getElementById("admin-sb-url");
    const sbKeyInput = document.getElementById("admin-sb-key");
    const statusText = document.getElementById("admin-sb-status");

    if (sbUrlInput) sbUrlInput.value = CONFIG.SUPABASE_URL;
    if (sbKeyInput) sbKeyInput.value = CONFIG.SUPABASE_ANON_KEY;

    if (statusText) {
      if (CONFIG.isSupabaseConfigured()) {
        statusText.innerHTML = `<span class="text-emerald-400 font-bold">● CONNECTED TO LIVE SUPABASE BACKEND</span>`;
      } else {
        statusText.innerHTML = `<span class="text-amber-400 font-bold">● RUNNING IN STANDALONE DEMO ENGINE (LOCALSTORAGE + BROADCASTCHANNEL)</span>`;
      }
    }

    const saveSbBtn = document.getElementById("admin-save-sb");
    if (saveSbBtn) {
      saveSbBtn.onclick = () => {
        CONFIG.saveSupabaseConfig(sbUrlInput.value, sbKeyInput.value);
        SOUND.playCorrect();
        alert("Supabase configuration saved! Reloading application...");
        window.location.reload();
      };
    }

    const seedBotBtn = document.getElementById("admin-seed-bot");
    if (seedBotBtn) {
      seedBotBtn.onclick = async () => {
        const originalText = seedBotBtn.innerText;
        seedBotBtn.disabled = true;
        seedBotBtn.innerText = "DEPLOYING BOT...";
        const session = STORAGE.getSession();
        const roomCode = session?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
        await SUPABASE.seedDemoBot(roomCode);
        SOUND.playBeep(880, 0.05);
        seedBotBtn.innerText = "✓ BOT DEPLOYED!";
        setTimeout(() => {
          seedBotBtn.disabled = false;
          seedBotBtn.innerText = originalText;
        }, 1200);
      };
    }

    const resetBtn = document.getElementById("admin-reset-all");
    if (resetBtn) {
      resetBtn.onclick = async () => {
        const session = STORAGE.getSession();
        const roomCode = session?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
        if (confirm(`WARNING: Are you sure you want to reset all game state, scores, and teams for room ${roomCode}? This action cannot be undone.`)) {
          const originalText = resetBtn.innerText;
          resetBtn.disabled = true;
          resetBtn.innerText = "RESETTING MISSION DATA...";
          try {
            await SUPABASE.resetAllState(roomCode);
            STORAGE.clearSession();
            SOUND.playError();
            alert(`All game, team, and session data for room ${roomCode} has been reset.`);
          } catch (err) {
            console.error("Reset error:", err);
            alert("Reset completed with warnings. Refreshing interface...");
          } finally {
            window.location.reload();
          }
        }
      };
    }

    const exportBtn = document.getElementById("admin-export-csv");
    if (exportBtn) {
      exportBtn.onclick = async () => {
        const session = STORAGE.getSession();
        const roomCode = session?.roomCode || CONFIG.DEFAULT_ROOM_CODE;
        const lb = await SUPABASE.fetchLeaderboard(roomCode);
        this.exportLeaderboardCsv(lb);
      };
    }
  }

  exportLeaderboardCsv(leaderboard) {
    if (!leaderboard || leaderboard.length === 0) {
      alert("No leaderboard records to export.");
      return;
    }

    const headers = ["Rank", "Team Name", "Role Tag", "Challenges Solved", "Total Score", "Last Submission At", "Room Code"];
    const rows = leaderboard.map(t => [
      t.rank,
      `"${t.team_name.replace(/"/g, '""')}"`,
      `"${t.role_tag || ''}"`,
      t.challenges_solved,
      t.total_score,
      t.last_submission_at,
      t.room_code
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shall_we_play_a_game_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ----------------------------------------------------------------------------
  // Celebration Confetti Particle Engine
  // ----------------------------------------------------------------------------
  initConfetti() {
    this.canvas = document.getElementById("confetti-canvas");
    if (!this.canvas || typeof this.canvas.getContext !== "function") return;
    this.ctx = this.canvas.getContext("2d");
    this.particles = [];

    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", resize);
    resize();
  }

  triggerConfetti() {
    if (!this.canvas) return;
    const colors = ["#00e5ff", "#00ff88", "#ffb703", "#ff0055", "#ffffff"];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        x: window.innerWidth / 2 + (Math.random() * 200 - 100),
        y: window.innerHeight * 0.3,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 12,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    if (!this.confettiActive) {
      this.confettiActive = true;
      this.animateConfetti();
    }
  }

  animateConfetti() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.rSpeed;
      p.opacity -= 0.012;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();

      if (p.opacity <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      requestAnimationFrame(() => this.animateConfetti());
    } else {
      this.confettiActive = false;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Instantiate App once DOM is loaded or immediately if already ready
function initApp() {
  if (!window.SWPAG_APP) {
    window.SWPAG_APP = new App();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}



})();
