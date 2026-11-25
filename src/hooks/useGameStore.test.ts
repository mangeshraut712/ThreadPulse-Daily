import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "./useGameStore";
import { STORAGE_KEYS, writeStreak } from "../core/playerProgress";

describe("useGameStore", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ currentGame: null, isLoading: true, error: null });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-23T15:00:00Z"));
  });

  it("keeps guesses after a refresh and rejects another round after a solve", async () => {
    await useGameStore.getState().refreshGame();
    const answer = useGameStore.getState().currentGame?.puzzle.answer;
    expect(answer).toBeTruthy();

    await useGameStore.getState().submitGuess("!!!");
    expect(useGameStore.getState().currentGame?.playerState.guesses).toHaveLength(0);

    await useGameStore.getState().submitGuess("not-the-answer");
    await useGameStore.getState().refreshGame();
    expect(useGameStore.getState().currentGame?.playerState.guesses).toHaveLength(1);
    expect(useGameStore.getState().isLoading).toBe(false);

    await useGameStore.getState().submitGuess(answer ?? "");
    const solvedGuesses = useGameStore.getState().currentGame?.playerState.guesses.length ?? 0;
    expect(solvedGuesses).toBeGreaterThan(1);
    expect(useGameStore.getState().currentGame?.playerState.completed).toBe(true);
    expect(useGameStore.getState().currentGame?.playerState.score).toBeGreaterThanOrEqual(5);

    await useGameStore.getState().refreshGame();
    await useGameStore.getState().submitGuess("another try");
    expect(useGameStore.getState().currentGame?.playerState.completed).toBe(true);
    expect(useGameStore.getState().currentGame?.playerState.guesses).toHaveLength(solvedGuesses);
    expect(localStorage.getItem(STORAGE_KEYS.progress)).toContain(answer);
  });

  it("does not display a streak that was already broken", async () => {
    writeStreak(localStorage, { lastSolvedDay: "2026-10-01", streakDays: 12 });
    await useGameStore.getState().refreshGame();
    expect(useGameStore.getState().currentGame?.playerState.streak).toBe(0);
  });

  it("does not invent a point when a downvote cannot go below zero", async () => {
    await useGameStore.getState().refreshGame();
    const game = useGameStore.getState().currentGame;
    expect(game).toBeTruthy();
    if (!game) return;

    const clueId = "clue-zero";
    useGameStore.setState({
      currentGame: {
        ...game,
        communityClues: [
          {
            id: clueId,
            text: "Both players notice the pattern",
            author: "neighbor",
            upvotes: 0,
            modBoost: 0,
            aiAnalysis: {
              sentiment: 0,
              creativity: 0.5,
              difficulty: 0.5,
              engagement_prediction: 0.5,
              toxicity_score: 0,
              quality_score: 0.5,
            },
            createdAt: new Date("2026-10-23T12:00:00Z"),
            approved: true,
          },
        ],
        viewerVotes: {},
      },
    });

    useGameStore.getState().voteClue(clueId, "down");
    expect(useGameStore.getState().currentGame?.communityClues[0]?.upvotes).toBe(0);
    expect(useGameStore.getState().currentGame?.viewerVotes?.[clueId]).toBeUndefined();

    useGameStore.getState().voteClue(clueId, "down");
    expect(useGameStore.getState().currentGame?.communityClues[0]?.upvotes).toBe(0);
  });

  it("rejects a clue that contains the answer and accepts a different clue", async () => {
    await useGameStore.getState().refreshGame();
    const answer = useGameStore.getState().currentGame?.puzzle.answer ?? "";
    const leaked = await useGameStore.getState().submitClue(`pretty sure it is ${answer} today`);
    expect(leaked).toBe(false);
    expect(useGameStore.getState().error).toMatch(/answer/i);

    const accepted = await useGameStore.getState().submitClue("both players notice the pattern");
    expect(accepted).toBe(true);
    expect(useGameStore.getState().currentGame?.communityClues).toHaveLength(1);
  });
});
