import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Plus, Search, Receipt, TrendingDown, AlertCircle, CheckCircle2,
  MoreHorizontal, Download, Filter, Euro, Clock, Loader2,
  Trash2, Edit3, FileText, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  category: string;
  amount: number;
  taxAmount: number;
  date: string;
  status: string;
  receiptUrl?: string;
  notes?: string;
  createdAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Fournitures', 'Transport', 'Hébergement', 'Repas',
  'Télécom', 'Marketing', 'Logiciels', 'Autre'
] as const;

const TAX_RATES = [
  { label: '0 %', value: 0 },
  { label: '5,5 %', value: 5.5 },
  { label: '10 %', value: 10 },
  { label: '20 %', value: 20 },
];

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const CATEGORY_COLORS: Record<string, string> = {
  Fournitures: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  Transport:   'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900',
  Hébergement: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  Repas:       'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900',
  Télécom:     'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-900',
  Marketing:   'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-900',
  Logiciels:   'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900',
  Autre:       'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting' },
  { label: 'Dépenses',       href: '/dashboard/accounting/expenses' },
  { label: 'TVA',            href: '/dashboard/accounting/vat' },
  { label: 'Rapports',       href: '/dashboard/accounting/reports' },
];

function AccountingTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit overflow-x-auto">
      {TABS.map((t) => (
        <Link key={t.href} to={t.href}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap',
            active === t.href
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  (n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR') : '—';

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
    approved: { label: 'Approuvée',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900', icon: CheckCircle2 },
    pending:  { label: 'En attente',  cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',           icon: Clock },
    rejected: { label: 'Rejetée',     cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',                       icon: AlertCircle },
  };
  const c = cfg[status] ?? cfg.pending;
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border tracking-wide', c.cls)}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Autre;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border', cls)}>
      {category || 'Autre'}
    </span>
  );
}

// ─── Form defaults ────────────────────────────────────────────────────────────

const blankForm = () => ({
  title: '',
  category: 'Autre' as string,
  amountHT: '',
  taxRate: 20 as number,
  date: new Date().toISOString().split('T')[0],
  notes: '',
  status: 'pending',
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ExpensesPage = () => {
  const { user }    = useAuth();
  const { company } = useCompany();

  const [expenses,       setExpenses]       = useState<Expense[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [sheetOpen,      setSheetOpen]      = useState(false);
  const [editTarget,     setEditTarget]     = useState<Expense | null>(null);
  const [form,           setForm]           = useState(blankForm());
  const [submitting,     setSubmitting]     = useState(false);
  const [search,         setSearch]         = useState('');
  const [catFilter,      setCatFilter]      = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');

  // ─── Derived ──────────────────────────────────────────────────────────────

  const taxAmount = useMemo(() => {
    const ht = parseFloat(form.amountHT) || 0;
    return parseFloat((ht * (form.taxRate / 100)).toFixed(2));
  }, [form.amountHT, form.taxRate]);

  const totalTTC = useMemo(() => {
    const ht = parseFloat(form.amountHT) || 0;
    return ht + taxAmount;
  }, [form.amountHT, taxAmount]);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.expenses.list({
        where:   { companyId: company.id },
        orderBy: { date: 'desc' },
        limit:   500,
      });
      setExpenses(data as Expense[]);
    } catch {
      toast.error('Erreur lors du chargement des dépenses');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // ─── Stats (current month) ────────────────────────────────────────────────

  const now   = new Date();
  const mStr  = now.toISOString().slice(0, 7);

  const thisMonth = useMemo(() =>
    expenses.filter(e => (e.date || '').startsWith(mStr)),
  [expenses, mStr]);

  const totalMonth    = useMemo(() => thisMonth.reduce((s, e) => s + Number(e.amount    || 0), 0), [thisMonth]);
  const pendingCount  = useMemo(() => expenses.filter(e => e.status === 'pending').length,          [expenses]);
  const approvedTotal = useMemo(() => expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount || 0), 0), [expenses]);
  const vatTotal      = useMemo(() => expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.taxAmount || 0), 0), [expenses]);

  // ─── Bar chart (6 months) ─────────────────────────────────────────────────

  const chartData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d  = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const ms = d.toISOString().slice(0, 7);
      const total = expenses
        .filter(e => (e.date || '').startsWith(ms))
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      return { label: MONTHS_SHORT[d.getMonth()], montant: total };
    });
  }, [expenses]);

  // ─── Filtering ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch = !search ||
        e.title?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase());
      const matchCat    = catFilter    === 'all' || e.category === catFilter;
      const matchStatus = statusFilter === 'all' || e.status   === statusFilter;
      const matchFrom   = !dateFrom    || (e.date || '') >= dateFrom;
      const matchTo     = !dateTo      || (e.date || '') <= dateTo;
      return matchSearch && matchCat && matchStatus && matchFrom && matchTo;
    });
  }, [expenses, search, catFilter, statusFilter, dateFrom, dateTo]);

  // ─── Open sheet ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditTarget(null);
    setForm(blankForm());
    setSheetOpen(true);
  };

  const openEdit = (exp: Expense) => {
    setEditTarget(exp);
    const ht      = Number(exp.amount || 0);
    const tax     = Number(exp.taxAmount || 0);
    const taxRate = ht > 0 ? Math.round((tax / ht) * 100 * 10) / 10 : 20;
    setForm({
      title:    exp.title,
      category: exp.category || 'Autre',
      amountHT: String(ht),
      taxRate:  taxRate,
      date:     exp.date || new Date().toISOString().split('T')[0],
      notes:    exp.notes || '',
      status:   exp.status || 'pending',
    });
    setSheetOpen(true);
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user || !company) return;
    if (!form.title.trim()) { toast.error('Le libellé est requis'); return; }
    if (!form.amountHT || isNaN(parseFloat(form.amountHT))) {
      toast.error('Montant HT invalide');
      return;
    }
    const ht  = parseFloat(form.amountHT);
    const tax = parseFloat((ht * (form.taxRate / 100)).toFixed(2));
    const payload = {
      title:     form.title.trim(),
      category:  form.category,
      amount:    ht,
      taxAmount: tax,
      date:      form.date,
      status:    form.status,
      notes:     form.notes || null,
    };
    setSubmitting(true);
    try {
      if (editTarget) {
        await blink.db.expenses.update(editTarget.id, payload);
        toast.success('Dépense mise à jour');
      } else {
        await blink.db.expenses.create({
          id:        `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId:    user.id,
          companyId: company.id,
          ...payload,
        });
        toast.success('Dépense enregistrée');
      }
      setSheetOpen(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette dépense ?')) return;
    try {
      await blink.db.expenses.delete(id);
      toast.success('Dépense supprimée');
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Status change ────────────────────────────────────────────────────────

  const changeStatus = async (id: string, status: string) => {
    try {
      await blink.db.expenses.update(id, { status });
      toast.success('Statut mis à jour');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dépenses</h1>
          <p className="page-subtitle">Gérez et catégorisez vos dépenses professionnelles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => toast.info('Export en cours...')}>
            <Download className="w-4 h-4" />Exporter
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2" onClick={openCreate}>
                <Plus className="w-4 h-4" />Nouvelle dépense
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>{editTarget ? 'Modifier la dépense' : 'Nouvelle dépense'}</SheetTitle>
              </SheetHeader>

              <div className="space-y-5">
                {/* Libellé */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Libellé <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Ex : Abonnement Figma"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                {/* Catégorie */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catégorie</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Montant HT + taux TVA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Montant HT (€) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number" min="0" step="0.01" placeholder="0,00"
                      value={form.amountHT}
                      onChange={e => setForm(f => ({ ...f, amountHT: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Taux TVA</Label>
                    <Select value={String(form.taxRate)} onValueChange={v => setForm(f => ({ ...f, taxRate: Number(v) }))}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TAX_RATES.map(r => <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calcul auto TVA / TTC */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">TVA calculée</span>
                    <span className="font-bold text-primary">{fmtEur(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold">Total TTC</span>
                    <span className="font-black">{fmtEur(totalTTC)}</span>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                {/* Statut */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvée</SelectItem>
                      <SelectItem value="rejected">Rejetée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</Label>
                  <Textarea
                    placeholder="Informations complémentaires..."
                    rows={3}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="rounded-xl resize-none text-sm"
                  />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSheetOpen(false)}>
                    Annuler
                  </Button>
                  <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {editTarget ? 'Enregistrer' : 'Ajouter'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AccountingTabs active="/dashboard/accounting/expenses" />

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Dépenses (mois)</p>
          {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
            <p className="text-2xl font-black tracking-tight text-red-600">{fmtEur(totalMonth)}</p>
          )}
          <p className="text-xs text-muted-foreground">{thisMonth.length} transaction(s)</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">En attente</p>
          {loading ? <Skeleton className="h-7 w-24 mb-1" /> : (
            <p className="text-2xl font-black tracking-tight text-amber-600">{pendingCount}</p>
          )}
          <p className="text-xs text-muted-foreground">À valider</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Approuvées</p>
          {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
            <p className="text-2xl font-black tracking-tight text-emerald-600">{fmtEur(approvedTotal)}</p>
          )}
          <p className="text-xs text-muted-foreground">Total validé</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TVA récupérable</p>
          {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
            <p className="text-2xl font-black tracking-tight text-primary">{fmtEur(vatTotal)}</p>
          )}
          <p className="text-xs text-muted-foreground">Sur dépenses approuvées</p>
        </div>
      </div>

      {/* ── Chart ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Évolution des dépenses (6 mois)</CardTitle>
          <CardDescription>Montant total mensuel par période</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k€` : `${v}€`} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => [fmtEur(v), 'Dépenses']}
                />
                <Bar dataKey="montant" name="Dépenses" fill="hsl(0 84% 60% / 0.75)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvée</SelectItem>
            <SelectItem value="rejected">Rejetée</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input type="date" className="w-40" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            title="Date de début" />
          <Input type="date" className="w-40" value={dateTo} onChange={e => setDateTo(e.target.value)}
            title="Date de fin" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="icon" onClick={() => { setDateFrom(''); setDateTo(''); }}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Receipt className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">Aucune dépense trouvée</p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || catFilter !== 'all' || statusFilter !== 'all'
                  ? 'Modifiez vos filtres de recherche.'
                  : 'Commencez par enregistrer votre première dépense professionnelle.'}
              </p>
              {!search && catFilter === 'all' && statusFilter === 'all' && (
                <Button size="sm" className="gap-2" onClick={openCreate}>
                  <Plus className="w-4 h-4" />Ajouter une dépense
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Montant HT</TableHead>
                    <TableHead className="text-right">TVA</TableHead>
                    <TableHead className="text-right">TTC</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(exp => {
                    const ht  = Number(exp.amount    || 0);
                    const tax = Number(exp.taxAmount  || 0);
                    const ttc = ht + tax;
                    return (
                      <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/30"
                        onClick={() => openEdit(exp)}>
                        <TableCell>
                          <p className="text-sm font-semibold">{exp.title}</p>
                          {exp.notes && (
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{exp.notes}</p>
                          )}
                        </TableCell>
                        <TableCell><CategoryBadge category={exp.category} /></TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-sm">{fmtEur(ht)}</TableCell>
                        <TableCell className="text-right text-primary tabular-nums text-sm">{fmtEur(tax)}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-sm">{fmtEur(ttc)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(exp.date)}</TableCell>
                        <TableCell><StatusBadge status={exp.status || 'pending'} /></TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEdit(exp)} className="cursor-pointer">
                                <Edit3 className="w-4 h-4 mr-2" />Modifier
                              </DropdownMenuItem>
                              {exp.status !== 'approved' && (
                                <DropdownMenuItem onClick={() => changeStatus(exp.id, 'approved')} className="cursor-pointer">
                                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />Approuver
                                </DropdownMenuItem>
                              )}
                              {exp.status !== 'rejected' && (
                                <DropdownMenuItem onClick={() => changeStatus(exp.id, 'rejected')} className="cursor-pointer">
                                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />Rejeter
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(exp.id)}
                                className="cursor-pointer text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {/* Footer totals */}
              <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                <span>{filtered.length} dépense(s) affichée(s)</span>
                <div className="flex gap-6">
                  <span>HT : <strong className="text-foreground">{fmtEur(filtered.reduce((s,e) => s + Number(e.amount || 0), 0))}</strong></span>
                  <span>TVA : <strong className="text-primary">{fmtEur(filtered.reduce((s,e) => s + Number(e.taxAmount || 0), 0))}</strong></span>
                  <span>TTC : <strong className="text-foreground">{fmtEur(filtered.reduce((s,e) => s + Number(e.amount || 0) + Number(e.taxAmount || 0), 0))}</strong></span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
