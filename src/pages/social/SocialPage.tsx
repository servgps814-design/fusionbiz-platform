import React, { useState, useEffect, useCallback } from 'react';
import {
  Share2, Plus, Instagram, Linkedin, Facebook, Twitter,
  Clock, CheckCircle2, XCircle, Loader2, Send, Calendar,
  MoreHorizontal, Trash2
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: 'text-pink-500 bg-pink-50' },
  { id: 'linkedin', label: 'LinkedIn',  color: 'text-blue-700 bg-blue-50' },
  { id: 'facebook', label: 'Facebook',  color: 'text-blue-600 bg-blue-50' },
  { id: 'twitter',  label: 'X / Twitter', color: 'text-slate-700 bg-slate-100' },
];

const statusCfg: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Brouillon',  cls: 'bg-slate-100 text-slate-600' },
  scheduled: { label: 'Planifié',  cls: 'bg-blue-100 text-blue-700' },
  published: { label: 'Publié',    cls: 'bg-emerald-100 text-emerald-700' },
  failed:    { label: 'Erreur',    cls: 'bg-red-100 text-red-700' },
};

export const SocialPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [form, setForm] = useState({ caption: '', scheduledAt: '' });

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const data = await blink.db.socialPosts.list({
        where: { organizationId: company.id },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      });
      setPosts(data as any[]);
    } catch { setPosts([]); } finally { setLoading(false); }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !user) return;
    if (!form.caption.trim()) { toast.error('Contenu requis'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Sélectionnez au moins une plateforme'); return; }
    setSaving(true);
    try {
      const status = form.scheduledAt ? 'scheduled' : 'draft';
      await blink.db.socialPosts.create({
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        organizationId: company.id,
        caption: form.caption,
        platforms: JSON.stringify(selectedPlatforms),
        mediaUrls: '[]',
        status,
        scheduledAt: form.scheduledAt || null,
        stats: '{}',
      });
      toast.success(status === 'scheduled' ? 'Publication planifiée' : 'Brouillon sauvegardé');
      setShowNew(false);
      setForm({ caption: '', scheduledAt: '' });
      setSelectedPlatforms(['instagram']);
      load();
    } catch { toast.error('Erreur lors de la création'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await blink.db.socialPosts.delete(id);
      toast.success('Publication supprimée');
      setPosts(p => p.filter(x => x.id !== id));
    } catch { toast.error('Erreur'); }
  };

  const getPlatformTags = (platformsJson: string) => {
    try {
      const arr: string[] = JSON.parse(platformsJson || '[]');
      return arr.map(p => PLATFORMS.find(pl => pl.id === p)?.label || p).join(', ');
    } catch { return '—'; }
  };

  const draft = posts.filter(p => p.status === 'draft').length;
  const scheduled = posts.filter(p => p.status === 'scheduled').length;
  const published = posts.filter(p => p.status === 'published').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Réseaux Sociaux</h1>
          <p className="page-subtitle">Planifiez et publiez vos contenus sur tous vos réseaux</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Brouillons</p>
          <p className="text-2xl font-black text-slate-500">{draft}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Planifiés</p>
          <p className="text-2xl font-black text-blue-600">{scheduled}</p>
        </div>
        <div className="metric-card text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Publiés</p>
          <p className="text-2xl font-black text-emerald-600">{published}</p>
        </div>
      </div>

      {/* Platform connection cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {PLATFORMS.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black', p.color)}>
              {p.label[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.label}</p>
              <p className="text-xs text-muted-foreground">Non connecté</p>
            </div>
          </div>
        ))}
      </div>

      {/* Posts table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Historique des publications</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Share2 className="w-6 h-6 text-muted-foreground" /></div>
            <p className="font-semibold">Aucune publication</p>
            <p className="text-sm text-muted-foreground mt-1">Créez votre premier post pour les réseaux sociaux</p>
            <Button onClick={() => setShowNew(true)} variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" /> Nouveau post
            </Button>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Contenu</th><th>Plateformes</th><th>Planifié</th><th>Statut</th><th className="w-12"></th></tr></thead>
            <tbody>
              {posts.map(post => {
                const cfg = statusCfg[post.status] ?? statusCfg.draft;
                return (
                  <tr key={post.id}>
                    <td className="max-w-xs">
                      <p className="text-sm truncate">{post.caption || '(sans légende)'}</p>
                    </td>
                    <td className="text-xs text-muted-foreground">{getPlatformTags(post.platforms)}</td>
                    <td className="text-sm text-muted-foreground">
                      {post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td>
                      <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', cfg.cls)}>{cfg.label}</span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(post.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4" />Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau post</DialogTitle>
            <DialogDescription>Composez et planifiez votre publication</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plateformes</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      selectedPlatforms.includes(p.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contenu *</Label>
              <Textarea
                placeholder="Rédigez votre publication..."
                rows={5}
                value={form.caption}
                onChange={e => setForm(p => ({ ...p, caption: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">{form.caption.length} caractères</p>
            </div>
            <div className="space-y-1.5">
              <Label>Planifier pour (optionnel)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Annuler</Button>
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {form.scheduledAt ? 'Planifier' : 'Enregistrer brouillon'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
