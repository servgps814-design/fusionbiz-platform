import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Package, MapPin, Clock, CheckCircle2, XCircle, Search, User } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  preparing: { label: 'En préparation', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Package },
  out_for_delivery: { label: 'En livraison', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Truck },
  delivered: { label: 'Livré', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
};

const PIPELINE_STATUSES = ['pending', 'preparing', 'out_for_delivery', 'delivered'];

export const DeliveryPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    clientName: '', clientAddress: '', partnerId: '', amount: '', notes: '', items: ''
  });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [res, connRes] = await Promise.all([
        blink.db.deliveries.list({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' }, limit: 100
        }),
        blink.db.companyConnections.list({
          where: { AND: [{ requesterId: company.id }, { status: 'accepted' }] }
        })
      ]);
      setDeliveries(res);
      setPartners(connRes);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const orderNum = deliveries.length + 1;

  const handleCreate = async () => {
    if (!form.clientName.trim() || !form.clientAddress.trim()) {
      toast.error('Nom du client et adresse requis'); return;
    }
    setSaving(true);
    try {
      await blink.db.deliveries.create({
        id: `del_${Date.now()}`, userId: user!.id, companyId: company!.id,
        orderNumber: `CMD-${String(orderNum).padStart(4, '0')}`,
        clientName: form.clientName, clientAddress: form.clientAddress,
        driverName: form.partnerId || 'Interne', amount: parseFloat(form.amount) || 0,
        notes: form.notes, items: form.items, status: 'pending'
      });
      toast.success('Commande créée et assignée');
      setOpen(false);
      setForm({ clientName: '', clientAddress: '', partnerId: '', amount: '', notes: '', items: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const advanceStatus = async (delivery: any) => {
    const order = PIPELINE_STATUSES;
    const idx = order.indexOf(delivery.status);
    if (idx >= order.length - 1) return;
    const next = order[idx + 1];
    await blink.db.deliveries.update(delivery.id, { status: next, ...(next === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}) });
    toast.success(`Statut: ${statusConfig[next].label}`);
    load();
  };

  const filtered = deliveries.filter(d =>
    d.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    d.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    d.driverName?.toLowerCase().includes(search.toLowerCase())
  );

  const countByStatus = (s: string) => deliveries.filter(d => d.status === s).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Logistique & Livraison</h1>
          <p className="text-muted-foreground font-medium">Suivez vos commandes et vos livraisons en temps réel.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouvelle Commande</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Nouvelle Commande de Livraison</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom du client *</Label><Input placeholder="Prénom Nom" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Adresse de livraison *</Label><Input placeholder="Adresse complète" value={form.clientAddress} onChange={e => setForm({ ...form, clientAddress: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Assigner à un partenaire B2B</Label>
                  <Select value={form.partnerId} onValueChange={v => setForm({...form, partnerId: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Flotte Interne" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Flotte Interne</SelectItem>
                      {partners.map(p => (
                        <SelectItem key={p.id} value={p.receiverId}>Partenaire #{p.receiverId.slice(0, 8)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="font-bold">Montant (€)</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="space-y-1"><Label className="font-bold">Articles</Label><Input placeholder="Ex: 1x Pizza Margherita, 2x Coca" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Notes</Label><Input placeholder="Instructions de livraison..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl" /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">{saving ? 'Création...' : 'Créer la commande'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pipeline View */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {PIPELINE_STATUSES.map(s => {
          const cfg = statusConfig[s];
          const StatusIcon = cfg.icon;
          return (
            <Card key={s} className="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs", cfg.color)}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{cfg.label}</span>
                </div>
                <p className="text-3xl font-black tracking-tighter">{countByStatus(s)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher une commande..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-24" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucune commande</h3>
          <p className="text-muted-foreground text-sm">Créez votre première commande de livraison.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(delivery => {
            const cfg = statusConfig[delivery.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const canAdvance = PIPELINE_STATUSES.indexOf(delivery.status) < PIPELINE_STATUSES.length - 1;

            return (
              <Card key={delivery.id} className="glass group hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.color)}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-mono font-black text-sm">{delivery.orderNumber}</span>
                        <Badge className={cn('text-xs font-bold border', cfg.color)}>{cfg.label}</Badge>
                        {delivery.amount > 0 && <span className="text-sm font-black text-primary">{Number(delivery.amount).toFixed(2)} €</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold mb-0.5">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {delivery.clientName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{delivery.clientAddress}</span>
                      </div>
                      {delivery.driverName && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Truck className="w-3 h-3" />
                          <span>Livreur: {delivery.driverName}</span>
                        </div>
                      )}
                      {delivery.items && <p className="text-xs text-muted-foreground mt-1 truncate">{delivery.items}</p>}
                    </div>
                    {canAdvance && (
                      <Button size="sm" onClick={() => advanceStatus(delivery)} className="rounded-lg font-bold h-8 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Avancer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};