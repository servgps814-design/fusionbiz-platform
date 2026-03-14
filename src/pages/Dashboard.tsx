import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Euro, FileText, Receipt, Users,
  Plus, ChevronRight, CheckCircle2, AlertCircle, Package,
  Megaphone, BarChart2, Activity, Wallet, Calendar, Zap,
  Target, Bell, Sparkles, ArrowUpRight, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardStats {
  revenueThisMonth: number;
  pendingInvoicesCount: number;
  pendingInvoicesAmount: number;
  expensesThisMonth: number;
  newClientsThisMonth: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  total: number;
  status: string;
  createdAt: string;
  dueDate: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  companyName: string;
  status: string;
  estimatedValue: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: number | string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAmount = (amount: number) =>
  `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const getMonthBounds = (monthsAgo = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
};

// ─── Demo Data Seeder ─────────────────────────────────────────────────────────
async function seedDemoData(companyId: string, userId: string) {
  try {
    const existing = await blink.db.invoices.list({ where: { companyId }, limit: 1 });
    if (existing && existing.length > 0) return;

    const demoClients = [
      { name: 'Dupont Conseil', email: 'contact@dupont-conseil.fr' },
      { name: 'Martin & Associés', email: 'info@martin-associes.fr' },
      { name: 'Sophie Laurent', email: 'sophie.laurent@email.fr' },
      { name: 'Tech Solutions SAS', email: 'contact@techsolutions.fr' },
      { name: 'Jean-Pierre Moreau', email: 'jp.moreau@email.fr' },
    ];
    for (const client of demoClients) {
      await blink.db.clients.create({
        id: `cli_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        companyId,
        name: client.name,
        email: client.email,
        status: 'active',
        totalSpent: 0,
      });
    }

    const invoiceData = [
      { clientName: 'Dupont Conseil',     status: 'paid',    amount: 2400, daysAgo: 2 },
      { clientName: 'Tech Solutions SAS', status: 'paid',    amount: 5800, daysAgo: 7 },
      { clientName: 'Martin & Associés',  status: 'pending', amount: 1200, daysAgo: 10 },
      { clientName: 'Sophie Laurent',     status: 'paid',    amount: 3900, daysAgo: 14 },
      { clientName: 'Jean-Pierre Moreau', status: 'overdue', amount: 780,  daysAgo: 22 },
      { clientName: 'Dupont Conseil',     status: 'draft',   amount: 4500, daysAgo: 28 },
      { clientName: 'Tech Solutions SAS', status: 'paid',    amount: 2100, daysAgo: 35 },
      { clientName: 'Martin & Associés',  status: 'pending', amount: 8900, daysAgo: 40 },
    ];
    for (let i = 0; i < invoiceData.length; i++) {
      const d = invoiceData[i];
      const date = new Date();
      date.setDate(date.getDate() - d.daysAgo);
      await blink.db.invoices.create({
        id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        companyId,
        number: `FAC-2025-${String(i + 1).padStart(3, '0')}`,
        type: 'invoice',
        clientName: d.clientName,
        status: d.status,
        amount: d.amount * 1.2,
        taxRate: 20,
        dueDate: new Date(date.getTime() + 30 * 86400000).toISOString().split('T')[0],
        notes: '',
        items: JSON.stringify([{ name: 'Prestation', quantity: 1, unitPrice: d.amount, total: d.amount }]),
        createdAt: date.toISOString(),
      });
    }

    const expenseData = [
      { title: 'Abonnement Adobe Creative', category: 'Logiciels',          amount: 149, daysAgo: 3 },
      { title: 'Campagne Google Ads',        category: 'Marketing',          amount: 320, daysAgo: 8 },
      { title: 'Fournitures bureau',         category: 'Bureau',             amount: 85,  daysAgo: 12 },
      { title: 'Trajet client Lyon',         category: 'Transport',          amount: 67,  daysAgo: 18 },
      { title: 'Formation React avancé',     category: 'Formation',          amount: 490, daysAgo: 25 },
      { title: 'Abonnement téléphone',       category: 'Télécommunications', amount: 39,  daysAgo: 28 },
    ];
    for (const exp of expenseData) {
      const date = new Date();
      date.setDate(date.getDate() - exp.daysAgo);
      await blink.db.expenses.create({
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        companyId,
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        taxAmount: exp.amount * 0.2,
        date: date.toISOString().split('T')[0],
        status: 'approved',
      });
    }

    const leadData = [
      { firstName: 'Thomas',  lastName: 'Bernard',  company: 'Bernard & Co',    status: 'new',       value: 5000 },
      { firstName: 'Marie',   lastName: 'Rousseau', company: 'Agence Rousseau', status: 'contacted', value: 12000 },
      { firstName: 'Nicolas', lastName: 'Petit',    company: 'NP Consulting',   status: 'qualified', value: 8500 },
      { firstName: 'Camille', lastName: 'Leroy',    company: 'Leroy Design',    status: 'proposal',  value: 3200 },
    ];
    for (const lead of leadData) {
      await blink.db.leads.create({
        id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        companyId,
        firstName: lead.firstName,
        lastName: lead.lastName,
        companyName: lead.company,
        status: lead.status,
        stage: lead.status,
        estimatedValue: lead.value,
        score: Math.floor(Math.random() * 100),
      });
    }

    const productData = [
      { name: 'Consultation stratégie digitale', price: 1200, stock: 999, category: 'Services' },
      { name: 'Pack SEO mensuel',                price: 890,  stock: 50,  category: 'Abonnements' },
      { name: 'Formation React avancé',          price: 1490, stock: 20,  category: 'Formation' },
      { name: 'Audit de site web',               price: 450,  stock: 999, category: 'Services' },
      { name: 'Pack réseaux sociaux',            price: 650,  stock: 100, category: 'Marketing' },
    ];
    for (const product of productData) {
      await blink.db.products.create({
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        companyId,
        name: product.name,
        price: product.price,
        stock: product.stock,
        status: 'active',
        category: product.category,
      });
    }

    const notifData = [
      { title: 'Nouvelle facture créée',  message: 'FAC-2025-001 a été générée pour Dupont Conseil.',   type: 'success' },
      { title: 'Paiement reçu',           message: 'Tech Solutions SAS a réglé 6 960,00 €.',             type: 'success' },
      { title: 'Facture en retard',       message: 'FAC-2025-005 est en retard de paiement.',            type: 'warning' },
      { title: 'Nouveau lead qualifié',   message: 'Nicolas Petit (NP Consulting) passe en "Qualifié".', type: 'info' },
      { title: 'Dépense soumise',         message: 'Formation React avancé — 490,00 € en attente.',      type: 'info' },
    ];
    for (const notif of notifData) {
      await blink.db.notifications.create({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        organizationId: companyId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        isRead: 0,
      });
    }
  } catch (err) {
    // silent fail — seeder is best-effort
  }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({
  title, value, subValue, trend, icon: Icon, loading, accentColor, iconBg
}: {
  title: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: React.ElementType;
  loading: boolean;
  accentColor: string;
  iconBg: string;
}) => (
  <div className="metric-card group relative overflow-hidden">
    <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-xl', accentColor)} />
    <div className="pl-5 pr-5 pt-5 pb-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110',
          iconBg
        )}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full',
            trend >= 0
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
          )}>
            {trend >= 0
              ? <TrendingUp className="w-3 h-3" />
              : <TrendingDown className="w-3 h-3" />
            }
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground mb-1.5">{title}</p>
      {loading ? (
        <Skeleton className="h-8 w-28 mb-1" />
      ) : (
        <p className="text-2xl font-black tracking-tighter text-foreground leading-none">{value}</p>
      )}
      {subValue && !loading && (
        <p className="text-xs font-semibold text-muted-foreground mt-1.5">{subValue}</p>
      )}
      {loading && <Skeleton className="h-4 w-20 mt-1.5" />}
    </div>
  </div>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; className: string }> = {
    paid:      { label: 'Payée',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' },
    pending:   { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800' },
    overdue:   { label: 'En retard',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800' },
    draft:     { label: 'Brouillon',  className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    sent:      { label: 'Envoyée',    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800' },
    cancelled: { label: 'Annulée',    className: 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500' },
  };
  const c = config[status] ?? config.draft;
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
      c.className
    )}>
      {c.label}
    </span>
  );
};

// ─── Lead Stage Badge ─────────────────────────────────────────────────────────
const LeadStageBadge = ({ stage }: { stage: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    new:       { label: 'Nouveau',      color: 'bg-blue-500' },
    contacted: { label: 'Contacté',     color: 'bg-sky-500' },
    qualified: { label: 'Qualifié',     color: 'bg-violet-500' },
    proposal:  { label: 'Proposition',  color: 'bg-amber-500' },
    won:       { label: 'Gagné',        color: 'bg-emerald-500' },
    lost:      { label: 'Perdu',        color: 'bg-red-500' },
  };
  const c = config[stage] ?? config.new;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-1.5 h-1.5 rounded-full', c.color)} />
      <span className="text-xs font-bold text-muted-foreground">{c.label}</span>
    </span>
  );
};

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xl p-4 text-sm">
      <p className="font-black text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="font-black text-foreground">{p.value.toLocaleString('fr-FR')} €</span>
        </div>
      ))}
    </div>
  );
};

// ─── Revenue chart data ───────────────────────────────────────────────────────
const revenueChartData = [
  { month: 'Oct', revenue: 12400 },
  { month: 'Nov', revenue: 15800 },
  { month: 'Déc', revenue: 11200 },
  { month: 'Jan', revenue: 18900 },
  { month: 'Fév', revenue: 22100 },
  { month: 'Mar', revenue: 19750 },
];

// ─── Quick Actions ────────────────────────────────────────────────────────────
const quickActions = [
  { label: 'Nouvelle facture',   icon: FileText,  href: '/dashboard/invoicing/invoices', color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/50' },
  { label: 'Nouveau devis',      icon: Receipt,   href: '/dashboard/invoicing/quotes',   color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/50' },
  { label: 'Ajouter un client',  icon: Users,     href: '/dashboard/crm',                color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
  { label: 'Voir les dépenses',  icon: Wallet,    href: '/dashboard/accounting/expenses',color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/50' },
  { label: 'Gérer les produits', icon: Package,   href: '/dashboard/ecommerce/products', color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-950/50' },
  { label: 'Lancer une campagne',icon: Megaphone, href: '/dashboard/marketing/campaigns',color: 'text-cyan-600',    bg: 'bg-cyan-50 dark:bg-cyan-950/50' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { company } = useCompany();

  const [stats, setStats] = useState<DashboardStats>({
    revenueThisMonth: 0,
    pendingInvoicesCount: 0,
    pendingInvoicesAmount: 0,
    expensesThisMonth: 0,
    newClientsThisMonth: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  const loadDashboard = useCallback(async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const { start: mStart, end: mEnd } = getMonthBounds(0);

      const [
        allInvoices,
        allExpenses,
        allClients,
        recentNotifs,
        recentLeads,
        topProducts,
      ] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.expenses.list({ where: { companyId: company.id }, orderBy: { date: 'desc' }, limit: 200 }),
        blink.db.clients.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.notifications.list({ where: { organizationId: company.id }, orderBy: { createdAt: 'desc' }, limit: 5 }),
        blink.db.leads.list({ where: { organizationId: company.id }, orderBy: { createdAt: 'desc' }, limit: 4 }),
        blink.db.products.list({ where: { companyId: company.id }, orderBy: { price: 'desc' }, limit: 3 }),
      ]);

      const revenueThisMonth = (allInvoices as any[])
        .filter((inv: any) => {
          if (inv.status !== 'paid') return false;
          const d = (inv.createdAt || inv.created_at || '').slice(0, 10);
          return d >= mStart && d <= mEnd;
        })
        .reduce((sum: number, inv: any) => sum + Number(inv.amount || inv.total || 0), 0);

      const pendingInvoices = (allInvoices as any[]).filter((inv: any) =>
        inv.status === 'pending' || inv.status === 'sent'
      );
      const pendingInvoicesAmount = pendingInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.amount || inv.total || 0), 0
      );

      const expensesThisMonth = (allExpenses as any[])
        .filter((exp: any) => {
          const d = (exp.date || '').slice(0, 10);
          return d >= mStart && d <= mEnd;
        })
        .reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);

      const newClientsThisMonth = (allClients as any[]).filter((c: any) => {
        const d = (c.createdAt || c.created_at || '').slice(0, 10);
        return d >= mStart && d <= mEnd;
      }).length;

      setStats({
        revenueThisMonth,
        pendingInvoicesCount: pendingInvoices.length,
        pendingInvoicesAmount,
        expensesThisMonth,
        newClientsThisMonth,
      });

      setRecentInvoices((allInvoices as any[]).slice(0, 5) as Invoice[]);
      setNotifications((recentNotifs as any[]) as Notification[]);
      setLeads((recentLeads as any[]) as Lead[]);
      setProducts((topProducts as any[]) as Product[]);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, company]);

  useEffect(() => {
    if (!user || !company || seeded) return;
    setSeeded(true);
    seedDemoData(company.id, user.id).then(() => loadDashboard());
  }, [user, company]);

  useEffect(() => {
    if (seeded) loadDashboard();
  }, [seeded]);

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const notificationIcon = (type: string) => {
    if (type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (type === 'warning') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <Bell className="w-4 h-4 text-blue-500" />;
  };

  const timeAgo = (iso: string) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `il y a ${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    return `il y a ${Math.floor(h / 24)}j`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="text-3xl font-black tracking-tighter text-foreground">
              Bonjour, {((user as any)?.displayName as string | undefined)?.split(' ')[0] || 'là'}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{today}</span>
            {company && (
              <>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-primary font-black uppercase tracking-widest text-[10px]">
                  {company.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard/crm">
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 rounded-xl font-bold hidden sm:flex gap-2"
            >
              <Users className="w-4 h-4" />
              Clients
            </Button>
          </Link>
          <Link to="/dashboard/accounting">
            <Button
              size="sm"
              className="h-10 px-5 rounded-xl font-black bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle facture
            </Button>
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <KpiCard
          title="Chiffre d'affaires du mois"
          value={formatAmount(stats.revenueThisMonth)}
          subValue="Factures payées ce mois"
          trend={12.5}
          icon={TrendingUp}
          loading={loading}
          accentColor="bg-blue-600"
          iconBg="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <KpiCard
          title="Factures en attente"
          value={String(stats.pendingInvoicesCount)}
          subValue={stats.pendingInvoicesCount > 0 ? formatAmount(stats.pendingInvoicesAmount) : 'Aucune en attente'}
          icon={Clock}
          loading={loading}
          accentColor="bg-amber-500"
          iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
        />
        <KpiCard
          title="Dépenses du mois"
          value={formatAmount(stats.expensesThisMonth)}
          subValue="Dépenses approuvées"
          trend={-4.2}
          icon={Receipt}
          loading={loading}
          accentColor="bg-violet-600"
          iconBg="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400"
        />
        <KpiCard
          title="Nouveaux clients"
          value={String(stats.newClientsThisMonth)}
          subValue="Clients ce mois-ci"
          trend={8.1}
          icon={Users}
          loading={loading}
          accentColor="bg-emerald-600"
          iconBg="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
        />
      </div>

      {/* ── Chart + Activity ───────────────────────────────────────────────── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* Revenue Area Chart */}
        <Card className="xl:col-span-2 border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider">
                  Évolution du chiffre d'affaires
                </CardTitle>
                <CardDescription className="text-xs font-bold mt-0.5">
                  6 derniers mois · données indicatives
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Tendance +12%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-6 pr-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="hsl(235 85% 55%)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(235 85% 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(235 85% 55%)"
                    strokeWidth={3}
                    fill="url(#gradRevenue)"
                    dot={{ r: 4, fill: 'hsl(235 85% 55%)', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'hsl(235 85% 55%)', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Activité récente
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest h-5 px-2">
                {notifications.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {loading ? (
              <div className="px-6 space-y-4 pt-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-xs font-bold">Aucune activité récente</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'flex items-start gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors',
                      Number(notif.isRead) === 0 && 'bg-primary/[0.02]'
                    )}
                  >
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      {notificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-foreground leading-tight truncate">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5 leading-snug line-clamp-2">{notif.message}</p>
                      {notif.createdAt && (
                        <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-wider">
                          {timeAgo(notif.createdAt)}
                        </p>
                      )}
                    </div>
                    {Number(notif.isRead) === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Invoices Table ───────────────────────────────────────────── */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Dernières factures
              </CardTitle>
              <CardDescription className="text-xs font-bold mt-0.5">
                Les 5 factures les plus récentes
              </CardDescription>
            </div>
            <Link to="/dashboard/accounting">
              <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl px-4">
                Voir tout <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-6 pb-6 space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : recentInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-xs font-bold">Aucune facture pour le moment</p>
              <Link to="/dashboard/accounting" className="mt-3">
                <Button size="sm" className="h-8 text-xs rounded-xl font-bold">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Créer une facture
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Numéro</th>
                    <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Montant</th>
                    <th className="px-6 py-3 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                    <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => navigate('/dashboard/accounting')}
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-foreground font-mono">
                          {(inv as any).number || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-foreground">
                          {(inv as any).clientName || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-foreground tabular-nums">
                          {formatAmount(Number((inv as any).amount || (inv as any).total || 0))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={(inv as any).status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs font-bold text-muted-foreground">
                          {(inv as any).createdAt
                            ? new Date((inv as any).createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions + Leads Pipeline ─────────────────────────────────── */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Quick Actions */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Actions rapides
            </CardTitle>
            <CardDescription className="text-xs font-bold">Accès direct aux fonctions principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className="group flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer bg-card hover:bg-primary/[0.02]">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110', action.bg)}>
                      <action.icon className={cn('w-4 h-4', action.color)} />
                    </div>
                    <span className="text-xs font-black text-foreground leading-tight">{action.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leads Pipeline */}
        <Card className="border-border shadow-sm flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Pipeline commercial
                </CardTitle>
                <CardDescription className="text-xs font-bold mt-0.5">Leads en cours de traitement</CardDescription>
              </div>
              <Link to="/dashboard/crm">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl px-4">
                  CRM <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {loading ? (
              <div className="px-6 pb-6 space-y-3 pt-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Target className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-xs font-bold">Aucun lead en cours</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {leads.map((lead) => {
                  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || (lead as any).companyName || '—';
                  const value = Number(lead.estimatedValue || 0);
                  return (
                    <div key={lead.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-primary">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{name}</p>
                        <p className="text-[11px] text-muted-foreground font-medium truncate">{(lead as any).companyName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-black text-foreground tabular-nums">{formatAmount(value)}</p>
                        <LeadStageBadge stage={lead.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Products + Expenses Bar Chart ──────────────────────────────── */}
      <div className="grid xl:grid-cols-2 gap-6">

        {/* Top Products */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Top produits / services
                </CardTitle>
                <CardDescription className="text-xs font-bold mt-0.5">Par prix de vente</CardDescription>
              </div>
              <Link to="/dashboard/accounting">
                <Button variant="ghost" size="sm" className="h-8 text-xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl px-4">
                  Catalogue <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Package className="w-8 h-8 mb-3 opacity-30" />
                <p className="text-xs font-bold">Aucun produit enregistré</p>
              </div>
            ) : (
              products.map((product, idx) => {
                const rankColors = ['text-amber-500', 'text-slate-400', 'text-amber-700'];
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-3.5 rounded-2xl border border-border hover:border-primary/20 hover:bg-primary/[0.02] transition-all group cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-primary/60" />
                      <span className={cn('absolute -top-1.5 -right-1.5 text-[10px] font-black', rankColors[idx] ?? 'text-muted-foreground')}>
                        #{idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-foreground truncate group-hover:text-primary transition-colors">
                        {(product as any).name}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {(product as any).category || 'Service'} · Stock : {(product as any).stock ?? '∞'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-foreground tabular-nums">
                        {formatAmount(Number((product as any).price || 0))}
                      </p>
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Actif</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Expenses Bar Chart */}
        <Card className="border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Répartition des dépenses
                </CardTitle>
                <CardDescription className="text-xs font-bold mt-0.5">6 derniers mois · données indicatives</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 pb-4 pr-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { month: 'Oct', depenses: 3200 },
                    { month: 'Nov', depenses: 4100 },
                    { month: 'Déc', depenses: 2800 },
                    { month: 'Jan', depenses: 5300 },
                    { month: 'Fév', depenses: 3900 },
                    { month: 'Mar', depenses: stats.expensesThisMonth > 0 ? Math.round(stats.expensesThisMonth) : 1149 },
                  ]}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)', radius: 8 } as any}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-xl p-3 text-xs">
                          <p className="font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                          <p className="font-black text-foreground">{payload[0].value?.toLocaleString('fr-FR')} €</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="depenses" fill="hsl(235 85% 55%)" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
