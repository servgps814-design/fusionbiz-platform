import { useState, useEffect, useCallback } from 'react';
import { fusionbizAuth } from '@/lib/auth-enhanced';

const ADMIN_CLICK_THRESHOLD = 4;
const ADMIN_CLICK_TIMEOUT = 2000; // 2 seconds

export function useAdminMode() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const currentUser = fusionbizAuth.auth.getCurrentUser();
  const isSystemAdmin = currentUser?.isSystemAdmin ?? false;

  useEffect(() => {
    setIsAdminMode(fusionbizAuth.auth.isAdminMode());
  }, [currentUser]);

  const handleLogoClick = useCallback(() => {
    if (!isSystemAdmin) return;

    setClickCount((prev) => prev + 1);

    // Reset counter after timeout
    const timer = setTimeout(() => setClickCount(0), ADMIN_CLICK_TIMEOUT);

    // Check if threshold reached
    if (clickCount + 1 === ADMIN_CLICK_THRESHOLD) {
      fusionbizAuth.auth.toggleAdminMode();
      setIsAdminMode(!isAdminMode);
      setClickCount(0);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [clickCount, isSystemAdmin, isAdminMode]);

  return {
    isAdminMode: isAdminMode && isSystemAdmin,
    isSystemAdmin,
    handleLogoClick,
    clickCount: isSystemAdmin ? clickCount : 0,
  };
}

export default useAdminMode;
