import type { CommunityClue, Guess, PlayerDailyState } from "../types";
import { MAX_GUESS_LENGTH, normalizeGuess, sanitizePlainText } from "./safety";

export const STORAGE_KEYS = {
  streak: "threadpulse.streak",
  clues: "threadpulse.cluesByDay",
  progress: "threadpulse.progressByDay",
  votes: "threadpulse.votesByDay",
} as const;

export const MAX_GUESSES = 6;
export const MAX_STORED_DAYS = 14;

export interface StreakRecord {
  lastSolvedDay: string | null;
  streakDays: number;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type VoteDirection = "up" | "down";

export function browserStorage(): KeyValueStorage | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function toUtcDayKey(inputDate = new Date()): string {
  const date = new Date(inputDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shiftUtcDay(dayKey: string, days: number): string {
  const date = new Date(`${dayKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toUtcDayKey(date);
}

export function emptyStreak(): StreakRecord {
  return { lastSolvedDay: null, streakDays: 0 };
}

export function activeStreakDays(record: StreakRecord, today: string): number {
  if (!record.lastSolvedDay || !Number.isFinite(record.streakDays) || record.streakDays <= 0) return 0;
  if (record.lastSolvedDay === today) return Math.floor(record.streakDays);
  if (record.lastSolvedDay === shiftUtcDay(today, -1)) return Math.floor(record.streakDays);
  return 0;
}

export function nextStreakRecord(record: StreakRecord, dayKey: string): StreakRecord {
  if (record.lastSolvedDay === dayKey && record.streakDays > 0) {
    return { lastSolvedDay: dayKey, streakDays: Math.floor(record.streakDays) };
  }
  const continuing = record.lastSolvedDay === shiftUtcDay(dayKey, -1) && record.streakDays > 0;
  return {
    lastSolvedDay: dayKey,
    streakDays: continuing ? Math.floor(record.streakDays) + 1 : 1,
  };
}

export function applyVote(
  upvotes: number,
  previous: VoteDirection | null,
  requested: VoteDirection
): { upvotes: number; vote: VoteDirection | null } {
  let score = Number.isFinite(upvotes) ? upvotes : 0;
  if (previous === "up") score -= 1;
  if (previous === "down") score += 1;

  if (previous === requested) {
    return { upvotes: Math.max(0, score), vote: null };
  }

  score += requested === "up" ? 1 : -1;
  return { upvotes: Math.max(0, score), vote: requested };
}

function readJson(storage: KeyValueStorage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(storage: KeyValueStorage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value));
}

function pruneDayMap(value: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(value).filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)).sort();
  const kept = keys.slice(-MAX_STORED_DAYS);
  const next: Record<string, unknown> = {};
  for (const key of kept) next[key] = value[key];
  return next;
}

export function readStreak(storage: KeyValueStorage): StreakRecord {
  const parsed = readJson(storage, STORAGE_KEYS.streak);
  if (!parsed || typeof parsed !== "object") return emptyStreak();
  const record = parsed as Record<string, unknown>;
  const lastSolvedDay = typeof record.lastSolvedDay === "string" ? record.lastSolvedDay : null;
  const streakDays = typeof record.streakDays === "number" && Number.isFinite(record.streakDays)
    ? Math.max(0, Math.floor(record.streakDays))
    : 0;
  return { lastSolvedDay, streakDays };
}

export function writeStreak(storage: KeyValueStorage, record: StreakRecord): void {
  writeJson(storage, STORAGE_KEYS.streak, record);
}

function parseGuess(value: unknown): Guess | null {
  if (!value || typeof value !== "object") return null;
  const guess = value as Record<string, unknown>;
  if (typeof guess.text !== "string") return null;
  const text = guess.text.trim();
  if (!normalizeGuess(text) || text.length > MAX_GUESS_LENGTH) return null;
  if (typeof guess.correct !== "boolean") return null;
  const timestamp = new Date(String(guess.timestamp ?? ""));
  if (Number.isNaN(timestamp.getTime())) return null;
  const hintsUsed = typeof guess.hintsUsed === "number" && Number.isFinite(guess.hintsUsed)
    ? Math.min(3, Math.max(1, Math.round(guess.hintsUsed)))
    : 1;
  return { text, timestamp, hintsUsed, correct: guess.correct };
}

export function parsePlayerProgress(value: unknown, fallbackStreak: number): PlayerDailyState | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.guesses) || record.guesses.length > MAX_GUESSES) return null;

  const guesses: Guess[] = [];
  for (const item of record.guesses) {
    const guess = parseGuess(item);
    if (!guess) return null;
    guesses.push(guess);
  }

  const completed = guesses.some((guess) => guess.correct);
  const started = new Date(String(record.timeStarted ?? ""));
  const timeStarted = Number.isNaN(started.getTime()) ? new Date() : started;
  const completedAt = record.timeCompleted ? new Date(String(record.timeCompleted)) : undefined;
  const timeCompleted = completedAt && !Number.isNaN(completedAt.getTime()) ? completedAt : undefined;
  const hintsUnlocked = typeof record.hintsUnlocked === "number" && Number.isFinite(record.hintsUnlocked)
    ? Math.min(3, Math.max(1, Math.round(record.hintsUnlocked)))
    : 1;
  const storedScore = typeof record.score === "number" && Number.isFinite(record.score)
    ? Math.min(125, Math.max(0, Math.round(record.score)))
    : 0;

  return {
    guesses,
    hintsUnlocked,
    score: completed ? Math.max(5, storedScore) : 0,
    completed,
    timeStarted,
    timeCompleted: completed ? timeCompleted ?? guesses[guesses.length - 1]?.timestamp : undefined,
    streak: fallbackStreak,
  };
}

export function readProgress(storage: KeyValueStorage, dayKey: string, fallbackStreak: number): PlayerDailyState | null {
  const parsed = readJson(storage, STORAGE_KEYS.progress);
  if (!parsed || typeof parsed !== "object") return null;
  return parsePlayerProgress((parsed as Record<string, unknown>)[dayKey], fallbackStreak);
}

export function writeProgress(storage: KeyValueStorage, dayKey: string, progress: PlayerDailyState): void {
  const parsed = readJson(storage, STORAGE_KEYS.progress);
  const existing = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  existing[dayKey] = {
    guesses: progress.guesses.map((guess) => ({
      text: guess.text,
      timestamp: guess.timestamp.toISOString(),
      hintsUsed: guess.hintsUsed,
      correct: guess.correct,
    })),
    hintsUnlocked: progress.hintsUnlocked,
    score: progress.score,
    completed: progress.completed,
    timeStarted: progress.timeStarted.toISOString(),
    timeCompleted: progress.timeCompleted?.toISOString(),
    streak: progress.streak,
  };
  writeJson(storage, STORAGE_KEYS.progress, pruneDayMap(existing));
}

function defaultAnalysis(): CommunityClue["aiAnalysis"] {
  return {
    sentiment: 0,
    creativity: 0.5,
    difficulty: 0.5,
    engagement_prediction: 0.5,
    toxicity_score: 0,
    quality_score: 0.5,
  };
}

function parseClue(value: unknown): CommunityClue | null {
  if (!value || typeof value !== "object") return null;
  const clue = value as Record<string, unknown>;
  if (typeof clue.id !== "string" || typeof clue.text !== "string" || typeof clue.author !== "string") return null;
  const text = sanitizePlainText(clue.text);
  if (text.length < 8 || text.length > 180) return null;
  const createdAt = new Date(String(clue.createdAt ?? ""));
  return {
    id: clue.id,
    text,
    author: clue.author,
    upvotes: typeof clue.upvotes === "number" && Number.isFinite(clue.upvotes) ? Math.max(0, Math.round(clue.upvotes)) : 0,
    modBoost: typeof clue.modBoost === "number" && Number.isFinite(clue.modBoost) ? Math.max(0, clue.modBoost) : 0,
    aiAnalysis: defaultAnalysis(),
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date(0) : createdAt,
    approved: clue.approved !== false,
  };
}

export function readClues(storage: KeyValueStorage, dayKey: string): CommunityClue[] {
  const parsed = readJson(storage, STORAGE_KEYS.clues);
  if (!parsed || typeof parsed !== "object") return [];
  const clues = (parsed as Record<string, unknown>)[dayKey];
  if (!Array.isArray(clues)) return [];
  return clues.map(parseClue).filter((clue): clue is CommunityClue => clue !== null);
}

export function writeClues(storage: KeyValueStorage, dayKey: string, clues: CommunityClue[]): void {
  const parsed = readJson(storage, STORAGE_KEYS.clues);
  const existing = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  existing[dayKey] = clues;
  writeJson(storage, STORAGE_KEYS.clues, pruneDayMap(existing));
}

export function readVotes(storage: KeyValueStorage, dayKey: string): Record<string, VoteDirection> {
  const parsed = readJson(storage, STORAGE_KEYS.votes);
  if (!parsed || typeof parsed !== "object") return {};
  const dayVotes = (parsed as Record<string, unknown>)[dayKey];
  if (!dayVotes || typeof dayVotes !== "object" || Array.isArray(dayVotes)) return {};
  const votes: Record<string, VoteDirection> = {};
  for (const [id, direction] of Object.entries(dayVotes)) {
    if (direction === "up" || direction === "down") votes[id] = direction;
  }
  return votes;
}

export function writeVotes(storage: KeyValueStorage, dayKey: string, votes: Record<string, VoteDirection>): void {
  const parsed = readJson(storage, STORAGE_KEYS.votes);
  const existing = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  existing[dayKey] = votes;
  writeJson(storage, STORAGE_KEYS.votes, pruneDayMap(existing));
}
