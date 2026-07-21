// ─── Performance Monitoring & Analytics ────────────────────────────────────────

import { config } from './config';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface PageMetrics {
  pageUrl: string;
  loadTime: number;
  interactiveTime: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private pageMetrics: PageMetrics | null = null;

  constructor() {
    if (typeof window !== 'undefined' && config.features.analytics) {
      this.initializePerformanceObserver();
    }
  }

  private initializePerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        // ─── Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric({
              name: entry.name,
              value: entry.duration || (entry as any).value || 0,
              unit: 'ms',
              timestamp: new Date().toISOString(),
            });
          }
        });

        observer.observe({
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'],
        });

        // ─── Navigation Timing
        window.addEventListener('load', () => {
          this.collectPageMetrics();
        });
      } catch {
        // Observer not supported
      }
    }
  }

  private collectPageMetrics(): void {
    if (typeof window === 'undefined') return;

    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

    this.pageMetrics = {
      pageUrl: window.location.pathname,
      loadTime: pageLoadTime,
      interactiveTime: perfData.domInteractive - perfData.navigationStart,
    };

    this.recordMetric({
      name: 'page_load_time',
      value: pageLoadTime,
      unit: 'ms',
      timestamp: new Date().toISOString(),
    });

    // ─── Send to analytics
    this.sendMetrics();
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > 50) {
      this.metrics.shift();
    }
  }

  private sendMetrics(): void {
    if (!config.features.analytics || !this.pageMetrics) return;

    try {
      if (config.monitoring.googleAnalyticsId) {
        this.sendToGoogleAnalytics(this.pageMetrics);
      }

      if (config.monitoring.mixpanelToken) {
        this.sendToMixpanel(this.pageMetrics);
      }
    } catch {
      // Silently fail
    }
  }

  private sendToGoogleAnalytics(metrics: PageMetrics): void {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    (window as any).gtag('event', 'page_view', {
      page_path: metrics.pageUrl,
      page_load_time: metrics.loadTime,
      interactive_time: metrics.interactiveTime,
    });

    if (metrics.largestContentfulPaint) {
      (window as any).gtag('event', 'web_vital', {
        metric_id: 'LCP',
        value: Math.round(metrics.largestContentfulPaint),
        event_category: 'web_vitals',
      });
    }
  }

  private sendToMixpanel(metrics: PageMetrics): void {
    if (typeof window === 'undefined' || !(window as any).mixpanel) return;

    (window as any).mixpanel.track('page_loaded', {
      page_url: metrics.pageUrl,
      load_time: metrics.loadTime,
      interactive_time: metrics.interactiveTime,
    });
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getPageMetrics(): PageMetrics | null {
    return this.pageMetrics ? { ...this.pageMetrics } : null;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ─── Track Component Render Times ──────────────────────────────────────────────

export function recordComponentRender(componentName: string, renderTime: number): void {
  performanceMonitor['recordMetric']?.({
    name: `component_render_${componentName}`,
    value: renderTime,
    unit: 'ms',
    timestamp: new Date().toISOString(),
  });
}

// ─── Navigation Timing Helper ──────────────────────────────────────────────────

export function getNavigationTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const timing = window.performance.timing;
  return {
    dns: timing.domainLookupEnd - timing.domainLookupStart,
    tcp: timing.connectEnd - timing.connectStart,
    ttfb: timing.responseStart - timing.navigationStart,
    download: timing.responseEnd - timing.responseStart,
    domParse: timing.domInteractive - timing.domLoading,
    domInteractive: timing.domInteractive - timing.navigationStart,
    domComplete: timing.domComplete - timing.navigationStart,
    loadComplete: timing.loadEventEnd - timing.navigationStart,
  };
}

export default performanceMonitor;
