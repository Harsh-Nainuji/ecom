import { Platform } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';

export interface OpenRazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
}

export interface RazorpayPaymentSuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Universal Razorpay Checkout Helper
 * Handles real Razorpay keys AND dev test fallback mode cleanly.
 */
export function openRazorpayCheckout(options: OpenRazorpayOptions): Promise<RazorpayPaymentSuccess> {
  return new Promise((resolve, reject) => {
    // 1. Check if mock test mode applies (placeholder key or mock order ID)
    const isMockKey = !options.key || options.key === 'rzp_test_5678' || options.key.length < 12;
    const isMockOrder = options.order_id.startsWith('order_test_');

    if (isMockKey || isMockOrder) {
      if (Platform.OS === 'web') {
        const confirmPayment = typeof window !== 'undefined'
          ? window.confirm(
              `FabZone Payment Gateway (Test Mode):\n\nTotal Amount: ₹${(options.amount / 100).toFixed(0)}\nOrder Reference: ${options.order_id}\n\nClick OK to simulate a successful payment, or Cancel to abort.`
            )
          : true;

        if (confirmPayment) {
          return resolve({
            razorpay_order_id: options.order_id,
            razorpay_payment_id: `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            razorpay_signature: `sig_test_${Date.now()}`,
          });
        } else {
          return reject({ description: 'Payment cancelled by user' });
        }
      } else {
        // Simulate successful checkout in dev mock mode for native platforms
        return resolve({
          razorpay_order_id: options.order_id,
          razorpay_payment_id: `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          razorpay_signature: `sig_test_${Date.now()}`,
        });
      }
    }

    // 2. Real Razorpay SDK Integration
    if (Platform.OS === 'web') {
      const loadScript = (): Promise<boolean> => {
        return new Promise((res) => {
          if (typeof window !== 'undefined' && (window as any).Razorpay) {
            return res(true);
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => res(true);
          script.onerror = () => res(false);
          document.body.appendChild(script);
        });
      };

      loadScript()
        .then((loaded) => {
          if (!loaded) {
            return reject(new Error('Failed to load Razorpay Web Checkout SDK script. Please check connection.'));
          }

          const rzpOptions = {
            ...options,
            handler: function (response: any) {
              resolve({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
            },
            modal: {
              ondismiss: function () {
                reject({ description: 'Payment process cancelled by user' });
              },
            },
          };

          const razorpayInstance = new (window as any).Razorpay(rzpOptions);
          razorpayInstance.open();
        })
        .catch((err) => reject(err));
    } else {
      RazorpayCheckout.open(options)
        .then((res: any) => {
          resolve({
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,
          });
        })
        .catch((err: any) => reject(err));
    }
  });
}
