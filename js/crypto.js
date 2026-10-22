/**
 * ==============================================================================
 * "SHALL WE PLAY A GAME?" — CRYPTOGRAPHIC & NORMALIZATION UTILITIES
 * Client-side SHA-256 hashing, string canonicalization, and cipher helpers
 * ==============================================================================
 */

export const CRYPTO = {
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
