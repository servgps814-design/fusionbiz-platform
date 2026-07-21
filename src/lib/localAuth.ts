export type LocalUser = {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  isAdmin?: boolean;
};

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type LocalCompany = {
  id: string;
  name: string;
  industry: string;
  siret: string;
  address: string;
  legalStatus: string;
  website?: string;
  logoUrl?: string;
  status: CompanyStatus;
  ownerId: string;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  credits: number;
  subscriptionPlan: 'basic' | 'professional' | 'enterprise';
};

export type PromotionCode = {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'credits';
  value: number;
  maxUses: number;
  currentUses: number;
  expiryDate: string;
  applicableTo: 'all' | 'new' | 'existing';
  isActive: boolean;
  createdAt: string;
};

export type LoyaltyReward = {
  id: string;
  companyId: string;
  type: 'credits' | 'discount' | 'upgrade';
  value: number;
  reason: string;
  givenAt: string;
  expiryDate?: string;
};

const DEMO_USER: LocalUser = {
  id: 'demo_user_1',
  email: 'admin@fusionbiz.fr',
  displayName: 'Admin FusionBiz',
  isAdmin: true,
};

const DEMO_COMPANY: LocalCompany = {
  id: 'demo_company_1',
  name: 'FusionBiz Demo',
  industry: 'Technology',
  siret: '12345678900123',
  address: '123 Rue de Paris, 75001 Paris',
  legalStatus: 'SARL',
  website: 'https://demo.fusionbiz.fr',
  status: 'approved',
  ownerId: 'demo_user_1',
  createdAt: new Date().toISOString(),
  approvedAt: new Date().toISOString(),
  credits: 1000,
  subscriptionPlan: 'enterprise',
};

const DEMO_PASSWORD = 'demo123';
const AUTH_KEY = 'fusionbiz_auth';
const ADMIN_KEY = 'fusionbiz_admin';

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

  async signup(email: string, password: string, displayName: string, companyInfo?: Partial<LocalCompany>) {
    // Check if user already exists
    const users = this.getStore('users');
    if (users.find((u: any) => u.email === email)) {
      throw new Error('Email déjà utilisé');
    }

    const userId = `user_${Date.now()}`;
    const companyId = `company_${Date.now()}`;

    const newUser: LocalUser = {
      id: userId,
      email,
      displayName,
      isAdmin: false,
    };

    const newCompany: LocalCompany = {
      id: companyId,
      name: companyInfo?.name || displayName,
      industry: companyInfo?.industry || '',
      siret: companyInfo?.siret || '',
      address: companyInfo?.address || '',
      legalStatus: companyInfo?.legalStatus || '',
      website: companyInfo?.website,
      status: 'pending',
      ownerId: userId,
      createdAt: new Date().toISOString(),
      credits: 0,
      subscriptionPlan: 'basic',
    };

    // Store user and company
    users.push({ ...newUser, password });
    this.setStore('users', users);

    const companies = this.getStore('companies');
    companies.push(newCompany);
    this.setStore('companies', companies);

    return { user: newUser, company: newCompany };
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
