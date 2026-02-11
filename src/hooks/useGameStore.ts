import { create } from 'zustand';
import { useState, useCallback } from 'react';
import {
  pickDailyPuzzle,
  computeScore,
  evaluateGuess,
  validateCommunityClue,
  rankCommunityClues
} from '../core/dailyGameEngine';

import type { Player, Puzzle, CommunityClue, DailyGameState, PlayerDailyState, Guess } from '../types';

const STORAGE_KEYS = {
  streak: "threadpulse.streak",
  clues: "threadpulse.cluesByDay"
};

const MAX_GUESSES = 6;

interface GameStoreResult {
  currentGame: DailyGameState | null;
  isLoading: boolean;
  error: string | null;
  refreshGame: () => Promise<void>;
  submitGuess: (guess: string) => Promise<boolean>;
  unlockHint: () => Promise<void>;
  submitClue: (clue: string) => Promise<boolean>;
}

function buildInitialPlayerState(): PlayerDailyState {
  const now = new Date();
  return {
    guesses: [],
    hintsUnlocked: 1,
    score: 0,
    completed: false,
    timeStarted: now,
    streak: 0
  };
}

function buildPuzzleModel(rawPuzzle: any): Puzzle {
  const now = new Date();
  return {
    id: String(rawPuzzle.id),
    title: String(rawPuzzle.title),
    answer: String(rawPuzzle.answer),
    category: String(rawPuzzle.category),
    hints: Array.isArray(rawPuzzle.hints) ? rawPuzzle.hints.map((h: unknown) => String(h)) : [],
    subredditTags: Array.isArray(rawPuzzle.subredditTags)
      ? rawPuzzle.subredditTags.map((tag: unknown) => String(tag))
      : [],
    difficulty: 0.5,
    createdAt: now
  };
}

function getStreak(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.streak);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Number(parsed.streakDays || 0);
  } catch {
    return 0;
  }
}

function getStreakState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.streak);
    if (!raw) return { lastSolvedDay: null as string | null, streakDays: 0 };
    const parsed = JSON.parse(raw);
    return {
      lastSolvedDay: typeof parsed.lastSolvedDay === "string" ? parsed.lastSolvedDay : null,
      streakDays: Number(parsed.streakDays || 0)
    };
  } catch {
    return { lastSolvedDay: null as string | null, streakDays: 0 };
  }
}

function toUtcDayKey(inputDate = new Date()) {
  const d = new Date(inputDate);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftUtcDay(dayKey: string, days: number): string {
  const d = new Date(`${dayKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toUtcDayKey(d);
}

function updateStreak(dayKey: string): number {
  const streak = getStreakState();
  if (streak.lastSolvedDay === dayKey) return streak.streakDays;

  const yesterday = shiftUtcDay(dayKey, -1);
  const next = {
    lastSolvedDay: dayKey,
    streakDays: streak.lastSolvedDay === yesterday ? streak.streakDays + 1 : 1
  };

  try {
    localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(next));
  } catch {
    // Non-blocking: gameplay should continue even if persistence fails.
  }

  return next.streakDays;
}

function getStoredClues(dayKey: string): CommunityClue[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.clues);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const clues = parsed?.[dayKey];
    return Array.isArray(clues) ? clues : [];
  } catch {
    return [];
  }
}

function saveStoredClues(dayKey: string, clues: CommunityClue[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.clues);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed[dayKey] = clues;
    localStorage.setItem(STORAGE_KEYS.clues, JSON.stringify(parsed));
  } catch {
    // Non-blocking: clue persistence errors should not block gameplay.
  }
}

export function useGameStore(): GameStoreResult {
  const [currentGame, setCurrentGame] = useState<DailyGameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const daily = pickDailyPuzzle(new Date());
      const nextGame: DailyGameState = {
        dayKey: String(daily.dayKey),
        puzzle: buildPuzzleModel(daily.puzzle),
        playerState: {
          ...buildInitialPlayerState(),
          streak: getStreak()
        },
        communityClues: getStoredClues(String(daily.dayKey)),
        leaderboard: [],
        timestamp: new Date()
      };

      setCurrentGame(nextGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize daily game.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitGuess = useCallback(
    async (guess: string) => {
      if (!currentGame || currentGame.playerState.completed) return false;

      if (currentGame.playerState.guesses.length >= MAX_GUESSES) {
        setError("No guesses remaining for today.");
        return false;
      }

      const normalizedGuess = guess.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
      const alreadyTried = currentGame.playerState.guesses.some(
        (item: { text: string }) => item.text.toLowerCase().replace(/[^a-z0-9]/g, "").trim() === normalizedGuess
      );
      if (alreadyTried) {
        setError("You already tried that guess.");
        return false;
      }

      const evaluation = evaluateGuess({
        guess,
        answer: currentGame.puzzle.answer
      });

      const startedAt = new Date(currentGame.playerState.timeStarted);
      const timeSeconds = Number.isNaN(startedAt.getTime()) ? 0 : Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 1000));

      const nextScore = computeScore({
        correct: evaluation.correct,
        hintsUsed: currentGame.playerState.hintsUnlocked,
        timeSeconds,
        streakDays: currentGame.playerState.streak
      });

      const newGuess = {
        text: guess,
        timestamp: new Date(),
        hintsUsed: currentGame.playerState.hintsUnlocked,
        correct: evaluation.correct
      };

      const nextStreak = evaluation.correct ? updateStreak(currentGame.dayKey) : currentGame.playerState.streak;

      setCurrentGame({
        ...currentGame,
        playerState: {
          ...currentGame.playerState,
          guesses: [...currentGame.playerState.guesses, newGuess],
          completed: evaluation.correct,
          score: nextScore,
          streak: nextStreak,
          timeCompleted: evaluation.correct ? new Date() : currentGame.playerState.timeCompleted
        }
      });
      if (evaluation.correct) {
        setError(null);
      } else if (currentGame.playerState.guesses.length + 1 >= MAX_GUESSES) {
        setError("Round complete. Try again on the next daily puzzle.");
      } else {
        setError(`Not correct yet. ${MAX_GUESSES - (currentGame.playerState.guesses.length + 1)} guesses left.`);
      }

      return evaluation.correct;
    },
    [currentGame]
  );

  const unlockHint = useCallback(async () => {
    if (!currentGame || currentGame.playerState.completed) return;

    const nextHints = Math.min(3, currentGame.playerState.hintsUnlocked + 1);
    if (nextHints === currentGame.playerState.hintsUnlocked) return;

    setCurrentGame({
      ...currentGame,
      playerState: {
        ...currentGame.playerState,
        hintsUnlocked: nextHints
      }
    });
  }, [currentGame]);

  const submitClue = useCallback(
    async (clue: string) => {
      if (!currentGame) return false;

      if (currentGame.communityClues.some((item: CommunityClue) => item.author === "local-player")) {
        setError("You already submitted a clue for today.");
        return false;
      }

      const validation = validateCommunityClue(clue, {
        forbiddenWords: [currentGame.puzzle.answer],
        existingClues: currentGame.communityClues.map((item: CommunityClue) => item.text)
      });
      if (!validation.valid) {
        setError(validation.reason || "Invalid clue.");
        return false;
      }

      const nextClue: CommunityClue = {
        id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        text: clue.trim(),
        author: "local-player",
        upvotes: 1,
        modBoost: 0,
        aiAnalysis: {
          sentiment: 0,
          creativity: 0.5,
          difficulty: 0.5,
          engagement_prediction: 0.5,
          toxicity_score: 0,
          quality_score: 0.5
        },
        approved: true,
        createdAt: new Date()
      };

      const ranked = rankCommunityClues([...currentGame.communityClues, nextClue], 5);
      saveStoredClues(currentGame.dayKey, ranked);
      setCurrentGame({
        ...currentGame,
        communityClues: ranked
      });
      setError(null);
      return true;
    },
    [currentGame]
  );

  return {
    currentGame,
    isLoading,
    error,
    refreshGame,
    submitGuess,
    unlockHint,
    submitClue
  };
}
