import { create } from "zustand";
import {
  pickDailyPuzzle,
  computeScore,
  evaluateGuess,
  validateCommunityClue,
  rankCommunityClues,
} from "../core/dailyGameEngine";
import {
  activeStreakDays,
  applyVote,
  browserStorage,
  nextStreakRecord,
  readClues,
  readProgress,
  readStreak,
  readVotes,
  writeClues,
  writeProgress,
  writeStreak,
  writeVotes,
  type VoteDirection,
} from "../core/playerProgress";
import { MAX_GUESS_LENGTH, normalizeGuess, sanitizePlainText } from "../core/safety";
import type { CommunityClue, DailyGameState, PlayerDailyState, Puzzle } from "../types";
import { devvitBridge } from "../utils/devvitBridge";

const MAX_GUESSES = 6;

interface GameStoreResult {
  currentGame: DailyGameState | null;
  isLoading: boolean;
  error: string | null;
  refreshGame: () => Promise<void>;
  submitGuess: (guess: string) => Promise<boolean>;
  unlockHint: () => Promise<void>;
  submitClue: (clue: string) => Promise<boolean>;
  voteClue: (clueId: string, direction: VoteDirection) => void;
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `clue-${Date.now()}`;
}

function buildInitialPlayerState(streak: number): PlayerDailyState {
  return {
    guesses: [],
    hintsUnlocked: 1,
    score: 0,
    completed: false,
    timeStarted: new Date(),
    streak,
  };
}

function buildPuzzleModel(rawPuzzle: {
  id: string;
  title: string;
  answer: string;
  category: string;
  hints: string[];
  subredditTags: string[];
}): Puzzle {
  return {
    id: String(rawPuzzle.id),
    title: String(rawPuzzle.title),
    answer: String(rawPuzzle.answer),
    category: String(rawPuzzle.category),
    hints: Array.isArray(rawPuzzle.hints) ? rawPuzzle.hints.map((hint) => String(hint)) : [],
    subredditTags: Array.isArray(rawPuzzle.subredditTags)
      ? rawPuzzle.subredditTags.map((tag) => String(tag))
      : [],
    difficulty: 0.5,
    createdAt: new Date(),
  };
}

function persistGame(game: DailyGameState): void {
  const storage = browserStorage();
  if (!storage) return;
  writeProgress(storage, game.dayKey, game.playerState);
  writeClues(storage, game.dayKey, game.communityClues);
  writeVotes(storage, game.dayKey, game.viewerVotes ?? {});
}

function commitSolvedStreak(dayKey: string): number {
  const storage = browserStorage();
  if (!storage) return 1;
  const next = nextStreakRecord(readStreak(storage), dayKey);
  writeStreak(storage, next);
  return next.streakDays;
}

export const useGameStore = create<GameStoreResult>((set, get) => ({
  currentGame: null,
  isLoading: true,
  error: null,

  refreshGame: async () => {
    set({ isLoading: true, error: null });

    try {
      const now = new Date();
      const daily = pickDailyPuzzle(now);
      const dayKey = String(daily.dayKey);
      const storage = browserStorage();
      const streak = storage ? activeStreakDays(readStreak(storage), dayKey) : 0;
      const storedProgress = storage ? readProgress(storage, dayKey, streak) : null;
      const playerState = storedProgress
        ? { ...storedProgress, streak: storedProgress.completed ? Math.max(storedProgress.streak, streak) : streak }
        : buildInitialPlayerState(streak);

      set({
        isLoading: false,
        currentGame: {
          dayKey,
          puzzle: buildPuzzleModel(daily.puzzle),
          playerState,
          communityClues: storage ? readClues(storage, dayKey) : [],
          viewerVotes: storage ? readVotes(storage, dayKey) : {},
          leaderboard: [],
          timestamp: now,
        },
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to initialize daily game.",
      });
    }
  },

  submitGuess: async (guess: string) => {
    const trimmed = guess.trim();
    const normalized = normalizeGuess(trimmed);
    if (!normalized || trimmed.length > MAX_GUESS_LENGTH) {
      set({ error: "Enter a guess using letters or numbers (32 characters max)." });
      return false;
    }

    let applied = false;
    let solved = false;
    let dayKey = "";

    set((state) => {
      const game = state.currentGame;
      if (!game || game.playerState.completed) return state;
      if (game.playerState.guesses.length >= MAX_GUESSES) {
        return { error: "No guesses remaining for today." };
      }

      const duplicate = game.playerState.guesses.some((item) => normalizeGuess(item.text) === normalized);
      if (duplicate) {
        return { error: "You already tried that guess." };
      }

      const evaluation = evaluateGuess({
        guess: trimmed,
        answer: game.puzzle.answer,
      });
      const startedAt = new Date(game.playerState.timeStarted);
      const elapsed = Number.isNaN(startedAt.getTime())
        ? 0
        : Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
      const nextScore = computeScore({
        correct: evaluation.correct,
        hintsUsed: game.playerState.hintsUnlocked,
        timeSeconds: elapsed,
        streakDays: game.playerState.streak,
      });
      const guesses = [
        ...game.playerState.guesses,
        {
          text: trimmed,
          timestamp: new Date(),
          hintsUsed: game.playerState.hintsUnlocked,
          correct: evaluation.correct,
        },
      ];
      const guessesLeft = MAX_GUESSES - guesses.length;
      applied = true;
      solved = evaluation.correct;
      dayKey = game.dayKey;

      return {
        error: evaluation.correct
          ? null
          : guessesLeft <= 0
            ? "Round complete. Try again on the next daily puzzle."
            : `Not correct yet. ${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} left.`,
        currentGame: {
          ...game,
          playerState: {
            ...game.playerState,
            guesses,
            completed: evaluation.correct,
            score: evaluation.correct ? nextScore : 0,
            timeCompleted: evaluation.correct ? new Date() : game.playerState.timeCompleted,
          },
        },
      };
    });

    if (!applied) return false;

    if (solved) {
      const streak = commitSolvedStreak(dayKey);
      set((state) => {
        if (!state.currentGame || state.currentGame.dayKey !== dayKey) return state;
        return {
          currentGame: {
            ...state.currentGame,
            playerState: { ...state.currentGame.playerState, streak },
          },
        };
      });
    }

    const latest = get().currentGame;
    if (latest) persistGame(latest);
    return solved;
  },

  unlockHint: async () => {
    let changed = false;
    set((state) => {
      const game = state.currentGame;
      if (!game || game.playerState.completed || game.playerState.guesses.length >= MAX_GUESSES) return state;
      const nextHints = Math.min(3, game.playerState.hintsUnlocked + 1);
      if (nextHints === game.playerState.hintsUnlocked) return state;
      changed = true;
      return {
        currentGame: {
          ...game,
          playerState: { ...game.playerState, hintsUnlocked: nextHints },
        },
      };
    });
    if (!changed) return;
    const latest = get().currentGame;
    if (latest) persistGame(latest);
  },

  submitClue: async (clue: string) => {
    const game = get().currentGame;
    if (!game) return false;

    const validation = validateCommunityClue(clue, {
      forbiddenWords: [game.puzzle.answer],
      existingClues: game.communityClues.map((item) => item.text),
    });
    if (!validation.valid) {
      set({ error: validation.reason || "Invalid clue." });
      return false;
    }

    const nextClue: CommunityClue = {
      id: createId(),
      text: sanitizePlainText(clue),
      author: "local-player",
      upvotes: 1,
      modBoost: 0,
      aiAnalysis: {
        sentiment: 0,
        creativity: 0.5,
        difficulty: 0.5,
        engagement_prediction: 0.5,
        toxicity_score: 0,
        quality_score: 0.5,
      },
      approved: true,
      createdAt: new Date(),
    };

    let accepted = false;
    set((state) => {
      const current = state.currentGame;
      if (!current) return state;
      if (current.communityClues.some((item) => item.author === "local-player")) {
        return { error: "You already submitted a clue for today." };
      }
      accepted = true;
      return {
        error: null,
        currentGame: {
          ...current,
          communityClues: rankCommunityClues([...current.communityClues, nextClue], 5, {
            forbiddenWords: [current.puzzle.answer],
          }),
        },
      };
    });

    if (!accepted) return false;
    const latest = get().currentGame;
    if (latest) {
      persistGame(latest);
      devvitBridge.submitClue(nextClue.text, latest.dayKey);
    }
    return true;
  },

  voteClue: (clueId, direction) => {
    const game = get().currentGame;
    if (!game) return;
    const target = game.communityClues.find((clue) => clue.id === clueId);
    if (!target) return;

    const previous = game.viewerVotes?.[clueId] ?? null;
    const voted = applyVote(target.upvotes, previous, direction);
    const viewerVotes = { ...(game.viewerVotes ?? {}) };
    if (voted.vote) viewerVotes[clueId] = voted.vote;
    else delete viewerVotes[clueId];

    const communityClues = rankCommunityClues(
      game.communityClues.map((clue) => (clue.id === clueId ? { ...clue, upvotes: voted.upvotes } : clue)),
      5,
      { forbiddenWords: [game.puzzle.answer] }
    );
    const nextGame: DailyGameState = { ...game, communityClues, viewerVotes };
    set({ currentGame: nextGame });
    persistGame(nextGame);
  },
}));
