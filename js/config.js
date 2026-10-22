/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CONFIGURATION MODULE
 * Dynamic runtime config supporting URL params, localStorage, or environment keys
 * ==============================================================================
 */

export const CONFIG = {
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
