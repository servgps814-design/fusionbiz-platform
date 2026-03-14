import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Plus, Search, MoreHorizontal, FileText, Loader2,
  Trash2, Edit, Filter, CheckCircle2, Clock,
  AlertTriangle, Send, XCircle, Ban, TrendingUp,
  Euro, Receipt, ArrowUpRight,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  userId?: string;
  companyId?: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  number: string;
  status: string;
  type: string;
  amount: number;
  taxRate: number;
  dueDate?: string;
  issueDate?: string;
  notes?: string;
  items?: string;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Nav Tabs ──────────────────────────────────────────────────────────────────

const INVOICE_TABS = [
  { label: 'Devis', href: '/dashboard/invoicing/quotes' },
  { label: 'Factures', href: '/dashboard/invoicing/invoices' },
  { label: 'Avoirs', href: '/dashboard/invoicing/credits' },
];

function InvoicingTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
      {INVOICE_TABS.map((t) => (
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

// ─── Status Config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: 'Brouillon',   className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: FileText },
  sent:      { label: 'Envoyée',     className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',        icon: Send },
  pending:   { label: 'En attente',  className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900',   icon: Clock },
  paid:      { label: 'Payée',       className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900', icon: CheckCircle2 },
  overdue:   { label: 'En retard',   className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',              icon: AlertTriangle },
  cancelled: { label: 'Annulée',     className: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700', icon: Ban },
};

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
      cfg.className
    )}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

// ─── Invoice Form (Sheet) ──────────────────────────────────────────────────────

const EMPTY_ITEM: InvoiceItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };

function InvoiceSheet({
  open, onClose, onSave, initial, nextNumber,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: Partial<Invoice> | null;
  nextNumber: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const inThirty = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    number: nextNumber,
    issueDate: today,
    dueDate: inThirty,
    status: 'draft',
    type: 'invoice',
    taxRate: 20,
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        clientName: initial.clientName || '',
        clientEmail: initial.clientEmail || '',
        number: initial.number || nextNumber,
        issueDate: initial.issueDate || today,
        dueDate: initial.dueDate || inThirty,
        status: initial.status || 'draft',
        type: initial.type || 'invoice',
        taxRate: Number(initial.taxRate ?? 20),
        notes: initial.notes || '',
      });
      try {
        const parsed = initial.items ? JSON.parse(initial.items) : [];
        setItems(parsed.length ? parsed : [{ ...EMPTY_ITEM }]);
      } catch {
        setItems([{ ...EMPTY_ITEM }]);
      }
    } else {
      setForm({
        clientName: '', clientEmail: '', number: nextNumber,
        issueDate: today, dueDate: inThirty,
        status: 'draft', type: 'invoice', taxRate: 20, notes: '',
      });
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [open, initial, nextNumber]);

  const updateItem = (i: number, k: keyof InvoiceItem, v: string | number) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [k]: v };
      if (k === 'quantity' || k === 'unitPrice') {
        next[i].total = Number(next[i].quantity) * Number(next[i].unitPrice);
      }
      return next;
    });
  };

  const subtotalHT = items.reduce((s, it) => s + (it.total || 0), 0);
  const taxAmount  = subtotalHT * (form.taxRate / 100);
  const totalTTC   = subtotalHT + taxAmount;

  const handleSave = async () => {
    if (!form.clientName.trim()) { toast.error('Le nom du client est requis'); return; }
    if (items.every(it => !it.description.trim())) { toast.error('Ajoutez au moins une ligne de prestation'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, items, subtotalHT, taxAmount, totalTTC });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-lg font-black tracking-tight">
            {initial ? 'Modifier la facture' : 'Nouvelle facture'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Renseignez les informations de la facture</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Client info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nom du client ou société"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="contact@client.fr"
                value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
              />
            </div>
          </div>

          {/* Dates & meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Numéro</Label>
              <Input
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="credit_note">Avoir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Émission</Label>
              <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Échéance</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyée</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="paid">Payée</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="cancelled">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lignes de facturation</Label>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground w-16 text-center">Qté</th>
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground w-28 text-right">Prix unit. HT</th>
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground w-24 text-right">Total HT</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1.5">
                        <Input
                          placeholder="Prestation ou produit..."
                          value={item.description}
                          onChange={e => updateItem(i, 'description', e.target.value)}
                          className="border-0 shadow-none h-8 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number" min="0"
                          value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                          className="border-0 shadow-none h-8 text-sm text-center"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number" min="0" step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                          className="border-0 shadow-none h-8 text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right font-bold text-xs tabular-nums">{fmtEur(item.total)}</td>
                      <td className="px-1 py-1.5">
                        {items.length > 1 && (
                          <button
                            onClick={() => setItems(prev => prev.filter((_, j) => j !== i))}
                            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 border-t border-border bg-muted/30">
                <button
                  onClick={() => setItems(prev => [...prev, { ...EMPTY_ITEM }])}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
                </button>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-bold tabular-nums">{fmtEur(subtotalHT)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">TVA</span>
                <div className="flex items-center gap-2">
                  <Select value={String(form.taxRate)} onValueChange={v => setForm(f => ({ ...f, taxRate: Number(v) }))}>
                    <SelectTrigger className="h-7 w-[72px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 %</SelectItem>
                      <SelectItem value="5.5">5,5 %</SelectItem>
                      <SelectItem value="10">10 %</SelectItem>
                      <SelectItem value="20">20 %</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-bold tabular-nums">{fmtEur(taxAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-black">Total TTC</span>
                <span className="font-black text-primary tabular-nums">{fmtEur(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes / Conditions de paiement</Label>
            <Textarea
              placeholder="IBAN, RIB, conditions de règlement..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="resize-none text-sm"
              rows={3}
            />
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-background">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? 'Enregistrer les modifications' : 'Créer la facture'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const InvoicesPage = () => {
  const location = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();
  const isCreditsView = location.pathname.includes('/credits');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalBilled  = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalPending = invoices.filter(i => ['pending', 'sent'].includes(i.status)).reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);

  // ─── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await blink.db.invoices.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 200,
      });
      setInvoices(data as Invoice[]);
    } catch {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ─── Next number ────────────────────────────────────────────────────────────
  const getNextNumber = (): string => {
    const prefix = isCreditsView ? 'AVO' : 'FAC';
    const year = new Date().getFullYear();
    const relevant = invoices.filter(i =>
      isCreditsView ? i.type === 'credit_note' : i.type !== 'credit_note'
    );
    return `${prefix}-${year}-${String(relevant.length + 1).padStart(3, '0')}`;
  };

  // ─── Save (create / update) ─────────────────────────────────────────────────
  const handleSave = async (data: any) => {
    if (!user) return;
    try {
      if (editInvoice) {
        await blink.db.invoices.update(editInvoice.id, {
          clientName: data.clientName,
          clientEmail: data.clientEmail || null,
          number: data.number,
          status: data.status,
          type: data.type,
          amount: data.totalTTC,
          taxRate: data.taxRate,
          dueDate: data.dueDate || null,
          notes: data.notes || null,
          items: JSON.stringify(data.items),
        });
        toast.success('Facture mise à jour avec succès');
      } else {
        const id = `inv_${genId()}`;
        await blink.db.invoices.create({
          id,
          userId: user.id,
          companyId: company?.id || null,
          number: data.number,
          clientName: data.clientName,
          clientEmail: data.clientEmail || null,
          status: data.status,
          type: data.type,
          amount: data.totalTTC,
          taxRate: data.taxRate,
          dueDate: data.dueDate || null,
          notes: data.notes || null,
          items: JSON.stringify(data.items),
          createdAt: new Date().toISOString(),
        });
        toast.success(`Facture ${data.number} créée avec succès`);
      }
      setSheetOpen(false);
      setEditInvoice(null);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde de la facture');
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await blink.db.invoices.delete(deleteId);
      toast.success('Facture supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Status change helpers ──────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string, label?: string) => {
    try {
      await blink.db.invoices.update(id, { status });
      toast.success(label || 'Statut mis à jour');
      load();
    } catch {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // ─── Filter ─────────────────────────────────────────────────────────────────
  const viewInvoices = isCreditsView
    ? invoices.filter(i => i.type === 'credit_note')
    : invoices.filter(i => i.type !== 'credit_note');

  const filtered = viewInvoices.filter(inv => {
    const matchSearch = !search ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ─── Open create ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditInvoice(null);
    setSheetOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setEditInvoice(inv);
    setSheetOpen(true);
  };

  const pageTitle = isCreditsView ? 'Avoirs' : 'Factures';
  const pageSubtitle = isCreditsView ? 'Gérez vos avoirs et notes de crédit' : 'Gérez vos factures clients';
  const createLabel = isCreditsView ? 'Nouvel avoir' : 'Nouvelle facture';

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{pageTitle}</h1>
          <p className="page-subtitle">{pageSubtitle}</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          {createLabel}
        </Button>
      </div>

      {/* Tabs */}
      <InvoicingTabs active={location.pathname} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total facturé', value: fmtEur(totalBilled), icon: Receipt, color: 'text-foreground', loading },
          { label: 'Encaissé', value: fmtEur(totalPaid), icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', loading },
          { label: 'En attente', value: fmtEur(totalPending), icon: Clock, color: 'text-amber-600 dark:text-amber-400', loading },
          { label: 'En retard', value: fmtEur(totalOverdue), icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', loading },
        ].map((stat, i) => (
          <Card key={i} className="border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
              {loading ? (
                <Skeleton className="h-7 w-28 mt-1" />
              ) : (
                <p className={cn('text-xl font-black tabular-nums tracking-tight', stat.color)}>{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="sent">Envoyée</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="paid">Payée</SelectItem>
            <SelectItem value="overdue">En retard</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">
                {search || statusFilter !== 'all' ? 'Aucun résultat' : `Aucune ${isCreditsView ? 'avoir' : 'facture'} trouvée`}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'Aucun document ne correspond à ces critères'
                  : `Créez votre premier ${isCreditsView ? 'avoir' : 'facture'} pour commencer`}
              </p>
              {!search && statusFilter === 'all' && (
                <Button size="sm" className="gap-2" onClick={openCreate}>
                  <Plus className="w-4 h-4" /> {createLabel}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-black uppercase tracking-wider">Numéro</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Client</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider text-right">Montant TTC</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Échéance</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Type</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inv => (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => openEdit(inv)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{inv.number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{inv.clientName}</div>
                        {inv.clientEmail && (
                          <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {fmtEur(Number(inv.amount || 0))}
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(inv.dueDate)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          inv.type === 'credit_note'
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
                            : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        )}>
                          {inv.type === 'credit_note' ? 'Avoir' : 'Facture'}
                        </span>
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openEdit(inv)} className="gap-2 cursor-pointer">
                              <Edit className="w-4 h-4" /> Modifier
                            </DropdownMenuItem>
                            {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(inv.id, 'paid', `Facture ${inv.number} marquée comme payée`)}
                                className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Marquer comme payée
                              </DropdownMenuItem>
                            )}
                            {inv.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(inv.id, 'sent', 'Facture marquée comme envoyée')}
                                className="gap-2 cursor-pointer"
                              >
                                <Send className="w-4 h-4" /> Marquer envoyée
                              </DropdownMenuItem>
                            )}
                            {['sent', 'pending'].includes(inv.status) && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(inv.id, 'overdue', 'Facture marquée en retard')}
                                className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <AlertTriangle className="w-4 h-4" /> Marquer en retard
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(inv.id)}
                              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet */}
      <InvoiceSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditInvoice(null); }}
        onSave={handleSave}
        initial={editInvoice}
        nextNumber={getNextNumber()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
