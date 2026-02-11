import { useCallback } from 'react';

export const useHapticFeedback = () => {
  const isSupported = useCallback(() => {
    return 'vibrate' in navigator;
  }, []);
  
  const triggerHaptic = useCallback((
    type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning'
  ) => {
    if (!isSupported()) return;
    
    const patterns = {
      light: [10],
      medium: [50],
      heavy: [100],
      success: [50, 50, 50],
      error: [100, 50, 100],
      warning: [50, 30, 50]
    };
    
    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      console.error('Haptic feedback failed:', error);
    }
  }, [isSupported]);
  
  const triggerCustomPattern = useCallback((pattern: number[]) => {
    if (!isSupported()) return;
    
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error('Custom haptic pattern failed:', error);
    }
  }, [isSupported]);
  
  const stop = useCallback(() => {
    if (!isSupported()) return;
    
    try {
      navigator.vibrate(0);
    } catch (error) {
      console.error('Failed to stop haptic:', error);
    }
  }, [isSupported]);
  
  return {
    isSupported: isSupported(),
    triggerHaptic,
    triggerCustomPattern,
    stop
  };
};
