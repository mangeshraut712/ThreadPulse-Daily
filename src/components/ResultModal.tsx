import type { DailyGameState } from "../types";

interface ResultModalProps {
    gameState: DailyGameState;
    onClose: () => void;
    onShare: (platform: string) => void;
}

export function ResultModal({ gameState, onClose, onShare }: ResultModalProps) {
    const won = gameState.playerState.completed;
    const guessCount = gameState.playerState.guesses.length;
    const score = gameState.playerState.score;
    const streak = gameState.playerState.streak;

    const emojiGrid = gameState.playerState.guesses
        .map((g) => (g.correct ? "🟩" : "🟥"))
        .join("");

    const shareText = won
        ? `🧩 ThreadPulse Daily ${gameState.dayKey}\n\n${emojiGrid}\n\nScore: ${score} | Streak: 🔥${streak}\n\n#ThreadPulseDaily #RedditGames`
        : `🧩 ThreadPulse Daily ${gameState.dayKey}\n\n${emojiGrid}\n\nBetter luck tomorrow!\n\n#ThreadPulseDaily #RedditGames`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareText);
            onShare("clipboard");
        } catch {
            // Fallback
            const textarea = document.createElement("textarea");
            textarea.value = shareText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            onShare("clipboard");
        }
    };

    const handleRedditShare = () => {
        const url = `https://www.reddit.com/submit?title=${encodeURIComponent(
            `ThreadPulse Daily ${gameState.dayKey} — Score: ${score}`
        )}&selftext=true&text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank", "width=600,height=500");
        onShare("reddit");
    };

    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(url, "_blank", "width=600,height=400");
        onShare("twitter");
    };

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Game Results">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="result-emoji">{won ? "🎉" : "😔"}</div>
                <h2 className="result-title">
                    {won ? "Brilliant!" : "Better Luck Tomorrow"}
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)", marginBottom: "var(--sp-2)" }}>
                    {won
                        ? `You solved it in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}!`
                        : `The answer was "${gameState.puzzle.answer}"`}
                </p>

                {/* Emoji Grid */}
                <div style={{ fontSize: "1.5rem", letterSpacing: "4px", margin: "var(--sp-4) 0" }}>
                    {emojiGrid}
                </div>

                {/* Stats */}
                <div className="result-stats">
                    <div className="result-stat">
                        <div className="result-stat-value" style={{ color: won ? "var(--success)" : "var(--error)" }}>
                            {score}
                        </div>
                        <div className="result-stat-label">Score</div>
                    </div>
                    <div className="result-stat">
                        <div className="result-stat-value" style={{ color: "var(--accent-gold)" }}>
                            🔥{streak}
                        </div>
                        <div className="result-stat-label">Streak</div>
                    </div>
                    <div className="result-stat">
                        <div className="result-stat-value">
                            {guessCount}/6
                        </div>
                        <div className="result-stat-label">Guesses</div>
                    </div>
                </div>

                {/* Share Buttons */}
                <div className="share-grid">
                    <button className="share-btn share-btn-reddit" onClick={handleRedditShare} type="button">
                        🤖 Share on Reddit
                    </button>
                    <button className="share-btn share-btn-copy" onClick={handleCopy} type="button">
                        📋 Copy Result
                    </button>
                    <button className="share-btn share-btn-twitter" onClick={handleTwitterShare} type="button">
                        🐦 Share on X
                    </button>
                </div>

                <button
                    className="btn btn-ghost"
                    onClick={onClose}
                    style={{ marginTop: "var(--sp-4)", width: "100%" }}
                    type="button"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
