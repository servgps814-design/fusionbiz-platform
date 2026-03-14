import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, MoreHorizontal, Trash2, Edit, Download,
  Receipt, CheckCircle2, Clock, AlertCircle, Loader2, X, Upload
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  taxAmount: number;
  date: string;
  status: string;
  notes: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

const CATEGORIES = [
  'Logiciels', 'Marketing', 'Bureau', 'Transport', 'Formation',
  'Télécommunications', 'Frais bancaires', 'Sous-traitance', 'Matériel', 'Autre'
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────

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
        <Link key={t.href} to={t.href}
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            active === t.href ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    approved: { label: 'Approuvée', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800', icon: CheckCircle2 },
    pending:  { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800', icon: Clock },
    rejected: { label: 'Rejetée',   className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800', icon: AlertCircle },
  };
  const c = cfg[status] ?? cfg.pending;
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', c.className)}>
      <Icon className="w-3 h-3" />{c.label}
    </span>
  );
}

// ─── Expense Form ─────────────────────────────────────────────────────────────

interface ExpenseFormData {
  title: string; category: string; amount: string;
  taxAmount: string; date: string; notes: string; status: string;
}

const defaultForm: ExpenseFormData = {
  title: '', category: 'Autre', amount: '', taxAmount: '',
  date: new Date().toISOString().split('T')[0], notes: '', status: 'pending'
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const ExpensesPage = () => {
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.expenses.list({
        where: { companyId: company.id },
        orderBy: { date: 'desc' },
        limit: 200
      });
      setExpenses(data as any[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditExpense(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setEditExpense(exp);
    setForm({
      title: exp.title, category: exp.category || 'Autre',
      amount: String(exp.amount), taxAmount: String(exp.taxAmount || ''),
      date: exp.date, notes: exp.notes || '', status: exp.status || 'pending'
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.amount || !form.date) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        amount: parseFloat(form.amount),
        taxAmount: form.taxAmount ? parseFloat(form.taxAmount) : 0,
        date: form.date,
        notes: form.notes,
        status: form.status,
      };
      if (editExpense) {
        await blink.db.expenses.update(editExpense.id, payload);
        toast.success('Dépense modifiée');
      } else {
        await blink.db.expenses.create({
          id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user!.id,
          companyId: company!.id,
          ...payload,
        });
        toast.success('Dépense ajoutée');
      }
      setShowForm(false);
      load();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

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

  const filtered = expenses.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount || 0), 0);
  const totalTax = filtered.reduce((s, e) => s + Number(e.taxAmount || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dépenses</h1>
          <p className="page-subtitle">Gérez et catégorisez vos dépenses professionnelles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Nouvelle dépense
          </Button>
        </div>
      </div>

      <AccountingTabs active="/dashboard/accounting/expenses" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total dépenses</p>
          <p className="text-2xl font-black tracking-tight text-red-600">{fmt(totalAmount)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} ligne(s)</p>
        </div>
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">TVA déductible</p>
          <p className="text-2xl font-black tracking-tight text-primary">{fmt(totalTax)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sur les dépenses filtrées</p>
        </div>
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">HT total</p>
          <p className="text-2xl font-black tracking-tight">{fmt(totalAmount - totalTax)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Montant hors taxes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher une dépense..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes catégories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            <SelectItem value="approved">Approuvée</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="rejected">Rejetée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
              <p className="text-sm text-muted-foreground mb-4">Commencez par ajouter vos premières dépenses professionnelles.</p>
              <Button size="sm" onClick={openCreate} className="gap-2">
                <Plus className="w-4 h-4" />Ajouter une dépense
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Catégorie</th>
                    <th>Date</th>
                    <th>Montant TTC</th>
                    <th>TVA</th>
                    <th>Statut</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exp) => (
                    <tr key={exp.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(exp)}>
                      <td>
                        <p className="text-sm font-semibold">{exp.title}</p>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                          {exp.category || 'Autre'}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="text-sm font-bold">{fmt(Number(exp.amount || 0))}</td>
                      <td className="text-sm text-primary">{fmt(Number(exp.taxAmount || 0))}</td>
                      <td><StatusBadge status={exp.status || 'pending'} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => openEdit(exp)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="cursor-pointer text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />Supprimer
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

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editExpense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
            <DialogDescription>
              {editExpense ? 'Modifiez les informations de cette dépense.' : 'Enregistrez une nouvelle dépense professionnelle.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Libellé <span className="text-destructive">*</span></Label>
              <Input id="title" placeholder="Ex: Abonnement Figma" value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="approved">Approuvée</SelectItem>
                    <SelectItem value="rejected">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Montant TTC (€) <span className="text-destructive">*</span></Label>
                <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax">TVA (€)</Label>
                <Input id="tax" type="number" min="0" step="0.01" placeholder="0.00" value={form.taxAmount}
                  onChange={(e) => setForm({ ...form, taxAmount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
              <Input id="date" type="date" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Informations complémentaires..." rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editExpense ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
