import { createClient } from '@blinkdotnew/sdk';

function getProjectId(): string {
  const envId = (import.meta as any).env?.VITE_BLINK_PROJECT_ID;
  if (envId) return envId;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const match = hostname.match(/^([^.]+)\.sites\.blink\.new$/);
  if (match) return match[1];
  return 'fusionbiz-platform-eqm2kch7';
}

const _blink = createClient({
  projectId: getProjectId(),
  publishableKey: (import.meta as any).env?.VITE_BLINK_PUBLISHABLE_KEY,
  auth: { mode: 'managed' },
});

// Re-export with a typed db proxy that accepts any table name
export const blink = _blink as typeof _blink & {
  db: Record<string, any> & typeof _blink.db;
};
