import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Package, FileText, Plus, Search, MoreHorizontal,
  TrendingUp, ArrowUpRight, Edit, Trash2, Send, Eye
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  inactive: 'bg-muted text-muted-foreground border-border',
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  overdue: 'bg-red-500/10 text-red-600 border-red-500/20',
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
};

// ─── CLIENTS TAB ─────────────────────────────────────────────────────────────
const ClientsTab = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.clients.list({ where: { userId: user.id, companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setClients(res);
    } catch { toast.error('Erreur chargement clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      await blink.db.clients.create({
        id: `cli_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, email: form.email, phone: form.phone,
        address: form.address, notes: form.notes, status: 'active', totalSpent: '0'
      });
      toast.success('Client créé');
      setOpen(false);
      setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      load();
    } catch { toast.error('Erreur création'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return;
    await blink.db.clients.delete(id);
    toast.success('Client supprimé');
    load();
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un client..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouveau Client</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Nouveau Client</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom *</Label><Input placeholder="Nom ou société" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="font-bold">Email</Label><Input placeholder="email@exemple.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="font-bold">Téléphone</Label><Input placeholder="+33..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1"><Label className="font-bold">Adresse</Label><Input placeholder="Adresse complète" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Notes</Label><Input placeholder="Informations complémentaires" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl" /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">{saving ? 'Création...' : 'Créer le client'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucun client</h3>
          <p className="text-muted-foreground text-sm">Ajoutez votre premier client pour commencer.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Card key={client.id} className="glass group hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                    {client.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(client.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h4 className="font-black text-base mb-1 truncate">{client.name}</h4>
                {client.email && <p className="text-xs text-muted-foreground truncate mb-1">{client.email}</p>}
                {client.phone && <p className="text-xs text-muted-foreground mb-3">{client.phone}</p>}
                <div className="flex items-center justify-between">
                  <Badge className={cn('text-xs font-bold border', statusColors[client.status] || statusColors.active)}>{client.status === 'active' ? 'Actif' : 'Inactif'}</Badge>
                  <span className="text-xs font-bold text-primary">{Number(client.totalSpent || 0).toLocaleString('fr-FR')} €</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PRODUITS TAB ─────────────────────────────────────────────────────────────
const ProductsTab = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', sku: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.products.list({ where: { userId: user.id, companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setProducts(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.price) { toast.error('Nom et prix requis'); return; }
    setSaving(true);
    try {
      await blink.db.products.create({
        id: `prod_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, description: form.description, price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0, category: form.category, sku: form.sku, status: 'active'
      });
      toast.success('Produit créé'); setOpen(false);
      setForm({ name: '', description: '', price: '', stock: '', category: '', sku: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await blink.db.products.delete(id);
    toast.success('Produit supprimé'); load();
  };

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouveau Produit</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Nouveau Produit/Service</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom *</Label><Input placeholder="Nom du produit ou service" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Description</Label><Input placeholder="Description courte" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="font-bold">Prix (€) *</Label><Input type="number" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="font-bold">Stock</Label><Input type="number" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="font-bold">Catégorie</Label><Input placeholder="Ex: Services" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="font-bold">SKU/Ref</Label><Input placeholder="Référence" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">{saving ? 'Création...' : 'Créer le produit'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucun produit</h3>
          <p className="text-muted-foreground text-sm">Ajoutez votre catalogue produits ou services.</p>
        </Card>
      ) : (
        <Card className="glass overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="text-left p-4">Produit</th>
                <th className="text-left p-4 hidden md:table-cell">Catégorie</th>
                <th className="text-right p-4">Prix</th>
                <th className="text-right p-4 hidden sm:table-cell">Stock</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.id} className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors", i % 2 === 0 && "bg-muted/10")}>
                  <td className="p-4">
                    <div>
                      <p className="font-bold text-sm">{product.name}</p>
                      {product.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{product.description}</p>}
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell"><Badge variant="secondary" className="text-xs">{product.category || 'Non catégorisé'}</Badge></td>
                  <td className="p-4 text-right font-black text-primary">{Number(product.price || 0).toFixed(2)} €</td>
                  <td className="p-4 text-right hidden sm:table-cell">
                    <span className={cn("font-bold text-sm", Number(product.stock) <= 5 && Number(product.stock) > 0 ? "text-yellow-500" : Number(product.stock) === 0 ? "text-red-500" : "")}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ─── FACTURES TAB ─────────────────────────────────────────────────────────────
const InvoicesTab = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ clientName: '', type: 'invoice', amount: '', taxRate: '20', dueDate: '', notes: '' });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.invoices.list({ where: { userId: user.id, companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 });
      setInvoices(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const invoiceCount = invoices.length + 1;
  const prefix = form.type === 'invoice' ? 'FAC' : 'DEV';

  const handleCreate = async () => {
    if (!form.clientName.trim() || !form.amount) { toast.error('Client et montant requis'); return; }
    setSaving(true);
    try {
      await blink.db.invoices.create({
        id: `inv_${Date.now()}`, userId: user!.id, companyId: company!.id,
        clientName: form.clientName, number: `${prefix}-${String(invoiceCount).padStart(4, '0')}`,
        type: form.type, amount: parseFloat(form.amount), taxRate: parseFloat(form.taxRate),
        status: 'draft', dueDate: form.dueDate, notes: form.notes
      });
      toast.success('Document créé'); setOpen(false);
      setForm({ clientName: '', type: 'invoice', amount: '', taxRate: '20', dueDate: '', notes: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const updateStatus = async (id: string, status: string) => {
    await blink.db.invoices.update(id, { status });
    toast.success('Statut mis à jour'); load();
  };

  const totalAmount = invoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);
  const paidAmount = invoices.filter(i => i.status === 'paid').reduce((s, inv) => s + Number(inv.amount || 0), 0);

  const statusLabel: Record<string, string> = { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard' };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Facturation', value: `${totalAmount.toLocaleString('fr-FR')} €`, color: 'text-foreground' },
          { label: 'Montant Encaissé', value: `${paidAmount.toLocaleString('fr-FR')} €`, color: 'text-emerald-500' },
          { label: 'En Attente', value: `${(totalAmount - paidAmount).toLocaleString('fr-FR')} €`, color: 'text-yellow-500' },
        ].map(stat => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouveau Document</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Nouvelle Facture / Devis</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label className="font-bold">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="invoice">Facture</SelectItem><SelectItem value="quote">Devis</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="font-bold">Client *</Label><Input placeholder="Nom du client" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="font-bold">Montant HT (€) *</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="font-bold">TVA (%)</Label><Input type="number" placeholder="20" value={form.taxRate} onChange={e => setForm({ ...form, taxRate: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1"><Label className="font-bold">Date d'échéance</Label><Input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Notes</Label><Input placeholder="Conditions de paiement..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl" /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">{saving ? 'Création...' : 'Créer le document'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-16" />)}</div>
      ) : invoices.length === 0 ? (
        <Card className="glass p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucun document</h3>
          <p className="text-muted-foreground text-sm">Créez votre première facture ou devis.</p>
        </Card>
      ) : (
        <Card className="glass overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="text-left p-4">Numéro</th>
                <th className="text-left p-4">Client</th>
                <th className="text-center p-4 hidden sm:table-cell">Statut</th>
                <th className="text-right p-4">Montant TTC</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const ttc = Number(inv.amount || 0) * (1 + Number(inv.taxRate || 20) / 100);
                return (
                  <tr key={inv.id} className={cn("border-b border-border/50 hover:bg-muted/30 transition-colors", i % 2 === 0 && "bg-muted/10")}>
                    <td className="p-4 font-mono text-sm font-bold">{inv.number}</td>
                    <td className="p-4">
                      <p className="font-bold text-sm">{inv.clientName}</p>
                      <p className="text-xs text-muted-foreground">{inv.type === 'invoice' ? 'Facture' : 'Devis'}</p>
                    </td>
                    <td className="p-4 text-center hidden sm:table-cell">
                      <Select value={inv.status} onValueChange={v => updateStatus(inv.id, v)}>
                        <SelectTrigger className={cn("h-7 text-xs font-bold border rounded-lg w-auto", statusColors[inv.status])}>
                          <SelectValue>{statusLabel[inv.status] || inv.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-right font-black">{ttc.toFixed(2)} €</td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateStatus(inv.id, 'sent')}>
                        <Send className="w-4 h-4 text-primary" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};

// ─── MAIN ERP PAGE ────────────────────────────────────────────────────────────
export const ERPPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">ERP Entreprise</h1>
        <p className="text-muted-foreground font-medium">Gérez vos clients, produits et documents comptables depuis un seul endroit.</p>
      </div>
      <Tabs defaultValue="clients">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto gap-1">
          <TabsTrigger value="clients" className="rounded-lg font-bold gap-2"><Users className="w-4 h-4" /> Clients</TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg font-bold gap-2"><Package className="w-4 h-4" /> Produits</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg font-bold gap-2"><FileText className="w-4 h-4" /> Factures</TabsTrigger>
        </TabsList>
        <TabsContent value="clients" className="mt-6"><ClientsTab /></TabsContent>
        <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
        <TabsContent value="invoices" className="mt-6"><InvoicesTab /></TabsContent>
      </Tabs>
    </div>
  );
};
