/**
 * FusionBiz Platform - Enhanced Auth & Company Management System
 * Supports: Signup, Company Approval, Admin Access, Promotions, Loyalty
 */

// ─── User Types ────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'member';

export type LocalUser = {
  id: string;
  email: string;
  password: string; // hashed in real app
  displayName: string;
  phone?: string;
  role: UserRole;
  companyId?: string;
  isSystemAdmin: boolean;
  createdAt: string;
};

// ─── Company Types ─────────────────────────────────────────────────────────

export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export type LocalCompany = {
  id: string;
  name: string;
  industry: string;
  siret?: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  legalStatus: string;
  website?: string;
  logoUrl?: string;
  phone: string;
  status: CompanyStatus;
  ownerId: string;
  subscriptionPlan: SubscriptionPlan;
  credits: number;
  maxUsers: number;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  suspendedAt?: string;
  trialEndsAt: string;
  monthlyRevenue?: number;
};

// ─── Promotion & Loyalty Types ─────────────────────────────────────────────

export type PromotionCodeType = 'percentage' | 'fixed_amount' | 'free_credits' | 'upgrade_discount';

export type PromotionCode = {
  id: string;
  code: string;
  type: PromotionCodeType;
  value: number;
  description: string;
  maxUses: number;
  currentUses: number;
  usedBy: string[];
  expiryDate: string;
  minPlanRequired: SubscriptionPlan;
  applicableTo: 'all_companies' | 'new_only' | 'existing_only' | 'specific_companies';
  applicableCompanyIds?: string[];
  isActive: boolean;
  createdAt: string;
  createdBy: string;
};

export type LoyaltyReward = {
  id: string;
  companyId: string;
  type: 'credits' | 'discount_code' | 'feature_unlock';
  value: number;
  reason: string;
  description: string;
  expiryDate?: string;
  claimedAt?: string;
  createdAt: string;
};

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type CompanyLoyalty = {
  id: string;
  companyId: string;
  tier: LoyaltyTier;
  points: number;
  totalSpent: number;
  monthlyActiveFeatures: number;
  lastActivity: string;
  rewards: string[]; // loyalty reward IDs
  createdAt: string;
  updatedAt: string;
};

// ─── Usage Tracking ────────────────────────────────────────────────────────

export type CompanyUsage = {
  id: string;
  companyId: string;
  date: string;
  invoicesSent: number;
  ordersProcessed: number;
  leadsCreated: number;
  emailsSent: number;
  apiCallsMade: number;
  storageUsedGb: number;
};

// ─── Demo Data ─────────────────────────────────────────────────────────────

export const DEMO_ADMIN_USER: LocalUser = {
  id: 'admin_user_1',
  email: 'admin@fusionbiz.fr',
  password: 'demo123',
  displayName: 'Admin FusionBiz',
  role: 'admin',
  isSystemAdmin: true,
  createdAt: new Date().toISOString(),
};

export const DEMO_COMPANY_OWNER: LocalUser = {
  id: 'owner_user_1',
  email: 'owner@techcorp.fr',
  password: 'demo123',
  displayName: 'Jean Dupont',
  phone: '+33612345678',
  role: 'owner',
  companyId: 'demo_company_1',
  isSystemAdmin: false,
  createdAt: new Date().toISOString(),
};

export const DEMO_COMPANY: LocalCompany = {
  id: 'demo_company_1',
  name: 'TechCorp SAS',
  industry: 'Software Development',
  siret: '12345678900123',
  address: '123 Rue de la Innovation',
  city: 'Paris',
  postalCode: '75001',
  country: 'France',
  legalStatus: 'SAS',
  website: 'https://techcorp.fr',
  phone: '+33612345678',
  status: 'approved',
  ownerId: 'owner_user_1',
  subscriptionPlan: 'professional',
  credits: 500,
  maxUsers: 10,
  createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  approvedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  monthlyRevenue: 1500,
};

export const DEMO_CREDENTIALS = {
  admin: { email: DEMO_ADMIN_USER.email, password: DEMO_ADMIN_USER.password },
  user: { email: DEMO_COMPANY_OWNER.email, password: DEMO_COMPANY_OWNER.password },
};

// ─── Storage Keys ──────────────────────────────────────────────────────────

const DB_PREFIX = 'fusionbiz_';
const AUTH_KEY = `${DB_PREFIX}auth`;
const ADMIN_MODE_KEY = `${DB_PREFIX}admin_mode`;

// ─── Helper Functions ──────────────────────────────────────────────────────

function getStore(name: string): any[] {
  try {
    return JSON.parse(localStorage.getItem(`${DB_PREFIX}db_${name}`) || '[]');
  } catch {
    return [];
  }
}

function setStore(name: string, data: any[]): void {
  localStorage.setItem(`${DB_PREFIX}db_${name}`, JSON.stringify(data));
}

function initializeDefaultData(): void {
  const users = getStore('users');
  const companies = getStore('companies');

  if (users.length === 0) {
    setStore('users', [DEMO_ADMIN_USER, DEMO_COMPANY_OWNER]);
  }

  if (companies.length === 0) {
    setStore('companies', [DEMO_COMPANY]);
  }

  // Initialize demo promotion code
  const promos = getStore('promotion_codes');
  if (promos.length === 0) {
    setStore('promotion_codes', [
      {
        id: 'promo_welcome',
        code: 'WELCOME20',
        type: 'percentage',
        value: 20,
        description: 'Bienvenue 20% de réduction',
        maxUses: 1000,
        currentUses: 45,
        usedBy: [],
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        minPlanRequired: 'free',
        applicableTo: 'new_only',
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'admin_user_1',
      } as PromotionCode,
    ]);
  }
}

// ─── Authentication Service ────────────────────────────────────────────────

type AuthListener = (state: { user: LocalUser | null; isLoading: boolean }) => void;

class AuthService {
  private listeners: AuthListener[] = [];
  private user: LocalUser | null = null;
  private adminMode: boolean = false;

  constructor() {
    initializeDefaultData();
    this.loadUser();
  }

  private loadUser(): void {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored) {
        this.user = JSON.parse(stored);
      }
      const adminStored = localStorage.getItem(ADMIN_MODE_KEY);
      if (adminStored) {
        this.adminMode = JSON.parse(adminStored);
      }
    } catch {
      this.user = null;
      this.adminMode = false;
    }
    setTimeout(() => this.notify(false), 0);
  }

  private notify(isLoading: boolean): void {
    this.listeners.forEach((l) => l({ user: this.user, isLoading }));
  }

  onAuthStateChanged(listener: AuthListener): () => void {
    this.listeners.push(listener);
    listener({ user: this.user, isLoading: false });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  async login(email: string, password: string): Promise<LocalUser> {
    const users = getStore('users');
    const user = users.find((u: LocalUser) => u.email === email && u.password === password);

    if (!user) {
      throw new Error('Email ou mot de passe incorrect');
    }

    this.user = user;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    this.notify(false);
    return user;
  }

  async signup(email: string, password: string, displayName: string, companyInfo: Partial<LocalCompany>): Promise<{ user: LocalUser; company: LocalCompany }> {
    const users = getStore('users');
    if (users.find((u: LocalUser) => u.email === email)) {
      throw new Error('Cet email est déjà utilisé');
    }

    const userId = `user_${Date.now()}`;
    const companyId = `company_${Date.now()}`;

    const newUser: LocalUser = {
      id: userId,
      email,
      password,
      displayName,
      role: 'owner',
      companyId,
      isSystemAdmin: false,
      createdAt: new Date().toISOString(),
    };

    const newCompany: LocalCompany = {
      id: companyId,
      name: companyInfo.name || displayName,
      industry: companyInfo.industry || '',
      siret: companyInfo.siret,
      address: companyInfo.address || '',
      city: companyInfo.city || '',
      postalCode: companyInfo.postalCode || '',
      country: companyInfo.country || 'France',
      legalStatus: companyInfo.legalStatus || '',
      website: companyInfo.website,
      phone: companyInfo.phone || '',
      status: 'pending',
      ownerId: userId,
      subscriptionPlan: 'free',
      credits: 0,
      maxUsers: 3,
      createdAt: new Date().toISOString(),
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    users.push(newUser);
    setStore('users', users);

    const companies = getStore('companies');
    companies.push(newCompany);
    setStore('companies', companies);

    return { user: newUser, company: newCompany };
  }

  async logout(): Promise<void> {
    this.user = null;
    this.adminMode = false;
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(ADMIN_MODE_KEY);
    this.notify(false);
  }

  async updateUser(updates: Partial<LocalUser>): Promise<LocalUser> {
    if (!this.user) throw new Error('Non authentifié');

    const users = getStore('users');
    const idx = users.findIndex((u: LocalUser) => u.id === this.user!.id);
    if (idx !== -1) {
      this.user = { ...users[idx], ...updates };
      users[idx] = this.user;
      setStore('users', users);
      localStorage.setItem(AUTH_KEY, JSON.stringify(this.user));
      this.notify(false);
    }

    return this.user;
  }

  getCurrentUser(): LocalUser | null {
    return this.user;
  }

  isAdminMode(): boolean {
    return this.adminMode && this.user?.isSystemAdmin;
  }

  setAdminMode(enabled: boolean): void {
    if (this.user?.isSystemAdmin) {
      this.adminMode = enabled;
      localStorage.setItem(ADMIN_MODE_KEY, JSON.stringify(enabled));
      this.notify(false);
    }
  }

  toggleAdminMode(): void {
    this.setAdminMode(!this.adminMode);
  }
}

// ─── Database Service ─────────────────────────────────────────────────────

class DatabaseService {
  table(name: string) {
    return {
      async list(query?: { where?: Record<string, any>; limit?: number }): Promise<any[]> {
        let rows = getStore(name);
        if (query?.where) {
          rows = rows.filter((row) =>
            Object.entries(query.where!).every(([key, value]) => {
              if (typeof value === 'function') return value(row[key]);
              return row[key] === value;
            })
          );
        }
        if (query?.limit) rows = rows.slice(0, query.limit);
        return rows;
      },

      async get(id: string): Promise<any | null> {
        const rows = getStore(name);
        return rows.find((r) => r.id === id) ?? null;
      },

      async create(data: any): Promise<any> {
        const rows = getStore(name);
        rows.push(data);
        setStore(name, rows);
        return data;
      },

      async update(id: string, data: any): Promise<any | null> {
        const rows = getStore(name);
        const idx = rows.findIndex((r) => r.id === id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...data };
          setStore(name, rows);
          return rows[idx];
        }
        return null;
      },

      async delete(id: string): Promise<void> {
        const rows = getStore(name).filter((r) => r.id !== id);
        setStore(name, rows);
      },

      async upsert(data: any): Promise<any> {
        const rows = getStore(name);
        const idx = rows.findIndex((r) => r.id === data.id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...data };
        } else {
          rows.push(data);
        }
        setStore(name, rows);
        return rows[idx] ?? data;
      },
    };
  }
}

// ─── Export Services ────────────────────────────────────────────────────────

const authService = new AuthService();
const dbService = new DatabaseService();

const dbProxy = new Proxy({} as Record<string, ReturnType<DatabaseService['table']>>, {
  get(_, tableName: string) {
    return dbService.table(tableName);
  },
});

export const fusionbizAuth = {
  auth: {
    login: (email: string, password: string) => authService.login(email, password),
    signup: (email: string, password: string, displayName: string, companyInfo: Partial<LocalCompany>) => 
      authService.signup(email, password, displayName, companyInfo),
    logout: () => authService.logout(),
    onAuthStateChanged: (listener: AuthListener) => authService.onAuthStateChanged(listener),
    getCurrentUser: () => authService.getCurrentUser(),
    updateUser: (updates: Partial<LocalUser>) => authService.updateUser(updates),
    isAdminMode: () => authService.isAdminMode(),
    setAdminMode: (enabled: boolean) => authService.setAdminMode(enabled),
    toggleAdminMode: () => authService.toggleAdminMode(),
  },
  db: dbProxy,
};

// Keep legacy export for compatibility
export const localAuth = fusionbizAuth;
