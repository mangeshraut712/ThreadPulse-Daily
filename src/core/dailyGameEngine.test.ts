import { describe, expect, it } from "vitest";
import { puzzleBank } from "../data/puzzleBank";
import {
  computeScore,
  evaluateGuess,
  pickDailyPuzzle,
  rankCommunityClues,
  validateCommunityClue,
} from "./dailyGameEngine";
import { clueContainsAnswer, isUtcDayKey, unwrapWebViewMessage, validateClueText } from "./safety";
import { isTrustedMessageOrigin } from "../utils/messageOrigin";
import type { CommunityClue } from "../types";

function clue(text: string, upvotes: number, createdAt: string): CommunityClue {
  return {
    id: text,
    text,
    author: "player",
    upvotes,
    modBoost: 0,
    aiAnalysis: {
      sentiment: 0,
      creativity: 0.5,
      difficulty: 0.5,
      engagement_prediction: 0.5,
      toxicity_score: 0,
      quality_score: 0.5,
    },
    createdAt: new Date(createdAt),
    approved: true,
  };
}

describe("daily puzzle selection", () => {
  it("selects the same puzzle for every player on a UTC day", () => {
    const morning = new Date("2026-10-23T00:30:00Z");
    const evening = new Date("2026-10-23T23:59:00Z");
    const first = pickDailyPuzzle(morning);
    const second = pickDailyPuzzle(evening);

    expect(first.dayKey).toBe("2026-10-23");
    expect(second).toMatchObject({ dayKey: first.dayKey, index: first.index, puzzle: first.puzzle });
  });

  it("uses the UTC date when the local date is still the previous day", () => {
    const result = pickDailyPuzzle(new Date("2026-10-23T23:30:00-07:00"));
    expect(result.dayKey).toBe("2026-10-24");
  });

  it("rejects an empty puzzle bank", () => {
    expect(() => pickDailyPuzzle(new Date(), [])).toThrow(/empty/i);
  });
});

describe("guesses and scores", () => {
  it("accepts punctuation and spacing variants of the answer", () => {
    expect(evaluateGuess({ guess: "Rabbit Hole!", answer: "rabbit hole" }).correct).toBe(true);
    expect(evaluateGuess({ guess: "!!!", answer: "karma" }).correct).toBe(false);
    expect(evaluateGuess({ guess: "   ", answer: "karma" }).correct).toBe(false);
  });

  it("applies hint, time, and streak rules with finite bounds", () => {
    expect(computeScore({ correct: false, hintsUsed: 1, timeSeconds: 0, streakDays: 10 })).toBe(0);
    expect(computeScore({ correct: true, hintsUsed: 1, timeSeconds: 0, streakDays: 0 })).toBe(100);
    expect(computeScore({ correct: true, hintsUsed: 3, timeSeconds: 0, streakDays: 0 })).toBe(70);
    expect(computeScore({ correct: true, hintsUsed: 1, timeSeconds: 36, streakDays: 0 })).toBe(94);
    expect(computeScore({ correct: true, hintsUsed: 1, timeSeconds: 10_000, streakDays: 0 })).toBe(65);
    expect(computeScore({ correct: true, hintsUsed: 1, timeSeconds: 0, streakDays: 3 })).toBe(101);
    expect(computeScore({ correct: true, hintsUsed: 1, timeSeconds: 0, streakDays: 80 })).toBe(125);
    expect(computeScore({ correct: true, hintsUsed: 100, timeSeconds: Number.NaN, streakDays: Number.NaN })).toBe(5);
  });
});

describe("community clues", () => {
  it("rejects links, markup, and the answer without blocking unrelated words", () => {
    expect(validateCommunityClue("both sides argued well").valid).toBe(true);
    expect(validateCommunityClue("both sides argued well", { forbiddenWords: ["bot"] }).valid).toBe(true);
    expect(validateCommunityClue("the answer is a bot", { forbiddenWords: ["bot"] }).valid).toBe(false);
    expect(validateCommunityClue("think rabbit-hole stories", { forbiddenWords: ["rabbit hole"] }).valid).toBe(false);
    expect(validateCommunityClue("see https://example.com today").valid).toBe(false);
    expect(validateCommunityClue("do not use <script> tags").valid).toBe(false);
    expect(validateCommunityClue("tiny").valid).toBe(false);
    expect(clueContainsAnswer("A.M.A. thread energy", "ama")).toBe(false);
    expect(clueContainsAnswer("join the ama thread", "ama")).toBe(true);
  });

  it("ranks higher voted clues first and drops answer leaks", () => {
    const ranked = rankCommunityClues(
      [
        clue("older quiet observation", 1, "2026-10-01T00:00:00Z"),
        clue("the answer is karma", 10, "2026-10-02T00:00:00Z"),
        clue("newer popular observation", 4, "2026-10-03T00:00:00Z"),
      ],
      5,
      { forbiddenWords: ["karma"] }
    );

    expect(ranked.map((item) => item.text)).toEqual([
      "newer popular observation",
      "older quiet observation",
    ]);
  });

  it("validates host messages before they can be stored", () => {
    expect(validateClueText("javascript:alert(1) is not a clue").valid).toBe(false);
    expect(isUtcDayKey("2026-02-31")).toBe(false);
    expect(isUtcDayKey("2026-10-23")).toBe(true);
    expect(unwrapWebViewMessage({
      type: "devvit-message",
      data: { message: { type: "GAME_COMPLETE", data: { score: 10 } } },
    })).toEqual({ type: "GAME_COMPLETE", data: { score: 10 } });
    expect(unwrapWebViewMessage({ type: "not valid" })).toBeNull();
  });
});

describe("puzzle bank", () => {
  it("has a month of unique puzzles whose visible text does not contain the answer", () => {
    expect(puzzleBank.length).toBeGreaterThanOrEqual(28);
    const ids = new Set(puzzleBank.map((puzzle) => puzzle.id));
    const answers = new Set(puzzleBank.map((puzzle) => puzzle.answer));
    expect(ids.size).toBe(puzzleBank.length);
    expect(answers.size).toBe(puzzleBank.length);

    for (const puzzle of puzzleBank) {
      expect(puzzle.hints).toHaveLength(3);
      const normalizedAnswer = puzzle.answer.toLowerCase().replace(/[^a-z0-9]/g, "");
      const visible = [puzzle.title, puzzle.category, ...puzzle.hints, ...puzzle.subredditTags];
      for (const text of visible) {
        const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, "");
        expect(normalized.includes(normalizedAnswer)).toBe(false);
      }
    }
  });
});

describe("message origins", () => {
  it("accepts Reddit parents and rejects lookalike hosts", () => {
    expect(isTrustedMessageOrigin("https://www.reddit.com")).toBe(true);
    expect(isTrustedMessageOrigin("https://mod.reddit.com")).toBe(true);
    expect(isTrustedMessageOrigin("http://localhost:4173")).toBe(true);
    expect(isTrustedMessageOrigin("https://reddit.com.evil.test")).toBe(false);
    expect(isTrustedMessageOrigin("https://notreddit.com")).toBe(false);
    expect(isTrustedMessageOrigin("http://www.reddit.com")).toBe(false);
  });
});
