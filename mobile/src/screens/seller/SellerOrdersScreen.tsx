import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchSellerOrders, getNextOrderStatus, type SellerOrder, updateOrderStatus } from '../../lib/api/seller';
import type { OrderStatus } from '../../lib/types';
import { C, S, R, T } from '../../lib/theme';

const FILTERS: (OrderStatus | 'All')[] = ['All', 'paid', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid:      { bg: C.card2, color: C.rose },
  packed:    { bg: '#fef3c7', color: '#92400e' },
  shipped:   { bg: '#dbeafe', color: '#1e40af' },
  out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' },
  delivered: { bg: '#d1fae5', color: '#065f46' },
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
          const st = STATUS_COLORS[item.order_status] ?? { bg: '#f3f4f6', color: C.muted };
          const nextStatusLabel = getNextOrderStatus(item.order_status);
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={T.h4}>{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={[T.caption, { marginTop: 2 }]}>{new Date(item.placed_at).toLocaleDateString('en-IN')}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{item.order_status}</Text>
                </View>
              </View>
              <View style={styles.cardMid}>
                <Text style={T.body} numberOfLines={1}>{item.buyer_name}</Text>
                <Text style={[T.bodySmall, { color: C.text3 }]} numberOfLines={1}>
                  {item.items.length} item{item.items.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.cardBottom}>
                <Text style={T.price}>₹{item.total_amount.toLocaleString()}</Text>
                {nextStatusLabel && (
                  <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => handleAdvanceStatus(item)}>
                    <Text style={styles.actionBtnText}>Mark {nextStatusLabel.replace(/_/g, ' ')}</Text>
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
  container: { flex: 1, backgroundColor: C.white },
  filters: { paddingHorizontal: S.lg, paddingVertical: S.sm, gap: S.sm },
  filterChip: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.full, paddingHorizontal: S.md, paddingVertical: S.xs + 1, backgroundColor: C.white },
  filterChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  filterText: { fontSize: 13, fontWeight: '600', color: C.muted },
  filterTextActive: { color: C.white },
  list: { paddingHorizontal: S.lg, paddingBottom: S.xxl, gap: S.sm },
  card: { backgroundColor: C.white, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: S.md, gap: S.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statusPill: { borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMid: { gap: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: S.xs, borderTopWidth: 1, borderColor: C.border },
  actionBtn: { backgroundColor: C.rose, borderRadius: R.sm, paddingHorizontal: S.md, paddingVertical: 6 },
  actionBtnText: { color: C.white, fontSize: 12, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
});
