import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Building2, Upload, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';
import { useCompany } from '@/hooks/useCompany';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const OnboardingPage = () => {
  const { user } = useAuth();
  const { refreshCompany } = useCompany();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    siret: '',
    address: '',
    legalStatus: 'SAS',
  });

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.siret.length !== 14) {
      toast.error('Le numéro SIRET doit comporter 14 chiffres.');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const companyId = `comp_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create company record
      await blink.db.companies.create({
        id: companyId,
        userId: user?.id,
        name: formData.companyName,
        siret: formData.siret,
        legalStatus: formData.legalStatus,
        address: formData.address,
        isVerified: "0",
      });

      // Assign admin role
      await blink.db.userRoles.create({
        id: `role_${Math.random().toString(36).substr(2, 9)}`,
        userId: user?.id,
        companyId: companyId,
        role: 'admin',
      });

      // Create public business listing automatically
      await blink.db.publicBusinessListing.create({
        id: `pub_${companyId}`,
        companyId: companyId,
        businessType: formData.legalStatus || 'SME',
        description: `Entreprise ${formData.companyName} spécialisée dans son secteur.`,
        isPublic: "1"
      });

      await refreshCompany();
      toast.success('Dossier envoyé avec succès ! Notre équipe va valider vos documents.');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue lors de la création de votre entreprise.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* ── Brand Header ── */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span
            className="text-2xl font-black tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(235,85%,72%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ORBiS
          </span>
        </div>

        {/* ── Step progress ── */}
        <div className="relative mb-12">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-primary transition-all duration-500 -translate-y-1/2"
            style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
          />
          <div className="relative flex justify-between items-center px-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-4',
                  step >= s
                    ? 'bg-primary text-white border-primary'
                    : 'bg-muted text-muted-foreground border-muted',
                )}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* ── Step 1: Company identity ── */}
        {step === 1 && (
          <Card className="glass border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                Identité de l'entreprise
              </CardTitle>
              <CardDescription>
                Commençons par les informations de base de votre structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="font-bold">
                    Nom de l'entreprise
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: ORBiS Tech"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret" className="font-bold">
                    Numéro SIRET
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
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    Numéro d'identification légal requis pour la vérification KYC.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="font-bold">
                    Adresse du siège
                  </Label>
                  <Input
                    id="address"
                    placeholder="Adresse complète"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
                >
                  Continuer <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Legal documents ── */}
        {step === 2 && (
          <Card className="glass border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                Documents Légaux
              </CardTitle>
              <CardDescription>
                Pour finaliser votre inscription, nous avons besoin de vos justificatifs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold">KBIS (Moins de 3 mois)</p>
                  <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (Max 10MB)</p>
                </div>
                <div className="p-4 rounded-xl border-2 border-dashed border-border flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold">Pièce d'identité du gérant</p>
                  <p className="text-xs text-muted-foreground">Recto/Verso obligatoire</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl font-bold"
                >
                  Retour
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-[2] h-12 rounded-xl font-bold bg-primary shadow-lg shadow-primary/20"
                >
                  Valider les documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Compliance ── */}
        {step === 3 && (
          <Card className="glass border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-black tracking-tighter uppercase">
                Conformité &amp; Sécurité
              </CardTitle>
              <CardDescription>
                Dernière étape avant l'accès à votre plateforme ORBiS.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
                  <p className="text-sm font-medium">
                    En validant, vous certifiez l'exactitude des informations fournies
                    conformément à la réglementation KYB européenne.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="terms" className="w-4 h-4 rounded border-border" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    J'accepte les conditions générales d'utilisation et la politique de
                    confidentialité.
                  </label>
                </div>
              </div>
              <Button
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full h-14 rounded-xl text-lg font-black bg-primary shadow-xl shadow-primary/20"
              >
                {loading ? 'Création en cours...' : 'Activer mon compte Entreprise'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
