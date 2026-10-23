import { type FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CommunityClue, DailyGameState } from "../types";
import type { AnimationType } from "../hooks/useGameMaker";
import { normalizeGuess } from "../core/safety";

const MAX_GUESSES = 6;

interface GameBoardProps {
  gameState: DailyGameState;
  onGuessSubmit: (guess: string) => void;
  onHintUnlock: () => void;
  onClueSubmit: (clue: string) => void;
  onClueVote?: (clueId: string, direction: "up" | "down") => void;
  onGameMakerAnimation?: (type: AnimationType) => void;
}

function HintList({
  hints,
  unlocked,
  canUnlockMore,
  onUnlock,
}: {
  hints: string[];
  unlocked: number;
  canUnlockMore: boolean;
  onUnlock: () => void;
}) {
  return (
    <ul className="hints-list" aria-live="polite">
      {hints.map((hint, index) => {
        const isVisible = index < unlocked;
        const canUnlock = !isVisible && canUnlockMore && index === unlocked;
        return (
          <li key={`hint-${index}`} className={`hint-item ${isVisible ? "" : "hint-locked"}`}>
            {canUnlock ? (
              <button type="button" className="hint-unlock" onClick={onUnlock}>
                <span className="hint-number" aria-hidden="true">{index + 1}</span>
                <span className="hint-text">Unlock hint {index + 1} (−15 points)</span>
              </button>
            ) : (
              <>
                <span className="hint-number" aria-hidden="true">{index + 1}</span>
                <span className="hint-text">{isVisible ? hint : "Unlock the previous hint first"}</span>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function GuessPanel({
  gameState,
  isGameOver,
  guessesLeft,
  onGuessSubmit,
  onGameMakerAnimation,
}: {
  gameState: DailyGameState;
  isGameOver: boolean;
  guessesLeft: number;
  onGuessSubmit: (guess: string) => void;
  onGameMakerAnimation?: (type: AnimationType) => void;
}) {
  const [guess, setGuess] = useState("");
  const [shakeInput, setShakeInput] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const guessErrorId = useId();
  const guessesUsed = gameState.playerState.guesses.length;

  useEffect(() => {
    if (!isGameOver && inputRef.current && document.activeElement === document.body) {
      inputRef.current.focus();
    }
  }, [isGameOver, guessesUsed]);

  const handleGuessSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = guess.trim();
      const normalized = normalizeGuess(trimmed);
      if (!normalized) {
        setFormError("Enter a guess using letters or numbers.");
        setShakeInput(true);
        window.setTimeout(() => setShakeInput(false), 500);
        return;
      }

      const isDuplicate = gameState.playerState.guesses.some((item) => normalizeGuess(item.text) === normalized);
      if (isDuplicate) {
        setFormError("You already tried that guess.");
        setShakeInput(true);
        window.setTimeout(() => setShakeInput(false), 500);
        return;
      }

      setFormError(null);
      onGuessSubmit(trimmed);
      setGuess("");
      onGameMakerAnimation?.("guess-submit");
    },
    [guess, gameState.playerState.guesses, onGuessSubmit, onGameMakerAnimation]
  );

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Your Guesses</h3>
        <div className="guess-slots" aria-label={`${guessesLeft} guesses remaining`}>
          {Array.from({ length: MAX_GUESSES }, (_, index) => {
            const previous = gameState.playerState.guesses[index];
            let className = "guess-slot";
            if (previous) className += previous.correct ? " correct" : " used";
            return <div key={index} className={className} aria-hidden="true" />;
          })}
        </div>
      </div>

      {gameState.playerState.guesses.length > 0 && (
        <div className="guess-grid">
          <h4 className="visually-hidden">Previous guesses</h4>
          {gameState.playerState.guesses.map((item, index) => (
            <div
              key={`guess-${item.text}-${index}`}
              className={`guess-row ${item.correct ? "correct" : "incorrect"}`}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="guess-icon" aria-hidden="true">{item.correct ? "✅" : "❌"}</span>
              <span>
                {item.text}
                <span className="visually-hidden">{item.correct ? ", correct" : ", incorrect"}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {!isGameOver && (
        <form onSubmit={handleGuessSubmit} className="input-group">
          <label className="visually-hidden" htmlFor="guess-input">Your guess</label>
          <input
            ref={inputRef}
            type="text"
            className={`guess-input ${shakeInput ? "gm-error" : ""}`}
            value={guess}
            onChange={(event) => {
              setGuess(event.target.value);
              if (formError) setFormError(null);
            }}
            placeholder={`Guess the word... (${guessesLeft} left)`}
            maxLength={32}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={isGameOver}
            id="guess-input"
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? guessErrorId : undefined}
          />
          <button type="submit" className="btn btn-primary" disabled={!guess.trim() || isGameOver}>
            Submit guess
          </button>
        </form>
      )}
      {formError && (
        <p id={guessErrorId} className="field-error" role="alert">{formError}</p>
      )}

      {gameState.playerState.score > 0 && (
        <div className="score-display" style={{ marginTop: "var(--sp-4)" }}>
          <div>
            <div className="score-label">Score</div>
            <div className="score-value">{gameState.playerState.score}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClueList({
  clues,
  viewerVotes,
  onClueVote,
}: {
  clues: CommunityClue[];
  viewerVotes: Record<string, "up" | "down">;
  onClueVote?: (clueId: string, direction: "up" | "down") => void;
}) {
  if (clues.length === 0) {
    return <p className="empty-copy">No clues yet — be the first to contribute!</p>;
  }

  return (
    <ul className="clue-list">
      {clues.map((clue) => {
        const authorLabel = clue.author === "local-player" ? "you" : clue.author;
        const vote = viewerVotes[clue.id];
        return (
          <li key={clue.id} className="clue-item">
            <div className="clue-votes">
              <button
                className="clue-vote-btn"
                aria-label={`Upvote clue by ${authorLabel}`}
                aria-pressed={vote === "up"}
                type="button"
                onClick={() => onClueVote?.(clue.id, "up")}
              >
                ▲
              </button>
              <span className="clue-vote-count">{clue.upvotes}</span>
              <button
                className="clue-vote-btn"
                aria-label={`Downvote clue by ${authorLabel}`}
                aria-pressed={vote === "down"}
                type="button"
                onClick={() => onClueVote?.(clue.id, "down")}
              >
                ▼
              </button>
            </div>
            <div>
              <div className="clue-text">{clue.text}</div>
              <div className="clue-author">by {authorLabel}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ClueComposer({ onClueSubmit }: { onClueSubmit: (clue: string) => void }) {
  const [clueInput, setClueInput] = useState("");
  const [showClueSection, setShowClueSection] = useState(false);
  const clueHintId = useId();

  const handleClueSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (clueInput.trim().length < 8) return;
    onClueSubmit(clueInput.trim());
    setClueInput("");
  };

  if (!showClueSection) {
    return (
      <button
        type="button"
        className="btn btn-outline"
        style={{ marginTop: "var(--sp-4)", width: "100%" }}
        onClick={() => setShowClueSection(true)}
      >
        Contribute a clue
      </button>
    );
  }

  return (
    <>
      <form onSubmit={handleClueSubmit} className="input-group" style={{ marginTop: "var(--sp-4)" }}>
        <label className="visually-hidden" htmlFor="clue-input">Community clue</label>
        <input
          type="text"
          className="guess-input"
          value={clueInput}
          onChange={(event) => setClueInput(event.target.value)}
          placeholder="Write a helpful clue (8-180 chars)"
          maxLength={180}
          minLength={8}
          id="clue-input"
          aria-describedby={clueHintId}
        />
        <button type="submit" className="btn btn-secondary" disabled={clueInput.trim().length < 8}>
          Submit clue
        </button>
      </form>
      <p id={clueHintId} className="field-hint">
        8 to 180 characters. Don&apos;t include the answer or links.
      </p>
    </>
  );
}

export function GameBoard({
  gameState,
  onGuessSubmit,
  onHintUnlock,
  onClueSubmit,
  onClueVote,
  onGameMakerAnimation,
}: GameBoardProps) {
  const guessesUsed = gameState.playerState.guesses.length;
  const guessesLeft = Math.max(0, MAX_GUESSES - guessesUsed);
  const isGameOver = gameState.playerState.completed || guessesLeft <= 0;
  const hasSubmittedClue = gameState.communityClues.some((clue) => clue.author === "local-player");
  const visibleCount = useMemo(
    () => Math.max(1, Math.min(3, gameState.playerState.hintsUnlocked)),
    [gameState.playerState.hintsUnlocked]
  );

  const unlockHint = useCallback(() => {
    onHintUnlock();
    onGameMakerAnimation?.("hint-reveal");
  }, [onHintUnlock, onGameMakerAnimation]);

  return (
    <div className="game-board">
      {gameState.playerState.completed && (
        <div className="completed-banner">
          <div className="completed-banner-icon" aria-hidden="true">🏆</div>
          <div className="completed-banner-text">
            <h3>Puzzle Solved!</h3>
            <p>
              The answer was <strong>&quot;{gameState.puzzle.answer}&quot;</strong> — you got it in{" "}
              {guessesUsed} {guessesUsed === 1 ? "guess" : "guesses"}.
            </p>
          </div>
        </div>
      )}

      {!gameState.playerState.completed && guessesLeft <= 0 && (
        <div className="failed-banner">
          <div className="failed-banner-icon" aria-hidden="true">💡</div>
          <div className="failed-banner-text">
            <h3>Not This Time</h3>
            <p>
              The answer was <strong>&quot;{gameState.puzzle.answer}&quot;</strong>. Come back tomorrow
              for a new puzzle!
            </p>
          </div>
        </div>
      )}

      <div className="card puzzle-card">
        <div className="card-header">
          <div>
            <div className="puzzle-number">
              Puzzle #{gameState.puzzle.id.replace("p", "")} · {gameState.dayKey}
            </div>
            <h2 className="puzzle-title">{gameState.puzzle.title}</h2>
          </div>
          <span className="card-badge badge-category">{gameState.puzzle.category}</span>
        </div>
        <HintList
          hints={gameState.puzzle.hints}
          unlocked={visibleCount}
          canUnlockMore={!isGameOver}
          onUnlock={unlockHint}
        />
        <div className="subreddit-tags">
          {gameState.puzzle.subredditTags.map((tag) => (
            <span className="subreddit-tag" key={tag}>{tag}</span>
          ))}
        </div>
      </div>

      <GuessPanel
        gameState={gameState}
        isGameOver={isGameOver}
        guessesLeft={guessesLeft}
        onGuessSubmit={onGuessSubmit}
        onGameMakerAnimation={onGameMakerAnimation}
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Community Clues</h3>
          <span className="card-badge badge-category">
            {gameState.communityClues.length} clue{gameState.communityClues.length === 1 ? "" : "s"}
          </span>
        </div>
        <ClueList
          clues={gameState.communityClues}
          viewerVotes={gameState.viewerVotes ?? {}}
          onClueVote={onClueVote}
        />
        {hasSubmittedClue ? (
          <div className="success-toast" style={{ marginTop: "var(--sp-3)" }} role="status">
            Your clue has been submitted. Thanks for contributing!
          </div>
        ) : (
          <ClueComposer onClueSubmit={onClueSubmit} />
        )}
      </div>
    </div>
  );
}
