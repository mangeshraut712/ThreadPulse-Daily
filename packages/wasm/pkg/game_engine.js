/**
 * JavaScript fallback for the ThreadPulse score helper.
 * The Rust crate in ../src is the native source; this file stays in sync
 * with src/core/dailyGameEngine.ts so the package is usable without wasm-pack.
 */

export function calculateScore({ correct, hintsUsed, timeSeconds, streakDays }) {
  if (!correct) return 0;
  const hints = Number.isFinite(hintsUsed) ? hintsUsed : 1;
  const time = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const streak = Number.isFinite(streakDays) ? streakDays : 0;
  const hintPenalty = Math.max(0, hints - 1) * 15;
  const timePenalty = Math.min(35, Math.floor(Math.max(0, time) / 6));
  const streakBonus = Math.min(25, Math.floor(Math.max(0, streak) / 2));
  return Math.max(5, 100 - hintPenalty - timePenalty + streakBonus);
}

export function guessesMatch(guess, answer) {
  const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedGuess = normalize(guess);
  return normalizedGuess.length > 0 && normalizedGuess === normalize(answer);
}
