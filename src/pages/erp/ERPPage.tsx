import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Package, FileText, Plus, Search, MoreHorizontal,
  TrendingUp, ArrowUpRight, Edit, Trash2, Send, Eye,
  Wallet, Receipt, Landmark, CheckCircle2, AlertCircle, Upload, Filter, Download
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
  reconciled: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

// ─── ACCOUNTING TAB (INDY STYLE) ───────────────────────────────────────────
const AccountingTab = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('expenses');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'office', date: new Date().toISOString().split('T')[0] });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [expRes, transRes] = await Promise.all([
        blink.db.expenses.list({ where: { companyId: company.id }, orderBy: { date: 'desc' } }),
        blink.db.transactions.list({ where: { companyId: company.id }, orderBy: { date: 'desc' } })
      ]);
      setExpenses(expRes);
      setTransactions(transRes);
    } catch { toast.error('Erreur chargement comptabilité'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleAddExpense = async () => {
    if (!form.title || !form.amount) return toast.error('Champs requis');
    try {
      await blink.db.expenses.create({
        id: `exp_${Date.now()}`,
        userId: user!.id,
        companyId: company!.id,
        title: form.title,
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        status: 'pending'
      });
      toast.success('Dépense ajoutée');
      setOpen(false);
      load();
    } catch { toast.error('Erreur creation'); }
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="glass border-l-4 border-l-primary">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Dépenses ce mois</p>
            <p className="text-2xl font-black tracking-tighter">{totalExpenses.toLocaleString('fr-FR')} €</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">TVA à décaisser</p>
            <p className="text-2xl font-black tracking-tighter">{(totalExpenses * 0.2).toLocaleString('fr-FR')} €</p>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="p-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Flux de trésorerie</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="text-2xl font-black tracking-tighter text-emerald-500">+12,450 €</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          <Button 
            variant={activeSubTab === 'expenses' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-lg font-bold"
            onClick={() => setActiveSubTab('expenses')}
          >
            <Receipt className="w-4 h-4 mr-2" /> Dépenses
          </Button>
          <Button 
            variant={activeSubTab === 'bank' ? 'secondary' : 'ghost'} 
            size="sm" 
            className="rounded-lg font-bold"
            onClick={() => setActiveSubTab('bank')}
          >
            <Landmark className="w-4 h-4 mr-2" /> Banque
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-2" /> Ajouter une dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tighter">Nouvelle Dépense</DialogTitle>
              <DialogDescription>Ajoutez un reçu ou saisissez manuellement.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-8 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors cursor-pointer group">
                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="text-sm font-bold">Déposer un reçu (PDF, JPG)</p>
                <p className="text-xs text-muted-foreground text-center">L'IA Fusion extraira automatiquement les données.</p>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Libellé</Label>
                <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ex: Abonnement SaaS" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold">Montant TTC (€)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Date</Label>
                  <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Fournitures bureau</SelectItem>
                    <SelectItem value="travel">Déplacements</SelectItem>
                    <SelectItem value="software">Logiciels / SaaS</SelectItem>
                    <SelectItem value="marketing">Publicité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense} className="w-full rounded-xl font-bold">Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {activeSubTab === 'expenses' ? (
        <Card className="glass overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b">
              <tr className="text-xs font-bold text-muted-foreground uppercase">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Libellé</th>
                <th className="p-4 text-left">Catégorie</th>
                <th className="p-4 text-right">Montant TTC</th>
                <th className="p-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Aucune dépense enregistrée</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-sm font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <p className="font-bold text-sm">{exp.title}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{exp.category}</Badge>
                    </td>
                    <td className="p-4 text-right font-black">-{Number(exp.amount).toFixed(2)} €</td>
                    <td className="p-4 text-right">
                      <Badge className={cn("text-[10px] font-bold border uppercase", statusColors[exp.status])}>{exp.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
            <Landmark className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-bold">Synchronisation Bancaire Active</p>
              <p className="text-xs text-muted-foreground">Dernière mise à jour : il y a 5 minutes (BNP Paribas)</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg text-xs font-bold">Forcer la synchro</Button>
          </div>
          
          <Card className="glass overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr className="text-xs font-bold text-muted-foreground uppercase">
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Opération</th>
                  <th className="p-4 text-right">Montant</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50 bg-yellow-500/5">
                  <td className="p-4 text-sm font-medium">12/03/2026</td>
                  <td className="p-4">
                    <p className="font-bold text-sm">VIREMENT CLIENT #1234</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Entrant</p>
                  </td>
                  <td className="p-4 text-right font-black text-emerald-500">+1,200.00 €</td>
                  <td className="p-4 text-right">
                    <Button size="sm" variant="outline" className="rounded-lg h-8 text-xs font-bold text-primary border-primary/20 hover:bg-primary/10">Rapprocher</Button>
                  </td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="p-4 text-sm font-medium">10/03/2026</td>
                  <td className="p-4">
                    <p className="font-bold text-sm">PRELEVEMENT AWS CLOUD</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Sortant</p>
                  </td>
                  <td className="p-4 text-right font-black">-45.20 €</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">Réconcilié</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
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
      const res = await blink.db.clients.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 });
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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(client => (
          <Card key={client.id} className="glass group hover:shadow-lg transition-all border border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {client.name?.charAt(0).toUpperCase()}
                </div>
                <Badge className={cn('text-[10px] font-bold border uppercase', statusColors[client.status])}>{client.status}</Badge>
              </div>
              <h4 className="font-black text-base mb-1 truncate">{client.name}</h4>
              <p className="text-xs text-muted-foreground truncate mb-3">{client.email || 'Pas d\'email'}</p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dépensé</span>
                <span className="text-sm font-black text-primary">{Number(client.totalSpent || 0).toLocaleString('fr-FR')} €</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: 'service' });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.products.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' } });
      setProducts(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleCreate = async () => {
    if (!form.name || !form.price) return toast.error('Champs requis');
    try {
      await blink.db.products.create({
        id: `prod_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, price: parseFloat(form.price), stock: parseInt(form.stock) || 0,
        category: form.category, status: 'active'
      });
      toast.success('Produit ajouté'); setOpen(false); load();
    } catch { }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase tracking-tighter text-lg">Catalogue Produits & Services</h3>
        <Button onClick={() => setOpen(true)} className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouveau Produit</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass">
          <DialogHeader><DialogTitle className="font-black uppercase">Nouveau Produit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label className="font-bold">Nom du produit</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="font-bold">Prix HT (€)</Label><Input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="rounded-xl" /></div>
              <div className="space-y-2"><Label className="font-bold">Stock initial</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="rounded-xl" /></div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Produit physique</SelectItem>
                  <SelectItem value="subscription">Abonnement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleCreate} className="w-full rounded-xl font-bold">Enregistrer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="glass overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr className="text-xs font-bold text-muted-foreground uppercase">
              <th className="p-4 text-left">Produit</th>
              <th className="p-4 text-left">Catégorie</th>
              <th className="p-4 text-right">Prix HT</th>
              <th className="p-4 text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="p-4 font-bold text-sm">{p.name}</td>
                <td className="p-4"><Badge variant="secondary" className="text-[10px] font-bold uppercase">{p.category}</Badge></td>
                <td className="p-4 text-right font-black">{Number(p.price).toFixed(2)} €</td>
                <td className="p-4 text-right font-bold">{p.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── FACTURES TAB ─────────────────────────────────────────────────────────────
const InvoicesTab = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.invoices.list({ where: { companyId: company.id }, orderBy: { createdAt: 'desc' } });
      setInvoices(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-black uppercase tracking-tighter text-lg">Facturation & Devis</h3>
        <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Créer une facture</Button>
      </div>
      <Card className="glass overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30 border-b">
            <tr className="text-xs font-bold text-muted-foreground uppercase">
              <th className="p-4 text-left">Numéro</th>
              <th className="p-4 text-left">Client</th>
              <th className="p-4 text-right">Montant TTC</th>
              <th className="p-4 text-right">Statut</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="p-4 font-mono text-xs font-bold">{inv.number}</td>
                <td className="p-4 font-bold text-sm">{inv.clientName}</td>
                <td className="p-4 text-right font-black">{Number(inv.amount || 0).toFixed(2)} €</td>
                <td className="p-4 text-right">
                  <Badge className={cn("text-[10px] font-bold border uppercase", statusColors[inv.status])}>{inv.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── MAIN ERP PAGE ────────────────────────────────────────────────────────────
export const ERPPage = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Gestion Entreprise</h1>
          <p className="text-muted-foreground font-medium italic">Plateforme FusionBiz — Intégration Odoo & Indy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-lg font-bold"><Download className="w-4 h-4 mr-2" /> Export FEC</Button>
          <Button variant="outline" size="sm" className="rounded-lg font-bold text-primary border-primary/20"><Landmark className="w-4 h-4 mr-2" /> Connexion Banque</Button>
        </div>
      </div>

      <Tabs defaultValue="accounting" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto flex-wrap mb-8">
          <TabsTrigger value="accounting" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Wallet className="w-4 h-4 mr-2" /> Comptabilité
          </TabsTrigger>
          <TabsTrigger value="clients" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Users className="w-4 h-4 mr-2" /> Clients
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <FileText className="w-4 h-4 mr-2" /> Facturation
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Package className="w-4 h-4 mr-2" /> Catalogue
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounting" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AccountingTab />
        </TabsContent>
        <TabsContent value="clients" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ClientsTab />
        </TabsContent>
        <TabsContent value="invoices" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <InvoicesTab />
        </TabsContent>
        <TabsContent value="products" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
