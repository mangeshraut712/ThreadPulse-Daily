import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameBoard } from "./GameBoard";
import type { DailyGameState } from "../types";

function gameState(): DailyGameState {
  return {
    dayKey: "2026-10-23",
    puzzle: {
      id: "p012",
      answer: "karma",
      category: "platform",
      title: "Reputation Points",
      hints: ["First hint stays visible.", "Second hint is locked.", "Third hint stays locked."],
      difficulty: 0.4,
      subredditTags: ["r/help"],
      createdAt: new Date("2026-10-23T00:00:00Z"),
    },
    playerState: {
      guesses: [],
      hintsUnlocked: 1,
      score: 0,
      completed: false,
      timeStarted: new Date("2026-10-23T00:00:00Z"),
      streak: 0,
    },
    communityClues: [
      {
        id: "clue-1",
        text: "It shows up on your profile.",
        author: "neighbor",
        upvotes: 2,
        modBoost: 0,
        aiAnalysis: {
          sentiment: 0,
          creativity: 0.5,
          difficulty: 0.4,
          engagement_prediction: 0.4,
          toxicity_score: 0,
          quality_score: 0.6,
        },
        createdAt: new Date("2026-10-23T00:00:00Z"),
        approved: true,
      },
    ],
    viewerVotes: {},
    timestamp: new Date("2026-10-23T00:00:00Z"),
  };
}

describe("GameBoard", () => {
  it("labels the guess field and does not reveal the answer early", () => {
    render(
      <GameBoard
        gameState={gameState()}
        onGuessSubmit={vi.fn()}
        onHintUnlock={vi.fn()}
        onClueSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Your guess")).toBeInTheDocument();
    expect(screen.queryByText(/karma/i)).not.toBeInTheDocument();
  });

  it("announces a duplicate guess and unlocks the next hint from the keyboard", async () => {
    const user = userEvent.setup();
    const onGuessSubmit = vi.fn();
    const onHintUnlock = vi.fn();
    const state = gameState();
    state.playerState.guesses = [
      {
        text: "upvote",
        timestamp: new Date("2026-10-23T00:10:00Z"),
        hintsUsed: 1,
        correct: false,
      },
    ];

    render(
      <GameBoard
        gameState={state}
        onGuessSubmit={onGuessSubmit}
        onHintUnlock={onHintUnlock}
        onClueSubmit={vi.fn()}
      />
    );

    await user.type(screen.getByLabelText("Your guess"), "upvote");
    await user.click(screen.getByRole("button", { name: "Submit guess" }));
    expect(onGuessSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/already tried/i);

    const unlock = screen.getByRole("button", { name: /unlock hint 2/i });
    unlock.focus();
    await user.keyboard("{Enter}");
    expect(onHintUnlock).toHaveBeenCalledTimes(1);
  });

  it("votes on a clue with a pressed state", async () => {
    const user = userEvent.setup();
    const onClueVote = vi.fn();
    render(
      <GameBoard
        gameState={gameState()}
        onGuessSubmit={vi.fn()}
        onHintUnlock={vi.fn()}
        onClueSubmit={vi.fn()}
        onClueVote={onClueVote}
      />
    );

    await user.click(screen.getByRole("button", { name: "Upvote clue by neighbor" }));
    expect(onClueVote).toHaveBeenCalledWith("clue-1", "up");
  });
});
