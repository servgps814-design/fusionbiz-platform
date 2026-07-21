// ─── Environment Configuration ─────────────────────────────────────────────────

interface Config {
  api: {
    baseUrl: string;
    timeout: number;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
  blink: {
    projectId: string;
    publishableKey?: string;
  };
  features: {
    analytics: boolean;
    logging: boolean;
    errorTracking: boolean;
    demoMode: boolean;
  };
  security: {
    allowedOrigins: string[];
    secureCookies: boolean;
    httpsOnly: boolean;
  };
  monitoring: {
    googleAnalyticsId?: string;
    sentryDsn?: string;
    mixpanelToken?: string;
  };
  cdn: {
    url?: string;
    enableServiceWorker: boolean;
  };
}

function parseEnvList(value?: string): string[] {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function getEnvironment(): 'development' | 'staging' | 'production' {
  const env = (import.meta as any).env?.VITE_APP_ENVIRONMENT || 'production';
  if (['development', 'staging', 'production'].includes(env)) {
    return env;
  }
  return 'production';
}

export const config: Config = {
  api: {
    baseUrl: (import.meta as any).env?.VITE_API_URL || 'https://api.fusionbiz.fr',
    timeout: parseInt((import.meta as any).env?.VITE_API_TIMEOUT || '30000', 10),
  },
  app: {
    name: (import.meta as any).env?.VITE_APP_NAME || 'FusionBiz Platform',
    version: (import.meta as any).env?.VITE_APP_VERSION || '1.0.0',
    environment: getEnvironment(),
  },
  blink: {
    projectId: (import.meta as any).env?.VITE_BLINK_PROJECT_ID || 'fusionbiz-platform-eqm2kch7',
    publishableKey: (import.meta as any).env?.VITE_BLINK_PUBLISHABLE_KEY,
  },
  features: {
    analytics: (import.meta as any).env?.VITE_ENABLE_ANALYTICS === 'true',
    logging: (import.meta as any).env?.VITE_ENABLE_LOGGING === 'true',
    errorTracking: (import.meta as any).env?.VITE_ENABLE_ERROR_TRACKING === 'true',
    demoMode: (import.meta as any).env?.VITE_ENABLE_DEMO_MODE === 'true',
  },
  security: {
    allowedOrigins: parseEnvList((import.meta as any).env?.VITE_ALLOWED_ORIGINS),
    secureCookies: (import.meta as any).env?.VITE_SECURE_COOKIES !== 'false',
    httpsOnly: (import.meta as any).env?.VITE_HTTPS_ONLY !== 'false',
  },
  monitoring: {
    googleAnalyticsId: (import.meta as any).env?.VITE_GOOGLE_ANALYTICS_ID,
    sentryDsn: (import.meta as any).env?.VITE_SENTRY_DSN,
    mixpanelToken: (import.meta as any).env?.VITE_MIXPANEL_TOKEN,
  },
  cdn: {
    url: (import.meta as any).env?.VITE_CDN_URL,
    enableServiceWorker: (import.meta as any).env?.VITE_ENABLE_SERVICE_WORKER !== 'false',
  },
};

// ─── Validation ────────────────────────────────────────────────────────────

export function validateConfig(): string[] {
  const errors: string[] = [];

  if (!config.api.baseUrl) {
    errors.push('VITE_API_URL is required');
  }

  if (!config.blink.projectId) {
    errors.push('VITE_BLINK_PROJECT_ID is required');
  }

  if (config.app.environment === 'production' && !config.blink.publishableKey) {
    errors.push('VITE_BLINK_PUBLISHABLE_KEY is required in production');
  }

  return errors;
}

// ─── Initialization ────────────────────────────────────────────────────────

if (config.app.environment === 'production') {
  const errors = validateConfig();
  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    if (typeof window !== 'undefined') {
      console.error(
        'Please check your .env.local file and ensure all required variables are set.'
      );
    }
  }
}

export default config;
