import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchWishlist, toggleWishlist } from '../lib/api/buyer';
import { useAuth } from './AuthContext';

interface WishlistEntry {
  product_id: string;
  product?: {
    id: string;
    name: string;
    price: number;
    product_images?: { id: string; image_url: string }[];
  } | null;
}

interface WishlistContextValue {
  wishlist: WishlistEntry[];
  loading: boolean;
  refresh: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

export function WishlistProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!session?.user) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchWishlist(session.user.id);
      setWishlist((data ?? []) as WishlistEntry[]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load wishlist', error);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const toggle = useCallback(async (productId: string) => {
    if (!session?.user) return;
    await toggleWishlist(session.user.id, productId);
    await refresh();
  }, [session?.user, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <WishlistContext.Provider value={{ wishlist, loading, refresh, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
