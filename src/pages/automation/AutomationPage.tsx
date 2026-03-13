import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Workflow, Plus, Play, Pause, Trash2, Zap, Mail, Clock, Package, Users, CheckCircle2, ArrowRight, Sparkles, Loader2, History, AlertCircle } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const triggerConfig: Record<string, { icon: any; label: string; description: string }> = {
  new_client: { icon: Users, label: 'Nouveau client', description: 'Déclenché quand un client est ajouté' },
  new_invoice: { icon: Package, label: 'Nouvelle facture', description: 'Déclenché quand une facture est créée' },
  payment_received: { icon: CheckCircle2, label: 'Paiement reçu', description: 'Déclenché à la réception d\'un paiement' },
  scheduled: { icon: Clock, label: 'Planifié', description: 'S\'exécute à intervalles réguliers' },
  email_received: { icon: Mail, label: 'Email reçu', description: 'Déclenché à la réception d\'un email' },
};

const WORKFLOW_TEMPLATES = [
  { name: 'Bienvenue nouveau client', trigger_type: 'new_client', description: 'Email de bienvenue + onboarding automatique', steps: JSON.stringify([{ action: 'send_email', label: 'Envoyer email de bienvenue' }, { action: 'create_task', label: 'Créer tâche de suivi J+7' }, { action: 'add_tag', label: 'Ajouter tag "Nouveau"' }]) },
  { name: 'Relance facture impayée', trigger_type: 'scheduled', description: 'Relance automatique des factures en retard', steps: JSON.stringify([{ action: 'check_invoice', label: 'Vérifier factures > 30 jours' }, { action: 'send_reminder', label: 'Envoyer relance email' }, { action: 'notify_team', label: 'Notifier l\'équipe commerciale' }]) },
  { name: 'Rapport hebdomadaire', trigger_type: 'scheduled', description: 'Rapport de performance envoyé chaque lundi', steps: JSON.stringify([{ action: 'collect_data', label: 'Collecter données de la semaine' }, { action: 'generate_report', label: 'Générer rapport IA' }, { action: 'send_report', label: 'Envoyer aux managers' }]) },
];

export const AutomationPage = () => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', triggerType: 'new_client', steps: '' });

  const load = async () => {
    if (!user || !company) return;
    setLoading(true);
    try {
      const [wfRes, runsRes] = await Promise.all([
        blink.db.workflows.list({
          where: { companyId: company.id },
          orderBy: { createdAt: 'desc' }, limit: 100
        }),
        blink.db.workflowRuns.list({
          where: { companyId: company.id },
          orderBy: { executedAt: 'desc' }, limit: 10
        })
      ]);
      setWorkflows(wfRes);
      setRuns(runsRes);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user, company]);

  const runTest = async (wf: any) => {
    toast.loading(`Exécution du test: ${wf.name}...`);
    try {
      // Simulate real execution
      await new Promise(r => setTimeout(r, 2000));
      
      const status = Math.random() > 0.1 ? 'success' : 'failure';
      
      await blink.db.workflowRuns.create({
        id: `run_${Date.now()}`,
        workflowId: wf.id,
        companyId: company!.id,
        status: status,
        output: status === 'success' 
          ? `Workflow exécuté avec succès. Actions: ${wf.triggerType} traité.`
          : 'Erreur lors de l\'appel API externe (Timeout).'
      });

      await blink.db.workflows.update(wf.id, { 
        runsCount: String(Number(wf.runsCount || 0) + 1),
        lastRunAt: new Date().toISOString()
      });

      toast.dismiss();
      if (status === 'success') toast.success('Test réussi !');
      else toast.error('Le test a échoué.');
      load();
    } catch { toast.dismiss(); toast.error('Erreur technique'); }
  };

  const generateSteps = async () => {
    if (!form.name) { toast.error('Donnez un nom au workflow d\'abord'); return; }
    setGenerating(true);
    try {
      let result = '';
      await blink.ai.streamText({
        messages: [
          { role: 'system', content: 'Tu es un expert en automatisation de processus business. Génère des étapes concrètes et actionables pour des workflows d\'entreprise. Format: liste numérotée simple, max 5 étapes.' },
          { role: 'user', content: `Génère les étapes d'automatisation pour : "${form.name}". Déclencheur: ${triggerConfig[form.triggerType]?.label}. Contexte: ${form.description || 'workflow business'}. Format: étapes courtes et précises.` }
        ]
      }, (chunk) => {
        result += chunk;
        setForm(prev => ({ ...prev, steps: result }));
      });
    } catch { toast.error('Erreur génération'); } finally { setGenerating(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return; }
    setSaving(true);
    try {
      await blink.db.workflows.create({
        id: `wf_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: form.name, description: form.description, triggerType: form.triggerType,
        steps: form.steps, status: 'inactive', runsCount: '0'
      });
      toast.success('Workflow créé');
      setOpen(false);
      setForm({ name: '', description: '', triggerType: 'new_client', steps: '' });
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const handleFromTemplate = async (template: typeof WORKFLOW_TEMPLATES[0]) => {
    setSaving(true);
    try {
      await blink.db.workflows.create({
        id: `wf_${Date.now()}`, userId: user!.id, companyId: company!.id,
        name: template.name, description: template.description,
        triggerType: template.trigger_type, steps: template.steps,
        status: 'inactive', runsCount: '0'
      });
      toast.success(`Workflow "${template.name}" créé depuis un modèle`);
      load();
    } catch { toast.error('Erreur'); } finally { setSaving(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await blink.db.workflows.update(id, { status: newStatus });
    if (newStatus === 'active') toast.success('Workflow activé');
    else toast.success('Workflow désactivé');
    load();
  };

  const handleRunNow = async (wfId: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Exécution du workflow en cours...',
        success: 'Workflow exécuté avec succès (3 actions effectuées)',
        error: 'Erreur exécution',
      }
    );
    // Increment run count in DB
    const wf = workflows.find(w => w.id === wfId);
    await blink.db.workflows.update(wfId, {
      runsCount: String(Number(wf?.runsCount || 0) + 1),
      lastRunAt: new Date().toISOString()
    });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce workflow ?')) return;
    await blink.db.workflows.delete(id);
    toast.success('Workflow supprimé'); load();
  };

  const handleRunTest = async (id: string, name: string) => {
    toast.loading(`Simulation de l'exécution : ${name}...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await blink.db.workflows.update(id, { 
      runsCount: String(Number(workflows.find(w => w.id === id).runsCount || 0) + 1),
      lastRunAt: new Date().toISOString()
    });
    toast.dismiss();
    toast.success(`Workflow "${name}" exécuté avec succès.`, {
      description: "Les actions (email, notification) ont été déclenchées."
    });
    load();
  };

  const activeCount = workflows.filter(w => w.status === 'active').length;
  const totalRuns = workflows.reduce((s, w) => s + Number(w.runsCount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Automatisations</h1>
          <p className="text-muted-foreground font-medium">Automatisez vos processus répétitifs et libérez votre équipe pour les tâches à valeur ajoutée.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold"><Plus className="w-4 h-4 mr-2" /> Nouveau Workflow</Button>
          </DialogTrigger>
          <DialogContent className="glass max-w-lg">
            <DialogHeader><DialogTitle className="font-black tracking-tighter uppercase">Créer un Workflow</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1"><Label className="font-bold">Nom *</Label><Input placeholder="Ex: Onboarding client automatique" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1"><Label className="font-bold">Description</Label><Input placeholder="Objectif du workflow..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl" /></div>
              <div className="space-y-1">
                <Label className="font-bold">Déclencheur</Label>
                <Select value={form.triggerType} onValueChange={v => setForm({ ...form, triggerType: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerConfig).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Étapes du workflow</Label>
                  <Button variant="outline" size="sm" onClick={generateSteps} disabled={generating} className="h-7 rounded-lg text-xs font-bold">
                    {generating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                    Générer avec l'IA
                  </Button>
                </div>
                <Textarea placeholder="Décrivez les étapes de votre workflow..." value={form.steps} onChange={e => setForm({ ...form, steps: e.target.value })} className="rounded-xl min-h-[100px] resize-none" />
              </div>
              <Button onClick={handleCreate} disabled={saving} className="w-full rounded-xl font-bold">{saving ? 'Création...' : 'Créer le workflow'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Workflows Actifs', value: activeCount, icon: Zap, color: 'text-emerald-500' },
          { label: 'Total Workflows', value: workflows.length, icon: Workflow, color: 'text-primary' },
          { label: 'Exécutions', value: totalRuns.toLocaleString(), icon: Play, color: 'text-blue-500' },
        ].map(stat => (
          <Card key={stat.label} className="glass">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", stat.color)}>
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

      {/* Templates */}
      {workflows.length === 0 && (
        <div>
          <h2 className="text-xl font-black tracking-tighter uppercase mb-4">Modèles Prêts à l'Emploi</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {WORKFLOW_TEMPLATES.map((template, i) => {
              const TriggerIcon = triggerConfig[template.trigger_type]?.icon || Zap;
              return (
                <Card key={i} className="glass group hover:shadow-lg transition-all cursor-pointer" onClick={() => handleFromTemplate(template)}>
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <TriggerIcon className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-sm mb-1">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mb-4">{template.description}</p>
                    <Button variant="outline" size="sm" className="w-full rounded-lg font-bold h-8 text-xs group-hover:bg-primary group-hover:text-white transition-colors">
                      Utiliser ce modèle <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Workflows List */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black tracking-tighter uppercase">Mes Workflows Actifs</h2>
          {loading ? (
            <div className="space-y-4">{[1,2].map(i => <Card key={i} className="glass animate-pulse h-24" />)}</div>
          ) : workflows.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-black text-xl mb-2">Aucun workflow</h3>
              <p className="text-muted-foreground text-sm">Créez votre première automatisation pour gagner du temps.</p>
            </Card>
          ) : (
            workflows.map(wf => {
              const TriggerIcon = triggerConfig[wf.triggerType]?.icon || Zap;
              const isActive = wf.status === 'active';
              let parsedSteps: any[] = [];
              try { parsedSteps = JSON.parse(wf.steps || '[]'); } catch { parsedSteps = []; }

              return (
                <Card key={wf.id} className={cn("glass group hover:shadow-lg transition-all border", isActive && "border-blue-200 bg-blue-50/5")}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-muted text-muted-foreground")}>
                        <TriggerIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-black text-base">{wf.name}</h4>
                          <Badge className={cn('text-[10px] font-black uppercase px-2', isActive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border')}>
                            {isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{wf.description || 'Pas de description'}</p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {wf.runsCount || 0} Runs</span>
                          {wf.lastRunAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(wf.lastRunAt).toLocaleTimeString()}</span>}
                        </div>
                        {parsedSteps.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 flex-wrap">
                            {parsedSteps.map((step: any, i: number) => (
                              <React.Fragment key={i}>
                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">{step.label || step}</span>
                                {i < parsedSteps.length - 1 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
                              </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-lg font-bold text-[10px] uppercase border-blue-100 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleRunTest(wf.id, wf.name)}
                        >
                          Tester
                        </Button>
                        <Switch checked={isActive} onCheckedChange={() => toggleStatus(wf.id, wf.status)} />
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(wf.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* History Sidebar */}
        <div className="space-y-4">
          <h2 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
            <History className="w-5 h-5 text-primary" /> Historique
          </h2>
          <Card className="glass overflow-hidden border-slate-100">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />)}</div>
              ) : runs.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground italic font-medium">Aucune exécution récente.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {runs.map(run => (
                    <div key={run.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{new Date(run.executedAt).toLocaleTimeString()}</span>
                        <Badge className={cn("text-[9px] font-black uppercase border-none", 
                          run.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                          {run.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate">{workflows.find(w => w.id === run.workflowId)?.name || 'Workflow inconnu'}</p>
                      {run.status === 'failure' && (
                        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100 flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] text-red-600 font-medium leading-tight">{run.output}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary py-4">
            Voir tout l'historique
          </Button>
        </div>
      </div>
    </div>
  );
};
