/**
 * Devvit message bridge.
 *
 * Sends gameplay events to a trusted Reddit parent frame and ignores
 * messages from any other origin. Outside Reddit, calls are no-ops.
 */

import { isUtcDayKey, MAX_SCORE, parseBoundedInt, validateClueText } from "../core/safety";
import { isTrustedMessageOrigin, trustedParentOrigin } from "./messageOrigin";

type DevvitMessage = {
  type: string;
  data?: Record<string, unknown>;
};

type MessageHandler = (msg: DevvitMessage) => void;

class DevvitBridge {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private isDevvit: boolean;

  constructor() {
    this.isDevvit = typeof window !== "undefined" && window.parent !== window;
    if (!this.isDevvit || typeof window === "undefined") return;

    window.addEventListener("message", (event: MessageEvent) => {
      if (!isTrustedMessageOrigin(event.origin)) return;
      try {
        const payload: unknown = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (!payload || typeof payload !== "object") return;
        const message = payload as DevvitMessage;
        if (typeof message.type !== "string" || !/^[A-Za-z0-9_-]{1,40}$/.test(message.type)) return;
        this.emit(message.type, message);
      } catch {
        // Ignore malformed messages.
      }
    });
  }

  postMessage(type: string, data?: Record<string, unknown>) {
    if (!this.isDevvit || typeof window === "undefined") return;
    const origin = trustedParentOrigin();
    if (!origin) return;

    window.parent.postMessage(
      { type: "devvit-message", data: { message: { type, data } } },
      origin
    );
  }

  on(type: string, handler: MessageHandler) {
    const list = this.handlers.get(type) ?? [];
    list.push(handler);
    this.handlers.set(type, list);
  }

  off(type: string, handler: MessageHandler) {
    const list = this.handlers.get(type);
    if (!list) return;
    this.handlers.set(
      type,
      list.filter((item) => item !== handler)
    );
  }

  private emit(type: string, msg: DevvitMessage) {
    for (const handler of this.handlers.get(type) ?? []) handler(msg);
  }

  get isInsideReddit(): boolean {
    return this.isDevvit;
  }

  reportGameComplete(score: number, guesses: number, streak: number, dayKey?: string) {
    const safeScore = parseBoundedInt(score, 0, MAX_SCORE);
    const safeGuesses = parseBoundedInt(guesses, 0, 6);
    const safeStreak = parseBoundedInt(streak, 0, 10000);
    const safeDay = dayKey && isUtcDayKey(dayKey) ? dayKey : new Date().toISOString().slice(0, 10);
    if (safeScore === null || safeGuesses === null || safeStreak === null || !isUtcDayKey(safeDay)) return;
    this.postMessage("GAME_COMPLETE", {
      score: safeScore,
      guesses: safeGuesses,
      streak: safeStreak,
      dayKey: safeDay,
    });
  }

  submitClue(clueText: string, dayKey?: string) {
    const clue = validateClueText(clueText);
    const safeDay = dayKey && isUtcDayKey(dayKey) ? dayKey : new Date().toISOString().slice(0, 10);
    if (!clue.valid || !isUtcDayKey(safeDay)) return;
    this.postMessage("SUBMIT_CLUE", { clueText: clue.text, dayKey: safeDay });
  }

  requestLeaderboard(dayKey?: string) {
    const safeDay = dayKey && isUtcDayKey(dayKey) ? dayKey : new Date().toISOString().slice(0, 10);
    if (!isUtcDayKey(safeDay)) return;
    this.postMessage("GET_LEADERBOARD", { dayKey: safeDay });
  }
}

export const devvitBridge = new DevvitBridge();
