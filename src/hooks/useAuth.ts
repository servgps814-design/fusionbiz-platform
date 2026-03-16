import { useEffect, useState } from 'react';
import { localAuth, type LocalUser } from '../lib/localAuth';

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = localAuth.auth.onAuthStateChanged((state) => {
      setUser(state.user);
      setLoading(state.isLoading);
    });
    setLoading(false);
    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login: (email?: string, password?: string) => localAuth.auth.login(email, password),
    logout: () => localAuth.auth.signOut(),
  };
}
