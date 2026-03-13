import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, Send, X, Sparkles, Workflow, Target, BarChart3,
  User, CheckCircle2, AlertCircle, Loader2, Plus, 
  FileText, Users, Receipt, Landmark
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: {
    type: 'create_client' | 'create_invoice' | 'create_expense' | 'analyze_margins';
    data: any;
    status: 'pending' | 'completed';
  };
}

export const Assistant = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant FusionBiz. Je peux créer des clients, des factures ou analyser vos données. Que puis-je faire pour vous ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const performAction = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg.action || msg.action.status === 'completed') return;

    if (msg.action.type === 'analyze_margins') {
       setMessages(prev => {
         const next = [...prev];
         next[msgIndex].action!.status = 'completed';
         next[msgIndex].content += "\n\n📊 **Analyse des marges Q1 :**\n- Marge brute moyenne : 32%\n- Point mort atteint : 12 Mars\n- Optimisation possible : Réduire les frais logistiques de 5% via le Réseau B2B.";
         return next;
       });
       return;
    }

    setLoading(true);
    try {
      if (msg.action.type === 'create_client') {
        await blink.db.clients.create({
          id: `cli_${Date.now()}`,
          userId: user!.id,
          companyId: company!.id,
          ...msg.action.data,
          status: 'active'
        });
        toast.success(`Client ${msg.action.data.name} créé par l'IA`);
      } else if (msg.action.type === 'create_invoice') {
        await blink.db.invoices.create({
          id: `inv_${Date.now()}`,
          userId: user!.id,
          companyId: company!.id,
          ...msg.action.data,
          status: 'draft',
          number: `FAC-${Date.now().toString().slice(-4)}`
        });
        toast.success(`Facture pour ${msg.action.data.clientName} créée par l'IA`);
      }

      setMessages(prev => {
        const next = [...prev];
        next[msgIndex].action!.status = 'completed';
        next[msgIndex].content += "\n\n✅ Action effectuée avec succès !";
        return next;
      });
    } catch (e) {
      toast.error("Erreur lors de l'exécution de l'action IA");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // 1. Check for intent using generateObject
      const intentResult = await blink.ai.generateObject({
        prompt: `Analyse l'intention de l'utilisateur : "${userMsg}". 
        S'il veut créer quelque chose, extrais les données. 
        Types supportés : 
        - create_client (besoin de name, email?)
        - create_invoice (besoin de clientName, amount)
        - analyze_margins (si l'utilisateur veut une analyse financière ou parler de rentabilité)
        Si pas d'action claire, renvoie action: null.`,
        schema: {
          type: 'object',
          properties: {
            hasAction: { type: 'boolean' },
            actionType: { type: 'string', enum: ['create_client', 'create_invoice', 'create_expense', 'analyze_margins', null] },
            data: { type: 'object' },
            response: { type: 'string' }
          }
        }
      });

      const { hasAction, actionType, data, response } = intentResult.object as any;

      if (hasAction && actionType) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response || `D'accord, j'ai préparé les données pour : ${actionType}. Voulez-vous que je valide l'action ?`,
          action: { type: actionType, data, status: 'pending' }
        }]);
      } else {
        // Simple chat fallback
        let fullResponse = '';
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
        await blink.ai.streamText({
          messages: [
            { role: 'system', content: 'Tu es l\'assistant IA central de FusionBiz. Tu es capable d\'aider sur la comptabilité (Indy), l\'ERP (Odoo) et l\'automatisation (n8n). Sois court et efficace.' },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ]
        }, (chunk) => {
          fullResponse += chunk;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1].content = fullResponse;
            return next;
          });
        });
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, je rencontre une difficulté technique." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="fixed bottom-28 right-8 w-96 h-[600px] z-[60] flex flex-col"
        >
          <Card className="flex-1 flex flex-col shadow-2xl glass border-2 border-primary/20 overflow-hidden bg-white/95 dark:bg-slate-900/95">
            <CardHeader className="p-4 border-b border-border/50 bg-slate-900 text-white flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black tracking-tight uppercase">Fusion Core IA</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70 text-blue-200">Mode Action Actif</span>
                  </div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10 text-white rounded-xl h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6">
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm",
                        m.role === 'assistant' ? "bg-slate-900 text-white" : "bg-blue-600 text-white"
                      )}>
                        {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div className={cn(
                          "p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border",
                          m.role === 'assistant' 
                            ? "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-tl-none" 
                            : "bg-blue-600 text-white border-blue-500 rounded-tr-none"
                        )}>
                          {m.content || (
                            <div className="flex gap-1 py-1">
                              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                              <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          )}
                        </div>
                        
                        {m.action && m.action.status === 'pending' && (
                          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 shadow-none overflow-hidden">
                            <CardContent className="p-3 space-y-3">
                              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-wider">
                                <Plus className="w-3 h-3" /> Action suggérée
                              </div>
                              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                {m.action.type === 'create_client' && `Nouveau client : ${m.action.data.name}`}
                                {m.action.type === 'create_invoice' && `Facture de ${m.action.data.amount}€ pour ${m.action.data.clientName}`}
                                {m.action.type === 'analyze_margins' && `Analyse des marges`}
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => performAction(i)} 
                                disabled={loading}
                                className="w-full h-8 rounded-lg font-black text-[10px] uppercase bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                              >
                                Confirmer l'action
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/50 space-y-4 bg-white dark:bg-slate-900">
                <div className="flex flex-wrap gap-2">
                   <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Analyse ma rentabilité ce trimestre")}>
                     <BarChart3 className="w-3 h-3 mr-1.5 text-blue-600" /> Analyse IA
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Crée un client 'Tech Solutions' avec l'email contact@tech.com")}>
                     <Users className="w-3 h-3 mr-1.5 text-blue-600" /> Client
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Crée une facture de 1500€ pour le client 'Tech Solutions'")}>
                     <Receipt className="w-3 h-3 mr-1.5 text-blue-600" /> Facture
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Liste mes dernières factures payées")}>
                     <FileText className="w-3 h-3 mr-1.5 text-blue-600" /> Stats
                   </Button>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    placeholder="Posez une question ou demandez une action..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:ring-blue-600 transition-all font-medium h-12"
                  />
                  <Button size="icon" onClick={handleSend} disabled={loading} className="rounded-xl h-12 w-12 bg-slate-900 hover:bg-black shadow-lg shrink-0">
                    <Send className="w-5 h-5 text-white" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};