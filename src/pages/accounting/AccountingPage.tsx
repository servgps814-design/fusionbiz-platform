import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Receipt, TrendingUp, TrendingDown, Euro, FileBarChart, Plus,
  Loader2, Search, MoreHorizontal, Filter, Trash2, Edit, Download,
  CheckCircle2, Clock, BarChart3
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Expense {
  id: string;
  userId?: string;
  companyId?: string;
  title: string;
  category?: string;
  amount: number;
  taxAmount?: number;
  date: string;
  status: string;
  notes?: string;
  receiptUrl?: string;
  createdAt?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  createdAt?: string;
  taxRate?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const fmtDate = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const TABS = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting', key: 'overview' },
  { label: 'Dépenses', href: '/dashboard/accounting/expenses', key: 'expenses' },
  { label: 'TVA', href: '/dashboard/accounting/vat', key: 'vat' },
  { label: 'Rapports', href: '/dashboard/accounting/reports', key: 'reports' },
];

const EXPENSE_CATEGORIES = [
  'Loyer & charges',
  'Logiciels',
  'Marketing',
  'Transport',
  'Fournitures',
  'Formation',
  'Sous-traitance',
  'Télécommunications',
  'Alimentaire',
  'Autres',
];

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down';
}) {
  return (
    <div className="metric-card flex items-start gap-4">
      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
          {label}
        </p>
        <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
        {sub && (
          <p
            className={cn(
              'text-xs mt-1 flex items-center gap-1',
              trend === 'up'
                ? 'text-emerald-600'
                : trend === 'down'
                ? 'text-red-500'
                : 'text-muted-foreground',
            )}
          >
            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Expense Form Dialog ──────────────────────────────────────────────────────
function ExpenseDialog({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: Partial<Expense>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    title: '',
    category: 'Logiciels',
    amount: '',
    taxAmount: '',
    date: today,
    status: 'pending',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open)
      setForm({
        title: initial?.title || '',
        category: initial?.category || 'Logiciels',
        amount: String(initial?.amount || ''),
        taxAmount: String(initial?.taxAmount || ''),
        date: initial?.date || today,
        status: initial?.status || 'pending',
        notes: initial?.notes || '',
      });
  }, [open]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Titre requis'); return; }
    if (!form.amount || isNaN(Number(form.amount))) { toast.error('Montant invalide'); return; }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {initial?.id ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </DialogTitle>
          <DialogDescription>Renseignez les informations de la dépense</DialogDescription>
        </DialogHeader>
        <div className="px-7 py-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Ex: Abonnement Adobe"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Catégorie
              </Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Statut
              </Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvée</SelectItem>
                  <SelectItem value="rejected">Refusée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Montant HT (€) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    amount: e.target.value,
                    taxAmount: String((Number(e.target.value) * 0.2).toFixed(2)),
                  }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                TVA (€)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.taxAmount}
                onChange={e => setForm(f => ({ ...f, taxAmount: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Date
            </Label>
            <Input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Notes
            </Label>
            <Textarea
              placeholder="Informations complémentaires..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="rounded-xl resize-none text-sm"
              rows={2}
            />
          </div>
        </div>
        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[120px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial?.id ? 'Enregistrer' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function Overview({
  invoices,
  expenses,
  loading,
}: {
  invoices: Invoice[];
  expenses: Expense[];
  loading: boolean;
}) {
  const revenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = revenue - totalExpenses;
  const vatCollected = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => {
      const rate = Number(i.taxRate || 20);
      return s + Number(i.amount || 0) * (rate / 100 / (1 + rate / 100));
    }, 0);

  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const m = d.toLocaleDateString('fr-FR', { month: 'short' });
    const mStr = d.toISOString().slice(0, 7);
    const rev = invoices
      .filter(inv => inv.status === 'paid' && (inv.createdAt || '').startsWith(mStr))
      .reduce((s, inv) => s + Number(inv.amount || 0), 0);
    const exp = expenses
      .filter(exp => (exp.date || exp.createdAt || '').startsWith(mStr))
      .reduce((s, exp) => s + Number(exp.amount || 0), 0);
    return {
      month: m.charAt(0).toUpperCase() + m.slice(1),
      revenue: rev,
      expenses: exp,
    };
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          label="Chiffre d'affaires"
          value={fmtEur(revenue)}
          sub="Factures payées"
          icon={Euro}
          color="bg-primary/10 text-primary"
          trend="up"
        />
        <MetricCard
          label="Dépenses totales"
          value={fmtEur(totalExpenses)}
          sub={`${expenses.length} dépenses`}
          icon={TrendingDown}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          trend="down"
        />
        <MetricCard
          label="Bénéfice net"
          value={fmtEur(profit)}
          sub={profit > 0 ? 'Positif' : 'Déficitaire'}
          icon={TrendingUp}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          trend={profit > 0 ? 'up' : 'down'}
        />
        <MetricCard
          label="TVA collectée"
          value={fmtEur(vatCollected)}
          sub="Sur factures payées"
          icon={Receipt}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-wider">
              Évolution financière — 6 mois
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-6 pr-4">
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(235 85% 55%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(235 85% 55%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fontWeight: 700,
                      fill: 'hsl(var(--muted-foreground))',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k€`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '12px',
                    }}
                    formatter={(v: number) => [fmtEur(v)]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="CA"
                    stroke="hsl(235 85% 55%)"
                    strokeWidth={2.5}
                    fill="url(#gRev)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    name="Dépenses"
                    stroke="hsl(0 84% 60%)"
                    strokeWidth={2}
                    fill="url(#gExp)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider">Trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: 'Recettes',
                value: revenue,
                max: Math.max(revenue, totalExpenses) * 1.2 || 1,
                color: 'bg-primary',
              },
              {
                label: 'Dépenses',
                value: totalExpenses,
                max: Math.max(revenue, totalExpenses) * 1.2 || 1,
                color: 'bg-red-500',
              },
              {
                label: 'TVA collectée',
                value: vatCollected,
                max: Math.max(revenue, totalExpenses) * 1.2 || 1,
                color: 'bg-amber-500',
              },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-bold text-muted-foreground">{item.label}</span>
                  <span className="font-black">{fmtEur(item.value)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', item.color)}
                    style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Expenses Tab ─────────────────────────────────────────────────────────────
function ExpensesTab({
  expenses,
  loading,
  onAdd,
  onDelete,
  onEdit,
}: {
  expenses: Expense[];
  loading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onEdit: (e: Expense) => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');

  const filtered = expenses.filter(e => {
    const matchS = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchC = catFilter === 'all' || e.category === catFilter;
    return matchS && matchC;
  });

  const cats = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

  const statusCfg: Record<string, string> = {
    pending:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400',
    approved:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400',
    rejected:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400',
  };
  const statusLabel: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Refusée',
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {cats.map(c => (
                <SelectItem key={c!} value={c!}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="rounded-xl gap-2 shadow-lg shadow-primary/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </Button>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Receipt className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm font-bold text-muted-foreground">Aucune dépense trouvée</p>
              <Button size="sm" className="mt-4 rounded-xl" onClick={onAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {['Libellé', 'Catégorie', 'Montant HT', 'TVA', 'Date', 'Statut', ''].map(h => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground last:text-right"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(e => (
                    <tr
                      key={e.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold">{e.title}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {e.category || '—'}
                      </td>
                      <td className="px-5 py-3.5 font-black text-red-600 tabular-nums">
                        {fmtEur(Number(e.amount || 0))}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground tabular-nums">
                        {fmtEur(Number(e.taxAmount || 0))}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {fmtDate(e.date)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                            statusCfg[e.status] ?? statusCfg.pending,
                          )}
                        >
                          {statusLabel[e.status] ?? e.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem
                              onClick={() => onEdit(e)}
                              className="gap-2 cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDelete(e.id)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── VAT Tab ──────────────────────────────────────────────────────────────────
function VATTab({
  invoices,
  expenses,
}: {
  invoices: Invoice[];
  expenses: Expense[];
}) {
  const vatCollected = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => {
      const rate = Number(i.taxRate || 20);
      return s + Number(i.amount || 0) * (rate / 100 / (1 + rate / 100));
    }, 0);
  const vatDeductible = expenses.reduce((s, e) => s + Number(e.taxAmount || 0), 0);
  const vatDue = vatCollected - vatDeductible;

  const months = Array.from({ length: 3 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (2 - i));
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="TVA collectée"
          value={fmtEur(vatCollected)}
          sub="Sur factures payées"
          icon={Receipt}
          color="bg-primary/10 text-primary"
        />
        <MetricCard
          label="TVA déductible"
          value={fmtEur(vatDeductible)}
          sub="Sur dépenses"
          icon={TrendingDown}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <MetricCard
          label="TVA nette à déclarer"
          value={fmtEur(Math.max(0, vatDue))}
          sub="Solde dû à l'État"
          icon={FileBarChart}
          color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        />
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-0 border-b border-border">
          <CardTitle className="text-sm font-black uppercase tracking-wider">
            Historique des déclarations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    'Période',
                    'TVA collectée',
                    'TVA déductible',
                    'Net à payer',
                    'Statut',
                  ].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((month, i) => (
                  <tr
                    key={month}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-5 py-3 font-bold capitalize">{month}</td>
                    <td className="px-5 py-3 font-bold">
                      {fmtEur(i === 2 ? vatCollected : vatCollected * (0.8 + i * 0.1))}
                    </td>
                    <td className="px-5 py-3">
                      {fmtEur(i === 2 ? vatDeductible : vatDeductible * (0.8 + i * 0.1))}
                    </td>
                    <td className="px-5 py-3 font-black">
                      {fmtEur(
                        Math.max(0, i === 2 ? vatDue : vatDue * (0.8 + i * 0.1)),
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                          i < 2
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200',
                        )}
                      >
                        {i < 2 ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {i < 2 ? 'Déclarée' : 'À déclarer'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab({
  invoices,
  expenses,
}: {
  invoices: Invoice[];
  expenses: Expense[];
}) {
  const revenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  const reports = [
    { name: 'Bilan annuel 2024', type: 'Bilan', date: '31 déc. 2024', size: '245 KB' },
    {
      name: 'Compte de résultat Q4 2024',
      type: 'Résultat',
      date: '31 déc. 2024',
      size: '128 KB',
    },
    {
      name: 'Grand livre décembre 2024',
      type: 'Grand livre',
      date: '31 déc. 2024',
      size: '512 KB',
    },
    {
      name: 'Balance générale nov. 2024',
      type: 'Balance',
      date: '30 nov. 2024',
      size: '89 KB',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="CA annuel"
          value={fmtEur(revenue)}
          icon={Euro}
          color="bg-primary/10 text-primary"
          sub="Toutes périodes"
        />
        <MetricCard
          label="Charges totales"
          value={fmtEur(totalExpenses)}
          icon={TrendingDown}
          color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          sub="Toutes catégories"
        />
        <MetricCard
          label="Résultat net"
          value={fmtEur(revenue - totalExpenses)}
          icon={BarChart3}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          sub={revenue - totalExpenses > 0 ? 'Bénéficiaire' : 'Déficitaire'}
          trend={revenue - totalExpenses > 0 ? 'up' : 'down'}
        />
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-sm font-black uppercase tracking-wider">
            Rapports disponibles
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Rapport', 'Type', 'Période', 'Taille', 'Actions'].map(h => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground last:text-right"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors group"
                  >
                    <td className="px-5 py-4 font-bold">
                      <div className="flex items-center gap-2">
                        <FileBarChart className="w-4 h-4 text-primary shrink-0" />
                        {r.name}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="badge-info">{r.type}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{r.date}</td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">{r.size}</td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs rounded-lg gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Télécharger
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AccountingPage() {
  const { pathname } = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseDialog, setExpenseDialog] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeTab = pathname.includes('/expenses')
    ? 'expenses'
    : pathname.includes('/vat')
    ? 'vat'
    : pathname.includes('/reports')
    ? 'reports'
    : 'overview';

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [invData, expData] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 500 }),
        blink.db.expenses.list({
          where: { companyId: company.id },
          orderBy: { date: 'desc' },
          limit: 500,
        }),
      ]);
      setInvoices(invData as Invoice[]);
      setExpenses(expData as Expense[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleExpenseSave = async (data: any) => {
    if (!company || !user) return;
    try {
      const payload = {
        userId: user.id,
        companyId: company.id,
        title: data.title,
        category: data.category,
        amount: Number(data.amount),
        taxAmount: Number(data.taxAmount || 0),
        date: data.date,
        status: data.status,
        notes: data.notes || null,
      };
      if (editExpense) {
        await blink.db.expenses.update(editExpense.id, payload);
        toast.success('Dépense mise à jour');
      } else {
        await blink.db.expenses.create({
          id: `exp_${genId()}`,
          ...payload,
        });
        toast.success('Dépense ajoutée');
      }
      setExpenseDialog(false);
      setEditExpense(null);
      load();
    } catch {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.expenses.delete(deleteId);
      toast.success('Dépense supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur de suppression');
    }
  };

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Comptabilité</h1>
          <p className="page-subtitle">Pilotez votre activité financière</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <Overview invoices={invoices} expenses={expenses} loading={loading} />
      )}
      {activeTab === 'expenses' && (
        <ExpensesTab
          expenses={expenses}
          loading={loading}
          onAdd={() => { setEditExpense(null); setExpenseDialog(true); }}
          onDelete={id => setDeleteId(id)}
          onEdit={e => { setEditExpense(e); setExpenseDialog(true); }}
        />
      )}
      {activeTab === 'vat' && <VATTab invoices={invoices} expenses={expenses} />}
      {activeTab === 'reports' && <ReportsTab invoices={invoices} expenses={expenses} />}

      {/* Expense dialog */}
      <ExpenseDialog
        open={expenseDialog}
        onClose={() => { setExpenseDialog(false); setEditExpense(null); }}
        onSave={handleExpenseSave}
        initial={editExpense || undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
