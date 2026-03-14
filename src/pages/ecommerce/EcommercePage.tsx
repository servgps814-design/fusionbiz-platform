import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Store, Package, ShoppingCart, Users, Tag, Plus, Search,
  MoreHorizontal, Trash2, Edit, Loader2, CheckCircle2, Clock
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs = [
  { label: 'Produits', href: '/dashboard/ecommerce/products', icon: Package },
  { label: 'Commandes', href: '/dashboard/ecommerce/orders', icon: ShoppingCart },
  { label: 'Clients', href: '/dashboard/ecommerce/customers', icon: Users },
  { label: 'Remises', href: '/dashboard/ecommerce/discounts', icon: Tag },
];

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';

const CATEGORIES = ['Services', 'Formation', 'Logiciels', 'Abonnements', 'Marketing', 'Matériel', 'Numérique', 'Autre'];

// ─── Products Tab ─────────────────────────────────────────────────────────────
const ProductsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: 'Services', sku: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.products.list({ where: { companyId }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setProducts(data as any[]);
    } catch { setProducts([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    if (isNaN(price) || price < 0) { toast.error('Prix invalide'); return; }
    setSaving(true);
    try {
      await blink.db.products.create({
        id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId, companyId,
        name: form.name, description: form.description,
        price, stock: parseInt(form.stock) || 0,
        category: form.category, sku: form.sku, status: 'active',
      });
      toast.success('Produit créé');
      setShowNew(false);
      setForm({ name: '', description: '', price: '', stock: '', category: 'Services', sku: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await blink.db.products.delete(id);
      toast.success('Produit supprimé');
      setProducts(p => p.filter(x => x.id !== id));
    } catch { toast.error('Erreur'); }
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="w-4 h-4" />Nouveau produit</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Package className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucun produit</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez vos premiers produits ou services</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer un produit</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Catégorie</th><th>SKU</th><th>Prix</th><th>Stock</th><th>Statut</th><th className="w-12"></th></tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="font-semibold text-sm">{p.name}</div>
                    {p.description && <div className="text-xs text-muted-foreground truncate max-w-xs">{p.description}</div>}
                  </td>
                  <td><span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground">{p.category || '—'}</span></td>
                  <td className="text-sm font-mono text-muted-foreground">{p.sku || '—'}</td>
                  <td className="font-bold">{fmt(Number(p.price || 0))}</td>
                  <td className="text-sm">{p.stock ?? '∞'}</td>
                  <td>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold',
                      p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                      {p.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="gap-2 text-destructive focus:text-destructive">
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
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau produit</DialogTitle>
            <DialogDescription>Ajoutez un produit ou service à votre catalogue</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5"><Label>Nom *</Label>
              <Input placeholder="Nom du produit" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Prix (€) *</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Stock</Label>
                <Input type="number" min="0" placeholder="999" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select></div>
              <div className="space-y-1.5"><Label>SKU</Label>
                <Input placeholder="PRD-001" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Description</Label>
              <Textarea rows={2} placeholder="Description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Orders Tab ───────────────────────────────────────────────────────────────
const OrdersTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.orders.list({ where: { organizationId: companyId }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setOrders(data as any[]);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const statusCfg: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'En attente',  cls: 'bg-amber-100 text-amber-700' },
    processing: { label: 'En cours',    cls: 'bg-blue-100 text-blue-700' },
    completed:  { label: 'Livré',       cls: 'bg-emerald-100 text-emerald-700' },
    cancelled:  { label: 'Annulé',      cls: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-semibold">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1">Les commandes de votre boutique apparaîtront ici</p>
        </div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Numéro</th><th>Client</th><th>Total</th><th>Date</th><th>Statut</th></tr></thead>
          <tbody>
            {orders.map(o => {
              const cfg = statusCfg[o.status] ?? statusCfg.pending;
              return (
                <tr key={o.id}>
                  <td className="font-mono text-sm font-semibold text-primary">{o.number}</td>
                  <td className="font-semibold text-sm">{o.customerName || '—'}</td>
                  <td className="font-bold">{fmt(Number(o.total || 0))}</td>
                  <td className="text-sm text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}</td>
                  <td><span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', cfg.cls)}>{cfg.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
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
      const data = await blink.db.storeCustomers.list({ where: { organizationId: companyId }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setCustomers(data as any[]);
    } catch { setCustomers([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {loading ? (
        <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users className="w-6 h-6 text-muted-foreground" /></div>
          <p className="font-semibold">Aucun client boutique</p>
          <p className="text-sm text-muted-foreground mt-1">Les clients de votre boutique apparaîtront ici</p>
        </div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Nom</th><th>Email</th><th>Commandes</th><th>Total dépensé</th></tr></thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id}>
                <td className="font-semibold text-sm">{c.firstName} {c.lastName}</td>
                <td className="text-sm text-muted-foreground">{c.email}</td>
                <td className="text-sm">{c.totalOrders || 0}</td>
                <td className="font-bold">{fmt(Number(c.totalSpent || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// ─── Discounts Tab ────────────────────────────────────────────────────────────
const DiscountsTab = ({ companyId, userId }: { companyId: string; userId: string }) => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: 'percentage', value: '', minOrderAmount: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blink.db.discounts.list({ where: { organizationId: companyId }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setDiscounts(data as any[]);
    } catch { setDiscounts([]); } finally { setLoading(false); }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.value);
    if (!form.name.trim() || isNaN(value) || value <= 0) { toast.error('Formulaire invalide'); return; }
    setSaving(true);
    try {
      await blink.db.discounts.create({
        id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizationId: companyId,
        name: form.name, code: form.code.toUpperCase(), type: form.type, value,
        minOrderAmount: parseFloat(form.minOrderAmount) || null, status: 'active',
      });
      toast.success('Remise créée');
      setShowNew(false);
      setForm({ name: '', code: '', type: 'percentage', value: '', minOrderAmount: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="w-4 h-4" />Nouvelle remise</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : discounts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Tag className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucune remise</p>
            <p className="text-sm text-muted-foreground mt-1">Créez des codes promo pour vos clients</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Créer une remise</Button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Nom</th><th>Code</th><th>Valeur</th><th>Utilisations</th><th>Statut</th></tr></thead>
            <tbody>
              {discounts.map(d => (
                <tr key={d.id}>
                  <td className="font-semibold text-sm">{d.name}</td>
                  <td><code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{d.code || '—'}</code></td>
                  <td className="font-bold">{d.type === 'percentage' ? `${d.value}%` : `${d.value} €`}</td>
                  <td className="text-sm text-muted-foreground">{d.usedCount || 0}/{d.maxUses || '∞'}</td>
                  <td>
                    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold',
                      d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {d.status === 'active' ? 'Actif' : 'Expiré'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Nouvelle remise</DialogTitle><DialogDescription>Créez un code promotionnel</DialogDescription></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5"><Label>Nom *</Label>
              <Input placeholder="Ex: Promotion printemps" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Code promo</Label>
                <Input placeholder="PROMO10" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                    <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valeur *</Label>
                <Input type="number" step="0.01" min="0" placeholder="10" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} required /></div>
              <div className="space-y-1.5"><Label>Commande min. (€)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Main EcommercePage ───────────────────────────────────────────────────────
export const EcommercePage = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { company } = useCompany();

  const activeTab = location.pathname;

  if (!company || !user) return null;

  const renderTab = () => {
    if (activeTab.includes('orders')) return <OrdersTab companyId={company.id} userId={user.id} />;
    if (activeTab.includes('customers')) return <CustomersTab companyId={company.id} />;
    if (activeTab.includes('discounts')) return <DiscountsTab companyId={company.id} userId={user.id} />;
    return <ProductsTab companyId={company.id} userId={user.id} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">E-commerce</h1>
          <p className="page-subtitle">Gérez votre boutique et votre catalogue</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <Link key={tab.href} to={tab.href}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === tab.href || (tab.href === '/dashboard/ecommerce/products' && activeTab === '/dashboard/ecommerce')
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
