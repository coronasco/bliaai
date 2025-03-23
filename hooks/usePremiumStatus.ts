import { useEffect, useState } from 'react';
import { app } from '@/lib/firebase';
import { getPremiumStatus } from './getPremiumStatus';
import { useAuth } from './useAuth';

export function usePremiumStatus() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkPremiumStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const status = await getPremiumStatus(app);
        setIsPremium(!!status);
      } catch (err) {
        console.error("Error checking premium status:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsPremium(false);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  return { isPremium, loading, error };
} 