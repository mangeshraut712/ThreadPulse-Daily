import { puzzleBank } from "../data/puzzleBank";
import { CommunityClue, Puzzle } from "../types";
import { clueContainsAnswer, normalizeGuess, sanitizePlainText } from "./safety";

const BLOCKED_CLUE_PATTERN = /(?:https?:\/\/|javascript:|data:|discord\.gg|t\.me\/)/i;

export interface DailyResult {
    dayKey: string;
    seed: number;
    index: number;
    puzzle: Puzzle;
}

export interface GuessEvaluation {
    normalizedGuess: string;
    normalizedAnswer: string;
    correct: boolean;
}

export interface ScoreParams {
    correct: boolean;
    hintsUsed: number;
    timeSeconds: number;
    streakDays: number;
}

export interface CommunityClueOptions {
    forbiddenWords?: string[];
    existingClues?: string[];
}

export interface ValidationResult {
    valid: boolean;
    reason: string;
}

export interface Snapshot {
    dayKey: string;
    puzzleId: string;
    title: string;
    category: string;
    subredditTags: string[];
    publicHint: string;
}

function toUtcDayKey(inputDate = new Date()) {
    const d = new Date(inputDate);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function daySeed(dayKey: string) {
    let hash = 2166136261;
    for (let i = 0; i < dayKey.length; i += 1) {
        hash ^= dayKey.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(seed: number) {
    let t = seed >>> 0;
    return () => {
        t += 0x6d2b79f5;
        let v = Math.imul(t ^ (t >>> 15), t | 1);
        v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
        return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
    };
}

function normalizeText(value = "") {
    return normalizeGuess(value);
}

export function pickDailyPuzzle(inputDate = new Date(), bank = puzzleBank): DailyResult {
    if (!Array.isArray(bank) || bank.length === 0) {
        throw new Error("Puzzle bank cannot be empty.");
    }

    const dayKey = toUtcDayKey(inputDate);
    const seed = daySeed(dayKey);
    const rng = mulberry32(seed);
    const index = Math.floor(rng() * bank.length);
    const puzzle = bank[index] as Puzzle; // explicit cast since we know bank contains Puzzles

    return {
        dayKey,
        seed,
        index,
        puzzle
    };
}

export function getHintSet(puzzle: Puzzle, hintsUnlocked = 1): string[] {
    const hints = Array.isArray(puzzle.hints) ? puzzle.hints : [];
    const requested = Number.isFinite(hintsUnlocked) ? hintsUnlocked : 1;
    const hintCount = Math.max(1, Math.min(3, requested));
    return hints.slice(0, hintCount);
}

export function evaluateGuess({ guess, answer }: { guess: string; answer: string }): GuessEvaluation {
    const normalizedGuess = normalizeText(guess);
    const normalizedAnswer = normalizeText(answer);
    return {
        normalizedGuess,
        normalizedAnswer,
        correct: normalizedGuess.length > 0 && normalizedGuess === normalizedAnswer
    };
}

export function computeScore({ correct, hintsUsed, timeSeconds, streakDays }: ScoreParams): number {
    if (!correct) return 0;

    const safeHints = Number.isFinite(hintsUsed) ? hintsUsed : 1;
    const safeTime = Number.isFinite(timeSeconds) ? timeSeconds : 0;
    const safeStreak = Number.isFinite(streakDays) ? streakDays : 0;
    const baseScore = 100;
    const hintPenalty = Math.max(0, safeHints - 1) * 15;
    const timePenalty = Math.min(35, Math.floor(Math.max(0, safeTime) / 6));
    const streakBonus = Math.min(25, Math.floor(Math.max(0, safeStreak) / 2));

    return Math.max(5, baseScore - hintPenalty - timePenalty + streakBonus);
}

export function buildResultComment({ correct, score, answer, dayKey }: { correct: boolean; score: number; answer: string; dayKey: string }): string {
    if (correct) {
        return `I solved ThreadPulse Daily for ${dayKey} with ${score} points.`;
    }
    return `I missed ThreadPulse Daily for ${dayKey}. The answer was ${answer}.`;
}

export function validateCommunityClue(text: string, options: CommunityClueOptions = {}): ValidationResult {
    const raw = sanitizePlainText(String(text || ""));

    if (raw.length < 8) {
        return { valid: false, reason: "Clue must be at least 8 characters." };
    }

    if (raw.length > 180) {
        return { valid: false, reason: "Clue must be 180 characters or fewer." };
    }

    if (/[<>]/.test(raw)) {
        return { valid: false, reason: "Clue cannot contain HTML." };
    }

    if (BLOCKED_CLUE_PATTERN.test(raw)) {
        return { valid: false, reason: "Links are not allowed in clues." };
    }

    const forbiddenWords = Array.isArray(options.forbiddenWords) ? options.forbiddenWords : [];
    const normalizedRaw = normalizeText(raw);
    for (const forbidden of forbiddenWords) {
        if (clueContainsAnswer(raw, forbidden)) {
            return { valid: false, reason: "Clue cannot contain the answer." };
        }
    }

    const existingClues = Array.isArray(options.existingClues) ? options.existingClues : [];
    const duplicate = existingClues.some((item) => normalizeText(item) === normalizedRaw);
    if (duplicate) {
        return { valid: false, reason: "This clue already exists for today." };
    }

    return { valid: true, reason: "ok" };
}

export function rankCommunityClues(clues: CommunityClue[], limit = 5, options: CommunityClueOptions = {}): CommunityClue[] {
    if (!Array.isArray(clues)) return [];
    const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 5;

    return [...clues]
        .filter((item) => item && typeof item.text === "string")
        .filter((item) => validateCommunityClue(item.text, options).valid)
        .sort((a, b) => {
            const scoreA = (a.upvotes || 0) + (a.modBoost || 0) * 3;
            const scoreB = (b.upvotes || 0) + (b.modBoost || 0) * 3;
            if (scoreA !== scoreB) return scoreB - scoreA;
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        })
        .slice(0, safeLimit);
}

export function createDailyGameSnapshot(inputDate = new Date()): Snapshot {
    const daily = pickDailyPuzzle(inputDate);

    return {
        dayKey: daily.dayKey,
        puzzleId: daily.puzzle.id,
        title: daily.puzzle.title,
        category: daily.puzzle.category,
        subredditTags: daily.puzzle.subredditTags,
        publicHint: daily.puzzle.hints[0]
    };
}
