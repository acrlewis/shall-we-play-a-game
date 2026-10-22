/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — LOCAL STORAGE & SESSION STATE MACHINE
 * Handles resilient session recovery, hint tracking, and anti-cheat rate limiting
 * ==============================================================================
 */

import { CONFIG } from "./config.js";

const STORAGE_KEY = "swpag_session_v1";

export class StorageManager {
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

export const STORAGE = new StorageManager();
