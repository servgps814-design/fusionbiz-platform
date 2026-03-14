import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, MoreHorizontal, FileText, Loader2,
  Trash2, Edit, Filter, CheckCircle2, Clock,
  AlertTriangle, Send, XCircle, Ban,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  taxRate: number;
  status: string;
  type?: string;
  dueDate?: string;
  notes?: string;
  items?: string;
  createdAt: string;
  companyId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Nav Tabs ─────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Devis',    href: '/dashboard/invoicing/quotes' },
  { label: 'Factures', href: '/dashboard/invoicing/invoices' },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: 'Brouillon',   className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: FileText },
  sent:      { label: 'Envoyée',    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900',       icon: Send },
  pending:   { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900',  icon: Clock },
  paid:      { label: 'Payée',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900', icon: CheckCircle2 },
  overdue:   { label: 'En retard',  className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900',             icon: AlertTriangle },
  cancelled: { label: 'Annulée',    className: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700', icon: Ban },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

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

// ─── Invoice Form Dialog ──────────────────────────────────────────────────────

const EMPTY_ITEM: InvoiceItem = { name: '', quantity: 1, unitPrice: 0, total: 0 };

function InvoiceDialog({
  open, onClose, onSave, initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: Partial<Invoice>;
}) {
  const today = new Date().toISOString().split('T')[0];
  const inThirty = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
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
        issueDate: today,
        dueDate: initial.dueDate || inThirty,
        status: initial.status || 'draft',
        type: initial.type || 'invoice',
        taxRate: Number(initial.taxRate || 20),
        notes: initial.notes || '',
      });
      try {
        const parsed = initial.items ? JSON.parse(initial.items) : [];
        setItems(parsed.length ? parsed : [{ ...EMPTY_ITEM }]);
      } catch {
        setItems([{ ...EMPTY_ITEM }]);
      }
    } else {
      setForm({ clientName: '', clientEmail: '', issueDate: today, dueDate: inThirty, status: 'draft', type: 'invoice', taxRate: 20, notes: '' });
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [open]);

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
    if (items.every(it => !it.name.trim())) { toast.error('Ajoutez au moins une ligne de prestation'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, items, subtotalHT, taxAmount, totalTTC });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {initial ? 'Modifier la facture' : 'Nouvelle facture'}
          </DialogTitle>
          <DialogDescription>Renseignez les informations de la facture</DialogDescription>
        </DialogHeader>

        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Client & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Client <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="Nom du client ou société"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                type="email"
                placeholder="contact@client.fr"
                value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Facture</SelectItem>
                  <SelectItem value="credit">Avoir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date d'émission</Label>
              <Input
                type="date"
                value={form.issueDate}
                onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Échéance</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lignes de facturation</Label>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground w-16 text-center">Qté</th>
                    <th className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground w-28 text-right">Prix unit.</th>
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
                          value={item.name}
                          onChange={e => updateItem(i, 'name', e.target.value)}
                          className="border-0 shadow-none rounded-lg h-8 text-sm"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                          className="border-0 shadow-none rounded-lg h-8 text-sm text-center"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))}
                          className="border-0 shadow-none rounded-lg h-8 text-sm text-right"
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
                  <Select
                    value={String(form.taxRate)}
                    onValueChange={v => setForm(f => ({ ...f, taxRate: Number(v) }))}
                  >
                    <SelectTrigger className="h-7 w-[72px] rounded-lg text-xs">
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
              className="rounded-xl resize-none text-sm"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[140px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? 'Enregistrer' : 'Créer la facture'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const InvoicesPage = () => {
  const { company } = useCompany();
  const { user } = useAuth();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalPaid    = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalPending = invoices.filter(i => ['pending', 'sent'].includes(i.status)).reduce((s, i) => s + Number(i.amount || 0), 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + Number(i.amount || 0), 0);

  // ─── Load ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.invoices.list({
        where: { companyId: company.id },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      setInvoices(data as Invoice[]);
    } catch {
      toast.error('Erreur lors du chargement des factures');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  // ─── Save (create / update) ───────────────────────────────────────────────
  const handleSave = async (data: any) => {
    if (!company || !user) return;
    try {
      if (editInvoice) {
        await blink.db.invoices.update(editInvoice.id, {
          clientName: data.clientName,
          status: data.status,
          type: data.type,
          amount: data.totalTTC,
          taxRate: data.taxRate,
          dueDate: data.dueDate,
          notes: data.notes || null,
          items: JSON.stringify(data.items),
        });
        toast.success('Facture mise à jour');
      } else {
        const count = await blink.db.invoices.count({ where: { companyId: company.id } });
        const prefix = data.type === 'credit' ? 'AVO' : 'FAC';
        const number = `${prefix}-${new Date().getFullYear()}-${String((count as number) + 1).padStart(3, '0')}`;
        await blink.db.invoices.create({
          id: `inv_${genId()}`,
          userId: user.id,
          companyId: company.id,
          number,
          clientName: data.clientName,
          status: data.status,
          type: data.type,
          amount: data.totalTTC,
          taxRate: data.taxRate,
          dueDate: data.dueDate,
          notes: data.notes || null,
          items: JSON.stringify(data.items),
        });
        toast.success(`Facture ${number} créée avec succès`);
      }
      setDialogOpen(false);
      setEditInvoice(null);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.invoices.delete(deleteId);
      toast.success('Facture supprimée');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ─── Mark paid ────────────────────────────────────────────────────────────
  const handleMarkPaid = async (inv: Invoice) => {
    try {
      await blink.db.invoices.update(inv.id, { status: 'paid' });
      toast.success(`Facture ${inv.number} marquée comme payée`);
      load();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ─── Status change ────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    try {
      await blink.db.invoices.update(id, { status });
      toast.success('Statut mis à jour');
      load();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────
  const filtered = invoices.filter(inv => {
    const matchSearch = !search ||
      inv.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      inv.number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Devis & Facturation</h1>
          <p className="page-subtitle">Gérez vos devis, factures et avoirs</p>
        </div>
        <Button
          onClick={() => { setEditInvoice(null); setDialogOpen(true); }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              tab.href.includes('invoices')
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Encaissé</p>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">{fmtEur(totalPaid)}</p>
        </div>
        <div className="metric-card">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">En attente</p>
          <p className="text-2xl font-black text-amber-600 tabular-nums">{fmtEur(totalPending)}</p>
        </div>
        <div className="metric-card">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">En retard</p>
          <p className="text-2xl font-black text-red-600 tabular-nums">{fmtEur(totalOverdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une facture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
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
      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">Aucune facture trouvée</p>
            <p className="text-sm text-muted-foreground mt-1">
              {search || statusFilter !== 'all'
                ? 'Aucun résultat pour ces critères'
                : 'Créez votre première facture pour commencer'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button
                size="sm"
                className="mt-4 gap-2"
                onClick={() => { setEditInvoice(null); setDialogOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Nouvelle facture
              </Button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Montant TTC</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Type</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td className="font-mono text-sm font-semibold text-primary">{inv.number}</td>
                  <td>
                    <div className="font-semibold text-sm">{inv.clientName}</div>
                    {inv.clientEmail && (
                      <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>
                    )}
                  </td>
                  <td className="font-bold tabular-nums">{fmtEur(Number(inv.amount || 0))}</td>
                  <td><StatusBadge status={inv.status} /></td>
                  <td className="text-sm text-muted-foreground">{fmtDate(inv.dueDate)}</td>
                  <td>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      inv.type === 'credit'
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                    )}>
                      {inv.type === 'credit' ? 'Avoir' : 'Facture'}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl">
                        <DropdownMenuItem
                          onClick={() => { setEditInvoice(inv); setDialogOpen(true); }}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" /> Modifier
                        </DropdownMenuItem>

                        {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                          <DropdownMenuItem
                            onClick={() => handleMarkPaid(inv)}
                            className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Marquer comme payée
                          </DropdownMenuItem>
                        )}

                        {inv.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(inv.id, 'sent')}
                            className="gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4" /> Marquer envoyée
                          </DropdownMenuItem>
                        )}

                        {['sent', 'pending'].includes(inv.status) && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(inv.id, 'overdue')}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice dialog */}
      <InvoiceDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditInvoice(null); }}
        onSave={handleSave}
        initial={editInvoice || undefined}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette facture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La facture sera définitivement supprimée.
            </AlertDialogDescription>
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
};
