import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Store, Package, ShoppingCart, Users, Tag, Plus, Search,
  MoreHorizontal, Trash2, Edit2, Loader2, TrendingUp, AlertTriangle,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtEur = (n: number) =>
  (n || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

const genSku = () =>
  'SKU-' + Math.random().toString(36).toUpperCase().substr(2, 6);

const CATEGORIES = ['Services', 'Formation', 'Logiciels', 'Abonnements', 'Marketing', 'Matériel', 'Numérique', 'Autre'];

// ─── Stock badge ──────────────────────────────────────────────────────────────

const StockBadge = ({ stock }: { stock: number }) => {
  const s = Number(stock ?? 0);
  if (s < 5) return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">{s}</Badge>;
  if (s < 10) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">{s}</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">{s}</Badge>;
};

// ─── Summary card ─────────────────────────────────────────────────────────────

const SummaryCard = ({
  label, value, sub, icon: Icon, color,
}: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) => (
  <div className="metric-card flex items-start gap-4">
    <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">{label}</p>
      <p className="text-2xl font-black tracking-tight leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── Products Tab ─────────────────────────────────────────────────────────────

const ProductsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', description: '', price: '', stock: '', category: 'Services', sku: genSku(), status: 'active' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.products.list({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        limit: 200,
      });
      setProducts(data as any[]);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditTarget(null);
    setForm({ ...emptyForm, sku: genSku() });
    setSheetOpen(true);
  };

  const openEdit = (p: any) => {
    setEditTarget(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      price: String(p.price || ''),
      stock: String(p.stock ?? ''),
      category: p.category || 'Services',
      sku: p.sku || '',
      status: p.status || 'active',
    });
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    if (isNaN(price) || price < 0) { toast.error('Prix invalide'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await blink.db.products.update(editTarget.id, {
          name: form.name, description: form.description, price,
          stock: parseInt(form.stock) || 0, category: form.category,
          sku: form.sku, status: form.status,
        });
        toast.success('Produit mis à jour');
      } else {
        await blink.db.products.create({
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          userId, companyId, name: form.name, description: form.description,
          price, stock: parseInt(form.stock) || 0, category: form.category,
          sku: form.sku, status: form.status,
        });
        toast.success('Produit créé');
      }
      setSheetOpen(false);
      load();
    } catch { toast.error('Erreur lors de la sauvegarde'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.products.delete(deleteId);
      toast.success('Produit supprimé');
      setProducts(prev => prev.filter(p => p.id !== deleteId));
    } catch { toast.error('Erreur'); } finally { setDeleteId(null); }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalStock = products.reduce((a, p) => a + Number(p.stock ?? 0), 0);
  const totalValue = products.reduce((a, p) => a + Number(p.price || 0) * Number(p.stock ?? 0), 0);
  const activeCount = products.filter(p => p.status === 'active').length;
  const lowStockCount = products.filter(p => Number(p.stock ?? 0) < 10).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total produits" value={products.length} icon={Package} color="bg-primary/10 text-primary" />
        <SummaryCard label="Actifs" value={activeCount} icon={TrendingUp} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <SummaryCard label="Stock faible" value={lowStockCount} sub="< 10 unités" icon={AlertTriangle} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <SummaryCard label="Valeur stock" value={fmtEur(totalValue)} icon={Tag} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher par nom ou SKU..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
            <SelectItem value="archived">Archivé</SelectItem>
          </SelectContent>
        </Select>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={openNew} className="gap-2 ml-auto"><Plus className="w-4 h-4" />Nouveau produit</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{editTarget ? 'Modifier le produit' : 'Nouveau produit'}</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input placeholder="Nom du produit" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prix (€) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Stock</Label>
                  <Input type="number" min="0" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Catégorie</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>SKU</Label>
                  <Input placeholder="SKU-XXXX" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea rows={3} placeholder="Description du produit..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <Separator />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucun produit trouvé</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers produits ou services à votre catalogue</p>
            <Button onClick={openNew} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer un produit</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>SKU</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="font-semibold text-sm">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</div>}
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{p.sku || '—'}</td>
                  <td>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">
                      {p.category || '—'}
                    </span>
                  </td>
                  <td className="font-bold">{fmtEur(Number(p.price || 0))}</td>
                  <td><StockBadge stock={Number(p.stock ?? 0)} /></td>
                  <td>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold',
                      p.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : p.status === 'archived' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400')}>
                      {p.status === 'active' ? 'Actif' : p.status === 'archived' ? 'Archivé' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)} className="gap-2">
                          <Edit2 className="w-4 h-4" />Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setDeleteId(p.id)} className="gap-2 text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4" />Supprimer
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

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce produit ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. Le produit sera définitivement supprimé de votre catalogue.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'En attente',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  processing: { label: 'En cours',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped:    { label: 'Expédiée',    cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  delivered:  { label: 'Livrée',      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled:  { label: 'Annulée',     cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  refunded:   { label: 'Remboursée',  cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const OrdersTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.orders.list({
        where: { organizationId: companyId },
        orderBy: { createdAt: 'desc' },
        limit: 200,
      });
      setOrders(data as any[]);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await blink.db.orders.update(id, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success('Statut mis à jour');
    } catch { toast.error('Erreur'); }
  };

  const filtered = orders.filter(o => {
    const matchSearch = (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (o.number || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pending = orders.filter(o => o.status === 'pending').length;
  const shipped = orders.filter(o => o.status === 'shipped').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Toutes" value={orders.length} icon={ShoppingCart} color="bg-primary/10 text-primary" />
        <SummaryCard label="En attente" value={pending} icon={AlertTriangle} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <SummaryCard label="Expédiées" value={shipped} icon={Store} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" />
        <SummaryCard label="Livrées" value={delivered} icon={TrendingUp} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un client ou numéro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(ORDER_STATUS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingCart className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucune commande</p>
            <p className="text-sm text-muted-foreground mt-1">Les commandes de votre boutique apparaîtront ici</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut paiement</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const cfg = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
                return (
                  <tr key={o.id}>
                    <td className="font-mono text-sm font-semibold text-primary">#{o.number || o.id.slice(-6).toUpperCase()}</td>
                    <td>
                      <div className="font-semibold text-sm">{o.customerName || '—'}</div>
                      {o.customerEmail && <div className="text-xs text-muted-foreground">{o.customerEmail}</div>}
                    </td>
                    <td className="font-bold">{fmtEur(Number(o.total || 0))}</td>
                    <td>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold',
                        o.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : o.paymentStatus === 'refunded' ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
                        {o.paymentStatus === 'paid' ? 'Payée' : o.paymentStatus === 'refunded' ? 'Remboursée' : 'Non payée'}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <Select value={o.status} onValueChange={v => updateStatus(o.id, v)}>
                        <SelectTrigger className={cn('h-7 text-xs font-semibold px-2.5 rounded-full border-0 w-auto gap-1.5', cfg.cls)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ORDER_STATUS).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Customers Tab ────────────────────────────────────────────────────────────

const CustomersTab = ({ companyId }: { companyId: string }) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.storeCustomers.list({
        where: { organizationId: companyId },
        orderBy: { totalSpent: 'desc' },
        limit: 200,
      });
      setCustomers(data as any[]);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = customers.reduce((a, c) => a + Number(c.totalSpent || 0), 0);
  const activeCount = customers.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard label="Total clients" value={customers.length} icon={Users} color="bg-primary/10 text-primary" />
        <SummaryCard label="Actifs" value={activeCount} icon={TrendingUp} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" />
        <SummaryCard label="Revenu total" value={fmtEur(totalRevenue)} icon={Tag} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucun client boutique</p>
            <p className="text-sm text-muted-foreground mt-1">Les clients de votre boutique apparaîtront ici après leurs premières commandes</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Commandes</th>
                <th>Total dépensé</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td className="font-semibold text-sm">{c.firstName} {c.lastName}</td>
                  <td className="text-sm text-muted-foreground">{c.email || '—'}</td>
                  <td className="text-sm text-muted-foreground">{c.phone || '—'}</td>
                  <td className="text-sm font-semibold">{c.totalOrders || 0}</td>
                  <td className="font-bold">{fmtEur(Number(c.totalSpent || 0))}</td>
                  <td>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold',
                      c.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
                      {c.status === 'active' ? 'Actif' : 'Inactif'}
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

// ─── Discounts Tab ────────────────────────────────────────────────────────────

const DiscountsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: '', code: '', type: 'percentage', value: '', minOrderAmount: '', maxUses: '', expiresAt: '' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.discounts.list({
        where: { organizationId: companyId },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      setDiscounts(data as any[]);
    } catch { setDiscounts([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.value);
    if (!form.name.trim() || !form.code.trim()) { toast.error('Nom et code requis'); return; }
    if (isNaN(value) || value <= 0) { toast.error('Valeur invalide'); return; }
    setSaving(true);
    try {
      await blink.db.discounts.create({
        id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        organizationId: companyId,
        name: form.name,
        code: form.code.toUpperCase(),
        type: form.type,
        value,
        minOrderAmount: parseFloat(form.minOrderAmount) || null,
        maxUses: parseInt(form.maxUses) || null,
        usedCount: 0,
        status: 'active',
        expiresAt: form.expiresAt || null,
      });
      toast.success('Remise créée');
      setSheetOpen(false);
      setForm(emptyForm);
      load();
    } catch { toast.error('Erreur lors de la création'); } finally { setSaving(false); }
  };

  const toggleStatus = async (d: any) => {
    const next = d.status === 'active' ? 'inactive' : 'active';
    try {
      await blink.db.discounts.update(d.id, { status: next });
      setDiscounts(prev => prev.map(x => x.id === d.id ? { ...x, status: next } : x));
      toast.success(next === 'active' ? 'Remise activée' : 'Remise désactivée');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-end">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Créer une remise</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nouvelle remise</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input placeholder="Ex : Promotion printemps" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Code promo *</Label>
                  <Input placeholder="PROMO10" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Valeur *</Label>
                  <Input type="number" step="0.01" min="0" placeholder={form.type === 'percentage' ? '10' : '5.00'} value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Commande min. (€)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Utilisations max.</Label>
                  <Input type="number" min="1" placeholder="Illimité" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Expire le</Label>
                  <Input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} />
                </div>
              </div>
              <Separator />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : discounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Tag className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucune remise</p>
            <p className="text-sm text-muted-foreground mt-1">Créez des codes promo pour fidéliser vos clients</p>
            <Button onClick={() => setSheetOpen(true)} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer une remise</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Code</th>
                <th>Type</th>
                <th>Valeur</th>
                <th>Utilisations</th>
                <th>Expire le</th>
                <th>Actif</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id}>
                  <td className="font-semibold text-sm">{d.name}</td>
                  <td>
                    <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono tracking-wider">
                      {d.code || '—'}
                    </code>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {d.type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                  </td>
                  <td className="font-bold">
                    {d.type === 'percentage' ? `${d.value}%` : fmtEur(Number(d.value))}
                  </td>
                  <td className="text-sm">
                    <span className={cn(d.maxUses && d.usedCount >= d.maxUses ? 'text-red-600 font-semibold' : '')}>
                      {d.usedCount || 0}{d.maxUses ? `/${d.maxUses}` : ''}
                    </span>
                  </td>
                  <td className="text-sm text-muted-foreground">
                    {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td>
                    <Switch
                      checked={d.status === 'active'}
                      onCheckedChange={() => toggleStatus(d)}
                    />
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

// ─── Nav tabs definition ──────────────────────────────────────────────────────

const NAV_TABS = [
  { label: 'Produits',        href: '/dashboard/ecommerce/products',  segment: 'products',  icon: Package },
  { label: 'Commandes',       href: '/dashboard/ecommerce/orders',    segment: 'orders',    icon: ShoppingCart },
  { label: 'Clients boutique',href: '/dashboard/ecommerce/customers', segment: 'customers', icon: Users },
  { label: 'Remises & Coupons',href: '/dashboard/ecommerce/discounts', segment: 'discounts', icon: Tag },
];

// ─── Main EcommercePage ───────────────────────────────────────────────────────

export const EcommercePage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { company } = useCompany();

  if (!company || !user) return null;

  const activeSegment = NAV_TABS.find(t => location.pathname.includes(t.segment))?.segment ?? 'products';

  const renderTab = () => {
    switch (activeSegment) {
      case 'orders':    return <OrdersTab companyId={company.id} userId={user.id} />;
      case 'customers': return <CustomersTab companyId={company.id} />;
      case 'discounts': return <DiscountsTab companyId={company.id} userId={user.id} />;
      default:          return <ProductsTab companyId={company.id} userId={user.id} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">E-commerce</h1>
          <p className="page-subtitle">Gérez votre boutique, catalogue et promotions</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border">
        {NAV_TABS.map(tab => (
          <Link
            key={tab.href}
            to={tab.href}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeSegment === tab.segment
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Link>
        ))}
      </div>

      {renderTab()}
    </div>
  );
};
