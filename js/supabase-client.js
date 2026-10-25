/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — SUPABASE REALTIME CLIENT & OFFLINE ENGINE
 * Dual-Mode: Supabase Postgres + Realtime with zero-config BroadcastChannel fallback
 * ==============================================================================
 */

import { CONFIG } from "./config.js";
import { CHALLENGES, getChallengeById, calculatePoints } from "./challenges.js";
import { CRYPTO } from "./crypto.js";

export class SupabaseClientManager {
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

export const SUPABASE = new SupabaseClientManager();
