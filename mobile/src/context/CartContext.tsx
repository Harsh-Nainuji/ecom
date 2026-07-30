import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItemWithProduct } from '../lib/types';
import { fetchCart, removeCartItem, updateCartItem } from '../lib/api/buyer';
import { useAuth } from './AuthContext';

interface CartContextValue {
  items: CartItemWithProduct[];
  loading: boolean;
  refresh: () => Promise<void>;
  setQuantity: (variantId: string, quantity: number) => Promise<void>;
  addToCart: (variantId: string, quantity?: number, productId?: string) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [items, setItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchCart(session.user.id);
      setItems(data ?? []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load cart', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const setQuantity = useCallback(async (variantId: string, quantity: number) => {
    if (!session?.user) return;
    await updateCartItem(session.user.id, variantId, quantity);
    await refresh();
  }, [session?.user, refresh]);

  const addToCart = useCallback(async (variantId: string, quantity: number = 1, productId?: string) => {
    if (!session?.user) return;
    const existing = items.find((item) => item.variant_id === variantId || (productId && item.product_variant?.product?.id === productId));
    const newQty = (existing?.quantity ?? 0) + quantity;
    await updateCartItem(session.user.id, variantId, newQty, productId);
    await refresh();
  }, [session?.user, items, refresh]);

  const remove = useCallback(async (variantId: string) => {
    if (!session?.user) return;
    await removeCartItem(session.user.id, variantId);
    await refresh();
  }, [session?.user, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh, session?.user?.id]);

  return (
    <CartContext.Provider value={{ items, loading, refresh, setQuantity, addToCart, remove }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
