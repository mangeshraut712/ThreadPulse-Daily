export const MAX_SCORE = 125;
export const MIN_CLUE_LENGTH = 8;
export const MAX_CLUE_LENGTH = 180;
export const MAX_GUESS_LENGTH = 32;

const BLOCKED_CLUE = /(?:https?:\/\/|javascript:|data:|discord\.gg|t\.me\/)/i;

export interface ClueValidation {
  valid: boolean;
  reason: string;
  text: string;
}

export interface GameMessage {
  type: string;
  data: Record<string, unknown>;
}

export function normalizeGuess(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function sanitizePlainText(value: string): string {
  let cleaned = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127) continue;
    cleaned += char;
  }
  return cleaned.trim();
}

export function isUtcDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function parseBoundedInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export function sanitizeRedditUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9_-]{3,30}$/.test(trimmed)) return null;
  return trimmed;
}

export function clueContainsAnswer(clue: string, answer: string): boolean {
  const answerWords = answer.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (answerWords.length === 0) return false;
  const clueWords = clue.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (let index = 0; index <= clueWords.length - answerWords.length; index += 1) {
    const matches = answerWords.every((word, offset) => clueWords[index + offset] === word);
    if (matches) return true;
  }
  return false;
}

export function validateClueText(text: unknown): ClueValidation {
  if (typeof text !== "string") {
    return { valid: false, reason: "Clue must be text.", text: "" };
  }

  const raw = sanitizePlainText(text);
  if (raw.length < MIN_CLUE_LENGTH) {
    return { valid: false, reason: "Clue must be at least 8 characters.", text: raw };
  }
  if (raw.length > MAX_CLUE_LENGTH) {
    return { valid: false, reason: "Clue must be 180 characters or fewer.", text: raw };
  }
  if (BLOCKED_CLUE.test(raw) || /[<>]/.test(raw)) {
    return { valid: false, reason: "Links and HTML are not allowed in clues.", text: raw };
  }

  return { valid: true, reason: "ok", text: raw };
}

export function unwrapWebViewMessage(message: unknown): GameMessage | null {
  if (!message || typeof message !== "object") return null;
  const record = message as Record<string, unknown>;
  const nested =
    record.type === "devvit-message" && record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>).message
      : record;
  if (!nested || typeof nested !== "object") return null;

  const inner = nested as Record<string, unknown>;
  if (typeof inner.type !== "string" || !/^[A-Z_]{1,40}$/.test(inner.type)) return null;
  const data =
    inner.data && typeof inner.data === "object" && !Array.isArray(inner.data)
      ? (inner.data as Record<string, unknown>)
      : {};
  return { type: inner.type, data };
}
