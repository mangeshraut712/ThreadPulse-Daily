import { useCallback, useEffect, useRef, useState } from "react";

import { GameBoard } from "./components/GameBoard";
import { Confetti } from "./components/Confetti";
import { ResultModal } from "./components/ResultModal";
import { useGameStore } from "./hooks/useGameStore";
import { useGameMaker, type AnimationType } from "./hooks/useGameMaker";
import { useHapticFeedback } from "./hooks/useHapticFeedback";
import { devvitBridge } from "./utils/devvitBridge";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function elapsedSeconds(startedAt: Date): number {
  const started = new Date(startedAt).getTime();
  if (Number.isNaN(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

function App() {
  const {
    currentGame,
    isLoading,
    error,
    refreshGame,
    submitGuess,
    unlockHint,
    submitClue,
    voteClue,
  } = useGameStore();

  const gameMaker = useGameMaker();
  const haptics = useHapticFeedback();
  const hapticsRef = useRef(haptics);
  const gameMakerRef = useRef(gameMaker);

  useEffect(() => {
    hapticsRef.current = haptics;
    gameMakerRef.current = gameMaker;
  });

  const [showConfetti, setShowConfetti] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [timer, setTimer] = useState(0);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const prevCompletedRef = useRef(false);
  const reportedDayRef = useRef<string | null>(null);
  const resultTimerRef = useRef<number | null>(null);

  const initializeGameMaker = gameMaker.initialize;

  useEffect(() => {
    void refreshGame();
    void initializeGameMaker();
  }, [refreshGame, initializeGameMaker]);

  useEffect(() => {
    if (isLoading || !currentGame) return;
    const loadingScreen = document.getElementById("loading-screen");
    if (!loadingScreen) return;
    loadingScreen.style.opacity = "0";
    const timeout = window.setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [isLoading, currentGame]);

  const roundStartedAt = currentGame?.playerState.timeStarted;
  const roundCompleted = currentGame?.playerState.completed ?? false;
  const roundGuesses = currentGame?.playerState.guesses.length ?? 0;

  useEffect(() => {
    if (!roundStartedAt || roundCompleted || roundGuesses >= 6) return;
    const tick = () => setTimer(elapsedSeconds(roundStartedAt));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [roundStartedAt, roundCompleted, roundGuesses]);

  useEffect(() => {
    if (!currentGame) return;
    const completed = currentGame.playerState.completed;
    const exhausted = !completed && currentGame.playerState.guesses.length >= 6;
    if (!completed && !exhausted) {
      prevCompletedRef.current = false;
      if (resultTimerRef.current !== null) {
        window.clearTimeout(resultTimerRef.current);
        resultTimerRef.current = null;
      }
      setShowResultModal(false);
      return;
    }
    if (prevCompletedRef.current) return;
    prevCompletedRef.current = true;

    const finishedAt = currentGame.playerState.timeCompleted?.getTime()
      ?? currentGame.playerState.guesses[currentGame.playerState.guesses.length - 1]?.timestamp.getTime()
      ?? Date.now();
    const isFresh = Date.now() - finishedAt < 2000;

    if (completed && isFresh) {
      setShowConfetti(true);
      hapticsRef.current.triggerHaptic("success");
      gameMakerRef.current.triggerAnimation("celebration");
      if (reportedDayRef.current !== currentGame.dayKey) {
        reportedDayRef.current = currentGame.dayKey;
        devvitBridge.reportGameComplete(
          currentGame.playerState.score ?? 0,
          currentGame.playerState.guesses.length,
          currentGame.playerState.streak ?? 0,
          currentGame.dayKey
        );
      }
    } else if (exhausted && isFresh) {
      hapticsRef.current.triggerHaptic("error");
      gameMakerRef.current.triggerAnimation("error");
    }

    resultTimerRef.current = window.setTimeout(
      () => setShowResultModal(true),
      isFresh ? (completed ? 1200 : 800) : 0
    );
  }, [currentGame]);

  useEffect(() => () => {
    if (resultTimerRef.current !== null) window.clearTimeout(resultTimerRef.current);
  }, []);

  const handleGuessSubmit = useCallback(
    async (guess: string) => {
      const isCorrect = await submitGuess(guess);
      hapticsRef.current.triggerHaptic(isCorrect ? "success" : "medium");
    },
    [submitGuess]
  );

  const handleGameMakerAnimation = useCallback((type: AnimationType) => {
    gameMakerRef.current.triggerAnimation(type);
  }, []);

  const handleShare = useCallback((platform: "clipboard" | "clipboard-error" | "reddit" | "twitter") => {
    if (platform === "clipboard") {
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    if (platform === "clipboard-error") {
      setCopied(false);
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2500);
    }
  }, []);

  if (isLoading || !currentGame) {
    return (
      <div className="app-shell">
        <div className="app-bg" />
        <main className="app-main" id="main">
          {!isLoading && error ? (
            <div className="error-toast" role="alert">
              <span>{error}</span>
              <button type="button" className="btn btn-primary" onClick={() => void refreshGame()}>
                Try again
              </button>
            </div>
          ) : (
            <div className="loading-state" role="status">
              <div className="loading-spinner" />
              <p>Loading today&apos;s puzzle...</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  const playing = !currentGame.playerState.completed && currentGame.playerState.guesses.length < 6;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to puzzle</a>
      <div className="app-bg" />
      <Confetti active={showConfetti} />

      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon" aria-hidden="true">🧩</div>
            <div className="brand-text">
              <h1>ThreadPulse Daily</h1>
              <p>{currentGame.dayKey}</p>
            </div>
          </div>

          <div className="header-meta">
            {playing && (
              <div className="timer" role="timer" aria-label={`Time elapsed: ${formatTime(timer)}`}>
                <span className="timer-icon" aria-hidden="true">⏱</span>
                <span>{formatTime(timer)}</span>
              </div>
            )}
            {currentGame.playerState.streak > 0 && (
              <div className="streak-badge" aria-label={`${currentGame.playerState.streak} day streak`}>
                <span aria-hidden="true">🔥</span> {currentGame.playerState.streak}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main" id="main">
        {error && (
          <div className="error-toast" role="alert">
            <span>{error}</span>
          </div>
        )}
        {copied && (
          <div className="success-toast" role="status">
            <span>Result copied to clipboard!</span>
          </div>
        )}
        {copyError && (
          <div className="error-toast" role="alert">
            <span>Couldn&apos;t copy the result. Select it and copy manually.</span>
          </div>
        )}

        <GameBoard
          gameState={currentGame}
          onGuessSubmit={(guess) => void handleGuessSubmit(guess)}
          onHintUnlock={() => void unlockHint()}
          onClueSubmit={(clue) => void submitClue(clue)}
          onClueVote={voteClue}
          onGameMakerAnimation={handleGameMakerAnimation}
        />
      </main>

      <footer className="app-footer">
        <p>
          Made with care for the <strong>Reddit Daily Games Hackathon 2026</strong>
        </p>
        <div className="footer-links">
          <a className="footer-link" href="https://developers.reddit.com" target="_blank" rel="noopener noreferrer">
            Devvit Docs <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a className="footer-link" href="https://gamemaker.io" target="_blank" rel="noopener noreferrer">
            GameMaker <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          <span aria-hidden="true">·</span>
          <a className="footer-link" href="https://redditdailygames2026.devpost.com" target="_blank" rel="noopener noreferrer">
            Hackathon <span className="visually-hidden">(opens in a new tab)</span>
          </a>
        </div>
      </footer>

      {showResultModal && (
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
