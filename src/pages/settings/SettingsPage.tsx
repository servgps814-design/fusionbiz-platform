import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Building2, Bell, Shield, Palette, Save, User, Mail, Phone, Globe, CheckCircle2, Share2, Eye, Network } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { company, refreshCompany } = useCompany();
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<any>(null);

  const [profileForm, setProfileForm] = useState({ displayName: '', email: '', phone: '' });
  const [companyForm, setCompanyForm] = useState({ name: '', siret: '', address: '', legalStatus: '' });
  const [publicForm, setPublicForm] = useState({ businessType: 'software', description: '', servicesOffered: '', isPublic: true });
  const [notifPrefs, setNotifPrefs] = useState({
    newPayment: true, newOrder: true, weeklyReport: true, monthlyReport: false, smsAlerts: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({ displayName: (user as any).displayName || '', email: user.email || '', phone: (user as any).phone || '' });
    }
    if (company) {
      setCompanyForm({ name: company.name || '', siret: company.siret || '', address: company.address || '', legalStatus: company.legalStatus || 'SAS' });
      // Fetch public listing
      blink.db.publicBusinessListing.list({ where: { companyId: company.id }, limit: 1 })
        .then((rows: any[]) => {
          const res = rows[0];
          if (res) {
            setListing(res);
            setPublicForm({
              businessType: res.businessType || 'software',
              description: res.description || '',
              servicesOffered: res.servicesOffered || '',
              isPublic: Number(res.isPublic) === 1
            });
          }
        })
        .catch(() => {});
    }
  }, [user, company]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await blink.auth.updateMe({ displayName: profileForm.displayName });
      toast.success('Profil mis à jour');
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const saveCompany = async () => {
    if (!company) return;
    setSaving(true);
    try {
      await blink.db.companies.update(company.id, {
        name: companyForm.name, address: companyForm.address, legalStatus: companyForm.legalStatus
      });
      await refreshCompany();
      toast.success('Informations société mises à jour');
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const savePublicProfile = async () => {
    if (!company) return;
    setSaving(true);
    try {
      await blink.db.publicBusinessListing.upsert({
        id: listing?.id || `pub_${Date.now()}`,
        companyId: company.id,
        businessType: publicForm.businessType,
        description: publicForm.description,
        servicesOffered: publicForm.servicesOffered,
        isPublic: publicForm.isPublic ? "1" : "0"
      });
      toast.success('Profil B2B mis à jour');
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const modules = [
    { id: 'erp', label: 'ERP Entreprise', description: 'Clients, produits, factures', enabled: true },
    { id: 'automation', label: 'Automatisations', description: 'Workflows automatisés', enabled: true },
    { id: 'marketing', label: 'Marketing IA', description: 'Campagnes multicanales', enabled: true },
    { id: 'delivery', label: 'Logistique & Livraison', description: 'Gestion des livraisons', enabled: true },
    { id: 'analytics', label: 'Analytics Avancé', description: 'Rapports et tableaux de bord', enabled: false },
    { id: 'b2b', label: 'Interconnexion B2B', description: 'Collaboration partenaires', enabled: false },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Paramètres</h1>
        <p className="text-muted-foreground font-medium">Configurez votre compte, votre société et vos préférences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto gap-1 flex-wrap">
          <TabsTrigger value="profile" className="rounded-lg font-bold gap-2"><User className="w-4 h-4" /> Profil</TabsTrigger>
          <TabsTrigger value="company" className="rounded-lg font-bold gap-2"><Building2 className="w-4 h-4" /> Société</TabsTrigger>
          <TabsTrigger value="network" className="rounded-lg font-bold gap-2"><Share2 className="w-4 h-4" /> Réseau B2B</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg font-bold gap-2"><Bell className="w-4 h-4" /> Notifications</TabsTrigger>
          <TabsTrigger value="modules" className="rounded-lg font-bold gap-2"><Settings className="w-4 h-4" /> Modules</TabsTrigger>
        </TabsList>

        {/* PROFIL */}
        <TabsContent value="profile" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-black tracking-tighter uppercase">Mon Profil</CardTitle>
              <CardDescription>Modifiez vos informations personnelles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-3xl border-4 border-primary/20">
                  {((user as any)?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-black text-lg">{(user as any)?.displayName || 'Utilisateur'}</p>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                  {user?.email && <div className="flex items-center gap-1 mt-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /><span className="text-xs text-emerald-500 font-bold">Email vérifié</span></div>}
                </div>
              </div>
              <Separator />
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="font-bold">Nom d'affichage</Label><Input value={profileForm.displayName} onChange={e => setProfileForm({ ...profileForm, displayName: e.target.value })} className="rounded-xl" placeholder="Votre nom" /></div>
                <div className="space-y-1"><Label className="font-bold">Email</Label><Input value={profileForm.email} disabled className="rounded-xl bg-muted/50" /></div>
                <div className="space-y-1"><Label className="font-bold">Téléphone</Label><Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="rounded-xl" placeholder="+33 6 00 00 00 00" /></div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="rounded-xl font-bold">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SOCIÉTÉ */}
        <TabsContent value="company" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-black tracking-tighter uppercase">Ma Société</CardTitle>
              <CardDescription>Informations légales et administratives.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {company && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="font-bold text-sm text-emerald-600">Dossier soumis</p>
                    <p className="text-xs text-muted-foreground">Votre dossier KYB est en cours de vérification.</p>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2"><Label className="font-bold">Raison sociale</Label><Input value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} className="rounded-xl" /></div>
                <div className="space-y-1"><Label className="font-bold">SIRET</Label><Input value={companyForm.siret} disabled className="rounded-xl bg-muted/50" /></div>
                <div className="space-y-1">
                  <Label className="font-bold">Forme juridique</Label>
                  <Select value={companyForm.legalStatus} onValueChange={v => setCompanyForm({ ...companyForm, legalStatus: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['SAS', 'SARL', 'SA', 'EI', 'EURL', 'SNC', 'Autre'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2"><Label className="font-bold">Adresse du siège</Label><Input value={companyForm.address} onChange={e => setCompanyForm({ ...companyForm, address: e.target.value })} className="rounded-xl" /></div>
              </div>
              <Button onClick={saveCompany} disabled={saving} className="rounded-xl font-bold">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RESEAU B2B */}
        <TabsContent value="network" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-black tracking-tighter uppercase flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-600" /> Profil Réseau B2B
              </CardTitle>
              <CardDescription>Rendez votre entreprise visible pour recevoir des demandes de partenariat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", publicForm.isPublic ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                  <div>
                    <p className="text-sm font-black uppercase text-blue-600 tracking-widest">Visibilité Publique</p>
                    <p className="text-xs text-slate-500 font-bold">Votre entreprise est {publicForm.isPublic ? "visible" : "masquée"} dans le catalogue B2B.</p>
                  </div>
                </div>
                <Switch
                  checked={publicForm.isPublic}
                  onCheckedChange={v => setPublicForm({...publicForm, isPublic: v})}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="font-bold">Type d'activité</Label>
                  <Select value={publicForm.businessType} onValueChange={v => setPublicForm({...publicForm, businessType: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant / Food</SelectItem>
                      <SelectItem value="delivery_agency">Agence de Livraison</SelectItem>
                      <SelectItem value="logistics">Logistique & Transport</SelectItem>
                      <SelectItem value="software">SaaS / Logiciels</SelectItem>
                      <SelectItem value="services">Services aux entreprises</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Services principaux</Label>
                  <Input
                    value={publicForm.servicesOffered}
                    onChange={e => setPublicForm({...publicForm, servicesOffered: e.target.value})}
                    className="rounded-xl"
                    placeholder="Ex: Livraison urbaine, Conseil marketing..."
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="font-bold">Description publique</Label>
                  <Textarea
                    value={publicForm.description}
                    onChange={e => setPublicForm({...publicForm, description: e.target.value})}
                    className="rounded-xl min-h-[100px] resize-none"
                    placeholder="Décrivez votre métier pour vos futurs partenaires..."
                  />
                </div>
              </div>
              <Button onClick={savePublicProfile} disabled={saving} className="rounded-xl font-bold bg-slate-900 hover:bg-black text-white px-8">
                {saving ? 'Publication...' : 'Publier mon profil'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-black tracking-tighter uppercase">Notifications</CardTitle>
              <CardDescription>Choisissez les alertes que vous souhaitez recevoir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Email</h3>
                {[
                  { key: 'emailNewClient', label: 'Nouveau client ajouté', desc: 'Recevez une notification à chaque nouveau client' },
                  { key: 'emailNewInvoice', label: 'Nouvelle facture', desc: 'À la création de chaque document' },
                  { key: 'emailPayment', label: 'Paiement reçu', desc: 'Notification lors de chaque encaissement' },
                  { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Synthèse de la semaine chaque lundi' },
                  { key: 'monthlyReport', label: 'Rapport mensuel', desc: 'Bilan mensuel complet de votre activité' },
                ].map(notif => (
                  <div key={notif.key} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="font-bold text-sm">{notif.label}</p>
                      <p className="text-xs text-muted-foreground">{notif.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[notif.key as keyof typeof notifPrefs]}
                      onCheckedChange={v => setNotifPrefs({ ...notifPrefs, [notif.key]: v })}
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">SMS</h3>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-sm">Alertes SMS critiques</p>
                    <p className="text-xs text-muted-foreground">Uniquement pour les événements importants</p>
                  </div>
                  <Switch checked={notifications.smsAlerts} onCheckedChange={v => setNotifications({ ...notifications, smsAlerts: v })} />
                </div>
              </div>
              <Button className="rounded-xl font-bold" onClick={() => toast.success('Préférences sauvegardées')}>
                <Save className="w-4 h-4 mr-2" /> Sauvegarder les préférences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODULES */}
        <TabsContent value="modules" className="mt-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="font-black tracking-tighter uppercase">Gestion des Modules</CardTitle>
              <CardDescription>Activez ou désactivez les fonctionnalités de votre plateforme.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {modules.map(module => (
                <div key={module.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${module.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    <div>
                      <p className="font-bold text-sm">{module.label}</p>
                      <p className="text-xs text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={module.enabled}
                    onCheckedChange={() => toast.info(`Module ${module.enabled ? 'désactivé' : 'activé'} — fonctionnalité en déploiement`)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
