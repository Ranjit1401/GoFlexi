import { api } from './api-client';
import { payTrip } from './trips';

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  theme?: {
    color?: string;
  };
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler: (response: RazorpayResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayInstance {
  open: () => void;
  close?: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

/**
 * Ensures Razorpay Checkout script is loaded.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptId = 'razorpay-checkout-script';
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK from checkout.razorpay.com');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export interface InitiatePaymentParams {
  amount: number;
  tripId?: string;
  title: string;
  destination: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  } | null;
  onSuccess: (paymentId: string) => void | Promise<void>;
  onError: (errorMessage: string) => void;
  onDismiss?: () => void;
}

/**
 * Initiates Razorpay payment end-to-end:
 * 1. Checks/loads script
 * 2. Calls backend /api/payments/create-order
 * 3. Launches Razorpay Checkout modal
 * 4. Verifies signature on backend /api/payments/verify
 * 5. Settles trip payment status
 */
export const initiateRazorpayPayment = async ({
  amount,
  tripId,
  title,
  destination,
  user,
  onSuccess,
  onError,
  onDismiss,
}: InitiatePaymentParams): Promise<void> => {
  try {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      throw new Error('Razorpay payment gateway failed to load. Please check your internet connection.');
    }

    // 1. Create order on backend
    const normalizedAmount = Math.max(1, Math.round(Number(amount) || 100));
    const receipt = `goflexi_${tripId ? tripId.slice(0, 8) : 'order'}_${Date.now()}`;

    const orderRes = await api.post<{
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
    }>('/payments/create-order', {
      amount: normalizedAmount,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      trip_id: tripId,
      notes: {
        trip_title: title,
        destination: destination,
      },
    });

    const order = orderRes.data;
    if (!order || !order.order_id || !order.key_id) {
      throw new Error('Failed to create Razorpay payment order.');
    }

    // 2. Open Razorpay Checkout modal
    const options: RazorpayCheckoutOptions = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency || 'INR',
      name: 'GoFlexi Travel',
      description: `${title} (${destination})`,
      order_id: order.order_id,
      theme: {
        color: '#0d9488', // Emerald/teal branding
      },
      prefill: {
        name: user?.name || 'Traveler',
        email: user?.email || 'traveler@goflexi.com',
      },
      notes: {
        trip_id: tripId || '',
        destination: destination,
      },
      handler: async (response: RazorpayResponse) => {
        try {
          // 3. Verify payment signature on backend
          await api.post('/payments/verify', {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            trip_id: tripId,
          });

          // 4. Update trip payment in backend if tripId exists
          if (tripId) {
            try {
              await payTrip(tripId);
            } catch (payErr) {
              console.warn('Trip settlement already recorded:', payErr);
            }
          }

          // 5. Invoke success callback
          await onSuccess(response.razorpay_payment_id);
        } catch (verifyError: any) {
          const msg =
            verifyError?.response?.data?.detail ||
            verifyError?.message ||
            'Payment verification failed on the server.';
          onError(msg);
        }
      },
      modal: {
        ondismiss: () => {
          if (onDismiss) onDismiss();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: any) {
    const errorMsg =
      err?.response?.data?.detail ||
      err?.message ||
      'Could not initiate payment. Please try again.';
    onError(errorMsg);
  }
};
