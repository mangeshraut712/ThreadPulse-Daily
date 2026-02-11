import { useCallback, useEffect, useRef, useState } from 'react';
import type { MobileUXConfig, SwipeActions } from '../types';

// Advanced mobile gesture detection for ThreadPulse Daily 2026
export interface GestureConfig {
  swipeThreshold: number;
  swipeVelocity: number;
  longPressDelay: number;
  doubleTapDelay: number;
  pinchZoomSensitivity: number;
  rotationSensitivity: number;
}

export interface GestureEvent {
  type: 'swipe' | 'tap' | 'doubleTap' | 'longPress' | 'pinch' | 'rotation' | 'pan';
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
  velocity?: number;
  scale?: number;
  rotation?: number;
  position: { x: number; y: number };
  timestamp: number;
}

export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startTime: number;
  startX: number;
  startY: number;
}

export function useMobileGestures(elementRef: React.RefObject<HTMLElement>, config: Partial<GestureConfig> = {}) {
  const [isMobile, setIsMobile] = useState(false);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [currentGesture, setCurrentGesture] = useState<GestureEvent | null>(null);
  
  const touchPointsRef = useRef<Map<number, TouchPoint>>(new Map());
  const gestureStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const gestureConfig: GestureConfig = {
    swipeThreshold: 50,
    swipeVelocity: 0.5,
    longPressDelay: 500,
    doubleTapDelay: 300,
    pinchZoomSensitivity: 0.01,
    rotationSensitivity: 0.01,
    ...config
  };

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice || hasTouch);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touches = event.touches;
    
    // Track all touch points
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const touchPoint: TouchPoint = {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY
      };
      
      touchPointsRef.current.set(touch.identifier, touchPoint);
    }

    // Single touch - start gesture detection
    if (touches.length === 1) {
      const touch = touches[0];
      gestureStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        triggerGesture('longPress', {
          position: { x: touch.clientX, y: touch.clientY },
          timestamp: Date.now()
        });
      }, gestureConfig.longPressDelay);

      // Check for double tap
      if (lastTapRef.current) {
        const timeDiff = Date.now() - lastTapRef.current.time;
        const distance = Math.sqrt(
          Math.pow(touch.clientX - lastTapRef.current.x, 2) +
          Math.pow(touch.clientY - lastTapRef.current.y, 2)
        );

        if (timeDiff < gestureConfig.doubleTapDelay && distance < 30) {
          triggerGesture('doubleTap', {
            position: { x: touch.clientX, y: touch.clientY },
            timestamp: Date.now()
          });
          lastTapRef.current = null;
        } else {
          lastTapRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
          };
        }
      } else {
        lastTapRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };
      }
    }
  }, [gesturesEnabled, gestureConfig]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touches = event.touches;
    
    // Clear long press timer on movement
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Update touch points
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const touchPoint = touchPointsRef.current.get(touch.identifier);
      
      if (touchPoint) {
        touchPoint.x = touch.clientX;
        touchPoint.y = touch.clientY;
      }
    }

    // Multi-touch gestures
    if (touches.length === 2) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      
      // Calculate pinch zoom
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const touchPoint1 = touchPointsRef.current.get(touch1.identifier);
      const touchPoint2 = touchPointsRef.current.get(touch2.identifier);
      
      if (touchPoint1 && touchPoint2) {
        const initialDistance = Math.sqrt(
          Math.pow(touchPoint2.startX - touchPoint1.startX, 2) +
          Math.pow(touchPoint2.startY - touchPoint1.startY, 2)
        );
        
        const scale = currentDistance / initialDistance;
        
        if (Math.abs(scale - 1) > gestureConfig.pinchZoomSensitivity) {
          triggerGesture('pinch', {
            scale,
            position: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            },
            timestamp: Date.now()
          });
        }
      }
    }
  }, [gesturesEnabled, gestureConfig]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touches = event.changedTouches;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Process ended touches
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      const touchPoint = touchPointsRef.current.get(touch.identifier);
      
      if (touchPoint) {
        // Check for swipe
        const deltaX = touch.clientX - touchPoint.startX;
        const deltaY = touch.clientY - touchPoint.startY;
        const deltaTime = Date.now() - touchPoint.startTime;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const velocity = distance / deltaTime;
        
        if (distance > gestureConfig.swipeThreshold && velocity > gestureConfig.swipeVelocity) {
          let direction: 'up' | 'down' | 'left' | 'right';
          
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? 'right' : 'left';
          } else {
            direction = deltaY > 0 ? 'down' : 'up';
          }
          
          triggerGesture('swipe', {
            direction,
            distance,
            velocity,
            position: { x: touch.clientX, y: touch.clientY },
            timestamp: Date.now()
          });
        } else if (distance < 10 && deltaTime < 200) {
          // Simple tap
          triggerGesture('tap', {
            position: { x: touch.clientX, y: touch.clientY },
            timestamp: Date.now()
          });
        }
        
        // Remove touch point
        touchPointsRef.current.delete(touch.identifier);
      }
    }

    // Clear gesture start if no touches remain
    if (event.touches.length === 0) {
      gestureStartRef.current = null;
    }
  }, [gesturesEnabled, gestureConfig]);

  // Trigger gesture event
  const triggerGesture = useCallback((type: GestureEvent['type'], data: Partial<GestureEvent>) => {
    const gestureEvent: GestureEvent = {
      type,
      timestamp: Date.now(),
      ...data
    } as GestureEvent;
    
    setCurrentGesture(gestureEvent);
    
    // Dispatch custom event
    if (elementRef.current) {
      const customEvent = new CustomEvent('gesture', {
        detail: gestureEvent,
        bubbles: true,
        cancelable: true
      });
      elementRef.current.dispatchEvent(customEvent);
    }
  }, [elementRef]);

  // Mouse event handlers for desktop testing
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touchPoint: TouchPoint = {
      id: 0,
      x: event.clientX,
      y: event.clientY,
      startTime: Date.now(),
      startX: event.clientX,
      startY: event.clientY
    };
    
    touchPointsRef.current.set(0, touchPoint);
    gestureStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      triggerGesture('longPress', {
        position: { x: event.clientX, y: event.clientY },
        timestamp: Date.now()
      });
    }, gestureConfig.longPressDelay);
  }, [gesturesEnabled, gestureConfig, triggerGesture]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touchPoint = touchPointsRef.current.get(0);
    
    if (touchPoint) {
      touchPoint.x = event.clientX;
      touchPoint.y = event.clientY;
      
      // Clear long press timer on movement
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }, [gesturesEnabled]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!gesturesEnabled || !elementRef.current) return;

    const touchPoint = touchPointsRef.current.get(0);
    
    if (touchPoint) {
      const deltaX = event.clientX - touchPoint.startX;
      const deltaY = event.clientY - touchPoint.startY;
      const deltaTime = Date.now() - touchPoint.startTime;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;
      
      if (distance > gestureConfig.swipeThreshold && velocity > gestureConfig.swipeVelocity) {
        let direction: 'up' | 'down' | 'left' | 'right';
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }
        
        triggerGesture('swipe', {
          direction,
          distance,
          velocity,
          position: { x: event.clientX, y: event.clientY },
          timestamp: Date.now()
        });
      } else if (distance < 10 && deltaTime < 200) {
        triggerGesture('tap', {
          position: { x: event.clientX, y: event.clientY },
          timestamp: Date.now()
        });
      }
      
      touchPointsRef.current.delete(0);
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    gestureStartRef.current = null;
  }, [gesturesEnabled, gestureConfig, triggerGesture]);

  // Setup event listeners
  useEffect(() => {
    const element = elementRef.current;
    
    if (!element || !isMobile) return;

    // Touch events
    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: false });
    element.addEventListener('touchmove', handleTouchMove as EventListener, { passive: false });
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: false });
    
    // Mouse events for desktop testing
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchmove', handleTouchMove as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [elementRef, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Gesture action handlers
  const handleSwipe = useCallback((direction: 'up' | 'down' | 'left' | 'right', action: () => void) => {
    const handleGesture = (event: Event) => {
      const customEvent = event as CustomEvent<GestureEvent>;
      if (customEvent.detail.type === 'swipe' && customEvent.detail.direction === direction) {
        action();
      }
    };

    if (elementRef.current) {
      elementRef.current.addEventListener('gesture', handleGesture);
      return () => elementRef.current?.removeEventListener('gesture', handleGesture);
    }
  }, [elementRef]);

  const handleTap = useCallback((action: (position: { x: number; y: number }) => void) => {
    const handleGesture = (event: Event) => {
      const customEvent = event as CustomEvent<GestureEvent>;
      if (customEvent.detail.type === 'tap') {
        action(customEvent.detail.position);
      }
    };

    if (elementRef.current) {
      elementRef.current.addEventListener('gesture', handleGesture);
      return () => elementRef.current?.removeEventListener('gesture', handleGesture);
    }
  }, [elementRef]);

  const handleLongPress = useCallback((action: (position: { x: number; y: number }) => void) => {
    const handleGesture = (event: Event) => {
      const customEvent = event as CustomEvent<GestureEvent>;
      if (customEvent.detail.type === 'longPress') {
        action(customEvent.detail.position);
      }
    };

    if (elementRef.current) {
      elementRef.current.addEventListener('gesture', handleGesture);
      return () => elementRef.current?.removeEventListener('gesture', handleGesture);
    }
  }, [elementRef]);

  const handlePinch = useCallback((action: (scale: number, position: { x: number; y: number }) => void) => {
    const handleGesture = (event: Event) => {
      const customEvent = event as CustomEvent<GestureEvent>;
      if (customEvent.detail.type === 'pinch' && customEvent.detail.scale) {
        action(customEvent.detail.scale, customEvent.detail.position);
      }
    };

    if (elementRef.current) {
      elementRef.current.addEventListener('gesture', handleGesture);
      return () => elementRef.current?.removeEventListener('gesture', handleGesture);
    }
  }, [elementRef]);

  return {
    isMobile,
    gesturesEnabled,
    currentGesture,
    setGesturesEnabled,
    handleSwipe,
    handleTap,
    handleLongPress,
    handlePinch,
    gestureConfig
  };
}

// Advanced haptic feedback system
export function useHapticFeedback() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Check if haptic feedback is supported
    const checkSupport = () => {
      const supported = 'vibrate' in navigator || 
                       'hapticFeedback' in window || 
                       ('DeviceMotionEvent' in window && 'DeviceOrientationEvent' in window);
      
      setIsSupported(supported);
    };

    checkSupport();
  }, []);

  const triggerHaptic = useCallback((pattern: number | number[], intensity: 'light' | 'medium' | 'strong' = 'medium') => {
    if (!isSupported || !isEnabled) return;

    try {
      // Standard Vibration API
      if ('vibrate' in navigator) {
        let vibrationPattern: number[];
        
        if (typeof pattern === 'number') {
          vibrationPattern = [pattern];
        } else {
          vibrationPattern = pattern;
        }

        // Adjust intensity based on parameter
        if (intensity === 'light') {
          vibrationPattern = vibrationPattern.map(p => p * 0.5);
        } else if (intensity === 'strong') {
          vibrationPattern = vibrationPattern.map(p => p * 1.5);
        }

        navigator.vibrate(vibrationPattern);
      }
      
      // iOS haptic feedback (if available)
      if ('hapticFeedback' in window && (window as any).hapticFeedback) {
        (window as any).hapticFeedback.trigger(pattern, intensity);
      }
      
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isSupported, isEnabled]);

  // Predefined haptic patterns
  const hapticPatterns = {
    // Game interactions
    correctAnswer: [10, 50, 10],
    incorrectAnswer: [100],
    hintReveal: [5, 30, 5, 30, 5],
    streakMilestone: [50, 30, 50, 30, 50],
    achievement: [100, 50, 100, 50, 200],
    
    // UI interactions
    tap: [5],
    longPress: [50],
    swipe: [10],
    buttonPress: [8],
    
    // Notifications
    notification: [50, 100, 50],
    warning: [100, 50, 100],
    error: [200],
    
    // Feedback
    success: [10, 30, 10],
    failure: [100],
    attention: [50, 30, 50]
  };

  const triggerPattern = useCallback((patternName: keyof typeof hapticPatterns, intensity?: 'light' | 'medium' | 'strong') => {
    const pattern = hapticPatterns[patternName];
    if (pattern) {
      triggerHaptic(pattern, intensity);
    }
  }, [triggerHaptic]);

  return {
    isSupported,
    isEnabled,
    setIsEnabled,
    triggerHaptic,
    triggerPattern,
    hapticPatterns
  };
}

// Mobile device detection utilities
export function useMobileDetection() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isPhone: false,
    isIOS: false,
    isAndroid: false,
    hasTouch: false,
    hasHaptic: false,
    orientation: 'portrait' as 'portrait' | 'landscape',
    screenSize: { width: 0, height: 0 },
    pixelRatio: 1,
    deviceMemory: 0,
    connectionType: 'unknown'
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const hasHaptic = 'vibrate' in navigator;
      
      // Detect device type
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
      const isPhone = /iphone|android.*mobile|mobile/i.test(userAgent);
      
      // Detect OS
      const isIOS = /iphone|ipad|ipod/i.test(userAgent);
      const isAndroid = /android/i.test(userAgent);
      
      // Get screen info
      const width = window.innerWidth || screen.width;
      const height = window.innerHeight || screen.height;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Get orientation
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // Get device memory (if available)
      const deviceMemory = (navigator as any).deviceMemory || 0;
      
      // Get connection type (if available)
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const connectionType = connection ? connection.effectiveType || connection.type : 'unknown';

      setDeviceInfo({
        isMobile,
        isTablet,
        isPhone,
        isIOS,
        isAndroid,
        hasTouch,
        hasHaptic,
        orientation,
        screenSize: { width, height },
        pixelRatio,
        deviceMemory,
        connectionType
      });
    };

    updateDeviceInfo();
    
    // Listen for orientation changes
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return deviceInfo;
}

// Mobile optimization utilities
export function useMobileOptimization() {
  const [performanceMode, setPerformanceMode] = useState<'low' | 'medium' | 'high'>('medium');
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    // Monitor battery level
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          
          setBatteryLevel(battery.level);
          setIsLowPowerMode(battery.dischargingTime < 300); // Less than 5 minutes remaining
          
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(battery.level);
          });
          
          battery.addEventListener('dischargingtimechange', () => {
            setIsLowPowerMode(battery.dischargingTime < 300);
          });
        } catch (error) {
          console.warn('Battery API not available');
        }
      }
    };

    monitorBattery();
  }, []);

  useEffect(() => {
    // Adjust performance based on device capabilities and battery
    const adjustPerformance = () => {
      if (isLowPowerMode || batteryLevel < 0.2) {
        setPerformanceMode('low');
      } else if (batteryLevel < 0.5) {
        setPerformanceMode('medium');
      } else {
        setPerformanceMode('high');
      }
    };

    adjustPerformance();
  }, [batteryLevel, isLowPowerMode]);

  const getOptimizedSettings = useCallback(() => {
    switch (performanceMode) {
      case 'low':
        return {
          particleCount: 20,
          animationQuality: 'low',
          updateRate: 30,
          enableShadows: false,
          enableBlur: false,
          enableGlow: false
        };
      case 'medium':
        return {
          particleCount: 50,
          animationQuality: 'medium',
          updateRate: 60,
          enableShadows: true,
          enableBlur: false,
          enableGlow: true
        };
      case 'high':
        return {
          particleCount: 100,
          animationQuality: 'high',
          updateRate: 60,
          enableShadows: true,
          enableBlur: true,
          enableGlow: true
        };
      default:
        return {
          particleCount: 50,
          animationQuality: 'medium',
          updateRate: 60,
          enableShadows: true,
          enableBlur: false,
          enableGlow: true
        };
    }
  }, [performanceMode]);

  return {
    performanceMode,
    batteryLevel,
    isLowPowerMode,
    getOptimizedSettings
  };
}
