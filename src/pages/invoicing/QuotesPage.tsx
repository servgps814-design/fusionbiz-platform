import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Plus, Search, Download, MoreHorizontal, Trash2, Edit,
  FileText, ArrowRight, CheckCircle2, Clock, XCircle,
  Loader2, AlertCircle, Filter, Send, Euro,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  userId?: string;
  organizationId?: string;
  number: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  clientSiret?: string;
  clientTva?: string;
  status: string;
  issueDate: string;
  validUntil: string;
  currency?: string;
  subtotal: number;
  tvaAmount: number;
  discountAmount?: number;
  total: number;
  notes?: string;
  terms?: string;
  items?: string;
  convertedToInvoiceId?: string;
  convertedAt?: string;
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Invoice Tabs ──────────────────────────────────────────────────────────────

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

// ─── Status Badge ──────────────────────────────────────────────────────────────

const QUOTE_STATUS_CFG: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon', className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
  sent:      { label: 'Envoyé',    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' },
  accepted:  { label: 'Accepté',  className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' },
  rejected:  { label: 'Refusé',   className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' },
  expired:   { label: 'Expiré',   className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' },
  converted: { label: 'Converti', className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800' },
};

function StatusBadge({ status }: { status: string }) {
  const c = QUOTE_STATUS_CFG[status] ?? QUOTE_STATUS_CFG.draft;
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border', c.className)}>
      {c.label}
    </span>
  );
}

// ─── Quote Form (Sheet) ────────────────────────────────────────────────────────

const EMPTY_ITEM: QuoteItem = { description: '', quantity: 1, unitPrice: 0, total: 0 };

const TVA_RATE = 20;

function QuoteSheet({
  open, onClose, onSave, initial, nextNumber,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: Quote | null;
  nextNumber: string;
}) {
  const today = new Date().toISOString().split('T')[0];
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const [form, setForm] = useState({
    number: nextNumber,
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    clientSiret: '',
    clientTva: '',
    status: 'draft',
    issueDate: today,
    validUntil: in30,
    notes: '',
    terms: 'Devis valable 30 jours à compter de sa date d\'émission.',
  });
  const [items, setItems] = useState<QuoteItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        number: initial.number || nextNumber,
        clientName: initial.clientName || '',
        clientEmail: initial.clientEmail || '',
        clientAddress: initial.clientAddress || '',
        clientSiret: initial.clientSiret || '',
        clientTva: initial.clientTva || '',
        status: initial.status || 'draft',
        issueDate: initial.issueDate || today,
        validUntil: initial.validUntil || in30,
        notes: initial.notes || '',
        terms: initial.terms || 'Devis valable 30 jours à compter de sa date d\'émission.',
      });
      try {
        const parsed = initial.items ? JSON.parse(initial.items) : [];
        setItems(parsed.length ? parsed : [{ ...EMPTY_ITEM }]);
      } catch {
        setItems([{ ...EMPTY_ITEM }]);
      }
    } else {
      setForm({
        number: nextNumber,
        clientName: '', clientEmail: '', clientAddress: '',
        clientSiret: '', clientTva: '',
        status: 'draft',
        issueDate: today,
        validUntil: in30,
        notes: '',
        terms: 'Devis valable 30 jours à compter de sa date d\'émission.',
      });
      setItems([{ ...EMPTY_ITEM }]);
    }
  }, [open, initial, nextNumber]);

  const updateItem = (i: number, k: keyof QuoteItem, v: string | number) => {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [k]: v };
      if (k === 'quantity' || k === 'unitPrice') {
        next[i].total = Number(next[i].quantity) * Number(next[i].unitPrice);
      }
      return next;
    });
  };

  const subtotal = items.reduce((s, it) => s + (it.total || 0), 0);
  const tvaAmount = subtotal * (TVA_RATE / 100);
  const total = subtotal + tvaAmount;

  const handleSave = async () => {
    if (!form.clientName.trim()) { toast.error('Le nom du client est requis'); return; }
    if (!form.number.trim()) { toast.error('Le numéro de devis est requis'); return; }
    if (items.every(it => !it.description.trim())) { toast.error('Ajoutez au moins une ligne de prestation'); return; }
    setSaving(true);
    try {
      await onSave({ ...form, items, subtotal, tvaAmount, total });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-lg font-black tracking-tight">
            {initial ? 'Modifier le devis' : 'Nouveau devis'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Renseignez les informations du devis commercial</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Number + status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Numéro <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Statut</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyé</SelectItem>
                  <SelectItem value="accepted">Accepté</SelectItem>
                  <SelectItem value="rejected">Refusé</SelectItem>
                  <SelectItem value="expired">Expiré</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date d'émission</Label>
              <Input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Valable jusqu'au</Label>
              <Input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
            </div>
          </div>

          <Separator />

          {/* Client info */}
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Informations client</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nom / Société <span className="text-destructive">*</span>
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
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse</Label>
                <Input
                  placeholder="12 rue de la Paix, 75001 Paris"
                  value={form.clientAddress}
                  onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SIRET</Label>
                <Input
                  placeholder="123 456 789 00012"
                  value={form.clientSiret}
                  onChange={e => setForm(f => ({ ...f, clientSiret: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">N° TVA intracommunautaire</Label>
                <Input
                  placeholder="FR12345678901"
                  value={form.clientTva}
                  onChange={e => setForm(f => ({ ...f, clientTva: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lignes de devis</Label>
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
                <span className="font-bold tabular-nums">{fmtEur(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA (20 %)</span>
                <span className="font-bold tabular-nums">{fmtEur(tvaAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-black">Total TTC</span>
                <span className="font-black text-primary tabular-nums">{fmtEur(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</Label>
              <Textarea
                placeholder="Remarques, informations complémentaires..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="resize-none text-sm"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Conditions générales</Label>
              <Textarea
                placeholder="Conditions de vente, délais, modalités..."
                value={form.terms}
                onChange={e => setForm(f => ({ ...f, terms: e.target.value }))}
                className="resize-none text-sm"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-background">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? 'Enregistrer les modifications' : 'Créer le devis'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export const QuotesPage = () => {
  const location = useLocation();
  const { company } = useCompany();
  const { user } = useAuth();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const totalAmount   = quotes.reduce((s, q) => s + Number(q.total || 0), 0);
  const acceptedCount = quotes.filter(q => q.status === 'accepted').length;
  const pendingCount  = quotes.filter(q => q.status === 'sent').length;
  const rejectedCount = quotes.filter(q => q.status === 'rejected').length;
  const conversionRate = quotes.length > 0
    ? Math.round((quotes.filter(q => ['accepted', 'converted'].includes(q.status)).length / quotes.length) * 100)
    : 0;

  // ─── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await blink.db.quotes.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        limit: 200,
      });
      setQuotes(data as Quote[]);
    } catch {
      toast.error('Erreur lors du chargement des devis');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // ─── Next number ─────────────────────────────────────────────────────────────
  const getNextNumber = (): string => {
    const year = new Date().getFullYear();
    return `DEV-${year}-${String(quotes.length + 1).padStart(3, '0')}`;
  };

  // ─── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async (data: any) => {
    if (!user) return;
    try {
      const payload = {
        number: data.number,
        clientName: data.clientName,
        clientEmail: data.clientEmail || null,
        clientAddress: data.clientAddress || null,
        clientSiret: data.clientSiret || null,
        clientTva: data.clientTva || null,
        status: data.status,
        issueDate: data.issueDate,
        validUntil: data.validUntil,
        currency: 'EUR',
        subtotal: data.subtotal,
        tvaAmount: data.tvaAmount,
        total: data.total,
        notes: data.notes || null,
        terms: data.terms || null,
        items: JSON.stringify(data.items),
        updatedAt: new Date().toISOString(),
      };

      if (editQuote) {
        await blink.db.quotes.update(editQuote.id, payload);
        toast.success(`Devis ${data.number} mis à jour avec succès`);
      } else {
        await blink.db.quotes.create({
          id: `quote_${genId()}`,
          userId: user.id,
          organizationId: company?.id || null,
          ...payload,
          createdAt: new Date().toISOString(),
        });
        toast.success(`Devis ${data.number} créé avec succès`);
      }

      setSheetOpen(false);
      setEditQuote(null);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde du devis');
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await blink.db.quotes.delete(deleteId);
      toast.success('Devis supprimé');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Convert to invoice ───────────────────────────────────────────────────────
  const convertToInvoice = async (q: Quote) => {
    if (!user) return;
    setConverting(q.id);
    try {
      const invCount = await blink.db.invoices.count({ where: { userId: user.id } });
      const year = new Date().getFullYear();
      const invNumber = `FAC-${year}-${String((invCount as number) + 1).padStart(3, '0')}`;
      const invId = `inv_${genId()}`;

      await blink.db.invoices.create({
        id: invId,
        userId: user.id,
        companyId: company?.id || null,
        number: invNumber,
        clientName: q.clientName,
        clientId: q.clientId || null,
        status: 'draft',
        type: 'invoice',
        amount: q.total || 0,
        taxRate: 20,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: q.notes || null,
        items: q.items || '[]',
        createdAt: new Date().toISOString(),
      });

      await blink.db.quotes.update(q.id, {
        status: 'converted',
        convertedToInvoiceId: invId,
        convertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      toast.success(`Devis converti en facture ${invNumber} avec succès`);
      load();
    } catch {
      toast.error('Erreur lors de la conversion en facture');
    } finally {
      setConverting(null);
    }
  };

  // ─── Status change ────────────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: string) => {
    const extra: Record<string, string> = {};
    if (status === 'sent') extra.sentAt = new Date().toISOString();
    if (status === 'accepted') extra.acceptedAt = new Date().toISOString();
    if (status === 'rejected') extra.rejectedAt = new Date().toISOString();
    try {
      await blink.db.quotes.update(id, { status, ...extra, updatedAt: new Date().toISOString() });
      toast.success('Statut mis à jour');
      load();
    } catch {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  // ─── Filter ──────────────────────────────────────────────────────────────────
  const filtered = quotes.filter(q => {
    const matchSearch = !search ||
      (q.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.clientName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openCreate = () => { setEditQuote(null); setSheetOpen(true); };
  const openEdit = (q: Quote) => { setEditQuote(q); setSheetOpen(true); };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Devis</h1>
          <p className="page-subtitle">Créez et gérez vos devis commerciaux</p>
        </div>
        <Button onClick={openCreate} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nouveau devis
        </Button>
      </div>

      {/* Tabs */}
      <InvoicingTabs active={location.pathname} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total devisé', value: fmtEur(totalAmount), sub: 'Tous statuts', className: 'text-foreground' },
          { label: 'Acceptés', value: String(acceptedCount), sub: `Taux : ${conversionRate} %`, className: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'En attente', value: String(pendingCount), sub: 'Envoyés', className: 'text-blue-600 dark:text-blue-400' },
          { label: 'Refusés', value: String(rejectedCount), sub: 'À relancer', className: 'text-red-600 dark:text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border/60 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{s.label}</p>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <p className={cn('text-xl font-black tabular-nums tracking-tight', s.className)}>{s.value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
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
            <SelectItem value="sent">Envoyé</SelectItem>
            <SelectItem value="accepted">Accepté</SelectItem>
            <SelectItem value="rejected">Refusé</SelectItem>
            <SelectItem value="expired">Expiré</SelectItem>
            <SelectItem value="converted">Converti</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
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
                {search || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucun devis trouvé'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {search || statusFilter !== 'all'
                  ? 'Aucun devis ne correspond à ces critères'
                  : 'Créez votre premier devis commercial'}
              </p>
              {!search && statusFilter === 'all' && (
                <Button size="sm" className="gap-2" onClick={openCreate}>
                  <Plus className="w-4 h-4" /> Nouveau devis
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
                    <TableHead className="text-xs font-black uppercase tracking-wider text-right">Total TTC</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Statut</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Émission</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-wider">Valable jusqu'au</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(q => (
                    <TableRow
                      key={q.id}
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => openEdit(q)}
                    >
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{q.number}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{q.clientName || '—'}</div>
                        {q.clientEmail && (
                          <div className="text-xs text-muted-foreground">{q.clientEmail}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {fmtEur(Number(q.total || 0))}
                      </TableCell>
                      <TableCell><StatusBadge status={q.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(q.issueDate)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(q.validUntil)}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => openEdit(q)} className="cursor-pointer gap-2">
                              <Edit className="w-4 h-4" /> Modifier
                            </DropdownMenuItem>
                            {q.status === 'draft' && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(q.id, 'sent')}
                                className="cursor-pointer gap-2"
                              >
                                <Send className="w-4 h-4" /> Marquer comme envoyé
                              </DropdownMenuItem>
                            )}
                            {q.status === 'sent' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(q.id, 'accepted')}
                                  className="cursor-pointer gap-2 text-emerald-600 focus:text-emerald-600"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Marquer accepté
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusChange(q.id, 'rejected')}
                                  className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                                >
                                  <XCircle className="w-4 h-4" /> Marquer refusé
                                </DropdownMenuItem>
                              </>
                            )}
                            {q.status === 'accepted' && !q.convertedToInvoiceId && (
                              <DropdownMenuItem
                                onClick={() => convertToInvoice(q)}
                                disabled={converting === q.id}
                                className="cursor-pointer gap-2 text-primary focus:text-primary font-semibold"
                              >
                                {converting === q.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <ArrowRight className="w-4 h-4" />
                                }
                                Convertir en facture
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteId(q.id)}
                              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
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
      <QuoteSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditQuote(null); }}
        onSave={handleSave}
        initial={editQuote}
        nextNumber={getNextNumber()}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce devis ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le devis sera définitivement supprimé.
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
