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
        const [username] = useState(context.userId || 'Redditor');

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
                    break;
                }

                case 'SUBMIT_CLUE': {
                    if (!data) break;
                    const { clueText, dayKey } = data as { clueText: string; dayKey: string };

                    const clueId = `clue:${dayKey}:${Date.now()}`;
                    await context.redis.hSet(clueId, {
                        text: String(clueText),
                        author: String(username),
                        upvotes: '0',
                    });
                    break;
                }
            }
        };

        if (!showGame) {
            return (
                <vstack height="100%" width="100%" alignment="center middle" gap="medium" backgroundColor="#F0F4FF">
                    <text size="xxlarge" weight="bold" color="#FF4500">
                        🧩 ThreadPulse Daily
                    </text>
                    <spacer size="medium" />
                    <button
                        appearance="primary"
                        onPress={() => setShowGame(true)}
                    >
                        START DAILY PUZZLE
                    </button>
                    <spacer size="large" />
                    <text size="small" color="#AAAAAA">
                        Welcome, {username}
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
    location: 'subreddit',
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

// ─── Automated Post Creation Triggers ────────────────────────────
Devvit.addTrigger({
    event: 'AppInstall',
    onEvent: async (_event, context) => {
        const subreddit = await context.reddit.getCurrentSubreddit();
        const dateStr = new Date().toISOString().split('T')[0];

        await context.reddit.submitPost({
            title: `🧩 ThreadPulse Daily — ${dateStr}`,
            subredditName: subreddit.name,
            preview: (
                <vstack alignment="center middle" height="100%" gap="medium" backgroundColor="#F0F4FF">
                    <text size="xxlarge" weight="bold" color="#FF4500">🧩 ThreadPulse Daily</text>
                    <text size="medium" color="#666666">Creating your puzzle...</text>
                </vstack>
            ),
        });
    },
});

Devvit.addTrigger({
    event: 'AppUpgrade',
    onEvent: async (_event, context) => {
        const subreddit = await context.reddit.getCurrentSubreddit();
        const dateStr = new Date().toISOString().split('T')[0];

        await context.reddit.submitPost({
            title: `🧩 ThreadPulse Daily — ${dateStr}`,
            subredditName: subreddit.name,
            preview: (
                <vstack alignment="center middle" height="100%" gap="medium" backgroundColor="#F0F4FF">
                    <text size="xxlarge" weight="bold" color="#FF4500">🧩 ThreadPulse Daily</text>
                    <text size="medium" color="#666666">Creating your puzzle...</text>
                </vstack>
            ),
        });
    },
});

Devvit.addTrigger({
    event: 'CommentSubmit',
    onEvent: async (event, context) => {
        const body = event.comment?.body?.toLowerCase().trim();
        if (body === '!create-game') {
            const subreddit = await context.reddit.getCurrentSubreddit();
            const dateStr = new Date().toISOString().split('T')[0];

            await context.reddit.submitPost({
                title: `🧩 ThreadPulse Daily — ${dateStr}`,
                subredditName: subreddit.name,
                preview: (
                    <vstack alignment="center middle" height="100%" gap="medium" backgroundColor="#F0F4FF">
                        <text size="xxlarge" weight="bold" color="#FF4500">🧩 ThreadPulse Daily</text>
                        <text size="medium" color="#666666">Creating your puzzle...</text>
                    </vstack>
                ),
            });

            if (event.comment?.id) {
                await context.reddit.remove(event.comment.id, true);
            }
        }
    },
});

export default Devvit;
