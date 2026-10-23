/* eslint-disable react-hooks/rules-of-hooks -- Devvit calls hooks from render callbacks, which are not React components. */
import { Devvit, useAsync, useState } from '@devvit/public-api';
import {
    isUtcDayKey,
    parseBoundedInt,
    sanitizeRedditUsername,
    unwrapWebViewMessage,
    validateClueText,
    MAX_SCORE,
} from '../../../src/core/safety';

Devvit.configure({
    redditAPI: true,
    redis: true,
});

function utcDayKey(date = new Date()): string {
    return date.toISOString().slice(0, 10);
}

type RedditRedisContext = Pick<Devvit.Context, "reddit" | "redis">;

async function moderatorUsername(context: Pick<Devvit.Context, "reddit">): Promise<string | null> {
    const user = await context.reddit.getCurrentUser();
    return sanitizeRedditUsername(user?.username ?? null);
}

async function isModerator(context: Pick<Devvit.Context, "reddit">): Promise<boolean> {
    const user = await context.reddit.getCurrentUser();
    if (!user) return false;
    const subreddit = await context.reddit.getCurrentSubreddit();
    const permissions = await user.getModPermissionsForSubreddit(subreddit.name);
    return Array.isArray(permissions) && permissions.length > 0;
}

async function createDailyPost(context: RedditRedisContext): Promise<boolean> {
    const subreddit = await context.reddit.getCurrentSubreddit();
    const dateStr = utcDayKey();
    if (!isUtcDayKey(dateStr)) return false;

    const lockKey = `daily-post:${subreddit.name}:${dateStr}`;
    const existing = await context.redis.get(lockKey);
    if (existing) return false;

    await context.reddit.submitPost({
        title: `ThreadPulse Daily — ${dateStr}`,
        subredditName: subreddit.name,
        preview: (
            <vstack alignment="center middle" height="100%" gap="medium" backgroundColor="#0B1622">
                <text size="xxlarge" weight="bold" color="#FFB089">ThreadPulse Daily</text>
                <text size="medium" color="#C6CAD1">Today's puzzle is ready.</text>
            </vstack>
        ),
    });
    await context.redis.set(lockKey, '1');
    return true;
}

Devvit.addCustomPostType({
    name: 'ThreadPulse Daily',
    description: 'A daily word puzzle game — guess the Reddit-themed word!',
    height: 'tall',
    render: (context) => {
        const [showGame, setShowGame] = useState(false);
        const usernameRequest = useAsync(async () => moderatorUsername(context));
        const username = usernameRequest.data ?? 'Redditor';
        const dayKey = utcDayKey();

        const onWebViewMessage = async (msg: { type?: string; data?: Record<string, unknown> }) => {
            const message = unwrapWebViewMessage(msg);
            if (!message) return;
            const player = (await moderatorUsername(context)) ?? 'player';

            switch (message.type) {
                case 'GAME_COMPLETE': {
                    const score = parseBoundedInt(message.data.score, 0, MAX_SCORE);
                    const streak = parseBoundedInt(message.data.streak, 0, 10000);
                    const guesses = parseBoundedInt(message.data.guesses, 0, 6);
                    const reportedDay = message.data.dayKey;
                    if (score === null || streak === null || guesses === null || !isUtcDayKey(reportedDay)) break;

                    await context.redis.zAdd(`leaderboard:${reportedDay}`, {
                        member: player,
                        score,
                    });
                    break;
                }
                case 'SUBMIT_CLUE': {
                    const clue = validateClueText(message.data.clueText);
                    const reportedDay = message.data.dayKey;
                    if (!clue.valid || !isUtcDayKey(reportedDay)) break;

                    const authorKey = `clue-author:${reportedDay}:${player}`;
                    const alreadySubmitted = await context.redis.get(authorKey);
                    if (alreadySubmitted) break;

                    const clueId = `clue:${reportedDay}:${Date.now()}`;
                    await context.redis.hSet(clueId, {
                        text: clue.text,
                        author: player,
                        upvotes: '0',
                    });
                    await context.redis.zAdd(`clues:${reportedDay}`, {
                        member: clueId,
                        score: Date.now(),
                    });
                    await context.redis.set(authorKey, clueId);
                    break;
                }
                default:
                    break;
            }
        };

        if (!showGame) {
            return (
                <vstack height="100%" width="100%" alignment="center middle" gap="medium" backgroundColor="#0B1622">
                    <text size="xxlarge" weight="bold" color="#FFB089">
                        ThreadPulse Daily
                    </text>
                    <button appearance="primary" onPress={() => setShowGame(true)}>
                        Start daily puzzle
                    </button>
                    <text size="small" color="#C6CAD1">
                        Welcome, {username}
                    </text>
                </vstack>
            );
        }

        return (
            <vstack height="100%" width="100%">
                <webview
                    url="index.html"
                    state={{ username, dayKey }}
                    onMessage={onWebViewMessage}
                    height="100%"
                    width="100%"
                />
            </vstack>
        );
    },
});

Devvit.addMenuItem({
    label: 'Create ThreadPulse Daily Post',
    location: 'subreddit',
    forUserType: 'moderator',
    onPress: async (_event, context) => {
        const created = await createDailyPost(context);
        context.ui.showToast({
            text: created ? 'ThreadPulse Daily post created.' : "Today's post already exists.",
            appearance: created ? 'success' : 'neutral',
        });
    },
});

Devvit.addTrigger({
    event: 'AppInstall',
    onEvent: async (_event, context) => {
        await createDailyPost(context);
    },
});

Devvit.addTrigger({
    event: 'AppUpgrade',
    onEvent: async (_event, context) => {
        await createDailyPost(context);
    },
});

Devvit.addTrigger({
    event: 'CommentSubmit',
    onEvent: async (event, context) => {
        const body = event.comment?.body?.toLowerCase().trim();
        if (body !== '!create-game') return;
        if (!(await isModerator(context))) return;
        await createDailyPost(context);
    },
});

export default Devvit;
