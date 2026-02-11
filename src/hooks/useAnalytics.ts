import { useCallback, useEffect, useRef, useState } from 'react';

// Advanced analytics and monitoring system for ThreadPulse Daily 2026
export interface AnalyticsEvent {
  id: string;
  type: string;
  category: 'gameplay' | 'ui' | 'performance' | 'social' | 'error' | 'ai' | 'mobile';
  action: string;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  properties: Record<string, any>;
  value?: number;
  duration?: number;
  metadata?: {
    userAgent: string;
    url: string;
    referrer: string;
    screenResolution: string;
    deviceType: string;
    connectionType: string;
    batteryLevel?: number;
  };
}

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage: number;
  bundleSize: number;
  renderTime: number;
  apiResponseTime: number;
  errorRate: number;
  conversionRate: number;
}

export interface UserBehaviorMetrics {
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  retentionRate: number;
  engagementScore: number;
  completionRate: number;
  averageSessionLength: number;
  returnUserRate: number;
  featureUsage: Record<string, number>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorRate: number;
  criticalErrors: number;
  recoveryRate: number;
  meanTimeToRecovery: number;
}

export interface AIPerformanceMetrics {
  modelAccuracy: number;
  predictionTime: number;
  confidenceScore: number;
  modelVersion: string;
  trainingDataSize: number;
  inferenceLatency: number;
  errorRate: number;
  userSatisfaction: number;
}

export interface MobileMetrics {
  deviceType: string;
  os: string;
  browser: string;
  screenResolution: string;
  touchAccuracy: number;
  gestureUsage: Record<string, number>;
  hapticFeedbackUsage: number;
  offlineUsage: number;
  batteryImpact: number;
}

export function useAnalytics() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [analyticsConfig, setAnalyticsConfig] = useState({
    enabled: true,
    debug: false,
    batchSize: 50,
    flushInterval: 30000,
    endpoint: '/api/analytics/events'
  });

  const eventQueue = useRef<AnalyticsEvent[]>([]);
  const performanceObserver = useRef<PerformanceObserver | null>(null);
  const errorBoundaryRef = useRef<Error | null>(null);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize analytics system
  useEffect(() => {
    initializeAnalytics();
    setupPerformanceMonitoring();
    setupErrorTracking();

    return () => {
      cleanup();
    };
  }, []);

  const initializeAnalytics = () => {
    // Generate unique session ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    // Get user ID from local storage or generate new one
    const storedUserId = localStorage.getItem('threadpulse_user_id');
    const newUserId = storedUserId || generateUserId();
    setUserId(newUserId);

    if (!storedUserId) {
      localStorage.setItem('threadpulse_user_id', newUserId);
    }

    // Load configuration
    const config = localStorage.getItem('threadpulse_analytics_config');
    if (config) {
      try {
        setAnalyticsConfig({ ...analyticsConfig, ...JSON.parse(config) });
      } catch (error) {
        console.error('Failed to load analytics config:', error);
      }
    }

    setIsInitialized(true);
    // console.log('📊 Analytics system initialized');
  };

  const setupPerformanceMonitoring = () => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      // Monitor Core Web Vitals
      performanceObserver.current = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            trackPerformance('navigation', {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              firstPaint: navEntry.responseStart - navEntry.requestStart
            });
          } else if (entry.entryType === 'paint') {
            trackPerformance('paint', {
              name: entry.name,
              startTime: entry.startTime,
              duration: entry.duration
            });
          } else if (entry.entryType === 'largest-contentful-paint') {
            trackPerformance('lcp', {
              value: entry.startTime,
              element: (entry as any).element?.tagName || 'unknown'
            });
          } else if (entry.entryType === 'first-input') {
            trackPerformance('fid', {
              value: (entry as any).processingStart - entry.startTime,
              inputType: (entry as any).name
            });
          } else if (entry.entryType === 'layout-shift') {
            trackPerformance('cls', {
              value: (entry as any).value,
              sources: (entry as any).sources?.length || 0
            });
          }
        });
      });

      performanceObserver.current.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (error) {
      console.error('Failed to setup performance monitoring:', error);
    }
  };

  const setupErrorTracking = () => {
    // Global error handler
    window.addEventListener('error', (event) => {
      trackError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      trackError('promise', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        trackError('resource', {
          element: (event.target as Element).tagName,
          source: (event.target as HTMLImageElement | HTMLScriptElement).src || 'unknown'
        });
      }
    }, true);
  };

  const trackEvent = useCallback((
    category: AnalyticsEvent['category'],
    action: string,
    properties: Record<string, any> = {},
    value?: number,
    duration?: number
  ) => {
    if (!analyticsConfig.enabled || !isInitialized) {
      return;
    }

    const event: AnalyticsEvent = {
      id: generateEventId(),
      type: 'custom',
      category,
      action,
      timestamp: new Date(),
      sessionId,
      userId,
      properties,
      value,
      duration,
      metadata: getMetadata()
    };

    eventQueue.current.push(event);

    if (analyticsConfig.debug) {
      // console.log('📊 Analytics Event:', event);
    }

    // Flush if batch size reached
    if (eventQueue.current.length >= analyticsConfig.batchSize) {
      flushEvents();
    }
  }, [analyticsConfig, isInitialized, sessionId, userId]);

  const trackPageView = useCallback((page: string, properties: Record<string, any> = {}) => {
    trackEvent('ui', 'page_view', { page, ...properties });
  }, [trackEvent]);

  const trackGameplay = useCallback((
    action: string,
    properties: Record<string, any> = {},
    value?: number
  ) => {
    trackEvent('gameplay', action, properties, value);
  }, [trackEvent]);

  const trackPerformance = useCallback((
    metric: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('performance', metric, properties);
  }, [trackEvent]);

  const trackSocial = useCallback((
    action: string,
    platform: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('social', action, { platform, ...properties });
  }, [trackEvent]);

  const trackError = useCallback((
    errorType: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('error', errorType, properties);
  }, [trackEvent]);

  const trackAI = useCallback((
    action: string,
    properties: Record<string, any> = {},
    confidence?: number
  ) => {
    trackEvent('ai', action, { ...properties, confidence });
  }, [trackEvent]);

  const trackMobile = useCallback((
    action: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('mobile', action, properties);
  }, [trackEvent]);

  const trackUserBehavior = useCallback((
    action: string,
    properties: Record<string, any> = {},
    duration?: number
  ) => {
    trackEvent('ui', action, properties, undefined, duration);
  }, [trackEvent]);

  // Advanced tracking methods
  const trackFunnel = useCallback((
    funnelName: string,
    step: number,
    stepName: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('ui', 'funnel_step', {
      funnel: funnelName,
      step,
      step_name: stepName,
      ...properties
    });
  }, [trackEvent]);

  const trackConversion = useCallback((
    conversionType: string,
    value: number,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('ui', 'conversion', {
      conversion_type: conversionType,
      ...properties
    }, value);
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((
    feature: string,
    action: string,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('ui', 'feature_usage', {
      feature,
      action,
      ...properties
    });
  }, [trackEvent]);

  const trackAPIPerformance = useCallback((
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('performance', 'api_call', {
      endpoint,
      method,
      status_code: statusCode,
      ...properties
    }, undefined, duration);
  }, [trackEvent]);

  const trackWebVitals = useCallback((metrics: Partial<PerformanceMetrics>) => {
    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        trackPerformance('web_vital', { metric: key, value });
      }
    });
  }, [trackPerformance]);

  const trackUserEngagement = useCallback((
    engagementScore: number,
    properties: Record<string, any> = {}
  ) => {
    trackEvent('ui', 'engagement', {
      score: engagementScore,
      ...properties
    }, engagementScore);
  }, [trackEvent]);

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) {
      return;
    }

    const events = [...eventQueue.current];
    eventQueue.current = [];

    try {
      const response = await fetch(analyticsConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
          'X-User-ID': userId || 'anonymous'
        },
        body: JSON.stringify({
          events,
          timestamp: new Date().toISOString(),
          metadata: getMetadata()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (analyticsConfig.debug) {
        // console.log(`📊 Flushed ${events.length} events to server`);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);

      // Re-add events to queue for retry
      eventQueue.current.unshift(...events);
    }
  }, [analyticsConfig, sessionId, userId]);

  // Get metadata for events
  const getMetadata = () => {
    if (typeof window === 'undefined') {
      return {
        userAgent: 'unknown',
        url: '',
        referrer: '',
        screenResolution: '0x0',
        deviceType: 'unknown',
        connectionType: 'unknown'
      };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

    return {
      userAgent: navigator.userAgent || 'unknown',
      url: window.location.href,
      referrer: document.referrer || '',
      screenResolution: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      deviceType: getDeviceType(),
      connectionType: connection?.effectiveType || 'unknown',
      batteryLevel: (navigator as any).battery?.level
    };
  };

  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  };

  // Generate unique IDs
  const generateSessionId = (): string => {
    return 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  };

  const generateUserId = (): string => {
    return 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  };

  const generateEventId = (): string => {
    return Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
  };

  // Cleanup
  const cleanup = () => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }

    if (performanceObserver.current) {
      performanceObserver.current.disconnect();
    }

    // Flush remaining events
    flushEvents();
  };

  // Auto-flush events
  useEffect(() => {
    if (isInitialized && analyticsConfig.enabled) {
      flushTimeoutRef.current = setInterval(() => {
        flushEvents();
      }, analyticsConfig.flushInterval);
    }

    return () => {
      if (flushTimeoutRef.current) {
        clearInterval(flushTimeoutRef.current);
      }
    };
  }, [isInitialized, analyticsConfig, flushEvents]);

  // Flush events on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0) {
        // Use sendBeacon for reliable delivery during page unload
        if (navigator.sendBeacon) {
          const data = JSON.stringify({
            events: eventQueue.current,
            timestamp: new Date().toISOString(),
            metadata: getMetadata()
          });

          navigator.sendBeacon(analyticsConfig.endpoint, data);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [analyticsConfig.endpoint]);

  return {
    isInitialized,
    sessionId,
    userId,
    analyticsConfig,

    // Tracking methods
    trackEvent,
    trackPageView,
    trackGameplay,
    trackPerformance,
    trackSocial,
    trackError,
    trackAI,
    trackMobile,
    trackUserBehavior,

    // Advanced tracking
    trackFunnel,
    trackConversion,
    trackFeatureUsage,
    trackAPIPerformance,
    trackWebVitals,
    trackUserEngagement,

    // Utilities
    flushEvents,
    setAnalyticsConfig
  };
}

// Performance monitoring hook
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    cumulativeLayoutShift: 0,
    memoryUsage: 0,
    bundleSize: 0,
    renderTime: 0,
    apiResponseTime: 0,
    errorRate: 0,
    conversionRate: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart
        }));
      }

      // Measure paint timing
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        setMetrics(prev => ({
          ...prev,
          firstContentfulPaint: fcp.startTime
        }));
      }

      // Measure LCP
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lastLCP = lcpEntries[lcpEntries.length - 1];
        setMetrics(prev => ({
          ...prev,
          largestContentfulPaint: lastLCP.startTime
        }));
      }

      // Measure memory usage
      if ((performance as any).memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: (performance as any).memory.usedJSHeapSize
        }));
      }
    };

    // Initial measurement
    setTimeout(measurePerformance, 1000);

    // Set up Performance Observer for ongoing monitoring
    if (window.PerformanceObserver) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'measure') {
              setMetrics(prev => ({
                ...prev,
                renderTime: entry.duration
              }));
            }
          });
        });

        observer.observe({ entryTypes: ['measure'] });
        setIsMonitoring(true);

        return () => {
          observer.disconnect();
          setIsMonitoring(false);
        };
      } catch (error) {
        console.error('Failed to setup performance monitoring:', error);
      }
    }
  }, []);

  const measureRenderTime = useCallback((name: string, fn: () => void) => {
    if (typeof window !== 'undefined' && window.performance && window.performance.mark) {
      window.performance.mark(`${name}-start`);
      fn();
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
    } else {
      fn();
    }
  }, []);

  const measureAPICall = useCallback(async (apiCall: () => Promise<any>): Promise<any> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;

      setMetrics(prev => ({
        ...prev,
        apiResponseTime: (prev.apiResponseTime + duration) / 2 // Running average
      }));

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      setMetrics(prev => ({
        ...prev,
        apiResponseTime: (prev.apiResponseTime + duration) / 2,
        errorRate: prev.errorRate + 0.01
      }));

      throw error;
    }
  }, []);

  return {
    metrics,
    isMonitoring,
    measureRenderTime,
    measureAPICall
  };
}

// Error tracking hook
export function useErrorTracking() {
  const [errors, setErrors] = useState<ErrorMetrics>({
    totalErrors: 0,
    errorsByType: {},
    errorsByCategory: {},
    errorRate: 0,
    criticalErrors: 0,
    recoveryRate: 0,
    meanTimeToRecovery: 0
  });

  const trackError = useCallback((
    errorType: string,
    category: string,
    error: Error | string,
    context: Record<string, any> = {}
  ) => {
    const errorInfo = {
      type: errorType,
      category,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    setErrors(prev => ({
      ...prev,
      totalErrors: prev.totalErrors + 1,
      errorsByType: {
        ...prev.errorsByType,
        [errorType]: (prev.errorsByType[errorType] || 0) + 1
      },
      errorsByCategory: {
        ...prev.errorsByCategory,
        [category]: (prev.errorsByCategory[category] || 0) + 1
      },
      criticalErrors: category === 'critical' ? prev.criticalErrors + 1 : prev.criticalErrors
    }));

    // Send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Error tracked:', errorInfo);
    }
  }, []);

  const trackRecovery = useCallback((errorType: string, recoveryTime: number) => {
    setErrors(prev => ({
      ...prev,
      recoveryRate: prev.recoveryRate + 0.01,
      meanTimeToRecovery: (prev.meanTimeToRecovery + recoveryTime) / 2
    }));
  }, []);

  return {
    errors,
    trackError,
    trackRecovery
  };
}

// Real-time monitoring hook
export function useRealTimeMonitoring() {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(process.env.REACT_APP_MONITORING_WS_URL || 'ws://localhost:8080/monitoring');

        wsRef.current.onopen = () => {
          setIsConnected(true);
          console.log('📡 Connected to real-time monitoring');
        };

        wsRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'alert') {
            setAlerts(prev => [...prev, data.alert]);
          }
        };

        wsRef.current.onclose = () => {
          setIsConnected(false);
          console.log('📡 Disconnected from real-time monitoring');
        };
      } catch (error) {
        console.error('Failed to connect to monitoring WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const sendAlert = useCallback((alert: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'alert',
        alert
      }));
    }
  }, []);

  return {
    isConnected,
    alerts,
    sendAlert
  };
}
