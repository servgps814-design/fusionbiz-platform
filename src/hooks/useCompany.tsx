import React, { createContext, useContext, useEffect, useState } from 'react';
import { blink } from '@/lib/blink';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  name: string;
  siret: string;
  isVerified: number | string;
  address?: string;
  legalStatus?: string;
  logoUrl?: string;
}

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompany = async () => {
    if (!user) {
      setCompany(null);
      setLoading(false);
      return;
    }

    try {
      const roles = await blink.db.userRoles.list({ where: { userId: user.id } });
      if (roles.length > 0) {
        const companyId = roles[0].companyId;
        const companyData = await blink.db.companies.get(companyId);
        setCompany(companyData as any);
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [user]);

  return (
    <CompanyContext.Provider value={{ company, loading, refreshCompany: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
