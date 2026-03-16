import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2, Upload, CheckCircle2, ShieldCheck, ArrowRight,
  ChevronRight, Zap,
} from 'lucide-react';
import { localAuth } from '@/lib/localAuth';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEP_LABELS = ['Identité', 'Documents', 'Activation'];

const LEGAL_STATUS_OPTIONS = [
  { value: 'SAS', label: 'SAS — Société par actions simplifiée' },
  { value: 'SARL', label: 'SARL — Société à responsabilité limitée' },
  { value: 'SNC', label: 'SNC — Société en nom collectif' },
  { value: 'EURL', label: 'EURL — Entreprise unipersonnelle à responsabilité limitée' },
  { value: 'Auto-entrepreneur', label: 'Auto-entrepreneur / Micro-entreprise' },
  { value: 'Autre', label: 'Autre forme juridique' },
];

export const OnboardingPage = () => {
  const { user } = useAuth();
  const { refreshCompany } = useCompany();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    address: '',
    legalStatus: 'SAS',
  });

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.companyName.trim().length < 2) {
      toast.error('Veuillez saisir le nom de votre entreprise.');
      return;
    }
    if (formData.siret.length !== 14) {
      toast.error('Le numéro SIRET doit comporter exactement 14 chiffres.');
      return;
    }
    if (formData.address.trim().length < 5) {
      toast.error('Veuillez saisir une adresse valide.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Veuillez accepter les conditions générales d'utilisation.");
      return;
    }

    setLoading(true);
    try {
      const companyId = `comp_${Math.random().toString(36).substr(2, 9)}`;

      await localAuth.db.companies.create({
        id: companyId,
        userId: user!.id,
        name: formData.companyName,
        siret: formData.siret,
        legalStatus: formData.legalStatus,
        address: formData.address,
        isVerified: '0',
      });

      await localAuth.db.userRoles.create({
        id: `role_${Math.random().toString(36).substr(2, 9)}`,
        userId: user!.id,
        companyId: companyId,
        role: 'admin',
      });

      await refreshCompany();
      toast.success('Bienvenue sur ORBiS ! Votre espace est prêt.');
      navigate('/dashboard');
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #07071f 0%, #0d0d2e 50%, #0a0a24 100%)' }}
    >
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, hsl(235 85% 55% / 0.15), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="max-w-lg w-full relative">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-2xl font-black tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #e2e8ff, #a5b4fc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ORBiS
          </span>
        </div>

        {/* Step progress */}
        <div className="relative mb-10">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          />
          <div className="relative flex justify-between items-start">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2 z-10',
                    step > s
                      ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent text-white shadow-lg shadow-indigo-500/30'
                      : step === s
                      ? 'bg-[#0d0d2e] border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/20'
                      : 'bg-[#0d0d2e] border-white/15 text-white/30',
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                <span
                  className={cn(
                    'text-xs font-semibold transition-colors duration-300',
                    step >= s ? 'text-indigo-300/70' : 'text-white/20',
                  )}
                >
                  {STEP_LABELS[s - 1]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <Card className="border border-white/10 bg-[#0d0d2e]/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter text-white">
                Identité de l'entreprise
              </CardTitle>
              <CardDescription className="text-indigo-300/50">
                Commençons par les informations de base de votre structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="font-semibold text-indigo-200/80 text-sm">
                    Nom de l'entreprise <span className="text-indigo-400">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Ex : ORBiS Tech SAS"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-indigo-500/60 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalStatus" className="font-semibold text-indigo-200/80 text-sm">
                    Forme juridique <span className="text-indigo-400">*</span>
                  </Label>
                  <Select
                    value={formData.legalStatus}
                    onValueChange={(val) => setFormData({ ...formData, legalStatus: val })}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10 text-white focus:border-indigo-500/60 focus:ring-indigo-500/20">
                      <SelectValue placeholder="Sélectionnez votre forme juridique" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d0d2e] border-white/10">
                      {LEGAL_STATUS_OPTIONS.map(({ value, label }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className="text-indigo-100/80 focus:bg-indigo-500/15 focus:text-white"
                        >
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="siret" className="font-semibold text-indigo-200/80 text-sm">
                    Numéro SIRET <span className="text-indigo-400">*</span>
                  </Label>
                  <Input
                    id="siret"
                    placeholder="14 chiffres"
                    required
                    maxLength={14}
                    value={formData.siret}
                    onChange={(e) =>
                      setFormData({ ...formData, siret: e.target.value.replace(/\D/g, '') })
                    }
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-indigo-500/60 focus:ring-indigo-500/20 font-mono tracking-wider"
                  />
                  <p className="text-xs text-indigo-400/40">
                    {formData.siret.length}/14 chiffres
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="font-semibold text-indigo-200/80 text-sm">
                    Adresse du siège social <span className="text-indigo-400">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Ex : 15 Rue de la Paix, 75001 Paris"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-11 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-indigo-500/60 focus:ring-indigo-500/20"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border-0 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] mt-2"
                >
                  Continuer
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <Card className="border border-white/10 bg-[#0d0d2e]/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter text-white">
                Documents Légaux
              </CardTitle>
              <CardDescription className="text-indigo-300/50">
                Facultatif — vous pouvez les ajouter plus tard.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center gap-2 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer group">
                <Upload className="w-5 h-5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <p className="text-sm font-bold text-white/60 group-hover:text-indigo-200 transition-colors">KBIS (Moins de 3 mois)</p>
                <p className="text-xs text-white/25">PDF, JPG ou PNG · Max 10 Mo</p>
              </div>
              <div className="p-5 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center gap-2 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer group">
                <Upload className="w-5 h-5 text-white/30 group-hover:text-indigo-400 transition-colors" />
                <p className="text-sm font-bold text-white/60 group-hover:text-indigo-200 transition-colors">Pièce d'identité du gérant</p>
                <p className="text-xs text-white/25">Recto/Verso obligatoire</p>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-300/60">
                  Ces documents sont nécessaires pour la vérification KYB. Vous pouvez les soumettre après création de votre compte.
                </p>
              </div>
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-11 rounded-xl font-semibold border-white/10 text-indigo-300/70 hover:bg-white/5 hover:text-white bg-transparent"
                >
                  Retour
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-[2] h-11 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border-0 text-white shadow-lg shadow-indigo-500/25"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <button
                onClick={() => setStep(3)}
                className="w-full text-center text-xs text-indigo-400/50 hover:text-indigo-300/70 transition-colors py-1 underline underline-offset-2"
              >
                Passer cette étape — ajouter plus tard
              </button>
            </CardContent>
          </Card>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <Card className="border border-white/10 bg-[#0d0d2e]/80 backdrop-blur-xl shadow-2xl shadow-black/40">
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter text-white">
                Conformité &amp; Activation
              </CardTitle>
              <CardDescription className="text-indigo-300/50">
                Dernière étape avant l'accès à votre plateforme ORBiS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-2xl bg-white/4 border border-white/8 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-400/60 mb-3">Récapitulatif</p>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-300/50">Entreprise</span>
                  <span className="text-white font-semibold">{formData.companyName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-300/50">Forme juridique</span>
                  <span className="text-white font-semibold">{formData.legalStatus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-300/50">SIRET</span>
                  <span className="text-white font-mono text-xs">{formData.siret}</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-500/8 border border-indigo-500/15">
                <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-200/60">
                  En validant, vous certifiez l'exactitude des informations fournies conformément à la réglementation KYB européenne.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 mt-0.5 accent-indigo-500 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-indigo-300/60 cursor-pointer leading-relaxed">
                  J'accepte les{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    conditions générales d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a href="#" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                    politique de confidentialité
                  </a>.
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-12 px-5 rounded-xl font-semibold border-white/10 text-indigo-300/70 hover:bg-white/5 hover:text-white bg-transparent"
                >
                  Retour
                </Button>
                <Button
                  onClick={handleFinalSubmit}
                  disabled={loading || !termsAccepted}
                  className="flex-1 h-12 rounded-xl font-black text-base bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 border-0 text-white shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Création en cours...
                    </span>
                  ) : (
                    <>
                      Activer mon compte
                      <Zap className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-indigo-400/30 mt-6">
          Vos données sont hébergées en France · Chiffrement TLS · RGPD natif
        </p>
      </div>
    </div>
  );
};
