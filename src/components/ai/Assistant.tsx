import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot, Send, X, BarChart3,
  User, CheckCircle2, Plus,
  FileText, Users, Receipt,
} from 'lucide-react';
import { localAuth } from '@/lib/localAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { toast } from 'sonner';

interface MessageAction {
  type: string;
  data: any;
  status: 'pending' | 'completed';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: MessageAction;
}

const DEMO_RESPONSES: Record<string, string> = {
  default: "Je suis votre assistant ORBiS. Je peux créer des clients, des factures ou des dépenses. Essayez par exemple : \"Crée un client Tech Solutions\" ou \"Fais une facture de 1500€\".",
  analyse: "📊 **Analyse financière de votre entreprise**\n\nChiffre d'affaires ce mois : **12 450 €**\nDépenses : **3 820 €**\nMarge nette : **8 630 €** (+12% vs mois dernier)\n\n✅ Santé financière : Bonne\n⚠️ Point d'attention : 3 factures en attente de paiement (4 200 €)",
  bilan: "📈 **Bilan financier**\n\nActif total : **45 200 €**\nPassif : **12 800 €**\nCapitaux propres : **32 400 €**\n\nRatio de liquidité : 1.8 (sain)\nRentabilité nette : 21%",
};

function getSimpleResponse(text: string): { hasAction: boolean; actionType?: string; data?: any; response: string } {
  const lower = text.toLowerCase();

  if (lower.includes('client') && (lower.includes('créer') || lower.includes('crée') || lower.includes('nouveau') || lower.includes('ajoute'))) {
    const nameMatch = text.match(/['"]([^'"]+)['"]/);
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    const name = nameMatch?.[1] || 'Nouveau Client';
    const email = emailMatch?.[0] || `contact@${name.toLowerCase().replace(/\s+/g, '')}.com`;
    return {
      hasAction: true,
      actionType: 'create_client',
      data: { name, email },
      response: `J'ai préparé la création du client **${name}** (${email}). Confirmez-vous ?`,
    };
  }

  if (lower.includes('facture') && (lower.includes('créer') || lower.includes('crée') || lower.includes('faire') || lower.includes('fais'))) {
    const amountMatch = text.match(/(\d+[\s]?[€]?[\s]?(?:euros?)?)/i);
    const clientMatch = text.match(/(?:pour|client)\s+['"]?([A-Za-zÀ-ÿ\s]+?)['"]?(?:\s|$)/i);
    const amount = amountMatch?.[1]?.replace(/[^0-9]/g, '') || '1000';
    const clientName = clientMatch?.[1]?.trim() || 'Client';
    return {
      hasAction: true,
      actionType: 'create_invoice',
      data: { clientName, amount },
      response: `J'ai préparé une facture de **${amount} €** pour **${clientName}**. Confirmez-vous ?`,
    };
  }

  if (lower.includes('dépense') && (lower.includes('créer') || lower.includes('crée') || lower.includes('enregistre') || lower.includes('ajoute'))) {
    const amountMatch = text.match(/(\d+)/);
    const titleMatch = text.match(/['"]([^'"]+)['"]/);
    const amount = amountMatch?.[1] || '50';
    const title = titleMatch?.[1] || 'Dépense professionnelle';
    return {
      hasAction: true,
      actionType: 'create_expense',
      data: { title, amount, category: 'divers' },
      response: `J'ai préparé la dépense **${title}** de **${amount} €**. Confirmez-vous ?`,
    };
  }

  if (lower.includes('analys') || lower.includes('rentabilit') || lower.includes('trimestre')) {
    return { hasAction: false, response: DEMO_RESPONSES.analyse };
  }

  if (lower.includes('bilan')) {
    return { hasAction: false, response: DEMO_RESPONSES.bilan };
  }

  return { hasAction: false, response: DEMO_RESPONSES.default };
}

export const Assistant = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  const { user } = useAuth();
  const { company } = useCompany();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Bonjour ! Je suis votre assistant ORBiS. Je peux créer des clients, des factures, des dépenses ou analyser vos données. Que puis-je faire pour vous ?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const performAction = async (msgIndex: number) => {
    const msg = messages[msgIndex];
    if (!msg.action || msg.action.status === 'completed') return;

    setLoading(true);
    try {
      if (msg.action.type === 'create_client') {
        await localAuth.db.clients.create({
          id: `cli_${Date.now()}`,
          userId: user?.id,
          companyId: company?.id,
          ...msg.action.data,
          status: 'active',
          createdAt: new Date().toISOString(),
        });
        toast.success(`Client ${msg.action.data.name} créé avec succès`);
      } else if (msg.action.type === 'create_invoice') {
        await localAuth.db.invoices.create({
          id: `inv_${Date.now()}`,
          userId: user?.id,
          companyId: company?.id,
          ...msg.action.data,
          status: 'draft',
          number: `FAC-${Date.now().toString().slice(-4)}`,
          createdAt: new Date().toISOString(),
        });
        toast.success(`Facture pour ${msg.action.data.clientName} créée`);
      } else if (msg.action.type === 'create_expense') {
        await localAuth.db.expenses.create({
          id: `exp_${Date.now()}`,
          userId: user?.id,
          companyId: company?.id,
          ...msg.action.data,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
        });
        toast.success(`Dépense de ${msg.action.data.amount} € enregistrée`);
      }

      setMessages((prev) => {
        const next = [...prev];
        next[msgIndex] = {
          ...next[msgIndex],
          action: { ...next[msgIndex].action!, status: 'completed' },
          content: next[msgIndex].content + '\n\n✅ Action effectuée avec succès !',
        };
        return next;
      });
    } catch {
      toast.error("Erreur lors de l'exécution de l'action");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const result = getSimpleResponse(userMsg);

    if (result.hasAction && result.actionType) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.response,
          action: { type: result.actionType!, data: result.data, status: 'pending' },
        },
      ]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', content: result.response }]);
    }

    setLoading(false);
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
                  <CardTitle className="text-sm font-black tracking-tight uppercase">Assistant ORBiS</CardTitle>
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
                    <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : '')}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm', m.role === 'assistant' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white')}>
                        {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col gap-2 max-w-[80%]">
                        <div className={cn('p-4 rounded-2xl text-sm leading-relaxed font-medium shadow-sm border whitespace-pre-line', m.role === 'assistant' ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-tl-none' : 'bg-blue-600 text-white border-blue-500 rounded-tr-none')}>
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
                                {m.action.type === 'create_invoice' && `Facture de ${m.action.data.amount} € pour ${m.action.data.clientName}`}
                                {m.action.type === 'create_expense' && `Dépense : ${m.action.data.title} (${m.action.data.amount} €)`}
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

                        {m.action && m.action.status === 'completed' && (
                          <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Effectué
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none">
                        <div className="flex gap-1 py-1">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/50 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput('Analyse ma rentabilité ce trimestre')}>
                    <BarChart3 className="w-3 h-3 mr-1.5 text-blue-600" /> Analyse IA
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Crée un client 'Tech Solutions' avec l'email contact@tech.com")}>
                    <Users className="w-3 h-3 mr-1.5 text-blue-600" /> Client
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Crée une facture de 1500€ pour 'Tech Solutions'")}>
                    <Receipt className="w-3 h-3 mr-1.5 text-blue-600" /> Facture
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider border-slate-200" onClick={() => setInput("Enregistre une dépense de 50€ pour 'Fournitures bureau'")}>
                    <FileText className="w-3 h-3 mr-1.5 text-blue-600" /> Dépense
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
