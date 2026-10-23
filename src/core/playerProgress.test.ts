import { describe, expect, it } from "vitest";
import {
  activeStreakDays,
  applyVote,
  nextStreakRecord,
  parsePlayerProgress,
  readProgress,
  writeProgress,
  type KeyValueStorage,
} from "./playerProgress";

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("streaks", () => {
  it("counts a streak only through yesterday or today", () => {
    expect(activeStreakDays({ lastSolvedDay: "2026-10-20", streakDays: 6 }, "2026-10-23")).toBe(0);
    expect(activeStreakDays({ lastSolvedDay: "2026-10-22", streakDays: 6 }, "2026-10-23")).toBe(6);
    expect(activeStreakDays({ lastSolvedDay: "2026-10-23", streakDays: 7 }, "2026-10-23")).toBe(7);
  });

  it("increments a continued streak and resets a broken one", () => {
    expect(nextStreakRecord({ lastSolvedDay: "2026-10-22", streakDays: 4 }, "2026-10-23")).toEqual({
      lastSolvedDay: "2026-10-23",
      streakDays: 5,
    });
    expect(nextStreakRecord({ lastSolvedDay: "2026-10-01", streakDays: 9 }, "2026-10-23")).toEqual({
      lastSolvedDay: "2026-10-23",
      streakDays: 1,
    });
    expect(nextStreakRecord({ lastSolvedDay: "2026-10-23", streakDays: 5 }, "2026-10-23").streakDays).toBe(5);
  });
});

describe("saved rounds", () => {
  it("restores a valid round and drops tampered guesses", () => {
    const storage = memoryStorage();
    writeProgress(storage, "2026-10-23", {
      guesses: [{ text: "karma", timestamp: new Date("2026-10-23T01:00:00Z"), hintsUsed: 1, correct: true }],
      hintsUnlocked: 2,
      score: 90,
      completed: true,
      timeStarted: new Date("2026-10-23T00:30:00Z"),
      timeCompleted: new Date("2026-10-23T01:00:00Z"),
      streak: 3,
    });

    const restored = readProgress(storage, "2026-10-23", 3);
    expect(restored?.completed).toBe(true);
    expect(restored?.guesses[0]?.timestamp).toBeInstanceOf(Date);
    expect(restored?.score).toBe(90);

    expect(parsePlayerProgress({
      guesses: Array.from({ length: 7 }, () => ({ text: "nope", timestamp: "2026-10-23T00:00:00Z", hintsUsed: 1, correct: false })),
      hintsUnlocked: 1,
      score: 9999,
      completed: false,
      timeStarted: "2026-10-23T00:00:00Z",
    }, 0)).toBeNull();
  });
});

describe("clue votes", () => {
  it("toggles a vote without driving the count below zero", () => {
    expect(applyVote(1, null, "up")).toEqual({ upvotes: 2, vote: "up" });
    expect(applyVote(2, "up", "up")).toEqual({ upvotes: 1, vote: null });
    expect(applyVote(0, null, "down")).toEqual({ upvotes: 0, vote: "down" });
  });
});
