import { useEffect, useId, useRef } from "react";
import type { DailyGameState } from "../types";

interface ResultModalProps {
  gameState: DailyGameState;
  onClose: () => void;
  onShare: (platform: "clipboard" | "clipboard-error" | "reddit" | "twitter") => void;
}

const FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

function openShareWindow(url: string) {
  const popup = window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  if (popup) popup.opener = null;
}

export function ResultModal({ gameState, onClose, onShare }: ResultModalProps) {
  const won = gameState.playerState.completed;
  const guessCount = gameState.playerState.guesses.length;
  const score = gameState.playerState.score;
  const streak = gameState.playerState.streak;
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const emojiGrid = gameState.playerState.guesses.map((guess) => (guess.correct ? "🟩" : "🟥")).join("");
  const shareText = won
    ? `🧩 ThreadPulse Daily ${gameState.dayKey}\n\n${emojiGrid}\n\nScore: ${score} | Streak: 🔥${streak}\n\n#ThreadPulseDaily #RedditGames`
    : `🧩 ThreadPulse Daily ${gameState.dayKey}\n\n${emojiGrid}\n\nBetter luck tomorrow!\n\n#ThreadPulseDaily #RedditGames`;

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => !item.hasAttribute("disabled")
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const handleCopy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        onShare("clipboard-error");
        return;
      }
      await navigator.clipboard.writeText(shareText);
      onShare("clipboard");
    } catch {
      onShare("clipboard-error");
    }
  };

  const handleRedditShare = () => {
    const url = `https://www.reddit.com/submit?title=${encodeURIComponent(
      `ThreadPulse Daily ${gameState.dayKey} — Score: ${score}`
    )}&type=TEXT&text=${encodeURIComponent(shareText)}`;
    openShareWindow(url);
    onShare("reddit");
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    openShareWindow(url);
    onShare("twitter");
  };

  return (
    <div
      ref={dialogRef}
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="result-emoji" aria-hidden="true">{won ? "🎉" : "😔"}</div>
        <h2 id={titleId} className="result-title">
          {won ? "Brilliant!" : "Better Luck Tomorrow"}
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-2)" }}>
          {won
            ? `You solved it in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!`
            : `The answer was "${gameState.puzzle.answer}"`}
        </p>

        <div className="emoji-grid" aria-label={won ? "Solved puzzle" : "Unsolved puzzle"}>
          {emojiGrid}
        </div>

        <div className="result-stats">
          <div className="result-stat">
            <div className="result-stat-value" style={{ color: won ? "var(--success)" : "var(--error)" }}>
              {score}
            </div>
            <div className="result-stat-label">Score</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-value score-value">{streak}</div>
            <div className="result-stat-label">Streak</div>
          </div>
          <div className="result-stat">
            <div className="result-stat-value">{guessCount}/6</div>
            <div className="result-stat-label">Guesses</div>
          </div>
        </div>

        <div className="share-grid">
          <button className="share-btn share-btn-reddit" onClick={handleRedditShare} type="button">
            Share on Reddit
          </button>
          <button className="share-btn share-btn-copy" onClick={() => void handleCopy()} type="button">
            Copy result
          </button>
          <button className="share-btn share-btn-twitter" onClick={handleTwitterShare} type="button">
            Share on X
          </button>
        </div>

        <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: "var(--sp-4)", width: "100%" }} type="button">
          Close
        </button>
      </div>
    </div>
  );
}
