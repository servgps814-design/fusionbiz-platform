import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Workflow, 
  Target, 
  BarChart3,
  User
} from 'lucide-react';
import { blink } from '@/lib/blink';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Assistant = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant FusionBiz. Comment puis-je vous aider à optimiser votre entreprise aujourd\'hui ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let fullResponse = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      await blink.ai.streamText({
        messages: [
          { role: 'system', content: 'Tu es l\'assistant IA central de FusionBiz Platform, un SaaS ERP et d\'automatisation ultra-moderne. Ton but est d\'aider l\'utilisateur à gérer son entreprise, créer des automatisations, lancer des campagnes marketing et analyser ses données. Sois professionnel, efficace et force de proposition.' },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ]
      }, (chunk) => {
        fullResponse += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = fullResponse;
          return newMessages;
        });
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une difficulté technique. Pouvez-vous reformuler ?" }]);
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
          <Card className="flex-1 flex flex-col shadow-2xl glass border-2 border-primary/20 overflow-hidden">
            <CardHeader className="p-4 border-b border-border/50 bg-primary text-white flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-black tracking-tight uppercase">Assistant Fusion IA</CardTitle>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-widest">En ligne</span>
                  </div>
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-background/50">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((m, i) => (
                    <div key={i} className={cn(
                      "flex gap-3",
                      m.role === 'user' ? "flex-row-reverse" : ""
                    )}>
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        m.role === 'assistant' ? "bg-primary text-white" : "bg-muted"
                      )}>
                        {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                        m.role === 'assistant' 
                          ? "bg-card border border-border shadow-sm rounded-tl-none" 
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        {m.content || <div className="flex gap-1 py-1"><div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" /><div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" /></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-border/50 space-y-4">
                <div className="flex flex-wrap gap-2">
                   <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider" onClick={() => setInput("Crée un workflow n8n...")}>
                     <Workflow className="w-3 h-3 mr-1 text-primary" /> Workflow
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider" onClick={() => setInput("Analyse mes ventes...")}>
                     <BarChart3 className="w-3 h-3 mr-1 text-primary" /> Rapports
                   </Button>
                   <Button variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold uppercase tracking-wider" onClick={() => setInput("Lance une campagne...")}>
                     <Target className="w-3 h-3 mr-1 text-primary" /> Marketing
                   </Button>
                </div>
                
                <div className="flex gap-2">
                  <Input 
                    placeholder="Tapez votre commande..." 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="rounded-xl bg-muted/50 border-transparent focus:border-primary transition-all"
                  />
                  <Button size="icon" onClick={handleSend} disabled={loading} className="rounded-xl shrink-0">
                    <Send className="w-4 h-4" />
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
