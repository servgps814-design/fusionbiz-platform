import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Download, MoreHorizontal, Trash2, Edit,
  FileText, ArrowRight, CheckCircle2, Clock, XCircle, Loader2
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
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

interface Quote {
  id: string;
  number: string;
  clientName: string;
  clientId: string;
  status: string;
  issueDate: string;
  validUntil: string;
  total: number;
  subtotal: number;
  tvaAmount: number;
  notes: string;
  items: string;
  convertedToInvoiceId: string;
  createdAt: string;
}

interface Client { id: string; name: string; email: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const invoiceTabs = [
  { label: 'Factures', href: '/dashboard/invoicing/invoices' },
  { label: 'Devis', href: '/dashboard/invoicing/quotes' },
  { label: 'Avoirs', href: '/dashboard/invoicing/credits' },
];

function InvoicingTabs({ active }: { active: string }) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
      {invoiceTabs.map((t) => (
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
  const cfg: Record<string, { label: string; className: string }> = {
    draft:    { label: 'Brouillon',   className: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' },
    sent:     { label: 'Envoyé',      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800' },
    accepted: { label: 'Accepté',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' },
    rejected: { label: 'Refusé',      className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' },
    expired:  { label: 'Expiré',      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' },
    converted:{ label: 'Converti',    className: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-800' },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', c.className)}>
      {c.label}
    </span>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface QuoteFormData {
  number: string; clientName: string; clientId: string; status: string;
  issueDate: string; validUntil: string; notes: string;
}

const defaultForm = (nextNum: number): QuoteFormData => ({
  number: `DEV-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`,
  clientName: '', clientId: '', status: 'draft',
  issueDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  notes: '',
});

// ─── Main Page ────────────────────────────────────────────────────────────────

export const QuotesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editQuote, setEditQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<QuoteFormData>(defaultForm(1));
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [quotesData, clientData] = await Promise.all([
        blink.db.quotes.list({
          where: { organizationId: company.id },
          orderBy: { createdAt: 'desc' },
          limit: 200
        }),
        blink.db.clients.list({ where: { companyId: company.id }, limit: 200 }),
      ]);
      setQuotes(quotesData as any[]);
      setClients(clientData as any[]);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditQuote(null);
    setForm(defaultForm(quotes.length + 1));
    setShowForm(true);
  };

  const openEdit = (q: Quote) => {
    setEditQuote(q);
    setForm({
      number: q.number, clientName: q.clientName || '', clientId: q.clientId || '',
      status: q.status, issueDate: q.issueDate || '', validUntil: q.validUntil || '',
      notes: q.notes || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.clientName.trim() || !form.number.trim()) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        number: form.number.trim(),
        clientName: form.clientName.trim(),
        clientId: form.clientId || '',
        status: form.status,
        issueDate: form.issueDate,
        validUntil: form.validUntil,
        notes: form.notes,
        total: 0,
        subtotal: 0,
        tvaAmount: 0,
        items: '[]',
      };
      if (editQuote) {
        await blink.db.quotes.update(editQuote.id, payload);
        toast.success('Devis modifié');
      } else {
        await blink.db.quotes.create({
          id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user!.id,
          organizationId: company!.id,
          ...payload,
        });
        toast.success('Devis créé');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devis ?')) return;
    try {
      await blink.db.quotes.delete(id);
      toast.success('Devis supprimé');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const convertToInvoice = async (q: Quote) => {
    try {
      const invId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await blink.db.invoices.create({
        id: invId,
        userId: user!.id,
        companyId: company!.id,
        clientName: q.clientName,
        clientId: q.clientId || '',
        number: q.number.replace('DEV', 'FAC'),
        status: 'draft',
        type: 'invoice',
        amount: q.total || 0,
        taxRate: 20,
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        notes: q.notes || '',
        items: q.items || '[]',
      });
      await blink.db.quotes.update(q.id, {
        status: 'converted',
        convertedToInvoiceId: invId,
        convertedAt: new Date().toISOString(),
      });
      toast.success('Devis converti en facture');
      load();
    } catch {
      toast.error('Erreur lors de la conversion');
    }
  };

  const filtered = quotes.filter((q) => {
    const matchSearch = !search ||
      (q.number || '').toLowerCase().includes(search.toLowerCase()) ||
      (q.clientName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Devis</h1>
          <p className="page-subtitle">Créez et gérez vos devis commerciaux</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />Exporter
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" />Nouveau devis
          </Button>
        </div>
      </div>

      <InvoicingTabs active="/dashboard/invoicing/quotes" />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total devis</p>
          {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-black tracking-tight">{quotes.length}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">Tous statuts</p>
        </div>
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Acceptés</p>
          {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-black tracking-tight text-emerald-600">{quotes.filter(q => q.status === 'accepted').length}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">À convertir</p>
        </div>
        <div className="metric-card">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">En attente</p>
          {loading ? <Skeleton className="h-7 w-20" /> : <p className="text-2xl font-black tracking-tight text-amber-600">{quotes.filter(q => q.status === 'sent').length}</p>}
          <p className="text-xs text-muted-foreground mt-0.5">Envoyés</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par numéro ou client..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
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
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText className="w-6 h-6 text-muted-foreground" /></div>
              <p className="font-semibold mb-1">Aucun devis trouvé</p>
              <p className="text-sm text-muted-foreground mb-4">Créez votre premier devis commercial.</p>
              <Button size="sm" onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />Créer un devis</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Validité</th>
                    <th>Montant</th>
                    <th>Statut</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => (
                    <tr key={q.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => openEdit(q)}>
                      <td><span className="font-mono text-xs font-bold text-primary">{q.number}</span></td>
                      <td><p className="text-sm font-medium">{q.clientName || '—'}</p></td>
                      <td className="text-sm text-muted-foreground">
                        {q.issueDate ? new Date(q.issueDate).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {q.validUntil ? new Date(q.validUntil).toLocaleDateString('fr-FR') : '—'}
                      </td>
                      <td className="text-sm font-bold">{fmt(Number(q.total || 0))}</td>
                      <td><StatusBadge status={q.status} /></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openEdit(q)} className="cursor-pointer">
                              <Edit className="w-4 h-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            {q.status === 'accepted' && !q.convertedToInvoiceId && (
                              <DropdownMenuItem onClick={() => convertToInvoice(q)} className="cursor-pointer text-primary">
                                <ArrowRight className="w-4 h-4 mr-2" />Convertir en facture
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(q.id)} className="cursor-pointer text-destructive focus:text-destructive">
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
            <DialogTitle>{editQuote ? 'Modifier le devis' : 'Nouveau devis'}</DialogTitle>
            <DialogDescription>Renseignez les informations du devis commercial.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Numéro <span className="text-destructive">*</span></Label>
                <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
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
            <div className="space-y-1.5">
              <Label>Client <span className="text-destructive">*</span></Label>
              {clients.length > 0 ? (
                <Select value={form.clientId} onValueChange={(v) => {
                  const c = clients.find(c => c.id === v);
                  setForm({ ...form, clientId: v, clientName: c?.name || '' });
                }}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="Nom du client" value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date d'émission</Label>
                <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Valide jusqu'au</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Conditions, remarques..." rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editQuote ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
