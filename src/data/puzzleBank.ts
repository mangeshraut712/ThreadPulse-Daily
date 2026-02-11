export interface Puzzle {
    id: string;
    answer: string;
    category: string;
    title: string;
    hints: string[];
    subredditTags: string[];
}

export const puzzleBank: Puzzle[] = [
    {
        id: "p001",
        answer: "wholesome",
        category: "community-vibe",
        title: "Faith in Humans",
        hints: [
            "This post type usually gets people saying, 'I needed this today.'",
            "It often features strangers helping each other with no strings attached.",
            "Common in communities focused on kindness and uplifting stories."
        ],
        subredditTags: ["r/HumansBeingBros", "r/wholesomememes"]
    },
    {
        id: "p002",
        answer: "nostalgia",
        category: "memory",
        title: "Back in the Day",
        hints: [
            "This feeling spikes when people post old gadgets, cartoons, or school memories.",
            "Comments often include phrases like 'core memory unlocked.'",
            "It connects current users to past eras and shared cultural moments."
        ],
        subredditTags: ["r/nostalgia", "r/OldSchoolCool"]
    },
    {
        id: "p003",
        answer: "chaos",
        category: "thread-energy",
        title: "Comment Spiral",
        hints: [
            "The top comment is normal, then everything derails quickly.",
            "Usually paired with absurd memes, bad puns, and escalating jokes.",
            "The mood is high-energy and unpredictable."
        ],
        subredditTags: ["r/memes", "r/funny"]
    },
    {
        id: "p004",
        answer: "plottwist",
        category: "story",
        title: "Not What You Expected",
        hints: [
            "A post starts one way, then reveals a very different outcome.",
            "Readers often edit their comments after seeing new context.",
            "This is a classic pattern in storytelling and viral threads."
        ],
        subredditTags: ["r/tifu", "r/BestofRedditorUpdates"]
    },
    {
        id: "p005",
        answer: "debate",
        category: "discussion",
        title: "Hot Take Hour",
        hints: [
            "People split into camps and defend opinions with long replies.",
            "Most threads have strong arguments from both sides.",
            "Moderation and civility matter most in this format."
        ],
        subredditTags: ["r/changemyview", "r/AskReddit"]
    },
    {
        id: "p006",
        answer: "speedrun",
        category: "gaming",
        title: "Fastest Route",
        hints: [
            "The objective is to finish as quickly as possible under shared rules.",
            "Players optimize every second and discover tiny time saves.",
            "Communities post records, resets, and breakdown clips."
        ],
        subredditTags: ["r/speedrun", "r/gaming"]
    },
    {
        id: "p007",
        answer: "underrated",
        category: "recommendation",
        title: "Hidden Gem",
        hints: [
            "Users argue this item deserves much more attention.",
            "The thread usually includes reasons it was overlooked.",
            "A lot of replies become recommendation chains."
        ],
        subredditTags: ["r/movies", "r/Music"]
    },
    {
        id: "p008",
        answer: "cringe",
        category: "reaction",
        title: "Second-Hand Embarrassment",
        hints: [
            "People react strongly when social mistakes are visible to everyone.",
            "Commenters physically recoil while still watching to the end.",
            "The emotion mixes discomfort, humor, and disbelief."
        ],
        subredditTags: ["r/CringePurgatory", "r/PublicFreakout"]
    },
    {
        id: "p009",
        answer: "whodunit",
        category: "mystery",
        title: "Solve the Case",
        hints: [
            "The thread presents clues and asks readers to infer the culprit.",
            "People compare evidence and challenge each theory.",
            "This format rewards close reading and lateral thinking."
        ],
        subredditTags: ["r/UnresolvedMysteries", "r/RBI"]
    },
    {
        id: "p010",
        answer: "streak",
        category: "habit",
        title: "Keep It Going",
        hints: [
            "Players return daily to maintain progress without missing a day.",
            "The mechanic is simple but drives long-term engagement.",
            "A miss resets momentum, so consistency matters."
        ],
        subredditTags: ["r/theXeffect", "r/GetDisciplined"]
    },
    {
        id: "p011",
        answer: "repost",
        category: "meta",
        title: "Déjà Vu Scroll",
        hints: [
            "Users in the comments section start debating originality.",
            "You feel certain you've seen this exact content before.",
            "The most common accusation in any popular thread."
        ],
        subredditTags: ["r/memes", "r/funny"]
    },
    {
        id: "p012",
        answer: "karma",
        category: "reddit-culture",
        title: "Internet Points",
        hints: [
            "It's the currency that fuels participation but can't buy anything.",
            "Some users farm it obsessively with low-effort posts.",
            "Your total is visible on your profile and signals reputation."
        ],
        subredditTags: ["r/help", "r/TheoryOfReddit"]
    },
    {
        id: "p013",
        answer: "rickroll",
        category: "internet-culture",
        title: "Never Gonna Give You Up",
        hints: [
            "A harmless prank that's been going strong since the 2000s.",
            "You click a link expecting something else entirely.",
            "The song is catchy. The betrayal is legendary."
        ],
        subredditTags: ["r/rickroll", "r/memes"]
    },
    {
        id: "p014",
        answer: "moderation",
        category: "governance",
        title: "Guardians of the Thread",
        hints: [
            "Without this, subreddits would descend into spam and toxicity.",
            "Volunteers enforce rules, remove posts, and ban violators.",
            "Every community depends on this unpaid labor."
        ],
        subredditTags: ["r/modhelp", "r/subredditdrama"]
    },
    {
        id: "p015",
        answer: "copypasta",
        category: "humor",
        title: "Ctrl+V Comedy",
        hints: [
            "Long blocks of text that spread through repetition and absurdity.",
            "The original meaning is lost — now it's pure meme fuel.",
            "Navy Seal, gorilla warfare, and tendies are classic examples."
        ],
        subredditTags: ["r/copypasta", "r/shitposting"]
    },
    {
        id: "p016",
        answer: "throwaway",
        category: "confession",
        title: "Anonymous Account",
        hints: [
            "Created specifically so the main account stays clean.",
            "Often used to share deeply personal or embarrassing stories.",
            "The username usually starts with a telltale phrase."
        ],
        subredditTags: ["r/confessions", "r/relationship_advice"]
    },
    {
        id: "p017",
        answer: "lurker",
        category: "behavior",
        title: "Silent Observer",
        hints: [
            "They read every comment but never post or reply.",
            "Statistically, this describes the vast majority of users.",
            "Some eventually 'de-cloak' with an apologetic first comment."
        ],
        subredditTags: ["r/AskReddit", "r/memes"]
    },
    {
        id: "p018",
        answer: "crosspost",
        category: "mechanics",
        title: "Shared Across Borders",
        hints: [
            "Content from one community appears in another with attribution.",
            "It's an official feature that gives credit to the original poster.",
            "Useful when a post fits multiple subreddits equally well."
        ],
        subredditTags: ["r/help", "r/TheoryOfReddit"]
    },
    {
        id: "p019",
        answer: "banana",
        category: "inside-joke",
        title: "Universal Scale",
        hints: [
            "Redditors use this item to show real-world size of objects.",
            "It started as a joke and became an unwritten standard.",
            "No ruler needed when you have this fruit for comparison."
        ],
        subredditTags: ["r/mildlyinteresting", "r/BananasForScale"]
    },
    {
        id: "p020",
        answer: "hivemind",
        category: "phenomenon",
        title: "Collective Agreement",
        hints: [
            "When the majority opinion dominates and dissent gets buried.",
            "Upvotes create a feedback loop that reinforces popular views.",
            "Critics say it suppresses original thought in large subreddits."
        ],
        subredditTags: ["r/TheoryOfReddit", "r/unpopularopinion"]
    },
    {
        id: "p021",
        answer: "flair",
        category: "customization",
        title: "Badge of Identity",
        hints: [
            "A small label next to your username that shows team or role.",
            "Some subreddits require it before you can post.",
            "It can be text, an emoji, or both — depending on community rules."
        ],
        subredditTags: ["r/help", "r/nfl"]
    },
    {
        id: "p022",
        answer: "tifu",
        category: "storytelling",
        title: "Mistake Made Public",
        hints: [
            "Four letters that preface the most entertaining confessions.",
            "Stories range from minor embarrassment to life-altering blunders.",
            "Half the fun is reading comments that say 'this isn't that bad.'"
        ],
        subredditTags: ["r/tifu", "r/AskReddit"]
    },
    {
        id: "p023",
        answer: "upvote",
        category: "mechanics",
        title: "Arrow of Approval",
        hints: [
            "One click to show agreement, appreciation, or 'this is funny.'",
            "The direction is always skyward — toward visibility.",
            "Enough of these and a post reaches the front page."
        ],
        subredditTags: ["r/help", "r/TheoryOfReddit"]
    },
    {
        id: "p024",
        answer: "rabbit hole",
        category: "experience",
        title: "Time Vanished",
        hints: [
            "You clicked on one link, then another, and suddenly it's 3 AM.",
            "Wikipedia, Reddit threads, and YouTube all enable this behavior.",
            "The deeper you go, the further from the original topic you drift."
        ],
        subredditTags: ["r/InternetIsBeautiful", "r/wikipedia"]
    },
    {
        id: "p025",
        answer: "goldfish",
        category: "pets",
        title: "Bowl Buddy",
        hints: [
            "A common first pet that lives in a small glass container.",
            "Despite myths, they can actually remember things for months.",
            "Posts about these creatures often reveal surprisingly long lifespans."
        ],
        subredditTags: ["r/Aquariums", "r/pets"]
    },
    {
        id: "p026",
        answer: "meme",
        category: "culture",
        title: "Shared Language",
        hints: [
            "An image, video, or phrase that spreads rapidly across the internet.",
            "The best ones capture a universal feeling in a single frame.",
            "They evolve, get remixed, and eventually die — only to be reborn."
        ],
        subredditTags: ["r/memes", "r/dankmemes"]
    },
    {
        id: "p027",
        answer: "subreddit",
        category: "structure",
        title: "Community Within a Community",
        hints: [
            "Every topic, hobby, and niche has its own dedicated space.",
            "Prefixed with 'r/' and managed by volunteer moderators.",
            "There are millions of these, from r/cats to r/astrophysics."
        ],
        subredditTags: ["r/help", "r/findareddit"]
    },
    {
        id: "p028",
        answer: "frontpage",
        category: "achievement",
        title: "Peak Visibility",
        hints: [
            "Getting here means thousands or millions will see your content.",
            "It's the ultimate validation for a Reddit post.",
            "An algorithm decides what rises to this coveted spot."
        ],
        subredditTags: ["r/all", "r/popular"]
    },
    {
        id: "p029",
        answer: "cakeday",
        category: "tradition",
        title: "Anniversary Slice",
        hints: [
            "A small icon appears next to your name on this special day.",
            "It celebrates the date your account was created.",
            "Posts mentioning it often receive extra goodwill and upvotes."
        ],
        subredditTags: ["r/cakeday", "r/memes"]
    },
    {
        id: "p030",
        answer: "shitpost",
        category: "humor",
        title: "Low Effort, High Impact",
        hints: [
            "Created with minimal effort but maximum comedic absurdity.",
            "Quality is intentionally low — that's the entire point.",
            "Some communities are dedicated exclusively to this art form."
        ],
        subredditTags: ["r/shitposting", "r/okbuddyretard"]
    },
    {
        id: "p031",
        answer: "deepfake",
        category: "technology",
        title: "Seeing Isn't Believing",
        hints: [
            "AI-generated media that makes anyone say or do anything.",
            "The realism has improved so much that detection is difficult.",
            "Ethical concerns around consent and misinformation are huge."
        ],
        subredditTags: ["r/technology", "r/Futurology"]
    },
    {
        id: "p032",
        answer: "gilded",
        category: "reward",
        title: "Golden Recognition",
        hints: [
            "When someone spends real money to highlight your contribution.",
            "A shiny icon appears next to the post or comment.",
            "The recipient gets special perks and access to an exclusive lounge."
        ],
        subredditTags: ["r/help", "r/lounge"]
    },
    {
        id: "p033",
        answer: "satire",
        category: "writing",
        title: "Serious About Not Being Serious",
        hints: [
            "It looks real, reads real, but the intention is mockery.",
            "The best versions make you question if the author is joking.",
            "Subreddits dedicated to this often get mistaken for genuine belief."
        ],
        subredditTags: ["r/TheOnion", "r/nottheonion"]
    },
    {
        id: "p034",
        answer: "bot",
        category: "automation",
        title: "Not a Real Person",
        hints: [
            "It replies instantly with formatted information or a reminder.",
            "Some are helpful, some are annoying, some are malicious.",
            "Auto-moderator is the most well-known example on this platform."
        ],
        subredditTags: ["r/BotDefense", "r/SubSimulatorGPT2"]
    },
    {
        id: "p035",
        answer: "ama",
        category: "format",
        title: "Open Questions",
        hints: [
            "Three letters that invite the internet to interrogate you.",
            "Celebrities, scientists, and everyday people have done them.",
            "The most famous one involved a sitting U.S. president."
        ],
        subredditTags: ["r/AMA", "r/IAmA"]
    }
];
