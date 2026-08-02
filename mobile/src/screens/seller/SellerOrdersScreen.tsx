import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchSellerOrders, getNextOrderStatus, type SellerOrder, updateOrderStatus } from '../../lib/api/seller';
import type { OrderStatus } from '../../lib/types';
import { C, S, R, T } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

const FILTERS: (OrderStatus | 'All')[] = ['All', 'pending', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:    { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  paid:      { bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' },
  packed:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  shipped:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  out_for_delivery: { bg: '#faf5ff', color: '#8b5cf6', border: '#e9d5ff' },
  delivered: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

export function SellerOrdersScreen() {
  const { session, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'All'>('All');
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    setLoading(true);
    try {
      const data = await fetchSellerOrders(session.user.id, activeFilter === 'All' ? undefined : activeFilter);
      setOrders(data ?? []);
      setError(null);
    } catch (err) {
      console.warn('Seller orders load failed', err);
      setOrders([]);
      setError('Unable to load orders. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role, activeFilter]);

  useEffect(() => { load(); }, [load]);

  // Real-time listener for orders table updates
  useEffect(() => {
    if (!session?.user?.id || profile?.role !== 'seller') return;

    const channel = supabase
      .channel(`seller-orders-channel-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${session.user.id}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, profile?.role, load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Seller Orders" subtitle="Sign in to view your orders." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="Seller Orders" subtitle="Switch to a seller account to access this section." />;
  }

  const handleAdvanceStatus = async (order: SellerOrder) => {
    const next = getNextOrderStatus(order.order_status);
    if (!next || next === 'cancelled') return;
    setLoading(true);
    try {
      await updateOrderStatus(order.id, next);
      await load();
    } catch (err) {
      console.warn('Update order status failed', err);
      setError('Failed to update order status.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => setActiveFilter(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item === 'All' ? 'All' : item.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => {
          const st = STATUS_COLORS[item.order_status] ?? { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
          const nextStatusLabel = getNextOrderStatus(item.order_status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>#ORD-{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>Placed on {new Date(item.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg, borderColor: st.border }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>
                    {item.order_status.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardMid}>
                <View style={styles.buyerRow}>
                  <Text style={styles.buyerLabel}>Customer</Text>
                  <Text style={styles.buyerName} numberOfLines={1}>{item.buyer_name}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.itemsLabel}>Order Details</Text>
                  <Text style={styles.itemsVal} numberOfLines={1}>
                    {item.items.length} item{item.items.length !== 1 ? 's' : ''} • Ref: {item.items[0]?.productName || 'Generic'}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.totalLabel}>Total Payout</Text>
                  <Text style={styles.totalPrice}>₹{item.total_amount.toLocaleString()}</Text>
                </View>
                {nextStatusLabel && (
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => handleAdvanceStatus(item)}>
                    <Text style={styles.actionBtnText}>Mark as {nextStatusLabel.replace(/_/g, ' ')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={C.pink} />
          ) : (
            <View style={styles.empty}>
              <Text style={T.h4}>{error ? 'Unable to load orders' : 'No orders in this filter'}</Text>
              {error ? <Text style={[T.caption, { color: C.error, marginTop: S.xs }]}>{error}</Text> : null}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF8F9' },
  filters: { paddingHorizontal: S.lg, paddingVertical: S.sm, gap: S.sm },
  filterChip: { borderWidth: 1, borderColor: C.border, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs + 1, backgroundColor: C.white },
  filterChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  filterText: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterTextActive: { color: C.white },
  list: { paddingHorizontal: S.lg, paddingBottom: S.xxl, gap: S.md },
  card: { 
    backgroundColor: C.white, 
    borderRadius: R.xl, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: S.md,
    shadowColor: C.pink,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: S.sm
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { ...T.h4, color: C.text, fontSize: 15, fontWeight: '800' },
  orderDate: { ...T.caption, color: C.muted, marginTop: 2 },
  statusPill: { borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F0E4E7' },
  cardMid: { gap: S.xs },
  buyerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerLabel: { ...T.caption, color: C.muted },
  buyerName: { ...T.bodySmall, fontWeight: '700', color: C.text2 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsLabel: { ...T.caption, color: C.muted },
  itemsVal: { ...T.bodySmall, color: C.text3 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: S.xs },
  totalLabel: { ...T.caption, color: C.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalPrice: { ...T.price, fontSize: 18, color: C.text },
  actionBtn: { backgroundColor: C.rose, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: 8, elevation: 1 },
  actionBtnText: { color: C.white, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: 60 },
});
