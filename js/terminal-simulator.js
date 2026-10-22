/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — W.O.P.R. TERMINAL & DEVTOOLS SIMULATOR
 * Built-in hacker console providing an interactive CLI, mock network requests,
 * and DOM inspector for OSINT/Scavenger challenges
 * ==============================================================================
 */

import { CRYPTO } from "./crypto.js";
import { SOUND } from "./audio.js";

export class TerminalSimulator {
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
