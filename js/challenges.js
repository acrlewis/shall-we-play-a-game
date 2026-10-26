/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CHALLENGES DATA STORE & PROGRESSIVE UNLOCK
 * 10 Authoritative Technical Challenges across 3 Tiers
 * ==============================================================================
 */

export const CHALLENGES = [
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

export function getChallengeById(id) {
  return CHALLENGES.find(c => c.id === id);
}

export function calculatePoints(challenge, hintsUsedCount = 0) {
  let penalty = 0;
  if (hintsUsedCount === 1) penalty = 0.10;
  else if (hintsUsedCount >= 2) penalty = 0.35;
  return Math.max(10, Math.round(challenge.points * (1 - penalty)));
}
