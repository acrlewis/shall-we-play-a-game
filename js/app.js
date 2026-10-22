/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — MASTER APPLICATION CONTROLLER
 * Routing, Onboarding Modal, Dynamic Challenge Renderer, Projector View & HUD
 * ==============================================================================
 */

import { CONFIG } from "./config.js";
import { CRYPTO } from "./crypto.js";
import { SOUND } from "./audio.js";
import { STORAGE } from "./storage.js";
import { CHALLENGES, getChallengeById } from "./challenges.js";
import { SUPABASE } from "./supabase-client.js";
import { TerminalSimulator } from "./terminal-simulator.js";

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
    const initialLb = await SUPABASE.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE);
    this.updateLeaderboardViews(initialLb);
    this.updateLiveTicker(initialLb);
  }

  // ----------------------------------------------------------------------------
  // Routing & Views
  // ----------------------------------------------------------------------------
  handleRouteHash() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
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
    if (viewName === "game") {
      this.renderChallenges();
      if (this.terminal) this.terminal.render();
    } else if (viewName === "projector") {
      SUPABASE.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE).then(lb => this.updateProjectorView(lb));
    } else if (viewName === "leaderboard") {
      SUPABASE.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE).then(lb => this.updateLeaderboardTable(lb));
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

        const session = STORAGE.getSession();
        const roomCode = session ? session.roomCode : CONFIG.DEFAULT_ROOM_CODE;
        const teamId = session ? session.teamId : "local-user";
        const unlockedHints = STORAGE.getUnlockedHints(chalId);

        try {
          const result = await SUPABASE.submitAnswer(
            roomCode,
            teamId,
            chalId,
            rawValue,
            unlockedHints.length
          );

          if (result.success) {
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
            feedback.innerText = `✗ ${result.message || 'Incorrect response. Verification failed.'}`;
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
      seedBotBtn.onclick = () => {
        SUPABASE.seedDemoBot();
        SOUND.playBeep(880, 0.05);
      };
    }

    const resetBtn = document.getElementById("admin-reset-all");
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (confirm("WARNING: Are you sure you want to reset all game state and clear local teams?")) {
          SUPABASE.resetAllState();
          SOUND.playError();
          alert("All session data has been reset.");
          window.location.reload();
        }
      };
    }

    const exportBtn = document.getElementById("admin-export-csv");
    if (exportBtn) {
      exportBtn.onclick = async () => {
        const lb = await SUPABASE.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE);
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

