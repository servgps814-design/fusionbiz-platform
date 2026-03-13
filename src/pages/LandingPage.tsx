import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  Bot, 
  Globe, 
  Layers, 
  Zap, 
  ShieldCheck, 
  ChevronRight,
  Workflow,
  Target,
  Truck,
  CheckCircle2,
  PlayCircle,
  Users,
  Building2,
  ArrowRight,
  Landmark,
  Receipt
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const FeatureItem = ({ icon: Icon, title, description, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group"
  >
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", color)}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-black mb-3 tracking-tight text-slate-900">{title}</h3>
    <p className="text-slate-500 leading-relaxed text-sm font-medium">{description}</p>
  </motion.div>
);

const Navbar = () => {
  const { login } = useAuth();
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter text-slate-900">FUSION<span className="text-blue-600">BIZ</span></span>
        </div>
        
        <div className="hidden lg:flex items-center gap-10 text-sm font-bold text-slate-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Produit</a>
          <a href="#solutions" className="hover:text-blue-600 transition-colors">Solutions</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Tarifs</a>
          <a href="#network" className="hover:text-blue-600 transition-colors">Réseau B2B</a>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={login} className="text-slate-600 font-bold hover:text-blue-600">Connexion</Button>
          <Button onClick={login} className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 h-12 font-bold text-white">
            Essai gratuit
          </Button>
        </div>
      </div>
    </nav>
  );
};

export const LandingPage = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 text-slate-900 font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden bg-white">
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-100 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest mb-8">
                ✨ L'OS business pour les PME & Indépendants
              </div>
              <h1 className="text-6xl lg:text-[80px] font-black tracking-tighter leading-[0.9] mb-8 text-slate-900">
                Gérez tout. <br />
                <span className="text-blue-600">Automatisez</span> <br />
                le reste.
              </h1>
              <p className="text-xl text-slate-500 mb-10 max-w-xl font-medium leading-relaxed">
                FusionBiz combine ERP, Comptabilité type Indy, et Automatisation type n8n dans une plateforme unique propulsée par l'IA.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" onClick={login} className="w-full sm:w-auto rounded-full px-10 h-16 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 text-white group">
                  Démarrer maintenant <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-10 h-16 text-lg font-bold border-2 border-slate-200 hover:bg-slate-50">
                  <PlayCircle className="mr-2 w-5 h-5 text-blue-600" /> Voir la démo
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-6 text-slate-400">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
                  ))}
                </div>
                <p className="text-sm font-bold tracking-tight"><span className="text-slate-900 font-black">500+</span> entreprises nous font confiance</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl border-8 border-slate-900/5 shadow-2xl overflow-hidden bg-slate-900 aspect-square lg:aspect-video flex items-center justify-center p-1">
                 <img 
                  src="https://images.unsplash.com/photo-1758520144667-3041caeff3c1?auto=format&fit=crop&q=80&w=1200" 
                  alt="FusionBiz Dashboard"
                  className="w-full h-full object-cover rounded-2xl opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="glass p-6 rounded-2xl border-white/20 shadow-2xl max-w-xs animate-bounce-subtle">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                        <p className="font-black text-xs uppercase tracking-widest">Assistant Fusion</p>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">"J'ai automatisé votre facturation et optimisé vos livraisons de 15% ce mois-ci."</p>
                   </div>
                </div>
              </div>
              {/* Floating indicators */}
              <div className="absolute -top-6 -right-6 p-4 rounded-2xl bg-white shadow-xl border border-slate-100 animate-fade-in">
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="absolute -bottom-6 -left-6 p-4 rounded-2xl bg-white shadow-xl border border-slate-100">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Intégrations natives ultra-performantes</p>
          <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-50 grayscale hover:opacity-100 transition-all duration-500">
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">STRIPE</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">BNP PARIBAS</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">WHATSAPP</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">INSTAGRAM</div>
             <div className="flex items-center gap-2 font-black text-2xl tracking-tighter italic">DHL</div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section id="features" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-6 leading-tight">
              Remplacez <span className="text-blue-600">10 outils</span> par une plateforme unifiée.
            </h2>
            <p className="text-lg text-slate-500 font-medium">Fini les abonnements multiples. FusionBiz centralise vos opérations critiques avec une expérience utilisateur inégalée.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureItem 
              icon={Landmark}
              color="bg-blue-600 shadow-blue-200"
              title="Comptabilité Automatisée"
              description="Synchro bancaire, détection de TVA et exports FEC. Gérez vos finances comme sur Indy, sans effort."
            />
            <FeatureItem 
              icon={Workflow}
              color="bg-purple-600 shadow-purple-200"
              title="Moteur d'Automatisation"
              description="Créez des workflows visuels puissants. Connectez vos modules ERP aux outils marketing instantanément."
            />
            <FeatureItem 
              icon={Bot}
              color="bg-slate-900 shadow-slate-200"
              title="Intelligence Artificielle"
              description="Un assistant qui ne se contente pas de parler : il crée des factures, lance des campagnes et analyse vos stocks."
            />
            <FeatureItem 
              icon={Target}
              color="bg-pink-600 shadow-pink-200"
              title="Marketing Multi-canal"
              description="Automatisez vos ventes sur Instagram, WhatsApp et Email avec une segmentation intelligente par IA."
            />
            <FeatureItem 
              icon={Network}
              color="bg-emerald-600 shadow-emerald-200"
              title="Réseau B2B Fusion"
              description="Interconnectez vos flux avec d'autres entreprises. Idéal pour les partenariats restaurant + livreur."
            />
            <FeatureItem 
              icon={Truck}
              color="bg-orange-600 shadow-orange-200"
              title="Logistique & Delivery"
              description="Pipeline de livraison complet de type Uber Eats pour gérer vos propres coursiers ou prestataires."
            />
          </div>
        </div>
      </section>

      {/* Solutions Detail */}
      <section id="solutions" className="py-32 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1 relative">
               <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 relative z-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white"><Receipt className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black uppercase text-blue-600 tracking-widest">Facturation</p>
                        <p className="font-bold">Facture #FAC-2026-0045</p>
                      </div>
                      <Badge className="ml-auto bg-emerald-500 hover:bg-emerald-500 text-white border-none">PAYÉE</Badge>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><Bot className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest">IA Action</p>
                        <p className="font-bold italic">"Workflow relance automatique activé"</p>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-900 text-white">
                       <div className="flex justify-between items-end mb-4">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-50">Profitabilité</p>
                          <TrendingUp className="text-emerald-400 w-5 h-5" />
                       </div>
                       <p className="text-4xl font-black tracking-tighter">+24.5%</p>
                       <p className="text-xs mt-2 opacity-70">Vs le mois dernier</p>
                    </div>
                  </div>
               </div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-600/5 rounded-full blur-[100px] -z-0" />
            </div>
            <div className="order-1 lg:order-2 space-y-8">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-tight">
                La puissance d'un <span className="text-blue-600">ERP</span>, <br />
                la simplicité d'une <span className="text-blue-600">App</span>.
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">
                FusionBiz a été conçu pour supprimer la complexité technique. Chaque module communique nativement avec les autres pour créer un flux de données fluide et intelligent.
              </p>
              <ul className="space-y-4">
                {[
                  "Conformité légale KYB & RGPD automatique",
                  "Support multi-entreprises & multi-filiales",
                  "Interface ultra-rapide et responsive",
                  "Assistant IA disponible 24/7"
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 font-bold text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
              <Button size="lg" onClick={login} className="rounded-full px-10 h-14 font-black bg-slate-900 hover:bg-slate-800 text-white">
                Explorer les fonctionnalités <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Network Preview */}
      <section id="network" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-[40px] bg-slate-900 p-12 lg:p-24 relative overflow-hidden">
             <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-tight text-white">
                    Rejoignez le <span className="text-blue-500">réseau B2B</span> interconnecté.
                  </h2>
                  <p className="text-lg text-slate-400 font-medium leading-relaxed">
                    Le futur du business est collaboratif. FusionBiz permet aux entreprises de partager des processus en un clic. Un restaurant peut envoyer ses commandes directement sur l'interface de son partenaire livreur.
                  </p>
                  <Button size="lg" onClick={login} className="rounded-full px-10 h-14 font-black bg-blue-600 hover:bg-blue-700 text-white border-none">
                    Ouvrir mon réseau <Zap className="ml-2 w-4 h-4 fill-current" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-4">
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <Building2 className="w-8 h-8 text-blue-500 mb-4" />
                        <p className="text-white font-bold">12k+</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Entreprises</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-blue-600/10 border border-blue-500/20 backdrop-blur-xl">
                        <Share2 className="w-8 h-8 text-blue-500 mb-4" />
                        <p className="text-white font-bold">850k</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Flux partagés</p>
                      </div>
                   </div>
                   <div className="space-y-4 pt-8">
                      <div className="p-6 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/20">
                        <Handshake className="w-8 h-8 text-white mb-4" />
                        <p className="text-white font-bold">99%</p>
                        <p className="text-xs text-blue-200 uppercase tracking-widest font-black">Satisfaction</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl">
                        <Globe className="w-8 h-8 text-purple-500 mb-4" />
                        <p className="text-white font-bold">24/7</p>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Disponibilité</p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-10">
          <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
            Prêt à faire passer votre business au <span className="text-blue-600 text-glow">niveau supérieur</span> ?
          </h2>
          <p className="text-xl text-slate-500 font-bold">Pas de carte bancaire requise. Configuration en 2 minutes.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={login} className="w-full sm:w-auto rounded-full px-12 h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 text-white">
              Démarrer l'essai gratuit
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-12 h-16 text-xl font-bold border-2 bg-white">
              Parler à un expert
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter">FUSIONBIZ</span>
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                La plateforme de gestion nouvelle génération pour les entreprises qui exigent le meilleur.
              </p>
            </div>
            {[
              { title: "Produit", links: ["ERP", "Comptabilité", "IA Assistant", "Automatisations"] },
              { title: "Entreprise", links: ["À propos", "Blog", "Carrières", "Contact"] },
              { title: "Légal", links: ["Confidentialité", "Mentions légales", "CGU", "Cookies"] },
            ].map(col => (
              <div key={col.title} className="space-y-6">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-900">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-bold">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs font-bold text-slate-400">© 2026 FusionBiz Platform. Fabriqué avec passion pour les entrepreneurs.</p>
            <div className="flex items-center gap-6">
              <ShieldCheck className="w-5 h-5 text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <Globe className="w-5 h-5 text-slate-300 hover:text-blue-600 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
