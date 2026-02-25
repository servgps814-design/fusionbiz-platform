import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Mail, Phone, Trash2, Crown, Shield, User } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: 'Administrateur', color: 'bg-primary/10 text-primary border-primary/20', icon: Crown },
  manager: { label: 'Manager', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Shield },
  member: { label: 'Membre', color: 'bg-muted text-muted-foreground border-border', icon: User },
  viewer: { label: 'Lecteur', color: 'bg-muted text-muted-foreground border-border', icon: User },
};

export const TeamPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'member', department: '' });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const res = await blink.db.teamMembers.list({
        where: { userId: user.id, companyId: company.id },
        orderBy: { invitedAt: 'desc' },
        limit: 100
      });
      setMembers(res);
    } catch { toast.error('Erreur chargement équipe'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nom et email requis'); return; }
    setSaving(true);
    try {
      await blink.db.teamMembers.create({
        id: `mem_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, email: form.email, role: form.role,
        department: form.department, status: 'active'
      });
      toast.success(`${form.name} ajouté à l'équipe`);
      setOpen(false);
      setForm({ name: '', email: '', role: 'member', department: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Retirer ${name} de l'équipe ?`)) return;
    await blink.db.teamMembers.delete(id);
    toast.success('Membre retiré'); load();
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.department?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: members.length,
    admins: members.filter(m => m.role === 'admin').length,
    managers: members.filter(m => m.role === 'manager').length,
    departments: [...new Set(members.map(m => m.department).filter(Boolean))].length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Équipe & Rôles</h1>
          <p className="text-muted-foreground font-medium">Gérez votre équipe, définissez les rôles et les permissions.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Inviter un membre</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Inviter un membre</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom complet *</Label><Input placeholder="Prénom Nom" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Email *</Label><Input type="email" placeholder="email@entreprise.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Rôle</Label>
                  <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrateur</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="member">Membre</SelectItem>
                      <SelectItem value="viewer">Lecteur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label className="font-bold">Département</Label><Input placeholder="Ex: Commercial" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="rounded-xl" /></div>
              </div>
              <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                Un email d&apos;invitation sera envoyé à {form.email || "l'adresse indiquée"}.
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">
                {saving ? 'Invitation...' : 'Envoyer l\'invitation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Membres Total', value: stats.total, icon: Users },
          { label: 'Administrateurs', value: stats.admins, icon: Crown },
          { label: 'Managers', value: stats.managers, icon: Shield },
          { label: 'Départements', value: stats.departments, icon: User },
        ].map(stat => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black tracking-tighter">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un membre..." className="pl-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <Card key={i} className="glass animate-pulse h-32" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-black text-xl mb-2">Aucun membre</h3>
          <p className="text-muted-foreground text-sm">Commencez à constituer votre équipe.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => {
            const role = roleConfig[member.role] || roleConfig.member;
            const RoleIcon = role.icon;
            return (
              <Card key={member.id} className="glass group hover:shadow-lg transition-all">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                      {member.name?.charAt(0).toUpperCase()}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(member.id, member.name)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <h4 className="font-black text-base mb-0.5">{member.name}</h4>
                  {member.department && <p className="text-xs text-muted-foreground mb-3">{member.department}</p>}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={cn("text-xs font-bold border gap-1", role.color)}>
                      <RoleIcon className="w-3 h-3" /> {role.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{member.email}</span>
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
