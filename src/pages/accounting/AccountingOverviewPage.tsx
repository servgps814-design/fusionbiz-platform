import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Euro, TrendingUp, TrendingDown, Receipt, Plus, ArrowUpRight,
  Download, FileBarChart, CreditCard, AlertCircle, CheckCircle2,
  Clock, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountingStats {
  revenue: number;
  expenses: number;
  profit: number;
  pendingInvoices: number;
  pendingAmount: number;
  overdueAmount: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: string;
  createdAt: string;
}

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const getMonth = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d.getMonth();
};

// ─── Tabs navigation ──────────────────────────────────────────────────────────

const tabs = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting' },
  { label: 'Dépenses', href: '/dashboard/accounting/expenses' },
  { label: 'TVA', href: '/dashboard/accounting/vat' },
  { label: 'Rapports', href: '/dashboard/accounting/reports' },
];

function AccountingTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
      {tabs.map((t) => (
        <Link
          key={t.href}
          to={t.href}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            active === t.href
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, trend, icon: Icon, iconClass, loading
}: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
  icon: React.ElementType; iconClass: string; loading: boolean;
}) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconClass)}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && !loading && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            trend === 'up' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' :
            trend === 'down' ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' :
            'bg-muted text-muted-foreground'
          )}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-28 mb-1" />
      ) : (
        <p className="text-2xl font-black tracking-tight">{value}</p>
      )}
      {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string }> = {
    paid:    { label: 'Payée',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' },
    pending: { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' },
    overdue: { label: 'En retard',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' },
    draft:   { label: 'Brouillon',  className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    sent:    { label: 'Envoyée',    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', c.className)}>
      {c.label}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export const AccountingOverviewPage = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccountingStats>({
    revenue: 0, expenses: 0, profit: 0,
    pendingInvoices: 0, pendingAmount: 0, overdueAmount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invoicesRaw, expensesRaw] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 200 }),
        blink.db.expenses.list({ where: { companyId: company.id }, orderBy: { date: 'desc' }, limit: 200 }),
      ]);

      const invoices = invoicesRaw as any[];
      const expenses = expensesRaw as any[];

      // Build monthly chart (last 6 months)
      const now = new Date();
      const months: { label: string; revenue: number; expenses: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: MONTHS[d.getMonth()], revenue: 0, expenses: 0 });
      }

      invoices.forEach((inv: any) => {
        if (inv.status !== 'paid') return;
        const d = new Date(inv.createdAt || inv.created_at || '');
        if (isNaN(d.getTime())) return;
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diff >= 0 && diff < 6) {
          months[5 - diff].revenue += Number(inv.amount || 0);
        }
      });

      expenses.forEach((exp: any) => {
        const d = new Date(exp.date || '');
        if (isNaN(d.getTime())) return;
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        if (diff >= 0 && diff < 6) {
          months[5 - diff].expenses += Number(exp.amount || 0);
        }
      });
      setChartData(months);

      // Current month bounds
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const revenue = invoices
        .filter((i: any) => i.status === 'paid' && (i.createdAt || i.created_at || '').slice(0, 10) >= mStart && (i.createdAt || i.created_at || '').slice(0, 10) <= mEnd)
        .reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

      const expensesMonth = expenses
        .filter((e: any) => (e.date || '').slice(0, 10) >= mStart && (e.date || '').slice(0, 10) <= mEnd)
        .reduce((s: number, e: any) => s + Number(e.amount || 0), 0);

      const pending = invoices.filter((i: any) => i.status === 'pending' || i.status === 'sent');
      const overdue = invoices.filter((i: any) => i.status === 'overdue');

      setStats({
        revenue,
        expenses: expensesMonth,
        profit: revenue - expensesMonth,
        pendingInvoices: pending.length,
        pendingAmount: pending.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
        overdueAmount: overdue.reduce((s: number, i: any) => s + Number(i.amount || 0), 0),
      });

      setRecentInvoices(invoices.slice(0, 5));
      setRecentExpenses(expenses.slice(0, 5));
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-subtitle">Pilotez vos finances et suivez votre activité</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button size="sm" className="gap-2" onClick={() => navigate('/dashboard/accounting/expenses')}>
            <Plus className="w-4 h-4" />
            Nouvelle dépense
          </Button>
        </div>
      </div>

      <AccountingTabs active="/dashboard/accounting" />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard label="Chiffre d'affaires (mois)" value={fmt(stats.revenue)} icon={Euro}
          iconClass="bg-primary/10 text-primary" trend="up" loading={loading}
          sub="Factures encaissées ce mois" />
        <KpiCard label="Dépenses (mois)" value={fmt(stats.expenses)} icon={TrendingDown}
          iconClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" trend="down" loading={loading}
          sub="Total dépenses du mois" />
        <KpiCard label="Résultat net" value={fmt(stats.profit)} icon={TrendingUp}
          iconClass={stats.profit >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600'}
          trend={stats.profit >= 0 ? 'up' : 'down'} loading={loading}
          sub="CA - Dépenses" />
      </div>

      {/* Second KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">En attente</p>
            {loading ? <Skeleton className="h-6 w-24 mt-1" /> : (
              <p className="text-xl font-black tracking-tight">{fmt(stats.pendingAmount)}</p>
            )}
            <p className="text-xs text-muted-foreground">{stats.pendingInvoices} facture(s)</p>
          </div>
        </div>
        <div className="metric-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">En retard</p>
            {loading ? <Skeleton className="h-6 w-24 mt-1" /> : (
              <p className="text-xl font-black tracking-tight">{fmt(stats.overdueAmount)}</p>
            )}
            <p className="text-xs text-muted-foreground">À relancer</p>
          </div>
        </div>
        <div className="metric-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marge brute</p>
            {loading ? <Skeleton className="h-6 w-24 mt-1" /> : (
              <p className="text-xl font-black tracking-tight">
                {stats.revenue > 0 ? Math.round(((stats.revenue - stats.expenses) / stats.revenue) * 100) : 0}%
              </p>
            )}
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Évolution financière (6 mois)</CardTitle>
          <CardDescription>Chiffre d'affaires vs Dépenses</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [fmt(v)]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="revenue" name="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Dépenses" fill="hsl(0 84% 60% / 0.7)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Recent tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Dernières factures</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/dashboard/invoicing/invoices')}>
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentInvoices.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aucune facture trouvée
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/dashboard/invoicing/invoices')}>
                      <td className="font-mono text-xs font-bold text-primary">{inv.number}</td>
                      <td className="text-sm font-medium truncate max-w-[120px]">{inv.clientName || '—'}</td>
                      <td className="text-sm font-bold">{fmt(Number(inv.amount || 0))}</td>
                      <td><StatusBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-bold">Dernières dépenses</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/dashboard/accounting/expenses')}>
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentExpenses.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Aucune dépense trouvée
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Catégorie</th>
                    <th>Montant</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate('/dashboard/accounting/expenses')}>
                      <td className="text-sm font-medium truncate max-w-[140px]">{exp.title}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          {exp.category || 'Autre'}
                        </span>
                      </td>
                      <td className="text-sm font-bold text-red-600">{fmt(Number(exp.amount || 0))}</td>
                      <td className="text-xs text-muted-foreground">
                        {exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Electronic invoicing banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <FileBarChart className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground mb-0.5">Facturation électronique obligatoire 2026</p>
          <p className="text-xs text-muted-foreground">
            ORBiS est conçu pour être compatible avec les obligations PDP/PPF françaises.
            Vos factures incluent les métadonnées légales nécessaires.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0">En savoir plus</Button>
      </div>
    </div>
  );
};
