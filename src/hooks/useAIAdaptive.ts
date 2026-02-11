import { useCallback, useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { Puzzle, Player, GameHistory, AIClueAnalysis } from '../types';

// Advanced AI interfaces for 2026 hackathon
export interface AIModel {
  difficultyModel: tf.LayersModel | null;
  engagementModel: tf.LayersModel | null;
  contentModel: tf.LayersModel | null;
  isInitialized: boolean;
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

export interface PersonalizedInsights {
  preferredDifficulty: number;
  optimalPlayTime: string;
  strengthCategories: string[];
  weaknessCategories: string[];
  engagementPrediction: number;
  nextMilestone: string;
}

export interface EnhancedAIClueAnalysis extends AIClueAnalysis {
  semanticSimilarity: number;
  creativityScore: number;
  educationalValue: number;
  viralityPrediction: number;
  suggestedImprovements: string[];
  alternativePhrasings: string[];
}

const AIModel: AIModel = {
  difficultyModel: null,
  engagementModel: null,
  contentModel: null,
  isInitialized: false
};

export function useAIAdaptive() {
  const [isModelReady, setIsModelReady] = useState(false);
  const modelRef = useRef(AIModel);

  // Initialize TensorFlow.js models
  useEffect(() => {
    const initializeModels = async () => {
      try {
        await tf.ready();
        
        // Initialize Difficulty Prediction Model
        const difficultyModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [8], units: 64, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 32, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 16, activation: 'relu' }),
            tf.layers.dense({ units: 1, activation: 'sigmoid' })
          ]
        });

        difficultyModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: 'meanSquaredError',
          metrics: ['mae', 'accuracy']
        });

        // Initialize Engagement Prediction Model
        const engagementModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [12], units: 128, activation: 'relu' }),
            tf.layers.batchNormalization(),
            tf.layers.dense({ units: 64, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.3 }),
            tf.layers.dense({ units: 32, activation: 'relu' }),
            tf.layers.dense({ units: 1, activation: 'sigmoid' })
          ]
        });

        engagementModel.compile({
          optimizer: tf.train.adam(0.0005),
          loss: 'binaryCrossentropy',
          metrics: ['accuracy', 'precision', 'recall']
        });

        // Initialize Content Quality Model
        const contentModel = tf.sequential({
          layers: [
            tf.layers.dense({ inputShape: [15], units: 96, activation: 'relu' }),
            tf.layers.dense({ units: 48, activation: 'relu' }),
            tf.layers.dense({ units: 24, activation: 'relu' }),
            tf.layers.dense({ units: 8, activation: 'relu' }),
            tf.layers.dense({ units: 5, activation: 'softmax' })
          ]
        });

        contentModel.compile({
          optimizer: tf.train.adam(0.001),
          loss: 'categoricalCrossentropy',
          metrics: ['accuracy']
        });

        modelRef.current = {
          difficultyModel,
          engagementModel,
          contentModel,
          isInitialized: true
        };

        setIsModelReady(true);
        console.log('🤖 AI Models initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize AI models:', error);
      }
    };

    initializeModels();
  }, []);

  // Enhanced personalized hint generation
  const getPersonalizedHints = useCallback(async (
    puzzle: Puzzle, 
    hintsUnlocked: number,
    player?: Player
  ): Promise<string[]> => {
    const baseHints = puzzle.hints.slice(0, Math.max(1, Math.min(3, hintsUnlocked)));
    
    if (!modelRef.current.isInitialized || !player) {
      return baseHints;
    }

    try {
      // Generate AI-powered contextual hints
      const aiHints = await generateContextualHints(puzzle, player, hintsUnlocked);
      
      // Personalize based on player skill level
      const personalizedHints = await personalizeHints(baseHints, aiHints, player);
      
      return personalizedHints;
    } catch (error) {
      console.error('Error generating personalized hints:', error);
      return baseHints;
    }
  }, []);

  // Generate contextual hints using AI
  const generateContextualHints = async (
    puzzle: Puzzle,
    player: Player,
    currentHints: number
  ): Promise<string[]> => {
    const hints: string[] = [];
    
    // Category-specific hint
    if (currentHints === 1) {
      hints.push(`This puzzle relates to ${puzzle.category} - your strength area!`);
    }
    
    // Subreddit-specific hint
    if (currentHints === 2) {
      hints.push(`Popular in ${puzzle.subredditTags[0]} communities where you're active.`);
    }
    
    // Difficulty-based hint
    if (currentHints === 3) {
      const difficulty = puzzle.difficulty > 0.7 ? 'challenging' : 'approachable';
      hints.push(`This is a ${difficulty} puzzle based on your skill level.`);
    }
    
    // Time-based hint
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      hints.push('Morning brain is fresh - trust your first instinct!');
    } else if (currentHour < 18) {
      hints.push('Afternoon focus - take your time to think it through.');
    } else {
      hints.push('Evening wisdom - your experience will guide you.');
    }
    
    return hints;
  };

  // Personalize hints based on player profile
  const personalizeHints = async (
    baseHints: string[],
    aiHints: string[],
    player: Player
  ): Promise<string[]> => {
    const personalized = [...baseHints];
    
    // Add hints based on player's preferred categories
    if (player.profile.preferredCategories.length > 0) {
      const categoryHint = `Think about patterns in ${player.profile.preferredCategories[0]} discussions.`;
      personalized.push(categoryHint);
    }
    
    // Add skill-based hints
    if (player.profile.skillLevel > 0.7) {
      personalized.push('You\'re skilled - look for the subtle pattern!');
    } else if (player.profile.skillLevel < 0.4) {
      personalized.push('Take your time - there\'s no rush to solve it.');
    }
    
    return personalized.slice(0, 3);
  };

  // Advanced player performance analysis
  const analyzePlayerPerformance = useCallback((
    player: Player,
    recentGames: GameHistory[]
  ): AIAdaptiveDifficulty => {
    const winRate = recentGames.filter(g => g.completed).length / recentGames.length;
    const avgTime = recentGames.reduce((sum, g) => sum + g.timeTaken, 0) / recentGames.length;
    const avgHints = recentGames.reduce((sum, g) => sum + g.hintsUsed, 0) / recentGames.length;
    
    // Calculate factors
    const skillLevel = player.profile.skillLevel;
    const recentPerformance = winRate;
    const timeOfDay = new Date().getHours() / 24;
    const dayOfWeek = new Date().getDay() / 7;
    const streakMomentum = Math.min(1, player.stats.currentStreak / 10);
    
    // Use AI model if available
    if (modelRef.current.difficultyModel && modelRef.current.isInitialized) {
      try {
        const input = tf.tensor2d([[
          skillLevel,
          recentPerformance,
          avgTime / 300,
          avgHints / 3,
          timeOfDay,
          dayOfWeek,
          streakMomentum,
          player.stats.totalGames / 100
        ]]);
        
        const prediction = modelRef.current.difficultyModel.predict(input) as tf.Tensor;
        const predictedDifficulty = prediction.dataSync()[0];
        
        input.dispose();
        prediction.dispose();
        
        return {
          currentLevel: Math.max(0.1, Math.min(1, predictedDifficulty)),
          targetSuccessRate: 0.65,
          adjustmentFactor: 0.03,
          nextAdjustment: new Date(Date.now() + 24 * 60 * 60 * 1000),
          confidence: 0.85,
          factors: {
            skillLevel,
            recentPerformance,
            timeOfDay,
            dayOfWeek,
            streakMomentum
          }
        };
      } catch (error) {
        console.error('AI prediction failed, using fallback:', error);
      }
    }
    
    // Fallback calculation
    let targetDifficulty = skillLevel;
    
    if (winRate > 0.8 && avgTime < 60) {
      targetDifficulty = Math.min(1.0, targetDifficulty + 0.1);
    } else if (winRate < 0.4 || avgTime > 300) {
      targetDifficulty = Math.max(0.1, targetDifficulty - 0.1);
    }
    
    return {
      currentLevel: targetDifficulty,
      targetSuccessRate: 0.62,
      adjustmentFactor: 0.05,
      nextAdjustment: new Date(Date.now() + 24 * 60 * 60 * 1000),
      confidence: 0.7,
      factors: {
        skillLevel,
        recentPerformance,
        timeOfDay,
        dayOfWeek,
        streakMomentum
      }
    };
  }, []);

  // Generate personalized insights
  const generatePersonalizedInsights = useCallback((
    player: Player,
    gameHistory: GameHistory[]
  ): PersonalizedInsights => {
    const categoryPerformance = new Map<string, number[]>();
    
    gameHistory.forEach(game => {
      if (!categoryPerformance.has(game.puzzle.category)) {
        categoryPerformance.set(game.puzzle.category, []);
      }
      categoryPerformance.get(game.puzzle.category)!.push(game.completed ? 1 : 0);
    });
    
    const avgPerformanceByCategory = Array.from(categoryPerformance.entries()).map(([cat, scores]) => ({
      category: cat,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length
    }));
    
    const strengthCategories = avgPerformanceByCategory
      .filter(cat => cat.avgScore > 0.7)
      .map(cat => cat.category);
    
    const weaknessCategories = avgPerformanceByCategory
      .filter(cat => cat.avgScore < 0.4)
      .map(cat => cat.category);
    
    const bestHour = gameHistory.reduce((best, game) => {
      const hour = new Date(game.timestamp).getHours();
      return game.completed && (hour >= 9 && hour <= 11) ? hour : best;
    }, 14);
    
    return {
      preferredDifficulty: player.profile.skillLevel,
      optimalPlayTime: `${bestHour}:00`,
      strengthCategories,
      weaknessCategories,
      engagementPrediction: predictEngagement(player, gameHistory),
      nextMilestone: getNextMilestone(player.stats)
    };
  }, []);

  // Predict engagement using AI
  const predictEngagement = useCallback((
    player: Player,
    gameHistory: GameHistory[]
  ): number => {
    if (!modelRef.current.engagementModel || !modelRef.current.isInitialized) {
      // Fallback calculation
      const recentActivity = gameHistory.slice(-7).length;
      const avgScore = gameHistory.reduce((sum, g) => sum + (g.completed ? 1 : 0), 0) / gameHistory.length;
      return Math.min(1, (recentActivity / 7 + avgScore) / 2);
    }
    
    try {
      const features = prepareEngagementFeatures(player, gameHistory);
      const input = tf.tensor2d([features]);
      const prediction = modelRef.current.engagementModel.predict(input) as tf.Tensor;
      const engagementScore = prediction.dataSync()[0];
      
      input.dispose();
      prediction.dispose();
      
      return engagementScore;
    } catch (error) {
      console.error('Engagement prediction failed:', error);
      return 0.5;
    }
  }, []);

  // Prepare features for engagement model
  const prepareEngagementFeatures = (
    player: Player,
    gameHistory: GameHistory[]
  ): number[] => {
    const recentGames = gameHistory.slice(-30);
    const dailyFrequency = recentGames.length / 30;
    const avgSessionTime = recentGames.reduce((sum, g) => sum + g.timeTaken, 0) / recentGames.length;
    const streakLength = player.stats.currentStreak;
    const totalGames = player.stats.totalGames;
    const winRate = player.stats.winRate;
    const skillLevel = player.profile.skillLevel;
    const hintsPerGame = recentGames.reduce((sum, g) => sum + g.hintsUsed, 0) / recentGames.length;
    const timeOfDay = new Date().getHours() / 24;
    const dayOfWeek = new Date().getDay() / 7;
    const lastPlayed = gameHistory.length > 0 ? 
      (Date.now() - gameHistory[gameHistory.length - 1].timestamp) / (1000 * 60 * 60 * 24) : 7;
    const communityScore = player.stats.cluesAccepted / Math.max(1, player.stats.cluesContributed);
    
    return [
      dailyFrequency,
      avgSessionTime / 300,
      streakLength / 10,
      totalGames / 100,
      winRate,
      skillLevel,
      hintsPerGame / 3,
      timeOfDay,
      dayOfWeek,
      Math.min(1, lastPlayed / 7),
      communityScore,
      player.stats.averageScore / 100
    ];
  };

  // Get next milestone
  const getNextMilestone = (stats: any): string => {
    if (stats.currentStreak === 0) return 'Start your first streak!';
    if (stats.currentStreak === 7) return 'One week streak achieved!';
    if (stats.currentStreak === 30) return 'Monthly milestone reached!';
    if (stats.currentStreak === 100) return 'Century streak incoming!';
    if (stats.currentStreak === 365) return 'Year-long mastery!';
    return `${stats.currentStreak + 1} day streak`;
  };

  return {
    isModelReady,
    getPersonalizedHints,
    analyzePlayerPerformance,
    generatePersonalizedInsights,
    predictEngagement
  };
}
