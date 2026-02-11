import { useCallback, useEffect, useState, useRef } from 'react';
import type { CommunityClue, Player, LeaderboardEntry, Achievement } from '../types';

// Advanced community and social features for ThreadPulse Daily 2026
export interface CommunityFeatures {
  clueSubmission: boolean;
  votingSystem: boolean;
  leaderboards: boolean;
  achievements: boolean;
  socialSharing: boolean;
  chatSystem: boolean;
  tournaments: boolean;
}

export interface SocialStats {
  totalCluesSubmitted: number;
  totalUpvotesReceived: number;
  totalDownvotesReceived: number;
  cluesAccepted: number;
  averageClueQuality: number;
  communityRank: number;
  reputation: number;
  badges: string[];
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  participants: string[];
  prizes: TournamentPrize[];
  rules: string[];
  currentRound: number;
  isActive: boolean;
}

export interface TournamentPrize {
  position: number;
  prize: string;
  value: number;
  currency: string;
}

export interface ChatMessage {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'system' | 'achievement' | 'streak';
  metadata?: Record<string, any>;
}

export interface SocialShare {
  platform: 'reddit' | 'twitter' | 'facebook' | 'discord' | 'whatsapp';
  url: string;
  title: string;
  description: string;
  hashtags: string[];
}

export function useCommunityFeatures(features: Partial<CommunityFeatures> = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [communityStats, setCommunityStats] = useState<SocialStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  const communityConfig: CommunityFeatures = {
    clueSubmission: true,
    votingSystem: true,
    leaderboards: true,
    achievements: true,
    socialSharing: true,
    chatSystem: true,
    tournaments: false,
    ...features
  };

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection for real-time features
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = process.env.REACT_APP_COMMUNITY_WS_URL || 'ws://localhost:8080/community';
        wsRef.current = new WebSocket(wsUrl);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          console.log('🌐 Connected to community server');
          
          // Join community channels
          wsRef.current?.send(JSON.stringify({
            type: 'join',
            channels: ['leaderboard', 'chat', 'tournaments']
          }));
        };
        
        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };
        
        wsRef.current.onclose = () => {
          setIsConnected(false);
          console.log('🌐 Disconnected from community server');
          
          // Attempt reconnection after delay
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 5000);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('🌐 WebSocket error:', error);
        };
      } catch (error) {
        console.error('🌐 Failed to connect to community server:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'leaderboard_update':
        setLeaderboard(data.leaderboard);
        break;
      case 'chat_message':
        setChatMessages(prev => [...prev, data.message]);
        break;
      case 'tournament_update':
        setTournaments(prev => {
          const index = prev.findIndex(t => t.id === data.tournament.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.tournament;
            return updated;
          }
          return [...prev, data.tournament];
        });
        break;
      case 'achievement_unlocked':
        setAchievements(prev => [...prev, data.achievement]);
        break;
      case 'community_stats':
        setCommunityStats(data.stats);
        break;
    }
  }, []);

  // Submit community clue with AI analysis
  const submitClue = useCallback(async (
    clueText: string,
    puzzleId: string,
    author: Player
  ): Promise<{ success: boolean; clueId?: string; error?: string }> => {
    if (!communityConfig.clueSubmission) {
      return { success: false, error: 'Clue submission is disabled' };
    }

    try {
      // Analyze clue with AI
      const aiAnalysis = await analyzeClueWithAI(clueText);
      
      const clueData = {
        text: clueText,
        puzzleId,
        author: author.id,
        authorName: author.username,
        aiAnalysis,
        timestamp: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
        approved: aiAnalysis.quality_score > 0.6
      };

      const response = await fetch('/api/community/clues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${author.id}`
        },
        body: JSON.stringify(clueData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Broadcast to community
        wsRef.current?.send(JSON.stringify({
          type: 'clue_submitted',
          clue: result.clue
        }));

        return { success: true, clueId: result.clue.id };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to submit clue:', error);
      return { success: false, error: 'Network error' };
    }
  }, [communityConfig.clueSubmission]);

  // Vote on community clue
  const voteOnClue = useCallback(async (
    clueId: string,
    voteType: 'upvote' | 'downvote',
    voterId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!communityConfig.votingSystem) {
      return { success: false, error: 'Voting is disabled' };
    }

    try {
      const response = await fetch(`/api/community/clues/${clueId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${voterId}`
        },
        body: JSON.stringify({ voteType })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Broadcast vote update
        wsRef.current?.send(JSON.stringify({
          type: 'clue_voted',
          clueId,
          voteType,
          newScore: result.newScore
        }));

        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to vote on clue:', error);
      return { success: false, error: 'Network error' };
    }
  }, [communityConfig.votingSystem]);

  // Get top community clues
  const getTopClues = useCallback(async (
    puzzleId: string,
    limit: number = 10
  ): Promise<CommunityClue[]> => {
    try {
      const response = await fetch(`/api/community/clues/top?puzzleId=${puzzleId}&limit=${limit}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch top clues:', error);
      return [];
    }
  }, []);

  // Get community leaderboard
  const getLeaderboard = useCallback(async (
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'daily',
    category?: string
  ): Promise<LeaderboardEntry[]> => {
    if (!communityConfig.leaderboards) {
      return [];
    }

    try {
      const params = new URLSearchParams({ timeframe });
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/community/leaderboard?${params}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }, [communityConfig.leaderboards]);

  // Send chat message
  const sendChatMessage = useCallback(async (
    message: string,
    author: Player,
    messageType: ChatMessage['type'] = 'text'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!communityConfig.chatSystem) {
      return { success: false, error: 'Chat is disabled' };
    }

    try {
      const chatMessage: ChatMessage = {
        id: generateId(),
        author: author.username,
        content: message,
        timestamp: new Date(),
        type: messageType
      };

      // Send via WebSocket for real-time delivery
      wsRef.current?.send(JSON.stringify({
        type: 'chat_message',
        message: chatMessage
      }));

      // Also persist to database
      await fetch('/api/community/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${author.id}`
        },
        body: JSON.stringify(chatMessage)
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return { success: false, error: 'Network error' };
    }
  }, [communityConfig.chatSystem]);

  // Share to social media
  const shareToSocial = useCallback((
    platform: SocialShare['platform'],
    score: number,
    streak: number,
    puzzleTitle: string
  ): SocialShare => {
    if (!communityConfig.socialSharing) {
      throw new Error('Social sharing is disabled');
    }

    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/game`;
    
    const shares: Record<SocialShare['platform'], SocialShare> = {
      reddit: {
        platform: 'reddit',
        url: shareUrl,
        title: `Just scored ${score} points with a ${streak}-day streak in ThreadPulse Daily! 🎮`,
        description: `Can you guess today's puzzle: "${puzzleTitle}"? Join me in this Reddit daily game!`,
        hashtags: ['ThreadPulse', 'RedditGames', 'DailyPuzzle']
      },
      twitter: {
        platform: 'twitter',
        url: shareUrl,
        title: `🎯 Score: ${score} | 🔥 Streak: ${streak} | 🧩 ThreadPulse Daily`,
        description: `Just completed today's puzzle: "${puzzleTitle}". Can you beat my score?`,
        hashtags: ['ThreadPulse', 'PuzzleGame', 'Reddit']
      },
      facebook: {
        platform: 'facebook',
        url: shareUrl,
        title: 'ThreadPulse Daily - Reddit\'s Smartest Puzzle Game',
        description: `I scored ${score} points with a ${streak}-day streak! Join me in this amazing daily puzzle game on Reddit.`,
        hashtags: ['ThreadPulseDaily', 'RedditGames', 'PuzzleChallenge']
      },
      discord: {
        platform: 'discord',
        url: shareUrl,
        title: `ThreadPulse Daily Score: ${score}`,
        description: `🎮 Score: ${score} | 🔥 Streak: ${streak} | 🧩 "${puzzleTitle}"`,
        hashtags: []
      },
      whatsapp: {
        platform: 'whatsapp',
        url: shareUrl,
        title: `ThreadPulse Daily - Score: ${score}, Streak: ${streak}`,
        description: `Check out this amazing puzzle game! I scored ${score} points with a ${streak}-day streak.`,
        hashtags: []
      }
    };

    return shares[platform];
  }, [communityConfig.socialSharing]);

  // Join tournament
  const joinTournament = useCallback(async (
    tournamentId: string,
    playerId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!communityConfig.tournaments) {
      return { success: false, error: 'Tournaments are disabled' };
    }

    try {
      const response = await fetch(`/api/community/tournaments/${tournamentId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${playerId}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Broadcast tournament update
        wsRef.current?.send(JSON.stringify({
          type: 'tournament_joined',
          tournamentId,
          playerId
        }));

        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to join tournament:', error);
      return { success: false, error: 'Network error' };
    }
  }, [communityConfig.tournaments]);

  // Get player achievements
  const getPlayerAchievements = useCallback(async (playerId: string): Promise<Achievement[]> => {
    if (!communityConfig.achievements) {
      return [];
    }

    try {
      const response = await fetch(`/api/community/players/${playerId}/achievements`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      return [];
    }
  }, [communityConfig.achievements]);

  // Unlock achievement
  const unlockAchievement = useCallback(async (
    playerId: string,
    achievementId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!communityConfig.achievements) {
      return { success: false, error: 'Achievements are disabled' };
    }

    try {
      const response = await fetch(`/api/community/players/${playerId}/achievements/${achievementId}/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${playerId}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Broadcast achievement unlock
        wsRef.current?.send(JSON.stringify({
          type: 'achievement_unlocked',
          achievement: result.achievement,
          playerId
        }));

        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      return { success: false, error: 'Network error' };
    }
  }, [communityConfig.achievements]);

  // Get community statistics
  const getCommunityStats = useCallback(async (): Promise<SocialStats | null> => {
    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch community stats:', error);
      return null;
    }
  }, []);

  // AI-powered clue analysis
  const analyzeClueWithAI = useCallback(async (clueText: string): Promise<any> => {
    try {
      const response = await fetch('/api/ai/analyze-clue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clue: clueText })
      });

      if (response.ok) {
        return await response.json();
      }
      
      // Fallback basic analysis
      return {
        sentiment: 0,
        creativity: 0.5,
        difficulty: 0.5,
        engagement_prediction: 0.5,
        toxicity_score: 0,
        quality_score: 0.5
      };
    } catch (error) {
      console.error('Failed to analyze clue with AI:', error);
      return {
        sentiment: 0,
        creativity: 0.5,
        difficulty: 0.5,
        engagement_prediction: 0.5,
        toxicity_score: 0,
        quality_score: 0.5
      };
    }
  }, []);

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  return {
    isConnected,
    communityStats,
    leaderboard,
    tournaments,
    chatMessages,
    achievements,
    communityConfig,
    
    // Methods
    submitClue,
    voteOnClue,
    getTopClues,
    getLeaderboard,
    sendChatMessage,
    shareToSocial,
    joinTournament,
    getPlayerAchievements,
    unlockAchievement,
    getCommunityStats
  };
}

// Advanced social sharing utilities
export function useSocialSharing() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{ success: boolean; platform?: string } | null>(null);

  const share = useCallback(async (
    platform: SocialShare['platform'],
    shareData: SocialShare
  ): Promise<{ success: boolean; error?: string }> => {
    setIsSharing(true);
    setShareResult(null);

    try {
      let success = false;

      switch (platform) {
        case 'reddit':
          success = await shareToReddit(shareData);
          break;
        case 'twitter':
          success = await shareToTwitter(shareData);
          break;
        case 'facebook':
          success = await shareToFacebook(shareData);
          break;
        case 'discord':
          success = await shareToDiscord(shareData);
          break;
        case 'whatsapp':
          success = await shareToWhatsApp(shareData);
          break;
      }

      setShareResult({ success, platform });
      return { success };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setShareResult({ success: false, platform });
      return { success: false, error: errorMessage };
    } finally {
      setIsSharing(false);
    }
  }, []);

  const shareToReddit = async (shareData: SocialShare): Promise<boolean> => {
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}`;
    window.open(redditUrl, '_blank', 'width=600,height=400');
    return true;
  };

  const shareToTwitter = async (shareData: SocialShare): Promise<boolean> => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title + ' ' + shareData.description)}&url=${encodeURIComponent(shareData.url)}&hashtags=${encodeURIComponent(shareData.hashtags.join(','))}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    return true;
  };

  const shareToFacebook = async (shareData: SocialShare): Promise<boolean> => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}&quote=${encodeURIComponent(shareData.description)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    return true;
  };

  const shareToDiscord = async (shareData: SocialShare): Promise<boolean> => {
    // Discord doesn't have a direct share API, so we copy to clipboard
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareData.title}\n${shareData.description}\n${shareData.url}`);
      return true;
    }
    return false;
  };

  const shareToWhatsApp = async (shareData: SocialShare): Promise<boolean> => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.title + ' ' + shareData.description + ' ' + shareData.url)}`;
    window.open(whatsappUrl, '_blank');
    return true;
  };

  const shareNative = async (shareData: SocialShare): Promise<boolean> => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.description,
          url: shareData.url
        });
        return true;
      } catch (error) {
        console.error('Native share failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    isSharing,
    shareResult,
    share,
    shareNative
  };
}

// Tournament management utilities
export function useTournamentManager() {
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [playerTournaments, setPlayerTournaments] = useState<Tournament[]>([]);

  const createTournament = useCallback(async (
    tournamentData: Omit<Tournament, 'id' | 'participants' | 'currentRound' | 'isActive'>
  ): Promise<{ success: boolean; tournamentId?: string; error?: string }> => {
    try {
      const response = await fetch('/api/community/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tournamentData)
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, tournamentId: result.tournament.id };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const getActiveTournaments = useCallback(async (): Promise<Tournament[]> => {
    try {
      const response = await fetch('/api/community/tournaments/active');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch active tournaments:', error);
      return [];
    }
  }, []);

  const getPlayerTournaments = useCallback(async (playerId: string): Promise<Tournament[]> => {
    try {
      const response = await fetch(`/api/community/players/${playerId}/tournaments`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch player tournaments:', error);
      return [];
    }
  }, []);

  return {
    activeTournaments,
    playerTournaments,
    createTournament,
    getActiveTournaments,
    getPlayerTournaments
  };
}
