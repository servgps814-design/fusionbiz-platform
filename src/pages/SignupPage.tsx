import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fusionbizAuth } from '@/lib/auth-enhanced';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Globe, FileText,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'user' | 'company' | 'confirm'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userData, setUserData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    displayName: '',
  });

  const [companyData, setCompanyData] = useState({
    name: '',
    industry: '',
    siret: '',
    legalStatus: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    phone: '',
    website: '',
  });

  const handleUserNext = () => {
    if (!userData.email || !userData.password || !userData.displayName) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    if (userData.password !== userData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (userData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setError('');
    setStep('company');
  };

  const handleCompanyNext = () => {
    if (!companyData.name || !companyData.industry || !companyData.address) {
      setError('Tous les champs marqués * sont obligatoires');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await fusionbizAuth.auth.signup(
        userData.email,
        userData.password,
        userData.displayName,
        companyData
      );

      // Auto-login
      await fusionbizAuth.auth.login(userData.email, userData.password);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-white gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Rejoignez FusionBiz</h1>
            <p className="text-slate-400 mt-2">Créez un compte pour votre entreprise en 3 étapes simples</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-slate-700 bg-slate-800/30">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <div className="flex gap-4">
            {(['user', 'company', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    (step === s || (['user', 'company'].includes(s) && step === 'confirm'))
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {i + 1}
                </div>
                {i < 2 && <div className="w-8 h-0.5 bg-slate-700"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Step 1: User Info */}
          {step === 'user' && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Vos informations personnelles</CardTitle>
                <CardDescription>Créez votre compte administrateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex gap-3 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nom complet *</label>
                  <Input
                    type="text"
                    placeholder="Ex: Jean Dupont"
                    value={userData.displayName}
                    onChange={(e) => setUserData({ ...userData, displayName: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email *</label>
                  <Input
                    type="email"
                    placeholder="Ex: jean@company.com"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Mot de passe *</label>
                  <Input
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={userData.password}
                    onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Confirmer mot de passe *</label>
                  <Input
                    type="password"
                    placeholder="Répétez votre mot de passe"
                    value={userData.passwordConfirm}
                    onChange={(e) => setUserData({ ...userData, passwordConfirm: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <Button onClick={handleUserNext} className="w-full bg-purple-600 hover:bg-purple-700">
                  Suivant: Informations entreprise
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Company Info */}
          {step === 'company' && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Informations de votre entreprise</CardTitle>
                <CardDescription>Détails nécessaires pour l'approbation de votre compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex gap-3 text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Nom entreprise *</label>
                    <Input
                      placeholder="Ex: TechCorp SAS"
                      value={companyData.name}
                      onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Secteur d'activité *</label>
                    <Input
                      placeholder="Ex: Logiciels"
                      value={companyData.industry}
                      onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">SIRET</label>
                    <Input
                      placeholder="Ex: 12345678900123"
                      value={companyData.siret}
                      onChange={(e) => setCompanyData({ ...companyData, siret: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Statut juridique</label>
                    <Input
                      placeholder="Ex: SAS, SARL, etc"
                      value={companyData.legalStatus}
                      onChange={(e) => setCompanyData({ ...companyData, legalStatus: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Adresse *</label>
                  <Input
                    placeholder="Ex: 123 Rue de Paris"
                    value={companyData.address}
                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                    className="bg-slate-600 border-slate-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Ville</label>
                    <Input
                      placeholder="Paris"
                      value={companyData.city}
                      onChange={(e) => setCompanyData({ ...companyData, city: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Code Postal</label>
                    <Input
                      placeholder="75001"
                      value={companyData.postalCode}
                      onChange={(e) => setCompanyData({ ...companyData, postalCode: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Pays</label>
                    <Input
                      placeholder="France"
                      value={companyData.country}
                      onChange={(e) => setCompanyData({ ...companyData, country: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Téléphone</label>
                    <Input
                      placeholder="+33612345678"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Site web</label>
                    <Input
                      placeholder="https://company.com"
                      value={companyData.website}
                      onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                      className="bg-slate-600 border-slate-500 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('user')}
                    variant="outline"
                    className="flex-1"
                  >
                    Précédent
                  </Button>
                  <Button
                    onClick={handleCompanyNext}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    Vérifier et créer compte
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {step === 'confirm' && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardHeader>
                <CardTitle>Confirmation des informations</CardTitle>
                <CardDescription>Vérifiez avant de créer votre compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-slate-600/50 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">Votre compte</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nom</span>
                        <span className="font-semibold">{userData.displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold">{userData.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-600/50 rounded-lg">
                    <h3 className="font-semibold text-white mb-3">Votre entreprise</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nom</span>
                        <span className="font-semibold">{companyData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Secteur</span>
                        <span className="font-semibold">{companyData.industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Adresse</span>
                        <span className="font-semibold">{companyData.address}, {companyData.city}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300">
                        <strong>Important :</strong> Votre compte sera en attente d'approbation par notre équipe. Vous recevrez un email de confirmation.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('company')}
                    variant="outline"
                    className="flex-1"
                  >
                    Modifier
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? 'Création...' : 'Créer mon compte'}
                  </Button>
                </div>

                <p className="text-center text-sm text-slate-400">
                  Vous avez déjà un compte?{' '}
                  <Link to="/" className="text-purple-400 hover:text-purple-300 font-semibold">
                    Se connecter
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default SignupPage;
