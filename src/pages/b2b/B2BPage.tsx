import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, Users, Handshake, Search, Building2, 
  MapPin, Star, Share2, CheckCircle2, MessageSquare,
  Network, ArrowRight, Zap, Filter, Trash2
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-600 border-yellow-200',
  accepted: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-100 text-red-600 border-red-200',
};

export const B2BPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [listings, setListings] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [myListing, setMyListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isListingOpen, setIsListingOpen] = useState(false);
  const [listingForm, setListingForm] = useState({ businessType: 'restaurant', description: '', servicesOffered: '' });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [listRes, connRes, myL] = await Promise.all([
        blink.db.publicBusinessListing.list({ limit: 100 }),
        blink.db.companyConnections.list({ 
          where: { OR: [{ requesterId: company.id }, { receiverId: company.id }] } 
        }),
        blink.db.publicBusinessListing.get({ where: { companyId: company.id } })
      ]);
      setListings(listRes);
      setConnections(connRes);
      setMyListing(myL);
      if (myL) setListingForm({ businessType: myL.businessType, description: myL.description, servicesOffered: myL.servicesOffered });
    } catch { toast.error('Erreur chargement réseau B2B'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleUpdateListing = async () => {
    try {
      if (myListing) {
        await blink.db.publicBusinessListing.update(myListing.id, { ...listingForm });
      } else {
        await blink.db.publicBusinessListing.create({
          id: `list_${Date.now()}`,
          companyId: company!.id,
          ...listingForm,
          isPublic: "1"
        });
      }
      toast.success('Profil B2B mis à jour');
      setIsListingOpen(false);
      load();
    } catch { toast.error('Erreur'); }
  };

  const handleConnect = async (targetCompanyId: string) => {
    if (targetCompanyId === company?.id) return;
    try {
      await blink.db.companyConnections.create({
        id: `conn_${Date.now()}`,
        requesterId: company!.id,
        receiverId: targetCompanyId,
        status: 'pending',
        sharedModules: 'delivery'
      });
      toast.success('Demande de connexion envoyée');
      load();
    } catch { toast.error('Erreur lors de la demande'); }
  };

  const handleAccept = async (connId: string) => {
    try {
      await blink.db.companyConnections.update(connId, { status: 'accepted' });
      toast.success('Connexion acceptée ! Vos flux sont désormais synchronisés.');
      load();
    } catch { toast.error('Erreur lors de l\'acceptation'); }
  };

  const handleReject = async (connId: string) => {
    try {
      await blink.db.companyConnections.delete(connId);
      toast.success('Demande refusée');
      load();
    } catch { toast.error('Erreur lors du refus'); }
  };

  const filteredListings = listings.filter(l => 
    l.companyId !== company?.id &&
    (l.businessType?.toLowerCase().includes(search.toLowerCase()) || 
     l.description?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Réseau B2B Fusion</h1>
          <p className="text-muted-foreground font-medium italic">Interconnectez votre entreprise avec l'écosystème local.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => setIsListingOpen(true)}><Share2 className="w-4 h-4 mr-2" /> {myListing ? 'Modifier mon profil' : 'Publier mon profil'}</Button>
          <Button className="rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"><Network className="w-4 h-4 mr-2" /> Gérer mes flux</Button>
        </div>
      </div>

      <Dialog open={isListingOpen} onOpenChange={setIsListingOpen}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="font-black uppercase tracking-tighter">Mon Profil Public B2B</DialogTitle>
            <DialogDescription>Rendez votre entreprise visible pour attirer des partenaires.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-bold">Type d'activité</Label>
              <Select value={listingForm.businessType} onValueChange={v => setListingForm({...listingForm, businessType: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant / Métiers de bouche</SelectItem>
                  <SelectItem value="delivery_agency">Agence de Livraison</SelectItem>
                  <SelectItem value="supplier">Fournisseur / Grossiste</SelectItem>
                  <SelectItem value="software">Logiciels / Services Numériques</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Description de l'entreprise</Label>
              <Input value={listingForm.description} onChange={e => setListingForm({...listingForm, description: e.target.value})} placeholder="Présentez votre métier..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="font-bold">Services proposés (séparés par virgules)</Label>
              <Input value={listingForm.servicesOffered} onChange={e => setListingForm({...listingForm, servicesOffered: e.target.value})} placeholder="Ex: Livraison express, Plats du jour..." className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateListing} className="w-full rounded-xl font-bold">Enregistrer le profil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-auto mb-8">
          <TabsTrigger value="explore" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Search className="w-4 h-4 mr-2" /> Explorer les partenaires
          </TabsTrigger>
          <TabsTrigger value="connections" className="rounded-xl font-bold py-3 px-6 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Handshake className="w-4 h-4 mr-2" /> Mes Connexions
            {connections.filter(c => c.status === 'pending' && c.receiverId === company?.id).length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white border-none h-5 w-5 flex items-center justify-center p-0 rounded-full">
                {connections.filter(c => c.status === 'pending' && c.receiverId === company?.id).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par secteur (Restaurant, Logistique, Freelance...)" 
                className="pl-10 rounded-xl h-12"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="h-12 rounded-xl px-6 border-2"><Filter className="w-4 h-4 mr-2" /> Filtres avancés</Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Real Data Listings */}
            {filteredListings.length > 0 ? (
              filteredListings.map(list => (
                <Card key={list.id} className="glass group hover:shadow-xl transition-all overflow-hidden border-border/50">
                  <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-500/20 relative">
                    <div className="absolute -bottom-6 left-6">
                      <div className="w-16 h-16 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-lg">
                        <Building2 className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                  </div>
                  <CardContent className="pt-10 p-6 space-y-4">
                    <div>
                      <h3 className="font-black text-lg tracking-tight truncate">Société ID: {list.companyId.slice(0, 8)}</h3>
                      <Badge variant="secondary" className="mt-1 text-[10px] font-bold uppercase tracking-wider">{list.businessType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {list.description || "Aucune description fournie par le partenaire."}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Paris, FR</div>
                      <div className="flex items-center gap-1 text-primary"><Star className="w-3 h-3 fill-primary" /> 4.9</div>
                    </div>
                    <Button 
                      onClick={() => handleConnect(list.companyId)}
                      className="w-full rounded-xl font-bold bg-muted text-foreground hover:bg-primary hover:text-white transition-all group"
                    >
                      Demander connexion <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              /* Fallback Mock for UX UI */
              <>
                <MockPartnerCard 
                  name="ViteLogistics" 
                  type="LOGISTIQUE" 
                  desc="Solution de livraison dernier kilomètre pour les restaurants et commerçants." 
                  onConnect={() => handleConnect('mock_1')}
                />
                <MockPartnerCard 
                  name="EcoPack Pro" 
                  type="FOURNISSEUR" 
                  desc="Emballages biodégradables et durables pour la restauration à emporter." 
                  onConnect={() => handleConnect('mock_2')}
                />
                <MockPartnerCard 
                  name="Fusion Marketing" 
                  type="AGENCE" 
                  desc="Expert en acquisition client via réseaux sociaux et campagnes automatisées." 
                  onConnect={() => handleConnect('mock_3')}
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="grid gap-4">
            {connections.length === 0 ? (
              <Card className="glass p-12 text-center">
                <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-black text-xl mb-2">Aucune connexion active</h3>
                <p className="text-muted-foreground text-sm">Explorez le réseau pour trouver des partenaires stratégiques.</p>
              </Card>
            ) : (
              connections.map(conn => (
                <Card key={conn.id} className="glass p-5 flex items-center justify-between border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Handshake className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-black text-sm">Partenaire #{conn.receiverId === company?.id ? conn.requesterId.slice(0, 8) : conn.receiverId.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px] font-bold border uppercase", statusColors[conn.status])}>
                          {conn.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">FLUX : DELIVERY, ERP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg font-bold"><MessageSquare className="w-4 h-4 mr-2" /> Chat</Button>
                    {conn.status === 'pending' && conn.receiverId === company?.id && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="rounded-lg font-bold bg-emerald-500 hover:bg-emerald-600"
                          onClick={() => handleAccept(conn.id)}
                        >
                          Accepter
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          className="rounded-lg font-bold text-red-500"
                          onClick={() => handleReject(conn.id)}
                        >
                          Refuser
                        </Button>
                      </div>
                    )}
                    {conn.status === 'accepted' && (
                       <Badge className="bg-emerald-100 text-emerald-600 border-emerald-200">Connecté</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="rounded-lg text-destructive" onClick={() => handleReject(conn.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const MockPartnerCard = ({ name, type, desc, onConnect }: any) => (
  <Card className="glass group hover:shadow-xl transition-all overflow-hidden border-border/50">
    <div className="h-24 bg-gradient-to-r from-primary/20 to-purple-500/20 relative" />
    <CardContent className="pt-10 p-6 space-y-4">
      <div className="absolute top-12 left-6">
        <div className="w-16 h-16 rounded-2xl bg-card border-4 border-background flex items-center justify-center shadow-lg">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
      </div>
      <div>
        <h3 className="font-black text-lg tracking-tight truncate">{name}</h3>
        <Badge variant="secondary" className="mt-1 text-[10px] font-bold uppercase tracking-wider">{type}</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{desc}</p>
      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
        <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Paris, FR</div>
        <div className="flex items-center gap-1 text-primary"><Star className="w-3 h-3 fill-primary" /> 4.9</div>
      </div>
      <Button 
        onClick={onConnect}
        className="w-full rounded-xl font-bold bg-muted text-foreground hover:bg-primary hover:text-white transition-all group"
      >
        Demander connexion <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </CardContent>
  </Card>
);
