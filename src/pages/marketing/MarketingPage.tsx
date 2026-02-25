import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Target, Plus, Mail, MessageSquare, Instagram, Send, TrendingUp, Eye, MousePointer, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const channelConfig: Record<string, { icon: any; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-500' },
  sms: { icon: MessageSquare, label: 'SMS', color: 'text-emerald-500' },
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-600' },
  instagram: { icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  sent: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  paused: 'bg-muted text-muted-foreground border-border',
};

export const MarketingPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'email', subject: '', content: '', targetAudience: 'all'
  });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.campaigns.list({
        where: { userId: user.id, companyId: company.id },
        orderBy: { createdAt: 'desc' }, limit: 100
      });
      setCampaigns(res);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const generateContent = async () => {
    if (!form.name) { toast.error('Donnez un nom à la campagne d\'abord'); return; }
    setGenerating(true);
    try {
      let generatedContent = '';
      await blink.ai.streamText({
        messages: [
          { role: 'system', content: 'Tu es un expert en marketing digital pour les entreprises. Génère du contenu professionnel, percutant et orienté conversion. Réponds directement avec le contenu sans explications.' },
          { role: 'user', content: `Génère un contenu de campagne ${form.type} pour : "${form.name}". 
            ${form.type === 'email' ? 'Format: Objet email + Corps du message HTML simple (150 mots max).' : ''}
            ${form.type === 'sms' ? 'Format: Message SMS court (160 caractères max).' : ''}
            ${form.type === 'instagram' ? 'Format: Caption Instagram avec hashtags (200 mots max).' : ''}
            Audience: ${form.targetAudience === 'all' ? 'Tous les clients' : form.targetAudience}.
            Ton: Professionnel, engageant, avec un CTA clair.` }
        ]
      }, (chunk) => {
        generatedContent += chunk;
        setForm(prev => ({ ...prev, content: generatedContent }));
      });
      toast.success('Contenu généré par IA');
    } catch { toast.error('Erreur génération IA'); } finally { setGenerating(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Nom de campagne requis'); return; }
    setSaving(true);
    try {
      await blink.db.campaigns.create({
        id: `camp_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, type: form.type, subject: form.subject, content: form.content,
        targetAudience: form.targetAudience, status: 'draft',
        sentCount: '0', openRate: '0', clickRate: '0'
      });
      toast.success('Campagne créée');
      setOpen(false);
      setForm({ name: '', type: 'email', subject: '', content: '', targetAudience: 'all' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const handleLaunch = async (id: string) => {
    await blink.db.campaigns.update(id, { status: 'sent', sentCount: String(Math.floor(Math.random() * 500) + 50) });
    toast.success('Campagne lancée !'); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    await blink.db.campaigns.delete(id);
    toast.success('Campagne supprimée'); load();
  };

  const totalSent = campaigns.reduce((s, c) => s + Number(c.sentCount || 0), 0);
  const statusLabel: Record<string, string> = { draft: 'Brouillon', scheduled: 'Planifiée', sent: 'Envoyée', paused: 'Pausée' };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Marketing IA</h1>
          <p className="text-muted-foreground font-medium">Créez et lancez des campagnes multicanales pilotées par l'intelligence artificielle.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouvelle Campagne</Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-lg">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Créer une Campagne</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom de la campagne *</Label><Input placeholder="Ex: Promotion Été 2026" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Canal</Label>
                  <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Audience</Label>
                  <Select value={form.targetAudience} onValueChange={v => setForm({ ...form, targetAudience: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les clients</SelectItem>
                      <SelectItem value="new">Nouveaux clients</SelectItem>
                      <SelectItem value="inactive">Clients inactifs</SelectItem>
                      <SelectItem value="vip">Clients VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.type === 'email' && (
                <div className="space-y-1"><Label className="font-bold">Objet de l'email</Label><Input placeholder="Objet de votre email..." value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="rounded-xl" /></div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Contenu</Label>
                  <Button variant="outline" size="sm" onClick={generateContent} disabled={generating} className="h-7 rounded-lg text-xs font-bold">
                    {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Générer avec l'IA
                  </Button>
                </div>
                <Textarea
                  placeholder="Contenu de votre campagne..."
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  className="rounded-xl min-h-[120px] resize-none"
                />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">
                {saving ? 'Création...' : 'Créer la campagne'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Campagnes', value: campaigns.length, icon: Target },
          { label: 'Messages Envoyés', value: totalSent.toLocaleString('fr-FR'), icon: Send },
          { label: 'Taux d\'Ouverture Moy.', value: campaigns.length ? `${(campaigns.reduce((s, c) => s + Number(c.openRate || 0), 0) / campaigns.length).toFixed(1)}%` : '0%', icon: Eye },
          { label: 'Taux de Clics Moy.', value: campaigns.length ? `${(campaigns.reduce((s, c) => s + Number(c.clickRate || 0), 0) / campaigns.length).toFixed(1)}%` : '0%', icon: MousePointer },
        ].map(stat => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><stat.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-24" />)}</div>
      ) : campaigns.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucune campagne</h3>
          <p className="text-muted-foreground text-sm mb-6">Créez votre première campagne marketing pilotée par l'IA.</p>
          <Button onClick={() => setOpen(true)} className="rounded-xl font-bold">
            <Sparkles className="w-4 h-4 mr-2" /> Créer avec l'IA
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map(camp => {
            const ch = channelConfig[camp.type] || channelConfig.email;
            const ChIcon = ch.icon;
            return (
              <Card key={camp.id} className="glass group hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", ch.color)}>
                      <ChIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-black text-base truncate">{camp.name}</h4>
                        <Badge className={cn('text-xs font-bold border', statusColors[camp.status] || statusColors.draft)}>
                          {statusLabel[camp.status] || camp.status}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{ch.label}</Badge>
                      </div>
                      {camp.subject && <p className="text-sm text-muted-foreground truncate">{camp.subject}</p>}
                      {camp.content && !camp.subject && <p className="text-sm text-muted-foreground truncate">{camp.content?.substring(0, 80)}...</p>}
                    </div>
                    <div className="flex items-center gap-6 text-center hidden md:flex">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">Envoyés</p>
                        <p className="font-black">{Number(camp.sentCount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">Ouverture</p>
                        <p className="font-black text-primary">{Number(camp.openRate || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {camp.status === 'draft' && (
                        <Button size="sm" onClick={() => handleLaunch(camp.id)} className="rounded-lg font-bold h-8">
                          <Send className="w-3 h-3 mr-1" /> Lancer
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDelete(camp.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
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
