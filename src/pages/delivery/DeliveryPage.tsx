import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, Plus, Package, MapPin, Clock, CheckCircle2, XCircle, Search, User, Share2, Handshake, ChevronRight, Building2 } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [sharedIncoming, setSharedIncoming] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    clientName: '', clientAddress: '', driverName: '', amount: '', notes: '', items: '', partnerId: 'self'
  });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [delRes, sharedRes, connRes] = await Promise.all([
        blink.db.deliveries.list({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' }, limit: 100
        }),
        blink.db.sharedOrders.list({
          where: { partnerCompanyId: company.id },
          orderBy: { createdAt: 'desc' }, limit: 50
        }),
        blink.db.companyConnections.list({
          where: { AND: [
            { OR: [{ requesterId: company.id }, { receiverId: company.id }] },
            { status: 'accepted' }
          ]}
        })
      ]);
      setDeliveries(delRes);
      setSharedIncoming(sharedRes);
      setConnections(connRes);
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
      const isDelegated = form.partnerId !== 'self';
      
      await blink.db.deliveries.create({
        id: `del_${Date.now()}`, 
        userId: user!.id, 
        companyId: company!.id,
        orderNumber: `CMD-${String(orderNum).padStart(4, '0')}`,
        clientName: form.clientName, 
        clientAddress: form.clientAddress,
        driverName: form.driverName, 
        amount: parseFloat(form.amount) || 0,
        notes: form.notes, 
        items: form.items, 
        status: 'pending',
        providerCompanyId: isDelegated ? form.partnerId : company!.id,
        requesterCompanyId: company!.id
      });

      if (isDelegated) {
        toast.success(`Commande envoyée au partenaire B2B`);
      } else {
        toast.success('Commande créée');
      }
      
      setOpen(false);
      setForm({ clientName: '', clientAddress: '', driverName: '', amount: '', notes: '', items: '', partnerId: 'self' });
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

  const handleDispatch = async (delivery: any, partnerCompanyId: string) => {
    try {
      await blink.db.sharedOrders.create({
        id: `shared_${Date.now()}`,
        originCompanyId: company!.id,
        partnerCompanyId: partnerCompanyId,
        orderId: delivery.id,
        status: 'pending'
      });
      toast.success('Commande transférée au partenaire');
      load();
    } catch { toast.error('Erreur de transfert'); }
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
              <div className="space-y-1">
                <Label className="font-bold text-xs uppercase tracking-widest text-slate-400">Prestataire de livraison</Label>
                <Select value={form.partnerId} onValueChange={v => setForm({ ...form, partnerId: v })}>
                  <SelectTrigger className="rounded-xl h-12 border-blue-100 bg-blue-50/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">En interne (Ma flotte)</SelectItem>
                    {connections.map(conn => {
                      const partnerId = conn.requesterId === company?.id ? conn.receiverId : conn.requesterId;
                      const partner = conn.requesterId === company?.id ? conn.receiver : conn.requester;
                      return (
                        <SelectItem key={conn.id} value={partnerId}>Partenaire : {partner.name}</SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="font-bold">Nom du client *</Label><Input placeholder="Prénom Nom" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="rounded-xl h-12" /></div>
              <div className="space-y-1"><Label className="font-bold">Adresse de livraison *</Label><Input placeholder="Adresse complète" value={form.clientAddress} onChange={e => setForm({ ...form, clientAddress: e.target.value })} className="rounded-xl h-12" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label className="font-bold">Livreur (si interne)</Label><Input placeholder="Nom du livreur" value={form.driverName} onChange={e => setForm({ ...form, driverName: e.target.value })} className="rounded-xl h-12" /></div>
                <div className="space-y-1"><Label className="font-bold">Montant (€)</Label><Input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="rounded-xl h-12" /></div>
              </div>
              <div className="space-y-1"><Label className="font-bold">Articles</Label><Input placeholder="Ex: 1x Pizza Margherita, 2x Coca" value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} className="rounded-xl h-12" /></div>
              <div className="space-y-1"><Label className="font-bold">Notes</Label><Input placeholder="Instructions de livraison..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="rounded-xl h-12" /></div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold h-12">{saving ? 'Création...' : 'Créer la commande'}</Button>
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
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tighter uppercase">Mes Commandes Directes</h2>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-10 rounded-xl h-9 text-xs" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">{[1,2].map(i => <Card key={i} className="glass animate-pulse h-24" />)}</div>
          ) : filtered.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-black text-xl mb-2">Aucune commande</h3>
              <p className="text-muted-foreground text-sm">Prêt pour votre première livraison ?</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(delivery => {
                const cfg = statusConfig[delivery.status] || statusConfig.pending;
                const StatusIcon = cfg.icon;
                const canAdvance = PIPELINE_STATUSES.indexOf(delivery.status) < PIPELINE_STATUSES.length - 1;

                return (
                  <Card key={delivery.id} className="glass group hover:shadow-lg transition-all border-slate-100">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm", cfg.color)}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                            <span className="font-mono font-black text-xs text-blue-600">{delivery.orderNumber}</span>
                            <Badge className={cn('text-[9px] font-black border uppercase px-1.5 py-0.5', cfg.color)}>{cfg.label}</Badge>
                            {delivery.amount > 0 && <span className="text-xs font-black text-slate-900">{Number(delivery.amount).toFixed(2)} €</span>}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-1">
                            {delivery.clientName}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{delivery.clientAddress}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {connections.length > 0 && delivery.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="rounded-lg h-8 text-[10px] font-black uppercase border-slate-200">
                                  <Share2 className="w-3 h-3 mr-1.5" /> Dispatcher
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 glass">
                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Partenaires connectés</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {connections.map(conn => {
                                  const partnerId = conn.requesterId === company?.id ? conn.receiverId : conn.requesterId;
                                  return (
                                    <DropdownMenuItem key={conn.id} onClick={() => handleDispatch(delivery, partnerId)} className="py-2.5 cursor-pointer">
                                      <Building2 className="w-4 h-4 mr-2 text-blue-600" /> 
                                      <span className="text-xs font-bold truncate">Partenaire #{partnerId.slice(0, 8)}</span>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {canAdvance && (
                            <Button size="sm" onClick={() => advanceStatus(delivery)} className="rounded-lg font-black text-[10px] uppercase h-8 px-4 bg-slate-900 text-white hover:bg-black transition-all">
                              Avancer <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Incoming B2B Orders */}
        <div className="w-full lg:w-80 space-y-4">
          <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
            <Handshake className="w-5 h-5 text-blue-600" /> Flux B2B
          </h2>
          <Card className="glass border-slate-100 min-h-[200px]">
            <CardContent className="p-0">
              <div className="p-4 border-b border-slate-100 bg-blue-50/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Commandes Partenaires</p>
              </div>
              {sharedIncoming.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground italic font-medium">Aucun flux entrant. Connectez-vous à des restaurants pour recevoir des missions.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sharedIncoming.map(shared => (
                    <div key={shared.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Origine : #{shared.originCompanyId.slice(0, 6)}</span>
                        <Badge className="bg-yellow-50 text-yellow-600 border-none text-[9px] font-black uppercase">Incoming</Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-700 mb-1">Mission de livraison #{shared.orderId.slice(-4)}</p>
                      <Button variant="outline" size="sm" className="w-full h-7 rounded-lg text-[9px] font-black uppercase border-blue-100 text-blue-600 hover:bg-blue-50">Accepter Mission</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
