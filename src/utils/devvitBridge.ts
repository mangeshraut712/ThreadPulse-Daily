/**
 * Devvit Message Bridge
 *
 * Handles bidirectional communication between the webview game
 * and the Devvit host (Reddit app). Falls back gracefully when
 * running outside of Reddit (e.g., local dev server).
 */

type DevvitMessage = {
    type: string;
    data?: Record<string, unknown>;
};

type MessageHandler = (msg: DevvitMessage) => void;

class DevvitBridge {
    private handlers: Map<string, MessageHandler[]> = new Map();
    private isDevvit: boolean;

    constructor() {
        // Detect if we're running inside a Devvit webview
        this.isDevvit = window.parent !== window;

        if (this.isDevvit) {
            window.addEventListener('message', (event) => {
                try {
                    const msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                    if (msg?.type) {
                        this.emit(msg.type, msg);
                    }
                } catch {
                    // Ignore non-JSON messages
                }
            });
        }
    }

    /** Send a message to the Devvit host */
    postMessage(type: string, data?: Record<string, unknown>) {
        if (!this.isDevvit) {
            console.log('[DevvitBridge] (local mode) →', type, data);
            return;
        }

        window.parent.postMessage(
            { type: 'devvit-message', data: { message: { type, data } } },
            '*'
        );
    }

    /** Listen for messages from Devvit host */
    on(type: string, handler: MessageHandler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(handler);
    }

    /** Remove a listener */
    off(type: string, handler: MessageHandler) {
        const list = this.handlers.get(type);
        if (list) {
            this.handlers.set(type, list.filter(h => h !== handler));
        }
    }

    private emit(type: string, msg: DevvitMessage) {
        const list = this.handlers.get(type);
        if (list) {
            list.forEach(h => h(msg));
        }
    }

    /** Check if running inside Devvit */
    get isInsideReddit(): boolean {
        return this.isDevvit;
    }

    /** Send game completion data to Devvit for leaderboard storage */
    reportGameComplete(score: number, guesses: number, streak: number) {
        const dayKey = new Date().toISOString().split('T')[0];
        this.postMessage('GAME_COMPLETE', { score, guesses, streak, dayKey });
    }

    /** Submit a community clue to Devvit Redis storage */
    submitClue(clueText: string) {
        const dayKey = new Date().toISOString().split('T')[0];
        this.postMessage('SUBMIT_CLUE', { clueText, dayKey });
    }

    /** Request leaderboard data from Devvit */
    requestLeaderboard() {
        const dayKey = new Date().toISOString().split('T')[0];
        this.postMessage('GET_LEADERBOARD', { dayKey });
    }
}

// Singleton instance
export const devvitBridge = new DevvitBridge();
