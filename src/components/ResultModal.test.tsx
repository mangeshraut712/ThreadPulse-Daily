import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResultModal } from "./ResultModal";
import type { DailyGameState } from "../types";

const gameState: DailyGameState = {
  dayKey: "2026-10-23",
  puzzle: {
    id: "p012",
    answer: "karma",
    category: "platform",
    title: "Reputation Points",
    hints: ["One", "Two", "Three"],
    difficulty: 0.4,
    subredditTags: ["r/help"],
    createdAt: new Date("2026-10-23T00:00:00Z"),
  },
  playerState: {
    guesses: [
      { text: "karma", timestamp: new Date("2026-10-23T00:05:00Z"), hintsUsed: 1, correct: true },
    ],
    hintsUnlocked: 1,
    score: 100,
    completed: true,
    timeStarted: new Date("2026-10-23T00:00:00Z"),
    timeCompleted: new Date("2026-10-23T00:05:00Z"),
    streak: 2,
  },
  communityClues: [],
  timestamp: new Date("2026-10-23T00:05:00Z"),
};

describe("ResultModal", () => {
  it("moves focus into the dialog and closes from the keyboard", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ResultModal gameState={gameState} onClose={onClose} onShare={vi.fn()} />);

    const dialog = screen.getByRole("dialog", { name: "Brilliant!" });
    expect(dialog).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opens the Reddit share window without giving it access to this page", async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<ResultModal gameState={gameState} onClose={vi.fn()} onShare={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Share on Reddit" }));
    expect(open).toHaveBeenCalledWith(
      expect.stringContaining("https://www.reddit.com/submit?"),
      "_blank",
      expect.stringContaining("noopener,noreferrer")
    );
    open.mockRestore();
  });
});
