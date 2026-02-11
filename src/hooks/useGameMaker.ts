import { useCallback, useMemo, useState } from "react";

export type AnimationType =
  | 'celebration'
  | 'success'
  | 'error'
  | 'hint-reveal'
  | 'guess-submit'
  | 'clue-contribute'
  | 'puzzle-solve';

export interface GameMakerConfig {
  quality: 'low' | 'medium' | 'high';
  soundEnabled: boolean;
  particleEffects: boolean;
  reducedMotion: boolean;
}

export function useGameMaker() {
  const [isReady, setIsReady] = useState<boolean>(false);
  const [config, setConfig] = useState<GameMakerConfig>({
    quality: 'high',
    soundEnabled: true,
    particleEffects: true,
    reducedMotion: false
  });
  const [activeAnimations, setActiveAnimations] = useState<Set<AnimationType>>(new Set<AnimationType>());

  // Initialize GameMaker runtime
  const initialize = useCallback(async () => {
    try {
      // In a real implementation, we would load the GameMaker WASM runtime here
      // For now, we'll use CSS-based animations as a fallback
      setIsReady(true);
    } catch (error) {
      console.warn('GameMaker initialization failed, using fallback animations');
      setIsReady(true); // Still set ready for CSS fallback
    }
  }, []);

  // Trigger a CSS-based animation
  const triggerAnimation = useCallback((animationType: AnimationType) => {
    if (typeof window === 'undefined') return;

    // Check for reduced motion preference
    if (config.reducedMotion) {
      return;
    }

    setActiveAnimations((prev: Set<AnimationType>) => {
      const next = new Set<AnimationType>(prev);
      next.add(animationType);
      return next;
    });

    // Remove animation after it completes
    setTimeout(() => {
      setActiveAnimations((prev: Set<AnimationType>) => {
        const next = new Set<AnimationType>(prev);
        next.delete(animationType);
        return next;
      });
    }, getAnimationDuration(animationType));
  }, [config.reducedMotion]);

  // Get animation duration based on type
  const getAnimationDuration = (animationType: AnimationType): number => {
    const durations: Record<AnimationType, number> = {
      'celebration': 2000,
      'success': 1000,
      'error': 500,
      'hint-reveal': 300,
      'guess-submit': 400,
      'clue-contribute': 500,
      'puzzle-solve': 1500
    };
    return durations[animationType] || 500;
  };

  // Create particle effect (CSS-based fallback)
  const createParticles = useCallback((_containerId: string, _particleCount: number) => {
    if (!config.particleEffects || config.reducedMotion) return;

    // In a full implementation, this would create canvas-based particles
    // For now, we rely on CSS animations for visual feedback
  }, [config.particleEffects, config.reducedMotion]);

  // Play sound effect
  const playSound = useCallback((soundType: 'success' | 'error' | 'hint' | 'submit') => {
    if (!config.soundEnabled) return;

    // In a full implementation, this would play actual sounds
    // For now, we just log it
    console.log(`[Sound] ${soundType}`);
  }, [config.soundEnabled]);

  // Update quality settings
  const updateQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setConfig((prev: GameMakerConfig) => ({ ...prev, quality }));
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setConfig((prev: GameMakerConfig) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  // Toggle particles
  const toggleParticles = useCallback(() => {
    setConfig((prev: GameMakerConfig) => ({ ...prev, particleEffects: !prev.particleEffects }));
  }, []);

  // Set reduced motion preference
  const setReducedMotion = useCallback((reduced: boolean) => {
    setConfig((prev: GameMakerConfig) => ({ ...prev, reducedMotion: reduced }));
  }, []);

  // Capture screenshot (placeholder)
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    // In a full implementation, this would capture the game canvas
    return null;
  }, []);

  // Get animation class names
  const getAnimationClass = useCallback((animationType: AnimationType): string => {
    const animationClasses: Record<AnimationType, string> = {
      'celebration': 'gm-celebration',
      'success': 'gm-success',
      'error': 'gm-error',
      'hint-reveal': 'gm-hint-reveal',
      'guess-submit': 'gm-guess-submit',
      'clue-contribute': 'gm-clue-contribute',
      'puzzle-solve': 'gm-puzzle-solve'
    };
    return animationClasses[animationType] || '';
  }, []);

  return useMemo(
    () => ({
      isReady,
      initialize,
      triggerAnimation,
      createParticles,
      playSound,
      updateQuality,
      toggleSound,
      toggleParticles,
      setReducedMotion,
      captureScreenshot,
      config,
      activeAnimations,
      getAnimationClass
    }),
    [
      isReady,
      initialize,
      triggerAnimation,
      createParticles,
      playSound,
      updateQuality,
      toggleSound,
      toggleParticles,
      setReducedMotion,
      captureScreenshot,
      config,
      activeAnimations,
      getAnimationClass
    ]
  );
}
