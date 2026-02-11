import { useCallback, useEffect, useRef, useState } from "react";

import { GameBoard } from "./components/GameBoard";
import { Confetti } from "./components/Confetti";
import { ResultModal } from "./components/ResultModal";
import { useGameStore } from "./hooks/useGameStore";
import { useGameMaker } from "./hooks/useGameMaker";
import { useHapticFeedback } from "./hooks/useHapticFeedback";
import { devvitBridge } from "./utils/devvitBridge";

function App() {
  const {
    currentGame,
    isLoading,
    error,
    refreshGame,
    submitGuess,
    unlockHint,
    submitClue,
  } = useGameStore();

  const gameMaker = useGameMaker();
  const haptics = useHapticFeedback();

  const [showConfetti, setShowConfetti] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timer, setTimer] = useState(0);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCompletedRef = useRef(false);

  // Initialize game
  useEffect(() => {
    void refreshGame();
    void gameMaker.initialize();
  }, [refreshGame, gameMaker.initialize]);

  // Hide loading screen once app is ready
  useEffect(() => {
    if (!isLoading && currentGame) {
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
        loadingScreen.style.opacity = "0";
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 400);
      }
    }
  }, [isLoading, currentGame]);

  // Timer
  useEffect(() => {
    if (
      currentGame &&
      !currentGame.playerState.completed &&
      currentGame.playerState.guesses.length < 6
    ) {
      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentGame]);

  // Detect solve
  useEffect(() => {
    if (currentGame?.playerState.completed && !prevCompletedRef.current) {
      prevCompletedRef.current = true;
      setShowConfetti(true);

      // Stop timer
      if (timerRef.current) clearInterval(timerRef.current);

      // Haptic feedback
      haptics.triggerHaptic("success");

      // GameMaker celebration
      gameMaker.triggerAnimation("celebration");

      // Report to Devvit host for leaderboard
      devvitBridge.reportGameComplete(
        currentGame.playerState.score ?? 0,
        currentGame.playerState.guesses.length,
        currentGame.playerState.streak ?? 0
      );

      // Show result modal after a brief delay
      setTimeout(() => setShowResultModal(true), 1200);
    }

    // Detect game over (exhausted guesses)
    if (
      currentGame &&
      !currentGame.playerState.completed &&
      currentGame.playerState.guesses.length >= 6 &&
      !prevCompletedRef.current
    ) {
      prevCompletedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      haptics.triggerHaptic("error");
      gameMaker.triggerAnimation("error");
      setTimeout(() => setShowResultModal(true), 800);
    }
  }, [currentGame, haptics, gameMaker]);

  const handleGuessSubmit = useCallback(
    async (guess: string) => {
      const isCorrect = await submitGuess(guess);
      if (isCorrect) {
        haptics.triggerHaptic("success");
      } else {
        haptics.triggerHaptic("medium");
      }
    },
    [submitGuess, haptics]
  );

  const handleGameMakerAnimation = useCallback(
    (type: string) => {
      gameMaker.triggerAnimation(type as any);
    },
    [gameMaker]
  );

  const handleShare = useCallback((platform: string) => {
    if (platform === "clipboard") {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Loading State ─────────────────────────────────────
  if (isLoading || !currentGame) {
    return (
      <div className="app-shell">
        <div className="app-bg" />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            flexDirection: "column",
            gap: "var(--sp-4)",
          }}
        >
          <div className="loading-spinner" />
          <p style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            Loading today&apos;s puzzle...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-bg" />

      {/* ─── Confetti ─── */}
      <Confetti active={showConfetti} />

      {/* ─── Header ─── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon" aria-hidden="true">
              🧩
            </div>
            <div className="brand-text">
              <h1>ThreadPulse Daily</h1>
              <p>{currentGame.dayKey}</p>
            </div>
          </div>

          <div className="header-meta">
            {/* Timer */}
            {!currentGame.playerState.completed &&
              currentGame.playerState.guesses.length < 6 && (
                <div className="timer" aria-label={`Time elapsed: ${formatTime(timer)}`}>
                  <span className="timer-icon">⏱</span>
                  <span>{formatTime(timer)}</span>
                </div>
              )}

            {/* Streak */}
            {currentGame.playerState.streak > 0 && (
              <div className="streak-badge" aria-label={`${currentGame.playerState.streak} day streak`}>
                🔥 {currentGame.playerState.streak}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="app-main">
        {/* Error toast */}
        {error && (
          <div className="error-toast" role="alert">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Copied toast */}
        {copied && (
          <div className="success-toast" role="status">
            <span>✅</span>
            <span>Result copied to clipboard!</span>
          </div>
        )}

        {/* Game Board */}
        <GameBoard
          gameState={currentGame}
          onGuessSubmit={(g) => void handleGuessSubmit(g)}
          onHintUnlock={() => void unlockHint()}
          onClueSubmit={(c) => void submitClue(c)}
          onGameMakerAnimation={handleGameMakerAnimation}
        />
      </main>

      {/* ─── Footer ─── */}
      <footer className="app-footer">
        <p>
          Made with ❤️ for the <strong>Reddit Daily Games Hackathon 2026</strong>
        </p>
        <div className="footer-links">
          <a className="footer-link" href="https://developers.reddit.com" target="_blank" rel="noopener noreferrer">
            Devvit Docs
          </a>
          <span style={{ color: "var(--text-tertiary)" }}>·</span>
          <a className="footer-link" href="https://gamemaker.io" target="_blank" rel="noopener noreferrer">
            GameMaker
          </a>
          <span style={{ color: "var(--text-tertiary)" }}>·</span>
          <a className="footer-link" href="https://redditdailygames2026.devpost.com" target="_blank" rel="noopener noreferrer">
            Hackathon
          </a>
        </div>
      </footer>

      {/* ─── Result Modal ─── */}
      {showResultModal && currentGame && (
        <ResultModal
          gameState={currentGame}
          onClose={() => setShowResultModal(false)}
          onShare={handleShare}
        />
      )}
    </div>
  );
}

export default App;
