import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Plus, TrendingUp, TrendingDown, AlertCircle, CheckCircle2,
  MoreHorizontal, Euro, Receipt, Building2, Calendar, FileText,
  Trash2, Star, Edit3, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TvaRate {
  id: string;
  organizationId: string;
  name: string;
  rate: number;
  isDefault: number | boolean;
  appliesTo?: string;
}

interface Invoice {
  id: string;
  amount: number;
  taxRate: number;
  status: string;
  createdAt?: string;
}

interface Expense {
  id: string;
  amount: number;
  taxAmount: number;
  date?: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "Vue d'ensemble", href: '/dashboard/accounting' },
  { label: 'Dépenses',       href: '/dashboard/accounting/expenses' },
  { label: 'TVA',            href: '/dashboard/accounting/vat' },
  { label: 'Rapports',       href: '/dashboard/accounting/reports' },
];

const DEFAULT_RATES: Omit<TvaRate, 'id' | 'organizationId'>[] = [
  { name: 'Taux normal',       rate: 20,  isDefault: 1, appliesTo: 'Biens et services standard' },
  { name: 'Taux réduit',       rate: 10,  isDefault: 0, appliesTo: 'Restauration, travaux' },
  { name: 'Taux super-réduit', rate: 5.5, isDefault: 0, appliesTo: 'Alimentation, livres' },
  { name: 'Exonéré',           rate: 0,   isDefault: 0, appliesTo: 'Exportations, médical' },
];

const MONTHS_FR_LONG  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

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

const getQuarter = (date: Date): string => {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `T${q} ${date.getFullYear()}`;
};

const quarterBounds = (q: number, year: number) => {
  const startMonth = (q - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end   = new Date(year, startMonth + 3, 0);
  return {
    start: start.toISOString().split('T')[0],
    end:   end.toISOString().split('T')[0],
  };
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const VATPage = () => {
  const { user }    = useAuth();
  const { company } = useCompany();

  const [loading,    setLoading]    = useState(true);
  const [invoices,   setInvoices]   = useState<Invoice[]>([]);
  const [expenses,   setExpenses]   = useState<Expense[]>([]);
  const [tvaRates,   setTvaRates]   = useState<TvaRate[]>([]);
  const [sheetOpen,  setSheetOpen]  = useState(false);
  const [rateForm,   setRateForm]   = useState({ name: '', rate: '', appliesTo: '' });
  const [saving,     setSaving]     = useState(false);

  // ─── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [inv, exp, rates] = await Promise.all([
        blink.db.invoices.list({ where: { companyId: company.id }, limit: 500 }),
        blink.db.expenses.list({ where: { companyId: company.id }, limit: 500 }),
        blink.db.tvaRates.list({ where: { organizationId: company.id }, limit: 100 }),
      ]);
      setInvoices(inv as Invoice[]);
      setExpenses(exp as Expense[]);
      setTvaRates(rates as TvaRate[]);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // ─── Current quarter summary ───────────────────────────────────────────────

  const now    = new Date();
  const curQ   = Math.floor(now.getMonth() / 3) + 1;
  const curY   = now.getFullYear();
  const bounds = quarterBounds(curQ, curY);

  const qCollected = useMemo(() =>
    invoices
      .filter(i => i.status === 'paid' && (i.createdAt || '').slice(0, 10) >= bounds.start && (i.createdAt || '').slice(0, 10) <= bounds.end)
      .reduce((s, i) => {
        const rate = Number(i.taxRate || 20);
        const ht   = Number(i.amount || 0) / (1 + rate / 100);
        return s + Number(i.amount || 0) - ht;
      }, 0),
  [invoices, bounds]);

  const qDeductible = useMemo(() =>
    expenses
      .filter(e => e.status === 'approved' && (e.date || '').slice(0, 10) >= bounds.start && (e.date || '').slice(0, 10) <= bounds.end)
      .reduce((s, e) => s + Number(e.taxAmount || 0), 0),
  [expenses, bounds]);

  const qNet = qCollected - qDeductible;

  // Next quarterly deadline
  const nextDeadlineMonth = curQ * 3; // End of quarter + 1 month
  const nextDeadline = new Date(curY, nextDeadlineMonth, 24);
  const deadlineStr  = nextDeadline.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  // ─── Quarterly breakdown (4 quarters of current year) ────────────────────

  const quarterlyData = useMemo(() => {
    return [1, 2, 3, 4].map(q => {
      const b = quarterBounds(q, curY);
      const collected = invoices
        .filter(i => i.status === 'paid' && (i.createdAt || '').slice(0, 10) >= b.start && (i.createdAt || '').slice(0, 10) <= b.end)
        .reduce((s, i) => {
          const rate = Number(i.taxRate || 20);
          const ht   = Number(i.amount || 0) / (1 + rate / 100);
          return s + Number(i.amount || 0) - ht;
        }, 0);
      const deductible = expenses
        .filter(e => e.status === 'approved' && (e.date || '').slice(0, 10) >= b.start && (e.date || '').slice(0, 10) <= b.end)
        .reduce((s, e) => s + Number(e.taxAmount || 0), 0);
      const qNum   = Math.floor(now.getMonth() / 3) + 1;
      const isPast = q < qNum;
      const isCur  = q === qNum;
      return {
        period: `T${q} ${curY}`,
        collected,
        deductible,
        balance: collected - deductible,
        status: isPast ? 'Clôturé' : isCur ? 'En cours' : 'À venir',
        statusCls: isPast
          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400'
          : isCur
          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
      };
    });
  }, [invoices, expenses, curY]);

  // ─── Add TVA rate ─────────────────────────────────────────────────────────

  const handleAddRate = async () => {
    if (!company) return;
    if (!rateForm.name.trim() || !rateForm.rate) {
      toast.error('Nom et taux requis');
      return;
    }
    setSaving(true);
    try {
      await blink.db.tvaRates.create({
        id:             `tva_${Date.now()}`,
        organizationId: company.id,
        name:           rateForm.name.trim(),
        rate:           parseFloat(rateForm.rate),
        isDefault:      0,
        appliesTo:      rateForm.appliesTo || null,
      });
      toast.success('Taux TVA ajouté');
      setSheetOpen(false);
      setRateForm({ name: '', rate: '', appliesTo: '' });
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!confirm('Supprimer ce taux ?')) return;
    try {
      await blink.db.tvaRates.delete(id);
      toast.success('Taux supprimé');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all, then set on this one
      await Promise.all(
        tvaRates.map(r => blink.db.tvaRates.update(r.id, { isDefault: r.id === id ? 1 : 0 }))
      );
      toast.success('Taux par défaut mis à jour');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  // Displayed rates: fetched from DB or default list
  const displayRates = tvaRates.length > 0
    ? tvaRates
    : DEFAULT_RATES.map((r, i) => ({ ...r, id: `default_${i}`, organizationId: company?.id || '' }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 pb-16">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">TVA</h1>
          <p className="page-subtitle">Suivi de votre TVA collectée, déductible et à reverser</p>
        </div>
      </div>

      <AccountingTabs active="/dashboard/accounting/vat" />

      {/* ── Info banner ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50 text-amber-800 dark:text-amber-400">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-sm font-medium">
          Ces données sont fournies à titre indicatif. Consultez votre expert-comptable pour la déclaration officielle de TVA (CA3/CA12).
        </p>
      </div>

      {/* ── Quarter summary cards ─────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Trimestre en cours — T{curQ} {curY}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TVA collectée</p>
            {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
              <p className="text-2xl font-black tracking-tight text-emerald-600">{fmtEur(qCollected)}</p>
            )}
            <p className="text-xs text-muted-foreground">Factures encaissées</p>
          </div>

          <div className="metric-card">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center mb-3">
              <TrendingDown className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TVA déductible</p>
            {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
              <p className="text-2xl font-black tracking-tight text-blue-600">{fmtEur(qDeductible)}</p>
            )}
            <p className="text-xs text-muted-foreground">Dépenses approuvées</p>
          </div>

          <div className="metric-card">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3',
              qNet >= 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400')}>
              <Receipt className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TVA nette à reverser</p>
            {loading ? <Skeleton className="h-7 w-28 mb-1" /> : (
              <p className={cn('text-2xl font-black tracking-tight', qNet >= 0 ? 'text-red-600' : 'text-emerald-600')}>
                {fmtEur(Math.abs(qNet))}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{qNet >= 0 ? 'À reverser à l\'État' : 'Crédit de TVA'}</p>
          </div>

          <div className="metric-card">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Prochain échéance</p>
            {loading ? <Skeleton className="h-7 w-32 mb-1" /> : (
              <p className="text-sm font-black tracking-tight">{deadlineStr}</p>
            )}
            <p className="text-xs text-muted-foreground">Déclaration CA3</p>
          </div>
        </div>
      </div>

      {/* ── TVA Rates table ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold">Taux de TVA</CardTitle>
            <CardDescription>Taux applicables à vos opérations</CardDescription>
          </div>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />Ajouter un taux
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader className="mb-6">
                <SheetTitle>Nouveau taux de TVA</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder="Ex : Taux normal" value={rateForm.name}
                    onChange={e => setRateForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Taux (%) <span className="text-destructive">*</span>
                  </Label>
                  <Input type="number" min="0" max="100" step="0.1" placeholder="20"
                    value={rateForm.rate}
                    onChange={e => setRateForm(f => ({ ...f, rate: e.target.value }))} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type d'application</Label>
                  <Input placeholder="Ex : Biens et services" value={rateForm.appliesTo}
                    onChange={e => setRateForm(f => ({ ...f, appliesTo: e.target.value }))} className="rounded-xl" />
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSheetOpen(false)}>Annuler</Button>
                  <Button className="flex-1 rounded-xl" onClick={handleAddRate} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Ajouter
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-12 w-full"/>)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead>Type d'application</TableHead>
                  <TableHead>Défaut</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-semibold text-sm">{rate.name}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-black bg-primary/10 text-primary">
                        {rate.rate} %
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rate.appliesTo || '—'}</TableCell>
                    <TableCell>
                      {Number(rate.isDefault) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3 h-3 fill-current" />Défaut
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!rate.id.startsWith('default_') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleSetDefault(rate.id)} className="cursor-pointer">
                              <Star className="w-4 h-4 mr-2" />Définir par défaut
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeleteRate(rate.id)}
                              className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Quarterly summary ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Récapitulatif trimestriel {curY}</CardTitle>
          <CardDescription>TVA collectée, déductible et solde par trimestre</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-12 w-full"/>)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">TVA collectée</TableHead>
                  <TableHead className="text-right">TVA déductible</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quarterlyData.map((row) => (
                  <TableRow key={row.period}>
                    <TableCell className="font-semibold text-sm">{row.period}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 tabular-nums">
                      {fmtEur(row.collected)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600 tabular-nums">
                      {fmtEur(row.deductible)}
                    </TableCell>
                    <TableCell className={cn('text-right font-black tabular-nums', row.balance >= 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {fmtEur(Math.abs(row.balance))}
                      <span className="text-[10px] font-medium text-muted-foreground ml-1">
                        {row.balance >= 0 ? '↑' : '↓'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide', row.statusCls)}>
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Electronic invoicing section ──────────────────────────────────── */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Facturation électronique obligatoire dès 2026</CardTitle>
              <CardDescription>
                En vertu de la loi de finances 2024, toutes les entreprises françaises devront émettre et recevoir des factures électroniques via une plateforme agréée (PDP) ou via le Portail Public de Facturation (PPF).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</span>
              </div>
              <p className="text-sm font-semibold">Architecture prête</p>
              <p className="text-xs text-muted-foreground mt-0.5">Conformité PPF/PDP</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Calendrier</span>
              </div>
              <p className="text-sm font-semibold">1er septembre 2026</p>
              <p className="text-xs text-muted-foreground mt-0.5">Grandes entreprises</p>
            </div>
            <div className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PDP / PPF</span>
              </div>
              <p className="text-sm font-semibold">Choix de la plateforme</p>
              <p className="text-xs text-muted-foreground mt-0.5">Plateforme Partenaire ou État</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast.info('Documentation disponible prochainement')}>
              Documentation DGFiP
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info('Comparateur PDP disponible prochainement')}>
              Comparer les PDP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
