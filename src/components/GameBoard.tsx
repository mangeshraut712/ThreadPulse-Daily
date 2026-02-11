import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DailyGameState } from "../types";

const MAX_GUESSES = 6;

interface GameBoardProps {
  gameState: DailyGameState;
  onGuessSubmit: (guess: string) => void;
  onHintUnlock: () => void;
  onClueSubmit: (clue: string) => void;
  onGameMakerAnimation?: (type: string) => void;
}

export function GameBoard({
  gameState,
  onGuessSubmit,
  onHintUnlock,
  onClueSubmit,
  onGameMakerAnimation,
}: GameBoardProps) {
  const [guess, setGuess] = useState("");
  const [clueInput, setClueInput] = useState("");
  const [shakeInput, setShakeInput] = useState(false);
  const [showClueSection, setShowClueSection] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const guessesUsed = gameState.playerState.guesses.length;
  const guessesLeft = Math.max(0, MAX_GUESSES - guessesUsed);
  const isCompleted = gameState.playerState.completed;
  const isExhausted = guessesLeft <= 0;
  const isGameOver = isCompleted || isExhausted;
  const hasSubmittedClue = gameState.communityClues.some((c) => c.author === "local-player");

  const visibleHints = useMemo(
    () =>
      gameState.puzzle.hints.slice(
        0,
        Math.max(1, Math.min(3, gameState.playerState.hintsUnlocked))
      ),
    [gameState.puzzle.hints, gameState.playerState.hintsUnlocked]
  );

  // Auto-focus input
  useEffect(() => {
    if (!isGameOver && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGameOver, guessesUsed]);

  const handleGuessSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = guess.trim();
      if (!trimmed) return;

      // Check for duplicate
      const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isDuplicate = gameState.playerState.guesses.some(
        (g) => g.text.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized
      );

      if (isDuplicate) {
        setShakeInput(true);
        setTimeout(() => setShakeInput(false), 500);
        return;
      }

      onGuessSubmit(trimmed);
      setGuess("");

      // Trigger GameMaker animation
      onGameMakerAnimation?.("guess-submit");
    },
    [guess, gameState.playerState.guesses, onGuessSubmit, onGameMakerAnimation]
  );

  const handleClueSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!clueInput.trim()) return;
      onClueSubmit(clueInput.trim());
      setClueInput("");
    },
    [clueInput, onClueSubmit]
  );

  const handleUnlockHint = useCallback(() => {
    onHintUnlock();
    onGameMakerAnimation?.("hint-reveal");
  }, [onHintUnlock, onGameMakerAnimation]);

  return (
    <div className="game-board">
      {/* ─── Completed / Failed Banner ─── */}
      {isCompleted && (
        <div className="completed-banner">
          <div className="completed-banner-icon">🏆</div>
          <div className="completed-banner-text">
            <h3>Puzzle Solved!</h3>
            <p>
              The answer was <strong>"{gameState.puzzle.answer}"</strong> — you
              got it in {guessesUsed} {guessesUsed === 1 ? "guess" : "guesses"}.
            </p>
          </div>
        </div>
      )}

      {isExhausted && !isCompleted && (
        <div className="failed-banner">
          <div className="failed-banner-icon">💡</div>
          <div className="failed-banner-text">
            <h3>Not This Time</h3>
            <p>
              The answer was <strong>"{gameState.puzzle.answer}"</strong>. Come
              back tomorrow for a new puzzle!
            </p>
          </div>
        </div>
      )}

      {/* ─── Puzzle Card ─── */}
      <div className="card puzzle-card">
        <div className="card-header">
          <div>
            <div className="puzzle-number">
              Puzzle #{gameState.puzzle.id.replace("p", "")} · {gameState.dayKey}
            </div>
            <h2 className="puzzle-title">{gameState.puzzle.title}</h2>
          </div>
          <span className="card-badge badge-category">
            {gameState.puzzle.category}
          </span>
        </div>

        {/* Hints */}
        <ul className="hints-list">
          {gameState.puzzle.hints.map((hint, index) => {
            const isVisible = index < visibleHints.length;
            return (
              <li
                key={`hint-${index}`}
                className={`hint-item ${isVisible ? "" : "hint-locked"}`}
                onClick={!isVisible && !isGameOver ? handleUnlockHint : undefined}
                role={!isVisible ? "button" : undefined}
                tabIndex={!isVisible && !isGameOver ? 0 : undefined}
                aria-label={!isVisible ? `Unlock hint ${index + 1}` : undefined}
              >
                <span className="hint-number">{index + 1}</span>
                <span className="hint-text">
                  {isVisible ? hint : "Tap to unlock this hint"}
                </span>
              </li>
            );
          })}
        </ul>

        {/* Subreddit Tags */}
        <div className="subreddit-tags">
          {gameState.puzzle.subredditTags.map((tag) => (
            <span className="subreddit-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Guess Section ─── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Your Guesses</h3>
          <div className="guess-slots" aria-label={`${guessesLeft} guesses remaining`}>
            {Array.from({ length: MAX_GUESSES }, (_, i) => {
              const g = gameState.playerState.guesses[i];
              let cls = "guess-slot";
              if (g) cls += g.correct ? " correct" : " used";
              return <div key={i} className={cls} />;
            })}
          </div>
        </div>

        {/* Previous guesses */}
        {gameState.playerState.guesses.length > 0 && (
          <div className="guess-grid">
            {gameState.playerState.guesses.map((g, i) => (
              <div
                key={`guess-${i}`}
                className={`guess-row ${g.correct ? "correct" : "incorrect"}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="guess-icon">
                  {g.correct ? "✅" : "❌"}
                </span>
                <span>{g.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        {!isGameOver && (
          <form onSubmit={handleGuessSubmit} className="input-group">
            <input
              ref={inputRef}
              type="text"
              className={`guess-input ${shakeInput ? "gm-error" : ""}`}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={`Guess the word... (${guessesLeft} left)`}
              maxLength={32}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={isGameOver}
              id="guess-input"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!guess.trim() || isGameOver}
            >
              Submit
            </button>
          </form>
        )}

        {/* Score */}
        {gameState.playerState.score > 0 && (
          <div style={{ marginTop: "var(--sp-4)", display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
            <div>
              <div className="score-label">Score</div>
              <div className="score-value">{gameState.playerState.score}</div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Community Clues ─── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            💬 Community Clues
          </h3>
          <span className="card-badge badge-category">
            {gameState.communityClues.length} clue{gameState.communityClues.length !== 1 ? "s" : ""}
          </span>
        </div>

        {gameState.communityClues.length > 0 ? (
          <ul className="clue-list">
            {gameState.communityClues.map((clue) => (
              <li key={clue.id} className="clue-item">
                <div className="clue-votes">
                  <button className="clue-vote-btn" aria-label="Upvote" type="button">▲</button>
                  <span className="clue-vote-count">{clue.upvotes}</span>
                  <button className="clue-vote-btn" aria-label="Downvote" type="button">▼</button>
                </div>
                <div>
                  <div className="clue-text">{clue.text}</div>
                  <div className="clue-author">
                    by {clue.author === "local-player" ? "you" : clue.author}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            No clues yet — be the first to contribute!
          </p>
        )}

        {/* Submit clue */}
        {!hasSubmittedClue ? (
          <>
            {!showClueSection ? (
              <button
                type="button"
                className="btn btn-outline"
                style={{ marginTop: "var(--sp-4)", width: "100%" }}
                onClick={() => setShowClueSection(true)}
              >
                ✍️ Contribute a Clue
              </button>
            ) : (
              <form onSubmit={handleClueSubmit} className="input-group" style={{ marginTop: "var(--sp-4)" }}>
                <input
                  type="text"
                  className="guess-input"
                  value={clueInput}
                  onChange={(e) => setClueInput(e.target.value)}
                  placeholder="Write a helpful clue (8-180 chars)"
                  maxLength={180}
                  minLength={8}
                  id="clue-input"
                />
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={clueInput.trim().length < 8}
                >
                  Submit
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="success-toast" style={{ marginTop: "var(--sp-3)" }}>
            ✅ Your clue has been submitted. Thanks for contributing!
          </div>
        )}
      </div>
    </div>
  );
}
