import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileBarChart, Download, TrendingUp, TrendingDown, Euro, Receipt } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const tabs = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting' },
  { label: 'Dépenses', href: '/dashboard/accounting/expenses' },
  { label: 'TVA', href: '/dashboard/accounting/vat' },
  { label: 'Rapports', href: '/dashboard/accounting/reports' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export const AccountingPage = () => {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [totals, setTotals] = useState({ revenue: 0, expenses: 0, profit: 0 });

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invoices, expenses] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 300 }),
        blink.db.expenses.list({ where: { companyId: company.id }, limit: 300 }),
      ]);

      const inv = invoices as any[];
      const exp = expenses as any[];

      const now = new Date();
      const monthly: Record<string, { revenue: number; expenses: number; invoiceCount: number; expenseCount: number; monthIdx: number; year: number }> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { revenue: 0, expenses: 0, invoiceCount: 0, expenseCount: 0, monthIdx: d.getMonth(), year: d.getFullYear() };
      }

      inv.filter(i => i.status === 'paid').forEach(i => {
        const d = (i.createdAt || i.created_at || '').slice(0, 7);
        if (monthly[d]) { monthly[d].revenue += Number(i.amount || 0); monthly[d].invoiceCount++; }
      });

      exp.forEach(e => {
        const d = (e.date || '').slice(0, 7);
        if (monthly[d]) { monthly[d].expenses += Number(e.amount || 0); monthly[d].expenseCount++; }
      });

      const rows = Object.entries(monthly).map(([_, v]) => ({
        period: `${MONTHS_FR[v.monthIdx]} ${v.year}`,
        revenue: v.revenue,
        expenses: v.expenses,
        profit: v.revenue - v.expenses,
        invoiceCount: v.invoiceCount,
        expenseCount: v.expenseCount,
      })).reverse();

      setReportData(rows);

      const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
      const totalExp = rows.reduce((s, r) => s + r.expenses, 0);
      setTotals({ revenue: totalRev, expenses: totalExp, profit: totalRev - totalExp });
    } catch {
      setReportData([]);
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-subtitle">Rapports financiers annuels</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Exporter CSV
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <Link key={tab.href} to={tab.href}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              tab.href === '/dashboard/accounting/reports'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Euro className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">CA annuel</p>
            {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-black">{fmt(totals.revenue)}</p>}
          </div>
        </div>
        <div className="metric-card flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Charges</p>
            {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-black">{fmt(totals.expenses)}</p>}
          </div>
        </div>
        <div className="metric-card flex items-start gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', totals.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50')}>
            <TrendingUp className={cn('w-5 h-5', totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600')} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Résultat</p>
            {loading ? <Skeleton className="h-7 w-24" /> : (
              <p className={cn('text-2xl font-black', totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {fmt(totals.profit)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly report table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileBarChart className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Rapport mensuel — 12 derniers mois</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Période</th>
                <th>Factures</th>
                <th>CA encaissé</th>
                <th>Charges</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, i) => (
                <tr key={i}>
                  <td className="font-semibold text-sm">{row.period}</td>
                  <td className="text-sm text-muted-foreground">{row.invoiceCount} facture(s)</td>
                  <td className="font-bold">{fmt(row.revenue)}</td>
                  <td className="text-red-600 font-medium">{fmt(row.expenses)}</td>
                  <td className={cn('font-black', row.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                    {row.profit >= 0 ? '+' : ''}{fmt(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td className="px-4 py-3 font-black uppercase text-xs tracking-widest">TOTAL</td>
                <td></td>
                <td className="px-4 py-3 font-black">{fmt(totals.revenue)}</td>
                <td className="px-4 py-3 font-black text-red-600">{fmt(totals.expenses)}</td>
                <td className={cn('px-4 py-3 font-black', totals.profit >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                  {fmt(totals.profit)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};
