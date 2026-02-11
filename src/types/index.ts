// Core types for ThreadPulse Daily 2026
export interface Player {
  id: string;
  username: string;
  karma: number;
  profile: PlayerProfile;
  stats: PlayerStats;
}

export interface PlayerProfile {
  skillLevel: number;
  averageTime: number;
  hintUsage: number;
  streakHistory: number[];
  preferredCategories: string[];
  joinDate: Date;
  lastActive: Date;
}

export interface PlayerStats {
  totalGames: number;
  winRate: number;
  averageScore: number;
  longestStreak: number;
  currentStreak: number;
  cluesContributed: number;
  cluesAccepted: number;
}

export interface GameHistory {
  date: Date;
  puzzleId: string;
  completed: boolean;
  score: number;
  timeTaken: number;
  hintsUsed: number;
  difficulty: number;
  timestamp: number;
  puzzle: {
    category: string;
  };
}

export interface Puzzle {
  id: string;
  answer: string;
  category: string;
  title: string;
  hints: string[];
  difficulty: number;
  subredditTags: string[];
  createdAt: Date;
  author?: string;
  aiGenerated?: boolean;
}

export interface DailyGameState {
  dayKey: string;
  puzzle: Puzzle;
  playerState: PlayerDailyState;
  communityClues: CommunityClue[];
  leaderboard?: LeaderboardEntry[];
  timestamp: Date;
}

export interface PlayerDailyState {
  guesses: Guess[];
  hintsUnlocked: number;
  score: number;
  completed: boolean;
  timeStarted: Date;
  timeCompleted?: Date;
  streak: number;
}

export interface Guess {
  text: string;
  timestamp: Date;
  hintsUsed: number;
  correct: boolean;
  score?: number;
}

export interface CommunityClue {
  id: string;
  text: string;
  author: string;
  upvotes: number;
  modBoost: number;
  aiAnalysis: AIClueAnalysis;
  createdAt: Date;
  approved: boolean;
}

export interface AIClueAnalysis {
  sentiment: number; // -1 to 1
  creativity: number; // 0 to 1
  difficulty: number; // 0 to 1
  engagement_prediction: number; // 0 to 1
  toxicity_score: number; // 0 to 1
  quality_score: number; // 0 to 1
}

export interface GameMakerConfig {
  enabled: boolean;
  particleEffects: boolean;
  animations: boolean;
  soundEnabled: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface MobileUXConfig {
  gestureControls: boolean;
  hapticFeedback: boolean;
  swipeActions: SwipeActions;
  longPressAction: string;
  pinchZoom: boolean;
}

export interface SwipeActions {
  right: 'submit' | 'next' | 'skip';
  left: 'hint' | 'back' | 'menu';
  up: 'leaderboard' | 'stats' | 'share';
  down: 'clues' | 'settings' | 'help';
}

export interface AIAdaptiveDifficulty {
  currentLevel: number;
  targetSuccessRate: number;
  adjustmentFactor: number;
  nextAdjustment: Date;
  confidence: number;
  factors: {
    skillLevel: number;
    recentPerformance: number;
    timeOfDay: number;
    dayOfWeek: number;
    streakMomentum: number;
  };
}

export interface LeaderboardEntry {
  player: Player;
  score: number;
  time: number;
  rank: number;
  change: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface NotificationSettings {
  dailyReminder: boolean;
  streakWarning: boolean;
  newFeatures: boolean;
  communityUpdates: boolean;
}

export interface AnalyticsEvent {
  type: string;
  player: string;
  timestamp: Date;
  data: Record<string, any>;
  sessionId: string;
}

// WebAssembly interface
export interface WasmGameEngine {
  calculate_score(params: ScoreParams): number;
  validate_guess(guess: string, answer: string): boolean;
  generate_hints(puzzle: Puzzle, count: number): string[];
  analyze_clue(clue: string): AIClueAnalysis;
}

export interface ScoreParams {
  correct: boolean;
  hintsUsed: number;
  timeSeconds: number;
  streakDays: number;
  difficulty: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface DailyPuzzleResponse {
  puzzle: Puzzle;
  playerState: PlayerDailyState;
  communityClues: CommunityClue[];
  canPlay: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  playerRank?: number;
  totalPlayers: number;
  lastUpdated: Date;
}
