import { Devvit, useState } from '@devvit/public-api';

Devvit.configure({
    redditAPI: true,
    redis: true,
});

// ─── Custom Post Type ────────────────────────────────────────────
Devvit.addCustomPostType({
    name: 'ThreadPulse Daily',
    description: 'A daily word puzzle game — guess the Reddit-themed word!',
    height: 'tall',
    render: (context) => {
        const [showGame, setShowGame] = useState(false);
        const [username] = useState('Redditor');

        // Handle messages from the webview
        const onWebViewMessage = async (msg: any) => {
            const { type, data } = msg;

            switch (type) {
                case 'GAME_COMPLETE': {
                    if (!data) break;
                    const { score, streak, dayKey } = data as {
                        score: number;
                        streak: number;
                        dayKey: string;
                    };

                    // Save score to leaderboard
                    await context.redis.zAdd(`leaderboard:${dayKey}`, {
                        member: String(username),
                        score: score,
                    });

                    // Save personal streak
                    await context.redis.set(`streak:${username}`, String(streak));
                    break;
                }

                case 'GET_LEADERBOARD': {
                    if (!data) break;
                    const { dayKey } = data as { dayKey: string };
                    const top10 = await context.redis.zRange(`leaderboard:${dayKey}`, 0, 9, {
                        reverse: true,
                        by: 'rank',
                    });
                    // Response sent via state update
                    console.log('Leaderboard data:', top10);
                    break;
                }

                case 'SUBMIT_CLUE': {
                    if (!data) break;
                    const { clueText, dayKey } = data as { clueText: string; dayKey: string };

                    const clueId = `clue:${dayKey}:${Date.now()}`;
                    await context.redis.hSet(clueId, {
                        text: String(clueText),
                        author: String(username), // Fix 3: Ensure author is string type
                        upvotes: '0',
                        timestamp: String(Date.now()),
                    });
                    break;
                }

                default:
                    console.log('Unknown message type:', type);
            }
        };

        // Landing screen — before player taps "Play"
        if (!showGame) {
            return (
                <vstack
                    alignment="center middle"
                    height="100%"
                    gap="large"
                    backgroundColor="#F0F4FF"
                >
                    <spacer size="large" />
                    <text size="xxlarge" weight="bold" color="#FF4500">
                        🧩 ThreadPulse Daily
                    </text>
                    <text size="medium" color="#666666" alignment="center">
                        Guess the Reddit-themed word using progressive hints.
                    </text>
                    <text size="small" color="#999999" alignment="center">
                        New puzzle every day • Build your streak • Share with the community
                    </text>
                    <spacer size="medium" />
                    <button
                        appearance="primary"
                        size="large"
                        onPress={() => setShowGame(true)}
                    >
                        🎮 Play Today's Puzzle
                    </button>
                    <spacer size="small" />
                    <text size="small" color="#AAAAAA">
                        Welcome, u/{username}
                    </text>
                    <spacer size="large" />
                </vstack>
            );
        }

        // Game screen — webview renders the full React game
        return (
            <vstack height="100%" width="100%">
                <webview
                    {...({
                        url: 'index.html',
                        state: {
                            username: username,
                            dayKey: new Date().toISOString().split('T')[0],
                        },
                        onMessage: onWebViewMessage,
                        height: '100%',
                        width: '100%',
                    } as any)}
                />
            </vstack>
        );
    },
});

// ─── Menu Items to Create Game Posts ──────────────────────────────
Devvit.addMenuItem({
    label: '🧩 Create ThreadPulse Daily Post',
    location: ['subreddit', 'post'],
    onPress: async (_event, context) => {
        const subreddit = await context.reddit.getCurrentSubreddit();
        const dateStr = new Date().toISOString().split('T')[0];

        await context.reddit.submitPost({
            title: `🧩 ThreadPulse Daily — ${dateStr}`,
            subredditName: subreddit.name,
            preview: (
                <vstack alignment="center middle" height="100%" gap="medium" backgroundColor="#F0F4FF">
                    <text size="xxlarge" weight="bold" color="#FF4500">
                        🧩 ThreadPulse Daily
                    </text>
                    <text size="medium" color="#666666">
                        Loading today's puzzle...
                    </text>
                </vstack>
            ),
        });

        context.ui.showToast({
            text: `ThreadPulse Daily post created!`,
            appearance: 'success',
        });
    },
});

export default Devvit;
