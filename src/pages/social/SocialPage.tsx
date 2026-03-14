import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Share2, Plus, Clock, CheckCircle2, XCircle, Loader2, Send,
  MoreHorizontal, Trash2, Edit, Instagram, Linkedin, Facebook,
  Twitter, Users, Wifi, WifiOff, Filter,
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SocialPost {
  id: string; caption: string; platforms: string; status: string;
  scheduledAt?: string; publishedAt?: string; createdAt: string;
}
interface SocialAccount {
  id: string; platform: string; accountName: string; status: string;
  followersCount?: number; createdAt: string;
}

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS: { id: string; label: string; Icon: React.ElementType; color: string; bg: string }[] = [
  { id: 'instagram', label: 'Instagram', Icon: Instagram, color: 'text-pink-500',    bg: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-900' },
  { id: 'facebook',  label: 'Facebook',  Icon: Facebook,  color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900' },
  { id: 'linkedin',  label: 'LinkedIn',  Icon: Linkedin,  color: 'text-blue-700',    bg: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900' },
  { id: 'tiktok',    label: 'TikTok',    Icon: Share2,    color: 'text-slate-800 dark:text-slate-200', bg: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' },
  { id: 'x',         label: 'X',         Icon: Twitter,   color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700' },
];

const getPlatformCfg = (id: string) => PLATFORMS.find(p => p.id === id) || PLATFORMS[0];

// ─── Status Config ────────────────────────────────────────────────────────────

const POST_STATUS: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: 'Brouillon',  className: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700', icon: Edit },
  scheduled: { label: 'Planifié',   className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900', icon: Clock },
  published: { label: 'Publié',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900', icon: CheckCircle2 },
  failed:    { label: 'Erreur',     className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900', icon: XCircle },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (s?: string) =>
  s ? new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
const genId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const parsePlatforms = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return [val]; } }
  return [];
};

// ─── Status Badge ─────────────────────────────────────────────────────────────

function PostStatusBadge({ status }: { status: string }) {
  const cfg = POST_STATUS[status] ?? POST_STATUS.draft;
  const Icon = cfg.icon;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
      cfg.className
    )}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

// ─── Platform Pills ───────────────────────────────────────────────────────────

function PlatformPills({ platforms }: { platforms: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {platforms.map(pid => {
        const p = getPlatformCfg(pid);
        const PIcon = p.Icon;
        return (
          <span key={pid} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border', p.bg, p.color)}>
            <PIcon className="w-2.5 h-2.5" />{p.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Composer Dialog ──────────────────────────────────────────────────────────

function ComposerDialog({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void;
  onSave: (d: any) => Promise<void>; initial?: Partial<SocialPost>;
}) {
  const [caption, setCaption] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCaption(initial?.caption || '');
      setSelectedPlatforms(parsePlatforms(initial?.platforms) || ['instagram']);
      setScheduledAt(initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : '');
      setStatus((initial?.status as any) || 'draft');
    }
  }, [open]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!caption.trim()) { toast.error('Le contenu est requis'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Sélectionnez au moins une plateforme'); return; }
    setSaving(true);
    try {
      await onSave({ caption, platforms: selectedPlatforms, scheduledAt: scheduledAt || null, status });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-7 pt-7 pb-0">
          <DialogTitle className="text-lg font-black tracking-tight">
            {initial ? 'Modifier le post' : 'Nouveau post'}
          </DialogTitle>
          <DialogDescription>Rédigez et planifiez votre publication</DialogDescription>
        </DialogHeader>
        <div className="px-7 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Caption */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Contenu <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Rédigez votre publication..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="rounded-xl resize-none"
              rows={5}
            />
            <p className="text-xs text-muted-foreground text-right">{caption.length} caractères</p>
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Plateformes <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const selected = selectedPlatforms.includes(p.id);
                const PIcon = p.Icon;
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all',
                      selected ? `${p.bg} ${p.color} ring-2 ring-current ring-offset-1` : 'border-border text-muted-foreground hover:border-primary/40'
                    )}
                  >
                    <PIcon className="w-3.5 h-3.5" />{p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Planification (optionnel)
            </Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => {
                setScheduledAt(e.target.value);
                if (e.target.value) setStatus('scheduled');
                else setStatus('draft');
              }}
              className="rounded-xl"
            />
          </div>
        </div>
        <DialogFooter className="px-7 pb-7 pt-4 border-t border-border gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-xl min-w-[120px]">
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {initial ? 'Enregistrer' : scheduledAt ? 'Planifier' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SocialPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [editPost, setEditPost] = useState<SocialPost | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const TABS = [
    { key: 'all',       label: 'Tous' },
    { key: 'draft',     label: 'Brouillons' },
    { key: 'scheduled', label: 'Planifiés' },
    { key: 'published', label: 'Publiés' },
  ] as const;

  const load = useCallback(async () => {
    if (!company) return;
    setLoading(true);
    try {
      const [postsData, accountsData] = await Promise.all([
        blink.db.socialPosts.list({ where: { organizationId: company.id }, orderBy: { createdAt: 'desc' }, limit: 100 }),
        blink.db.socialAccounts.list({ where: { organizationId: company.id }, limit: 20 }),
      ]);
      setPosts(postsData as SocialPost[]);
      setAccounts(accountsData as SocialAccount[]);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [company]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data: any) => {
    if (!company || !user) return;
    try {
      if (editPost) {
        await blink.db.socialPosts.update(editPost.id, {
          caption: data.caption,
          platforms: JSON.stringify(data.platforms),
          scheduledAt: data.scheduledAt || null,
          status: data.status,
        });
        toast.success('Post mis à jour');
      } else {
        await blink.db.socialPosts.create({
          id: `post_${genId()}`,
          userId: user.id, organizationId: company.id,
          caption: data.caption,
          platforms: JSON.stringify(data.platforms),
          status: data.status,
          scheduledAt: data.scheduledAt || null,
        });
        toast.success('Post créé');
      }
      setComposerOpen(false);
      setEditPost(null);
      load();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await blink.db.socialPosts.delete(deleteId);
      toast.success('Post supprimé');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const filtered = posts.filter(p =>
    activeTab === 'all' || p.status === activeTab
  );

  const stats = {
    total:     posts.length,
    published: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    connected: accounts.filter(a => a.status === 'active').length,
  };

  return (
    <div className="p-6 lg:p-8 animate-in-up space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Réseaux sociaux</h1>
          <p className="page-subtitle">Gérez et planifiez vos publications</p>
        </div>
        <Button
          onClick={() => { setEditPost(null); setComposerOpen(true); }}
          className="rounded-xl gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />Nouveau post
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total posts',    value: stats.total,     icon: Share2,      color: 'text-primary' },
          { label: 'Publiés',        value: stats.published, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Planifiés',      value: stats.scheduled, icon: Clock,       color: 'text-blue-600' },
          { label: 'Comptes liés',   value: stats.connected, icon: Users,       color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="metric-card flex items-center gap-4">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center bg-muted', s.color)}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-black tracking-tight">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black uppercase tracking-wider">Comptes connectés</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {accounts.map(acc => {
                const p = getPlatformCfg(acc.platform);
                const PIcon = p.Icon;
                const isActive = acc.status === 'active';
                return (
                  <div key={acc.id} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-sm', p.bg)}>
                    <PIcon className={cn('w-4 h-4', p.color)} />
                    <span className="font-bold">{acc.accountName}</span>
                    {acc.followersCount && (
                      <span className="text-xs text-muted-foreground">{acc.followersCount.toLocaleString('fr-FR')} abonnés</span>
                    )}
                    {isActive
                      ? <Wifi className="w-3 h-3 text-emerald-500 ml-1" />
                      : <WifiOff className="w-3 h-3 text-red-500 ml-1" />
                    }
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className={cn(
                'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black',
                activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {posts.filter(p => p.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Posts List */}
      <Card className="border-border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Share2 className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-bold text-muted-foreground mb-1">Aucun post</p>
              <p className="text-xs text-muted-foreground mb-4">
                {activeTab === 'all' ? 'Créez votre premier post social' : `Aucun post ${activeTab === 'draft' ? 'en brouillon' : activeTab === 'scheduled' ? 'planifié' : 'publié'}`}
              </p>
              <Button size="sm" className="rounded-xl" onClick={() => { setEditPost(null); setComposerOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />Créer un post
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(post => {
                const platforms = parsePlatforms(post.platforms);
                return (
                  <div key={post.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2 mb-2">{post.caption}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <PlatformPills platforms={platforms} />
                        <PostStatusBadge status={post.status} />
                        {post.scheduledAt && post.status === 'scheduled' && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {fmtDateTime(post.scheduledAt)}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            Publié {fmtDate(post.publishedAt)}
                          </span>
                        )}
                        {!post.publishedAt && !post.scheduledAt && (
                          <span className="text-xs text-muted-foreground">{fmtDate(post.createdAt)}</span>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={() => { setEditPost(post); setComposerOpen(true); }}
                          className="gap-2 cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(post.id)}
                          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ComposerDialog
        open={composerOpen}
        onClose={() => { setComposerOpen(false); setEditPost(null); }}
        onSave={handleSave}
        initial={editPost || undefined}
      />
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce post ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
