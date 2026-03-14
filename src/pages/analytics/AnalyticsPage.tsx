import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Euro,
  ShoppingCart, FileText, Target
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const COLORS = ['hsl(235 85% 55%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)', 'hsl(0 84% 60%)', 'hsl(199 89% 48%)'];

export const AnalyticsPage = () => {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, invoices: 0, clients: 0, expenses: 0 });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invoices, expenses, clients] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 300 }),
        blink.db.expenses.list({ where: { companyId: company.id }, limit: 300 }),
        blink.db.clients.list({ where: { companyId: company.id }, limit: 200 }),
      ]);

      const inv = invoices as any[];
      const exp = expenses as any[];
      const cli = clients as any[];

      const totalRevenue = inv.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalExpenses = exp.reduce((s, e) => s + Number(e.amount || 0), 0);

      setStats({ revenue: totalRevenue, invoices: inv.length, clients: cli.length, expenses: totalExpenses });

      // 6-month revenue chart
      const now = new Date();
      const monthly: Record<string, { revenue: number; expenses: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { revenue: 0, expenses: 0 };
      }
      inv.filter(i => i.status === 'paid').forEach(i => {
        const d = (i.createdAt || i.created_at || '').slice(0, 7);
        if (monthly[d]) monthly[d].revenue += Number(i.amount || 0);
      });
      exp.forEach(e => {
        const d = (e.date || '').slice(0, 7);
        if (monthly[d]) monthly[d].expenses += Number(e.amount || 0);
      });
      setRevenueChart(Object.entries(monthly).map(([key, v]) => ({
        month: MONTHS_FR[parseInt(key.split('-')[1]) - 1],
        revenue: Math.round(v.revenue),
        expenses: Math.round(v.expenses),
      })));

      // Expense categories breakdown
      const cats: Record<string, number> = {};
      exp.forEach(e => {
        const c = e.category || 'Autre';
        cats[c] = (cats[c] || 0) + Number(e.amount || 0);
      });
      setCategoryBreakdown(Object.entries(cats).map(([name, value]) => ({ name, value: Math.round(value) })));

      // Top clients by invoiced amount
      const clientTotals: Record<string, number> = {};
      inv.forEach(i => {
        if (i.clientName) clientTotals[i.clientName] = (clientTotals[i.clientName] || 0) + Number(i.amount || 0);
      });
      setTopClients(Object.entries(clientTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value: Math.round(value) }))
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const kpis = [
    { label: "Chiffre d'affaires", value: fmt(stats.revenue), icon: Euro, color: 'bg-blue-50 text-blue-600' },
    { label: 'Factures émises', value: String(stats.invoices), icon: FileText, color: 'bg-violet-50 text-violet-600' },
    { label: 'Clients', value: String(stats.clients), icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Dépenses', value: fmt(stats.expenses), icon: TrendingDown, color: 'bg-red-50 text-red-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytique</h1>
          <p className="page-subtitle">Tableau de bord de performance de votre activité</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="metric-card flex items-start gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', kpi.color)}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{kpi.label}</p>
              {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-xl font-black tracking-tight">{kpi.value}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-6">
          CA vs Dépenses — 6 derniers mois
        </h3>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(235 85% 55%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(235 85% 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number, name: string) => [fmt(v), name === 'revenue' ? 'CA' : 'Dépenses']}
                contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
              />
              <Legend formatter={v => v === 'revenue' ? 'CA' : 'Dépenses'} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(235 85% 55%)" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(0 84% 60%)" strokeWidth={2} fill="url(#expGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top clients */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Top clients</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-3">
              {topClients.map((c, i) => {
                const max = topClients[0].value;
                return (
                  <div key={c.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{c.name}</span>
                      <span className="font-black text-primary">{fmt(c.value)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(c.value / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense categories */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Répartition dépenses</h3>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucune dépense enregistrée</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
