import { isTauri } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

/**
 * A unified fetch function that uses Tauri's HTTP plugin when running inside Tauri,
 * and falls back to the native browser fetch otherwise.
 *
 * This is necessary because Tauri's fetch bypasses CORS restrictions that would
 * otherwise block requests to external APIs (like IPTV providers, Kick, etc.)
 */
export const fetch: typeof globalThis.fetch = isTauri()
  ? tauriFetch
  : globalThis.fetch;
