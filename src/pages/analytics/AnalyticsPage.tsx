import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Euro,
  ShoppingCart, FileText, Target, Megaphone, Share2,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0);
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const CHART_COLORS = {
  primary:  'hsl(235 85% 55%)',
  success:  'hsl(142 76% 36%)',
  warning:  'hsl(38 92% 50%)',
  danger:   'hsl(0 84% 60%)',
  info:     'hsl(199 89% 48%)',
};

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-bold">{typeof entry.value === 'number' && entry.value > 100 ? fmtEur(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; trend?: { value: number; label: string };
}) {
  const isPositive = (trend?.value || 0) >= 0;
  return (
    <div className="metric-card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-bold', isPositive ? 'text-emerald-600' : 'text-red-500')}>
          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {isPositive ? '+' : ''}{trend.value.toFixed(1)}% {trend.label}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AnalyticsPage = () => {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, expenses: 0, profit: 0, orders: 0, clients: 0, campaigns: 0 });
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [campaignPerf, setCampaignPerf] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invoices, expenses, clients, campaigns, orders] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 500 }),
        blink.db.expenses.list({ where: { companyId: company.id }, limit: 500 }),
        blink.db.clients.list({ where: { companyId: company.id }, limit: 200 }),
        blink.db.campaigns.list({ where: { companyId: company.id }, limit: 100 }),
        blink.db.orders.list({ where: { organizationId: company.id }, limit: 300 }).catch(() => []),
      ]);

      const inv  = invoices  as any[];
      const exp  = expenses  as any[];
      const cli  = clients   as any[];
      const camp = campaigns as any[];
      const ord  = orders    as any[];

      const paidInvoices  = inv.filter(i => i.status === 'paid');
      const totalRevenue  = paidInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
      const totalExpenses = exp.reduce((s, e) => s + Number(e.amount || 0), 0);

      setStats({
        revenue:   totalRevenue,
        expenses:  totalExpenses,
        profit:    totalRevenue - totalExpenses,
        orders:    ord.length,
        clients:   cli.length,
        campaigns: camp.length,
      });

      // 6-month chart
      const now = new Date();
      const monthly: Record<string, { revenue: number; expenses: number; label: string }> = {};
      for (let i = 5; i >= 0; i--) {
        const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { revenue: 0, expenses: 0, label: MONTHS_FR[d.getMonth()] };
      }
      paidInvoices.forEach(i => {
        const d = (i.createdAt || '').slice(0, 7);
        if (monthly[d]) monthly[d].revenue += Number(i.amount || 0);
      });
      exp.forEach(e => {
        const d = (e.date || e.createdAt || '').slice(0, 7);
        if (monthly[d]) monthly[d].expenses += Number(e.amount || 0);
      });
      setRevenueChart(Object.entries(monthly).map(([, v]) => ({
        month: v.label,
        Revenus: Math.round(v.revenue),
        Dépenses: Math.round(v.expenses),
        Profit: Math.round(v.revenue - v.expenses),
      })));

      // Top clients
      const clientTotals: Record<string, number> = {};
      inv.forEach(i => {
        if (i.clientName) clientTotals[i.clientName] = (clientTotals[i.clientName] || 0) + Number(i.amount || 0);
      });
      setTopClients(
        Object.entries(clientTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, total]) => ({ name, total, invoices: inv.filter(i => i.clientName === name).length }))
      );

      // Campaign performance
      setCampaignPerf(
        camp.slice(0, 6).map(c => ({
          name: c.name,
          type: c.type || 'email',
          sent: Number(c.sentCount || 0),
          openRate: Number(c.openRate || 0).toFixed(1),
          clickRate: Number(c.clickRate || 0).toFixed(1),
          status: c.status,
        }))
      );
    } catch {
      // fail silently — tables may not exist yet
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-in-up">
        <div className="page-header">
          <div><Skeleton className="h-8 w-40 rounded-xl" /><Skeleton className="h-4 w-64 rounded-xl mt-2" /></div>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytique</h1>
          <p className="page-subtitle">Vue d'ensemble de vos performances</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={fmtEur(stats.revenue)}
          icon={Euro}
          color="bg-primary/10 text-primary"
          sub="Factures encaissées"
        />
        <KpiCard
          label="Dépenses"
          value={fmtEur(stats.expenses)}
          icon={TrendingDown}
          color="bg-red-100 text-red-600 dark:bg-red-950/30"
          sub="Total des charges"
        />
        <KpiCard
          label="Bénéfice net"
          value={fmtEur(stats.profit)}
          icon={TrendingUp}
          color={stats.profit >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30' : 'bg-red-100 text-red-600 dark:bg-red-950/30'}
          sub="CA – Dépenses"
        />
        <KpiCard
          label="Clients"
          value={stats.clients.toString()}
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-950/30"
          sub="Clients actifs"
        />
        <KpiCard
          label="Commandes"
          value={stats.orders.toString()}
          icon={ShoppingCart}
          color="bg-orange-100 text-orange-600 dark:bg-orange-950/30"
          sub="Total commandes"
        />
        <KpiCard
          label="Campagnes"
          value={stats.campaigns.toString()}
          icon={Megaphone}
          color="bg-violet-100 text-violet-600 dark:bg-violet-950/30"
          sub="Campagnes marketing"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Revenus & Dépenses — 6 derniers mois
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueChart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Pas encore de données</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradDepenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.danger} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.danger} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k€`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Area type="monotone" dataKey="Revenus"  stroke={CHART_COLORS.primary} strokeWidth={2.5} fill="url(#gradRevenu)"  dot={false} />
                <Area type="monotone" dataKey="Dépenses" stroke={CHART_COLORS.danger}  strokeWidth={2}   fill="url(#gradDepenses)" dot={false} />
                <Area type="monotone" dataKey="Profit"   stroke={CHART_COLORS.success} strokeWidth={2}   fill="url(#gradProfit)"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune donnée client</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {topClients.map((client, i) => {
                  const maxTotal = topClients[0]?.total || 1;
                  return (
                    <div key={client.name} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                      <span className="w-5 text-xs font-black text-muted-foreground tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{client.name}</p>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(client.total / maxTotal) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black tabular-nums">{fmtEur(client.total)}</p>
                        <p className="text-[10px] text-muted-foreground">{client.invoices} facture{client.invoices > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              Performance campagnes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {campaignPerf.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Megaphone className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune campagne</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {['Campagne', 'Envois', 'Ouv.', 'Clics'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaignPerf.map((c, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 font-bold text-sm truncate max-w-[160px]">{c.name}</td>
                        <td className="px-5 py-3 text-xs tabular-nums">{c.sent.toLocaleString('fr-FR')}</td>
                        <td className="px-5 py-3 text-xs font-bold text-emerald-600">{c.openRate}%</td>
                        <td className="px-5 py-3 text-xs font-bold text-blue-600">{c.clickRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
