import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const tabs = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting' },
  { label: 'Dépenses', href: '/dashboard/accounting/expenses' },
  { label: 'TVA', href: '/dashboard/accounting/vat' },
  { label: 'Rapports', href: '/dashboard/accounting/reports' },
];

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export const VATPage = () => {
  const { company } = useCompany();
  const [loading, setLoading] = useState(true);
  const [tvaData, setTvaData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ collected: 0, deductible: 0, balance: 0 });

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invoices, expenses] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 200 }),
        blink.db.expenses.list({ where: { companyId: company.id }, limit: 200 }),
      ]);

      const inv = invoices as any[];
      const exp = expenses as any[];

      // Build monthly TVA breakdown
      const now = new Date();
      const monthly: Record<string, { collected: number; deductible: number; monthIdx: number; year: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthly[key] = { collected: 0, deductible: 0, monthIdx: d.getMonth(), year: d.getFullYear() };
      }

      inv.filter(i => i.status === 'paid').forEach(i => {
        const d = (i.createdAt || i.created_at || '').slice(0, 7);
        if (monthly[d]) {
          const ht = Number(i.amount || 0) / 1.2;
          monthly[d].collected += Number(i.amount || 0) - ht;
        }
      });

      exp.forEach(e => {
        const d = (e.date || '').slice(0, 7);
        if (monthly[d]) {
          monthly[d].deductible += Number(e.taxAmount || 0);
        }
      });

      const rows = Object.entries(monthly).map(([key, v]) => ({
        period: `${MONTHS_FR[v.monthIdx]} ${v.year}`,
        collected: v.collected,
        deductible: v.deductible,
        balance: v.collected - v.deductible,
      })).reverse();

      setTvaData(rows);

      const totalCollected = rows.reduce((s, r) => s + r.collected, 0);
      const totalDeductible = rows.reduce((s, r) => s + r.deductible, 0);
      setSummary({ collected: totalCollected, deductible: totalDeductible, balance: totalCollected - totalDeductible });
    } catch {
      setTvaData([]);
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
          <p className="page-subtitle">Suivi de votre TVA collectée et déductible</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <Link key={tab.href} to={tab.href}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              tab.href === '/dashboard/accounting/vat'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          Ces données sont fournies à titre indicatif. Consultez un expert-comptable pour la déclaration officielle de TVA.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">TVA collectée</p>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-black text-emerald-600">{fmt(summary.collected)}</p>}
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-blue-600" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">TVA déductible</p>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : <p className="text-2xl font-black text-blue-600">{fmt(summary.deductible)}</p>}
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Solde TVA à payer</p>
          </div>
          {loading ? <Skeleton className="h-7 w-24" /> : (
            <p className={cn('text-2xl font-black', summary.balance >= 0 ? 'text-primary' : 'text-emerald-600')}>
              {fmt(summary.balance)}
            </p>
          )}
        </div>
      </div>

      {/* Monthly table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Récapitulatif mensuel</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Période</th>
                <th>TVA collectée</th>
                <th>TVA déductible</th>
                <th>Solde</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {tvaData.map((row, i) => (
                <tr key={i}>
                  <td className="font-semibold text-sm">{row.period}</td>
                  <td className="font-bold text-emerald-700">{fmt(row.collected)}</td>
                  <td className="font-bold text-blue-700">{fmt(row.deductible)}</td>
                  <td className={cn('font-black', row.balance >= 0 ? 'text-primary' : 'text-emerald-600')}>
                    {fmt(row.balance)}
                  </td>
                  <td>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-xs font-bold',
                      i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                    )}>
                      {i === 0 ? 'En cours' : 'Clôturé'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
