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
    if (saved) {
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
  // API Methods (Supabase with Automatic Mock Fallback)
  // ----------------------------------------------------------------------------
  async registerTeam(roomCode, teamName, roleTag, avatar) {
    if (!this.isMockMode && this.client) {
      try {
        // Check if team already exists
        const { data: existing } = await this.client
          .from("teams")
          .select("*")
          .eq("room_code", roomCode)
          .eq("team_name", teamName)
          .single();

        if (existing) {
          return { success: true, team: existing };
        }

        // Insert new team
        const { data, error } = await this.client
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

        if (error) throw error;
        return { success: true, team: data };
      } catch (err) {
        console.warn("Supabase register error, using local session:", err);
      }
    }

    // Local / Mock Mode
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
      this.broadcastLocalUpdate(await this.fetchLeaderboard(roomCode));
    }

    return { success: true, team };
  }

  async fetchLeaderboard(roomCode = CONFIG.DEFAULT_ROOM_CODE) {
    if (!this.isMockMode && this.client) {
      try {
        const { data, error } = await this.client
          .from("leaderboard_view")
          .select("*")
          .eq("room_code", roomCode)
          .order("rank", { ascending: true });

        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn("Error fetching Supabase leaderboard:", err);
      }
    }

    // Local Leaderboard
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

    // If live Supabase is connected, execute stored procedure
    if (!this.isMockMode && this.client) {
      try {
        const { data, error } = await this.client.rpc("submit_challenge_answer", {
          p_room_code: roomCode,
          p_team_id: teamId,
          p_challenge_id: challengeId,
          p_answer_hash: answerHash,
          p_hints_used: hintsUsedCount
        });

        if (error) throw error;
        return data;
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
    const team = this.mockTeams.find(t => t.id === teamId || t.team_name === teamId);
    if (team) {
      team.total_score += points;
      team.challenges_solved += 1;
      team.last_submission_at = new Date().toISOString();
      this.saveMockTeams();
    }

    const updatedLeaderboard = await this.fetchLeaderboard(roomCode);
    this.broadcastLocalUpdate(updatedLeaderboard);

    return {
      success: true,
      challenge_id: challengeId,
      points_awarded: points,
      total_score: team ? team.total_score : points,
      challenges_solved: team ? team.challenges_solved : 1,
      message: "AUTHENTICATION GRANTED // ACCESS CODES VERIFIED"
    };
  }

  // Operator Actions
  resetAllState() {
    this.mockTeams = [];
    localStorage.removeItem("swpag_mock_teams");
    localStorage.removeItem("swpag_session_v1");
    this.broadcastLocalUpdate([]);
  }

  seedDemoBot() {
    const botNames = ["CyberValkyries", "CircuitBreakers", "ZeroDayKnights", "CryptoWizards"];
    const roles = ["SecOps", "DevOps", "Full-Stack", "QA"];
    const randomName = botNames[Math.floor(Math.random() * botNames.length)] + "-" + Math.floor(Math.random() * 90 + 10);
    const randomRole = roles[Math.floor(Math.random() * roles.length)];

    const bot = {
      id: `bot-${Date.now()}`,
      room_code: CONFIG.DEFAULT_ROOM_CODE,
      team_name: randomName,
      role_tag: randomRole,
      avatar: "avatar-robot",
      total_score: Math.floor(Math.random() * 400 + 100),
      challenges_solved: Math.floor(Math.random() * 4 + 1),
      last_submission_at: new Date().toISOString()
    };

    this.mockTeams.push(bot);
    this.saveMockTeams();
    this.fetchLeaderboard(CONFIG.DEFAULT_ROOM_CODE).then(lb => this.broadcastLocalUpdate(lb));
  }
}

export const SUPABASE = new SupabaseClientManager();
