export type LocalUser = {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
};

export type LocalCompany = {
  id: string;
  name: string;
  siret: string;
  address: string;
  legalStatus: string;
  isVerified: string;
  logoUrl?: string;
};

const DEMO_USER: LocalUser = {
  id: 'demo_user_1',
  email: 'demo@orbis.fr',
  displayName: 'Marie Dupont',
};
const DEMO_PASSWORD = 'demo123';
const AUTH_KEY = 'orbis_auth';

type AuthListener = (state: { user: LocalUser | null; isLoading: boolean }) => void;

class LocalAuthService {
  private listeners: AuthListener[] = [];
  private user: LocalUser | null = null;

  constructor() {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) this.user = JSON.parse(stored);
    } catch {}
    setTimeout(() => this.notify(false), 0);
  }

  private notify(isLoading: boolean) {
    this.listeners.forEach((l) => l({ user: this.user, isLoading }));
  }

  onAuthStateChanged(listener: AuthListener) {
    this.listeners.push(listener);
    listener({ user: this.user, isLoading: false });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async login(email?: string, password?: string) {
    if (email && password) {
      if (email === DEMO_USER.email && password === DEMO_PASSWORD) {
        this.user = { ...DEMO_USER };
        localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
        this.notify(false);
        return;
      }
      throw new Error('Identifiants incorrects. Utilisez demo@orbis.fr / demo123');
    }
    this.user = { ...DEMO_USER };
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
    this.notify(false);
  }

  async signOut() {
    this.user = null;
    localStorage.removeItem(AUTH_KEY);
    this.notify(false);
  }

  async updateMe(updates: Partial<LocalUser>) {
    if (!this.user) throw new Error('Non authentifié');
    this.user = { ...this.user, ...updates };
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
    this.notify(false);
  }

  getCurrentUser() {
    return this.user;
  }
}

class LocalDB {
  private getStore(name: string): any[] {
    try {
      return JSON.parse(localStorage.getItem(`orbis_db_${name}`) || '[]');
    } catch {
      return [];
    }
  }

  private setStore(name: string, data: any[]) {
    localStorage.setItem(`orbis_db_${name}`, JSON.stringify(data));
  }

  table(name: string) {
    const db = this;
    return {
      async list({ where, limit }: { where?: Record<string, any>; limit?: number } = {}) {
        let rows = db.getStore(name);
        if (where) {
          rows = rows.filter((row) =>
            Object.entries(where).every(([k, v]) => row[k] === v),
          );
        }
        if (limit) rows = rows.slice(0, limit);
        return rows;
      },
      async get(id: string) {
        const rows = db.getStore(name);
        return rows.find((r) => r.id === id) ?? null;
      },
      async create(data: any) {
        const rows = db.getStore(name);
        rows.push(data);
        db.setStore(name, rows);
        return data;
      },
      async update(id: string, data: any) {
        const rows = db.getStore(name);
        const idx = rows.findIndex((r) => r.id === id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...data };
          db.setStore(name, rows);
          return rows[idx];
        }
        return null;
      },
      async upsert(data: any) {
        const rows = db.getStore(name);
        const idx = rows.findIndex((r) => r.id === data.id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...data };
        } else {
          rows.push(data);
        }
        db.setStore(name, rows);
        return data;
      },
      async delete(id: string) {
        const rows = db.getStore(name).filter((r) => r.id !== id);
        db.setStore(name, rows);
      },
    };
  }
}

const authService = new LocalAuthService();
const dbService = new LocalDB();

const dbProxy = new Proxy({} as Record<string, ReturnType<LocalDB['table']>>, {
  get(_, tableName: string) {
    return dbService.table(tableName);
  },
});

export const DEMO_CREDENTIALS = { email: DEMO_USER.email, password: DEMO_PASSWORD };

export const localAuth = {
  auth: {
    onAuthStateChanged: authService.onAuthStateChanged.bind(authService),
    login: (email?: string, password?: string) => authService.login(email, password),
    signOut: authService.signOut.bind(authService),
    updateMe: authService.updateMe.bind(authService),
    getCurrentUser: authService.getCurrentUser.bind(authService),
  },
  db: dbProxy,
};
