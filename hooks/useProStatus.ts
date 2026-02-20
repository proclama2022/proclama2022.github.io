import { useState, useEffect } from 'react';
import { useProStore } from '@/stores/proStore';
import { checkProStatus, purchasePro, restorePurchases } from '@/services/purchaseService';
import { PurchaseError } from '@/types';

interface UseProStatusReturn {
  isPro: boolean;
  loading: boolean;
  purchase: () => Promise<{ success: boolean; error?: PurchaseError }>;
  restore: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
}

export function useProStatus(): UseProStatusReturn {
  const isPro = useProStore((state) => state.isPro);
  const [loading, setLoading] = useState(false);

  // Verify Pro status on mount
  useEffect(() => {
    checkProStatus().catch((error) => {
      console.error('Failed to check Pro status on mount:', error);
    });
  }, []);

  const purchase = async (): Promise<{ success: boolean; error?: PurchaseError }> => {
    setLoading(true);
    try {
      const result = await purchasePro();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const restore = async (): Promise<boolean> => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async (): Promise<void> => {
    await checkProStatus();
  };

  return {
    isPro,
    loading,
    purchase,
    restore,
    refreshStatus,
  };
}
