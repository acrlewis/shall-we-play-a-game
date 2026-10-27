# "SHALL WE PLAY A GAME?" — OFFICIAL SOLUTIONS MANUAL
### Comprehensive Challenge Walkthroughs, Flag Keys, Clues, Hints & Step-by-Step Technical Explanations

> **CONFIDENTIAL // EVENT MASTER & INSTRUCTOR REFERENCE ONLY**  
> This document details the exact questions, accepted answers, hints, mathematical/algorithmic breakdowns, and step-by-step solutions for all 10 challenges in the *Shall We Play a Game?* competition platform.

---

## Challenge Quick-Reference Matrix

| ID | Title | Tier | Points | Exact Normalized Answer | Validation SHA-256 Hash |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`CHAL-01`** | Ghost in the DOM | A | 100 | `FLAG{dom_c0mm3nt_inspected_42}` | `8937c905c3fff1b71bef90820a542a89aff496b4c6a59496b009d1448d564992` |
| **`CHAL-02`** | Robots & Disallowed Vectors | A | 150 | `FLAG{r0b0ts_txt_disallow_vault}` | `f5fa62cfa32620be876f5fa094cf3d9bce88983fc9cea32bff8d769f7b4cbdd6` |
| **`CHAL-03`** | The Secret Header | A | 175 | `JOSHUA-1983-DEFCON-1` | `129a1e533ccacf4309657b9d6502cae8ba9287b212f58ed12e2a9a2ab668d3d5` |
| **`CHAL-04`** | POSIX Signal Mastery | B | 125 | `SIGINT` | `71757acbda69de04e219cf2cc4c27facceb4179313526d105e680aa0afb8009e` |
| **`CHAL-05`** | The CAP Conundrum | B | 150 | `AP` | `84810bfea2375dab1b1c8417b8eed248488f55b002f091f4d4ef37dffca3b307` |
| **`CHAL-06`** | The Regex Network Hunter | B | 150 | `10.240.16.1` | `2534c564adcb9b4274f7694696cc7691b63533367ea690dd5d44b9ddb6f9d066` |
| **`CHAL-07`** | Rate Limit Standards | B | 100 | `429` | `2d1007980f49215311f7f1012e84f99b801eb5daeca04dedea3ada41cc45353b` |
| **`CHAL-08`** | Caesar of the Mainframe | C | 200 | `WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME` | `7852c608776bcb23d270a3f2439255d6d4862206d03caaaa568912cd208c64dd` |
| **`CHAL-09`** | The Layered Capsule | C | 250 | `SHALL WE PLAY A GAME?` | `ad81339fd2ed2d3099869eda8ee8bf832a5c96187a416790850a6316aa4aa7f4` |
| **`CHAL-10`** | The Off-By-One Quantum Gate | C | 300 | `42` | `73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049` |

---

## Detailed Challenge Solutions

```
================================================================================
TIER A: WEB SCAVENGER & OSINT (RECONNAISSANCE)
================================================================================
```

### CHAL-01: Ghost in the DOM

- **Tier:** Tier A: Web Scavenger & OSINT
- **Category:** DOM & Elements
- **Max Points:** 100 PTS
- **Target Answer:** `FLAG{dom_c0mm3nt_inspected_42}`
- **Validation Hash (SHA-256):** `8937c905c3fff1b71bef90820a542a89aff496b4c6a59496b009d1448d564992`
- **Input Placeholder:** `FLAG{...}`

#### The Question
> *"A rogue W.O.P.R. systems engineer left a clandestine debug marker embedded directly inside the document object model of this application. Inspect the page markup using browser DevTools or the embedded Terminal Simulator."*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Open browser DevTools (`Ctrl+Shift+I` or `Cmd+Option+I`) and inspect the root `<body>` element, or toggle the W.O.P.R. Terminal tool and inspect the DOM tab.
- **Hint 1 (-10% penalty / 90 pts net):** Check HTML comments near the main container element or footer in the source.
- **Hint 2 (-25% penalty / 75 pts net):** Search the Elements panel or DOM Inspector for `'SECRET_FLAG'`.

#### Step-by-Step Solution

Participants have three distinct methods to extract the secret token:

##### Method 1: Native Browser DevTools (Web Inspector)
1. In Google Chrome, Microsoft Edge, Firefox, or Safari, press `F12` (or right-click anywhere on the page and select **Inspect**, or press `Cmd+Option+I` on macOS / `Ctrl+Shift+I` on Windows/Linux).
2. Switch to the **Elements** tab (DOM inspector).
3. Look directly beneath the opening `<body>` tag:
   ```html
   <!-- ==============================================================================
        SECRET_FLAG: FLAG{dom_c0mm3nt_inspected_42} // DEVELOPER OVERRIDE TOKEN
        W.O.P.R. SYSTEMS DIAGNOSTIC LOG: CHAL-01 COMPLETE
        ============================================================================== -->
   ```
4. Copy the flag token string: `FLAG{dom_c0mm3nt_inspected_42}`.
5. Paste it into the challenge submission box and click **Transmit**.

##### Method 2: Embedded W.O.P.R. Mainframe Simulator (Enterprise / Mobile Friendly)
1. On the main **Arena** view, locate the embedded W.O.P.R. Mainframe Console below the challenge list.
2. Click the **`</> DOM Tree`** tab in the terminal toolbar.
3. The visual DOM tree renders simulated node hierarchy with comments highlighted in green syntax:
   ```html
   <!-- SECRET_FLAG: FLAG{dom_c0mm3nt_inspected_42} // DEVELOPER OVERRIDE TOKEN -->
   ```
4. Submit the flag token.

##### Method 3: View Page Source
1. Press `Ctrl+U` (Windows/Linux) or `Cmd+Option+U` (macOS).
2. In the source viewer, press `Ctrl+F` / `Cmd+F` and search for `SECRET_FLAG`.
3. Locate line 45 and extract `FLAG{dom_c0mm3nt_inspected_42}`.

---

### CHAL-02: Robots & Disallowed Vectors

- **Tier:** Tier A: Web Scavenger & OSINT
- **Category:** Web Security & Crawlers
- **Max Points:** 150 PTS
- **Target Answer:** `FLAG{r0b0ts_txt_disallow_vault}`
- **Validation Hash (SHA-256):** `f5fa62cfa32620be876f5fa094cf3d9bce88983fc9cea32bff8d769f7b4cbdd6`
- **Input Placeholder:** `FLAG{...}`

#### The Question
> *"Before automated web scrapers index search engines, they query standard compliance directives to determine forbidden sectors. Check the host's crawler policy to locate the hidden perimeter flag."*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Direct your browser to `/robots.txt` or type `'cat /robots.txt'` in the W.O.P.R. Console.
- **Hint 1 (-10% penalty / 135 pts net):** Every compliant web server hosts a plain text file at the root path detailing crawler permissions.
- **Hint 2 (-25% penalty / 112 pts net):** Check the last Disallow directive or read the notice in `/robots.txt`.

#### Step-by-Step Solution

##### Method 1: Web Browser Direct URL Navigation
1. In the browser address bar, append `/robots.txt` to the website root URL:
   - On GitHub Pages: `https://<org>.github.io/<repo>/robots.txt`
   - On Local Server: `http://localhost:8080/robots.txt`
2. The web server serves the static robots policy file:
   ```text
   # ==============================================================================
   # W.O.P.R. DEFENSE MAINFRAME CRAWLER POLICY
   # SYSTEM CLASSIFICATION: TOP SECRET // JOSHUA-RESTRICTED
   # ==============================================================================

   User-agent: *
   Disallow: /admin/
   Disallow: /telemetry/launch-codes/
   Disallow: /wopr/internal-diagnostics/
   Disallow: /vault/flag-r0b0ts-disallow/

   # ------------------------------------------------------------------------------
   # SCAVENGER NOTICE:
   # Looking for Challenge 02 Flag?
   # ACCESS GRANTED TO DISALLOWED SECTOR:
   # FLAG{r0b0ts_txt_disallow_vault}
   # ------------------------------------------------------------------------------
   ```
3. Copy the token: `FLAG{r0b0ts_txt_disallow_vault}`.
4. Paste it into the input box on the competition dashboard.

##### Method 2: Embedded W.O.P.R. Console CLI
1. Click into the command input field of the embedded terminal on the Arena page.
2. Run the command:
   ```bash
   cat /robots.txt
   ```
3. The simulated terminal immediately prints the content of the `robots.txt` policy along with the flag.

---

### CHAL-03: The Secret Header

- **Tier:** Tier A: Web Scavenger & OSINT
- **Category:** HTTP Telemetry
- **Max Points:** 175 PTS
- **Target Answer:** `JOSHUA-1983-DEFCON-1`
- **Validation Hash (SHA-256):** `129a1e533ccacf4309657b9d6502cae8ba9287b212f58ed12e2a9a2ab668d3d5`
- **Input Placeholder:** `JOSHUA-XXXX-DEFCON-X`

#### The Question
> *"When our simulated internal auth handshake initiates, the server attaches a non-standard military response header: `X-WOPR-DEFCON-KEY`. Inspect the simulated network traffic on `/api/v1/auth/handshake` to retrieve the key."*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Open the W.O.P.R. Terminal Simulator -> Network tab, or run `'curl /api/v1/auth/handshake'` in the terminal.
- **Hint 1 (-10% penalty / 157 pts net):** The custom header begins with `'X-WOPR-DEFCON-KEY'`.
- **Hint 2 (-25% penalty / 131 pts net):** Format: `JOSHUA-1983-DEFCON-1`. Check the simulated headers table in the Network tab.

#### Step-by-Step Solution

##### Method 1: Embedded W.O.P.R. CLI `curl`
1. Focus the terminal command line prompt (`guest@wopr-terminal:~$`).
2. Execute the HTTP request:
   ```bash
   curl /api/v1/auth/handshake
   ```
3. The simulator outputs the full HTTP response stream:
   ```http
   HTTP/1.1 200 OK
   Content-Type: application/json
   X-WOPR-DEFCON-KEY: JOSHUA-1983-DEFCON-1
   Server: WOPR-OS/1983
   Access-Control-Allow-Origin: *

   {"status": "AUTHENTICATED", "defcon": 1, "protocol": "JOSHUA"}
   ```
4. Read the value associated with the header key `X-WOPR-DEFCON-KEY`:
   `JOSHUA-1983-DEFCON-1`
5. Transmit this value.

##### Method 2: Embedded Network Sniffer Tab
1. Click the **`⇄ Network`** tab on the terminal toolbar.
2. In the telemetry log, click on the row:
   `GET /api/v1/auth/handshake [200 OK]`
3. In the right-hand **Response Headers** inspector, observe:
   - `Content-Type: application/json`
   - `Server: WOPR-OS/1983`
   - `X-WOPR-DEFCON-KEY: JOSHUA-1983-DEFCON-1`
4. Copy the value and submit.

---

```
================================================================================
TIER B: TECH TRIVIA & ARCHITECTURE (SYSTEMS & PROTOCOLS)
================================================================================
```

### CHAL-04: POSIX Signal Mastery

- **Tier:** Tier B: Tech Trivia & Architecture
- **Category:** POSIX & Systems
- **Max Points:** 125 PTS
- **Target Answer:** `SIGINT`
- **Validation Hash (SHA-256):** `71757acbda69de04e219cf2cc4c27facceb4179313526d105e680aa0afb8009e`
- **Input Placeholder:** `SIG...`

#### The Question
> *"When a systems engineer triggers [Ctrl] + [C] in a standard POSIX shell (bash/zsh), which asynchronous inter-process termination signal name is sent to the foreground process group?"*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Provide the standard uppercase signal name (e.g. `SIGKILL`, `SIGHUP`, `SIGTERM`, ...).
- **Hint 1 (-10% penalty / 112 pts net):** It has signal integer number 2 on standard Linux x86/ARM.
- **Hint 2 (-25% penalty / 93 pts net):** The signal stands for "Signal Interrupt".

#### Step-by-Step Solution & Systems Background
1. **Operating System Mechanics:**
   - Under standard POSIX terminal line discipline (`termios`), pressing `Ctrl+C` generates the ASCII control character `ETX` (End of Text, ASCII byte value `0x03`).
   - The kernel tty/pty driver catches this character and dispatches an asynchronous IPC signal to all processes in the controlling terminal's foreground process group.
2. **Signal Identification:**
   - The POSIX signal assigned to this keystroke is signal number `2`, defined in `<signal.h>` as **`SIGINT`** (Signal Interrupt).
   - In contrast, `Ctrl+\` sends `SIGQUIT` (signal 3, generating a core dump), and `Ctrl+Z` sends `SIGTSTP` (signal 20, stopping process execution).
3. **Submission:**
   Type **`SIGINT`** (the system normalization automatically handles lowercase inputs like `sigint`, but uppercase is canonical).

---

### CHAL-05: The CAP Conundrum

- **Tier:** Tier B: Tech Trivia & Architecture
- **Category:** Distributed Systems
- **Max Points:** 150 PTS
- **Target Answer:** `AP`
- **Validation Hash (SHA-256):** `84810bfea2375dab1b1c8417b8eed248488f55b002f091f4d4ef37dffca3b307`
- **Input Placeholder:** `XX`

#### The Question
> *"According to Eric Brewer's CAP Theorem, a distributed data store can guarantee at most two of three properties during network partitioning. When an active network partition occurs, systems like Apache Cassandra or Amazon Dynamo configured for high availability choose Availability over Consistency. What is the standard 2-letter classification for this architectural posture?"*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Enter the 2-letter uppercase acronym (e.g., `CP`, `CA`, or `AP`).
- **Hint 1 (-10% penalty / 135 pts net):** Partition tolerance (P) is mandatory on real networks. Which property did the system preserve?
- **Hint 2 (-25% penalty / 112 pts net):** Availability (A) + Partition Tolerance (P).

#### Step-by-Step Solution & Distributed Architecture Principles
1. **CAP Theorem Definition:**
   - **Consistency (C):** Every read receives the most recent write or an error.
   - **Availability (A):** Every non-failing node returns a non-error response for any request (without guaranteeing it contains the latest write).
   - **Partition Tolerance (P):** The system continues to operate despite arbitrary communication delays or message drops between nodes.
2. **The Partition Reality Trade-Off:**
   - On physical distributed networks, partitions ($P$) are inevitable due to fiber cuts, router failures, and packet loss.
   - Therefore, a distributed system must choose between:
     - **$CP$ (Consistency + Partition Tolerance):** Rejects or times out client requests when quorum cannot be reached (e.g., Google Spanner, Etcd, ZooKeeper).
     - **$AP$ (Availability + Partition Tolerance):** Accepts reads and writes on both sides of a partition to ensure 100% uptime, allowing replica divergence that resolves via eventual consistency, vector clocks, or Last-Write-Wins (e.g., Apache Cassandra, Couchbase, Amazon Dynamo).
3. **Answering:**
   The question specifically highlights choosing *Availability over Consistency* during partitions, which designates an **`AP`** system.

---

### CHAL-06: The Regex Network Hunter

- **Tier:** Tier B: Tech Trivia & Architecture
- **Category:** Regex & Network Logs
- **Max Points:** 150 PTS
- **Target Answer:** `10.240.16.1`
- **Validation Hash (SHA-256):** `2534c564adcb9b4274f7694696cc7691b63533367ea690dd5d44b9ddb6f9d066`
- **Input Placeholder:** `XXX.XXX.XXX.XXX`

#### The Question
> *"An anomalous telemetry record appeared in the W.O.P.R. gateway logs:*  
> `2026-10-22T06:14:02.812Z [ROUTER-CORE] Ingress packet dropped from 172.16.4.99; Internal default gateway route assigned to 31 30 2e 32 34 30 2e 31 36 2e 31 via interface vlan100; MAC 00:1A:2B:3C:4D:5E`  
> *What is the IP address of the internal default gateway in this log message?"*

#### In-Game Clue & Progressive Hints
- **Default Clue:** The IP address is listed in the log message in hexadecimal format. Extract the exact IPv4 address matching the gateway clause with hexdump in the terminal.
- **Hint 1 (-10% penalty / 135 pts net):** Look closely at the clause 'Internal default gateway route assigned to ...'.
- **Hint 2 (-25% penalty / 112 pts net):** It belongs to the private RFC 1918 Class A 10.x.x.x block.

#### Step-by-Step Solution
1. **Analyze the Raw Telemetry String:**
   Break down the segments of the log record:
   - Timestamp: `2026-10-22T06:14:02.812Z`
   - Host: `[ROUTER-CORE]`
   - Dropped packet source IP: `172.16.4.99` (RFC 1918 Class B address)
   - Route Assignment: `Internal default gateway route assigned to 31 30 2e 32 34 30 2e 31 36 2e 31 via interface vlan100`
   - Hardware address: `00:1A:2B:3C:4D:5E`

2. **Hexadecimal String Extraction & Decoding:**
   - **Regex Target Isolation:**  
     Extract the space-delimited hex sequence following the route assignment clause:
     ```regex
     gateway route assigned to ([0-9a-fA-F ]+) via
     ```
     Capture group 1 extracts: `31 30 2e 32 34 30 2e 31 36 2e 31`.
   - **Hex to ASCII Translation:**  
     Each two-character hex pair represents an ASCII byte:
     - `31` = `1`
     - `30` = `0`
     - `2e` = `.`
     - `32` = `2`
     - `34` = `4`
     - `30` = `0`
     - `2e` = `.`
     - `31` = `1`
     - `36` = `6`
     - `2e` = `.`
     - `31` = `1`  
     Joining these decoded characters produces the IPv4 address: `10.240.16.1`.

3. **Decoding Methods:**
   - **Embedded W.O.P.R. Terminal:**  
     Use the built-in `hexdump` tool in the Terminal Simulator tab:
     ```bash
     hexdump 31 30 2e 32 34 30 2e 31 36 2e 31
     # ASCII Decoded: 10.240.16.1
     ```
   - **Host Terminal (CLI):**  
     ```bash
     echo "31 30 2e 32 34 30 2e 31 36 2e 31" | xxd -r -p
     # 10.240.16.1
     ```
   - **Browser Developer Console:**  
     ```javascript
     "31 30 2e 32 34 30 2e 31 36 2e 31"
       .split(" ")
       .map(h => String.fromCharCode(parseInt(h, 16)))
       .join(""); // "10.240.16.1"
     ```

4. **Submit:** `10.240.16.1`.

---

### CHAL-07: Rate Limit Standards

- **Tier:** Tier B: Tech Trivia & Architecture
- **Category:** RFC & Protocols
- **Max Points:** 100 PTS
- **Target Answer:** `429`
- **Validation Hash (SHA-256):** `2d1007980f49215311f7f1012e84f99b801eb5daeca04dedea3ada41cc45353b`
- **Input Placeholder:** `4XX`

#### The Question
> *"Under RFC 6585 (Additional HTTP Status Codes), what 3-digit HTTP status code must an API gateway return when a client has exceeded its allotted request quota ('Too Many Requests')?"*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Enter the 3-digit numeric HTTP status code.
- **Hint 1 (-10% penalty / 90 pts net):** It is in the 4xx Client Error series.
- **Hint 2 (-25% penalty / 75 pts net):** It is exactly 429.

#### Step-by-Step Solution & RFC Standards
1. **IETF RFC 6585 Specification:**
   - Published in April 2012 by the Internet Engineering Task Force (IETF) to define four additional HTTP response status codes:
     - `428 Precondition Required`
     - `429 Too Many Requests`
     - `431 Request Header Fields Too Large`
     - `511 Network Authentication Required`
2. **Standard Behavior:**
   - Section 4 of RFC 6585 states: *"The 429 status code indicates that the user has sent too many requests in a given amount of time ('rate limiting')."*
   - Commonly accompanied by response headers:
     ```http
     HTTP/1.1 429 Too Many Requests
     Retry-After: 3600
     X-RateLimit-Limit: 100
     X-RateLimit-Remaining: 0
     X-RateLimit-Reset: 1761163200
     ```
3. **Submit:** **`429`**.

---

```
================================================================================
TIER C: CODE-BREAKING & CRYPTOGRAPHY (CIPHERS & ALGORITHMS)
================================================================================
```

### CHAL-08: Caesar of the Mainframe

- **Tier:** Tier C: Code-Breaking & Cryptography
- **Category:** Ciphers & Cryptanalysis
- **Max Points:** 200 PTS
- **Target Answer:** `WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME`
- **Validation Hash (SHA-256):** `7852c608776bcb23d270a3f2439255d6d4862206d03caaaa568912cd208c64dd`
- **Input Placeholder:** `XXX-XXXXX-XXX-XXXX-XX-XXXX-X-XXXX`

#### The Question
> *"Intercepted encrypted broadcast from Joshua's primary communications relay:*  
> `JUB-JBHYQ-LBH-YVXR-GB-CYNL-N-TNZR`  
> *Cryptanalysis indicates a classical ROT13 (Caesar cipher shifted 13 positions). Decode the transmission."*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Preserve hyphens. You can use the terminal command `'rot13 <string>'` in the W.O.P.R. console.
- **Hint 1 (-10% penalty / 180 pts net):** Rotating J by 13 gives W (10 + 13 = 23 -> W). First word is 'WHO'.
- **Hint 2 (-25% penalty / 150 pts net):** The decoded phrase is 'WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME'.

#### Step-by-Step Solution

##### Method 1: Mathematical Cryptanalysis (Modular Arithmetic)
ROT13 applies a rotation of 13 places across the 26 letters of the Latin alphabet. Because $13 \equiv -13 \pmod{26}$, the cipher is self-inverting (symmetric):

$$\text{Decoded}(C) = ((C - 'A') + 13) \bmod 26 + 'A'$$

Applying the transformation character by character:
- `J` (9)  $+ 13 = 22$ $\rightarrow$ **`W`**
- `U` (20) $+ 13 = 33 \bmod 26 = 7$ $\rightarrow$ **`H`**
- `B` (1)  $+ 13 = 14$ $\rightarrow$ **`O`**
- `-` $\rightarrow$ **`-`**
- `J` (9)  $+ 13 = 22$ $\rightarrow$ **`W`**
- `B` (1)  $+ 13 = 14$ $\rightarrow$ **`O`**
- `H` (7)  $+ 13 = 20$ $\rightarrow$ **`U`**
- `Y` (24) $+ 13 = 37 \bmod 26 = 11$ $\rightarrow$ **`L`**
- `Q` (16) $+ 13 = 29 \bmod 26 = 3$ $\rightarrow$ **`D`**
- `-` $\rightarrow$ **`-`**
- `L` (11) $+ 13 = 24$ $\rightarrow$ **`Y`**
- `B` (1)  $+ 13 = 14$ $\rightarrow$ **`O`**
- `H` (7)  $+ 13 = 20$ $\rightarrow$ **`U`**
- `-` $\rightarrow$ **`-`**
- `Y` (24) $+ 13 = 37 \bmod 26 = 11$ $\rightarrow$ **`L`**
- `V` (21) $+ 13 = 34 \bmod 26 = 8$ $\rightarrow$ **`I`**
- `X` (23) $+ 13 = 36 \bmod 26 = 10$ $\rightarrow$ **`K`**
- `R` (17) $+ 13 = 30 \bmod 26 = 4$ $\rightarrow$ **`E`**
- `-` $\rightarrow$ **`-`**
- `G` (6)  $+ 13 = 19$ $\rightarrow$ **`T`**
- `B` (1)  $+ 13 = 14$ $\rightarrow$ **`O`**
- `-` $\rightarrow$ **`-`**
- `C` (2)  $+ 13 = 15$ $\rightarrow$ **`P`**
- `Y` (24) $+ 13 = 37 \bmod 26 = 11$ $\rightarrow$ **`L`**
- `N` (13) $+ 13 = 26 \bmod 26 = 0$ $\rightarrow$ **`A`**
- `L` (11) $+ 13 = 24$ $\rightarrow$ **`Y`**
- `-` $\rightarrow$ **`-`**
- `N` (13) $+ 13 = 26 \bmod 26 = 0$ $\rightarrow$ **`A`**
- `-` $\rightarrow$ **`-`**
- `T` (19) $+ 13 = 32 \bmod 26 = 6$ $\rightarrow$ **`G`**
- `N` (13) $+ 13 = 26 \bmod 26 = 0$ $\rightarrow$ **`A`**
- `Z` (25) $+ 13 = 38 \bmod 26 = 12$ $\rightarrow$ **`M`**
- `R` (17) $+ 13 = 30 \bmod 26 = 4$ $\rightarrow$ **`E`**

Decoded String: **`WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME`**

##### Method 2: Embedded W.O.P.R. CLI Tool
In the embedded console, execute:
```bash
rot13 JUB-JBHYQ-LBH-YVXR-GB-CYNL-N-TNZR
```
The terminal prints:
```text
WHO-WOULD-YOU-LIKE-TO-PLAY-A-GAME
```

##### Method 3: Unix / Linux Command Line
```bash
echo "JUB-JBHYQ-LBH-YVXR-GB-CYNL-N-TNZR" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
```

---

### CHAL-09: The Layered Capsule

- **Tier:** Tier C: Code-Breaking & Cryptography
- **Category:** Multi-Stage Decoding
- **Max Points:** 250 PTS
- **Target Answer:** `SHALL WE PLAY A GAME?`
- **Validation Hash (SHA-256):** `ad81339fd2ed2d3099869eda8ee8bf832a5c96187a416790850a6316aa4aa7f4`
- **Input Placeholder:** `Clearance phrase...`

#### The Question
> *"A critical system payload was multi-tier encapsulated for transmission:*  
> `5530684254457767563055675545784257534242494564425455552f`  
> *Convert this Hex byte string to ASCII text. The resulting text is a Base64-encoded string. Decode that Base64 string to extract the original clearance sentence (including punctuation)."*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Stage 1: Hex -> ASCII (yields Base64). Stage 2: Base64 -> Plaintext string.
- **Hint 1 (-10% penalty / 225 pts net):** Hex '5530...' in ASCII starts with 'U0hBTEwgV0Ug...'.
- **Hint 2 (-25% penalty / 187 pts net):** It is the iconic inquiry from the W.O.P.R. computer: 'SHALL WE PLAY A GAME?'

#### Step-by-Step Solution

This is a two-stage sequential data pipeline: $\text{Hex} \xrightarrow{\text{Stage 1}} \text{Base64 ASCII} \xrightarrow{\text{Stage 2}} \text{Plaintext}$.

##### Stage 1: Hexadecimal to ASCII Text
1. Parse the 56-character hexadecimal stream into 28 two-character hex byte pairs:
   `55 30 68 42 54 45 77 67 56 30 55 67 55 45 78 42 57 53 42 42 49 45 64 42 54 55 55 2f`

2. Map each byte from its base-16 numerical value to ASCII:
   | Hex Byte | Decimal | ASCII Character |
   | :---: | :---: | :---: |
   | `55` | 85 | **`U`** |
   | `30` | 48 | **`0`** |
   | `68` | 104 | **`h`** |
   | `42` | 66 | **`B`** |
   | `54` | 84 | **`T`** |
   | `45` | 69 | **`E`** |
   | `77` | 119 | **`w`** |
   | `67` | 103 | **`g`** |
   | `56` | 86 | **`V`** |
   | `30` | 48 | **`0`** |
   | `55` | 85 | **`U`** |
   | `67` | 103 | **`g`** |
   | `55` | 85 | **`U`** |
   | `45` | 69 | **`E`** |
   | `78` | 120 | **`x`** |
   | `42` | 66 | **`B`** |
   | `57` | 87 | **`W`** |
   | `53` | 83 | **`S`** |
   | `42` | 66 | **`B`** |
   | `42` | 66 | **`B`** |
   | `49` | 73 | **`I`** |
   | `45` | 69 | **`E`** |
   | `64` | 100 | **`d`** |
   | `42` | 66 | **`B`** |
   | `54` | 84 | **`T`** |
   | `55` | 85 | **`U`** |
   | `55` | 85 | **`U`** |
   | `2f` | 47 | **`/`** |

3. Intermediate ASCII output:
   ```text
   U0hBTEwgV0UgUExBWSBBIEdBTUU/
   ```

##### Stage 2: Base64 to Plaintext
1. Decode the 28-character Base64 payload by processing 4-character chunks (where each chunk unpacks into 3 binary bytes):
   - `U0hB` $\rightarrow$ `SHA`
   - `TEwg` $\rightarrow$ `LL `
   - `V0Ug` $\rightarrow$ `WE `
   - `UExB` $\rightarrow$ `PLA`
   - `WSBB` $\rightarrow$ `Y A`
   - `IEdB` $\rightarrow$ ` GA`
   - `TUU/` $\rightarrow$ `ME?`
2. Assembling all decoded chunks:
   ```text
   SHALL WE PLAY A GAME?
   ```

##### Method 2: Embedded W.O.P.R. Terminal Execution
1. In the console, run:
   ```bash
   hexdump 5530684254457767563055675545784257534242494564425455552f
   ```
   Output: `U0hBTEwgV0UgUExBWSBBIEdBTUU/`
2. Feed that string into `base64`:
   ```bash
   base64 U0hBTEwgV0UgUExBWSBBIEdBTUU/
   ```
   Output: `SHALL WE PLAY A GAME?`

##### Method 3: One-Liner in Node.js or Python
- **Node.js:**
  ```javascript
  Buffer.from(Buffer.from('5530684254457767563055675545784257534242494564425455552f', 'hex').toString('ascii'), 'base64').toString('utf8');
  // Returns: 'SHALL WE PLAY A GAME?'
  ```
- **Bash / CLI:**
  ```bash
  echo "5530684254457767563055675545784257534242494564425455552f" | xxd -r -p | base64 --decode
  # Returns: SHALL WE PLAY A GAME?
  ```

---

### CHAL-10: The Off-By-One Quantum Gate

- **Tier:** Tier C: Code-Breaking & Cryptography
- **Category:** Debugging & Logic Verification
- **Max Points:** 300 PTS
- **Target Answer:** `42`
- **Validation Hash (SHA-256):** `73475cb40a568e8da8a045ced110137e159f890ac4da883b6b17dc651b3a8049`
- **Input Placeholder:** `Numeric result`

#### The Question
> *"A missile silo consensus module crashes with `NaN` due to an off-by-one bug in this JavaScript logic:*  
> ```javascript
> function calculateQuantumChecksum(matrix) {
>   let total = 0;
>   for (let i = 0; i <= matrix.length; i++) {
>     total += matrix[i] * (i + 1);
>   }
>   return total;
> }
> ```  
> *When you fix the off-by-one loop condition so it iterates only over valid elements (`i < matrix.length`), what is the exact return value of `calculateQuantumChecksum([2, 4, 4, 5])`?"*

#### In-Game Clue & Progressive Hints
- **Default Clue:** Calculate `(2*1) + (4*2) + (4*3) + (5*4)`.
- **Hint 1 (-10% penalty / 270 pts net):** Multiply each element by its 1-based index: `2*1=2, 4*2=8, 4*3=12, 5*4=20`.
- **Hint 2 (-25% penalty / 225 pts net):** Sum: `2 + 8 + 12 + 20 = 42`.

#### Step-by-Step Solution & Code Analysis

##### 1. Bug Diagnostic & Root Cause Analysis
- In JavaScript, arrays are 0-indexed. An array containing 4 elements (`[2, 4, 4, 5]`) has indices `0, 1, 2, 3`. Its `.length` property is `4`.
- The erroneous loop condition `i <= matrix.length` executes 5 iterations: `i = 0, 1, 2, 3, 4`.
- On the 5th iteration (`i = 4`), accessing `matrix[4]` evaluates to `undefined`.
- In JavaScript's type coercion rules:
  $$\text{undefined} \times (4 + 1) = \text{undefined} \times 5 = \text{NaN}$$
- Once `NaN` is added to `total`, any subsequent arithmetic results in `NaN`, corrupting the checksum calculation.

##### 2. The Corrected Implementation
Replacing `<=` with `<` ensures the loop stops before reaching `matrix.length`:
```javascript
function calculateQuantumChecksum(matrix) {
  let total = 0;
  for (let i = 0; i < matrix.length; i++) {
    total += matrix[i] * (i + 1);
  }
  return total;
}
```

##### 3. Step-by-Step Execution Trace for `[2, 4, 4, 5]`
- Target Array: `matrix = [2, 4, 4, 5]`
- Length: `matrix.length = 4`

| Iteration | Index $i$ | Condition ($i < 4$) | Element $\text{matrix}[i]$ | Multiplier $(i + 1)$ | Calculation | Added Value | Running Total |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **0** | `0` | `0 < 4` (TRUE) | `2` | `0 + 1 = 1` | $2 \times 1$ | `2` | **`2`** |
| **1** | `1` | `1 < 4` (TRUE) | `4` | `1 + 1 = 2` | $4 \times 2$ | `8` | **`10`** |
| **2** | `2` | `2 < 4` (TRUE) | `4` | `2 + 1 = 3` | $4 \times 3$ | `12` | **`22`** |
| **3** | `3` | `3 < 4` (TRUE) | `5` | `3 + 1 = 4` | $5 \times 4$ | `20` | **`42`** |
| **4** | `4` | `4 < 4` (FALSE) | — | — | — | — | *Terminates* |

$$\text{Final Result} = (2 \times 1) + (4 \times 2) + (4 \times 3) + (5 \times 4) = 2 + 8 + 12 + 20 = 42$$

##### 4. Submit:
The final answer is **`42`** (the famous Douglas Adams answer to the Ultimate Question of Life, the Universe, and Everything).

---

## Anti-Cheat Verification & Scoring Engine

### How Answer Submission Works Under the Hood
To preserve complete integrity and zero-trust security on a public static front-end, plaintext answers are never distributed in the client bundle. The validation engine enforces:

1. **Client-Side Canonicalization:**
   ```javascript
   function normalizeAnswer(str) {
     return String(str || '')
       .trim()
       .replace(/\s+/g, ' ')
       .toUpperCase();
   }
   ```
   - Trims leading/trailing whitespace.
   - Collapses internal duplicate spacing.
   - Converts to uppercase (making checks case-insensitive).

2. **Web Crypto SHA-256 Hashing:**
   The normalized string is hashed via the browser's native `crypto.subtle.digest('SHA-256', ...)`:
   ```javascript
   async function sha256(message) {
     const msgBuffer = new TextEncoder().encode(normalizeAnswer(message));
     const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
     const hashArray = Array.from(new Uint8Array(hashBuffer));
     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   }
   ```

3. **Atomic Anti-Cheat Stored Procedure (Supabase PostgreSQL):**
   When connected to Supabase, submissions call the Postgres RPC `submit_challenge_answer`:
   - Validates that the event timer has not expired (`status = 'ACTIVE'`).
   - Enforces a 3-second throttle window per team to eliminate brute-force bots.
   - Re-normalizes and re-hashes the answer in SQL to prevent client spoofing.
   - Deducts hint penalty points from the base reward if hints were unlocked.
   - Atomically updates team scores and broadcasts the event via `supabase_realtime`.
