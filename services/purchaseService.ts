import Purchases from 'react-native-purchases';
import { useProStore } from '@/stores/proStore';
import { PurchaseError } from '@/types';

const ENTITLEMENT_ID = 'no_ads';
const OFFERING_ID = 'default';

let isConfigured = false;

export async function initPurchases(): Promise<void> {
  if (isConfigured) {
    return;
  }

  try {
    const apiKey = process.env.REVENUECAT_API_KEY;
    if (!apiKey || apiKey === 'pub_YOUR_KEY_HERE') {
      console.warn('RevenueCat API key not configured. Skipping initialization.');
      return;
    }

    await Purchases.configure({ apiKey });
    isConfigured = true;
    console.log('RevenueCat initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RevenueCat:', error);
    throw error;
  }
}

export async function checkProStatus(): Promise<boolean> {
  try {
    if (!isConfigured) {
      // Return cached status if not configured
      return useProStore.getState().isPro;
    }

    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    // Update store with latest status
    useProStore.getState().setIsPro(isPro);
    useProStore.getState().setLastVerified(new Date().toISOString());

    return isPro;
  } catch (error) {
    console.error('Failed to check Pro status:', error);
    // Return cached status on error
    return useProStore.getState().isPro;
  }
}

export async function purchasePro(): Promise<{ success: boolean; error?: PurchaseError }> {
  try {
    if (!isConfigured) {
      return {
        success: false,
        error: { type: 'unknown', message: 'RevenueCat not configured' }
      };
    }

    const offerings = await Purchases.getOfferings();
    const product = offerings.current?.availableProducts[0];

    if (!product) {
      return {
        success: false,
        error: { type: 'product_not_available' }
      };
    }

    const { customerInfo } = await Purchases.purchaseProduct(product.identifier);
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (isPro) {
      useProStore.getState().setIsPro(true);
      useProStore.getState().setLastVerified(new Date().toISOString());
    }

    return { success: isPro };
  } catch (error: any) {
    // Handle user cancelled
    if (error?.userCancelled) {
      return {
        success: false,
        error: { type: 'user_cancelled' }
      };
    }

    // Handle network errors
    if (error?.message?.toLowerCase().includes('network')) {
      return {
        success: false,
        error: { type: 'network_error', message: error.message || 'Network error' }
      };
    }

    // Handle other errors
    return {
      success: false,
      error: { type: 'unknown', message: error?.message || 'Unknown error' }
    };
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    if (!isConfigured) {
      return false;
    }

    const customerInfo = await Purchases.restorePurchases();
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

    if (isPro) {
      useProStore.getState().setIsPro(true);
      useProStore.getState().setLastVerified(new Date().toISOString());
    }

    return isPro;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return false;
  }
}
