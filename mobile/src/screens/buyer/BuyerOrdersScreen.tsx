import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchOrders } from '../../lib/api/buyer';
import type { OrderSummary } from '../../lib/types';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { C, S, R, T } from '../../lib/theme';

function statusStyle(status: string): { label: string; bg: string; color: string } {
  switch (status) {
    case 'delivered':        return { label: 'Delivered',        bg: '#d1fae5', color: '#065f46' };
    case 'shipped':          return { label: 'Shipped',          bg: '#dbeafe', color: '#1e40af' };
    case 'out_for_delivery': return { label: 'Out for Delivery', bg: '#ede9fe', color: '#5b21b6' };
    case 'packed':           return { label: 'Packed',           bg: '#fef3c7', color: '#92400e' };
    case 'paid':             return { label: 'Confirmed',        bg: C.card2,   color: C.rose  };
    case 'cancelled':        return { label: 'Cancelled',        bg: '#fee2e2', color: C.error };
    default:                 return { label: 'Pending',          bg: '#f3f4f6', color: C.muted };
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function BuyerOrdersScreen() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const { session } = useAuth();

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const data = await fetchOrders(session.user.id);
      setOrders(data ?? []);
      setError(null);
    } catch (err) {
      console.warn('Orders load failed', err);
      setOrders([]);
      setError('Unable to load orders. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => { load(); }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Orders" subtitle="Sign in to view your orders." />;
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ paddingBottom: 24 }}
      data={orders}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.pink} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={C.pink} />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={T.h3}>{error ? 'Unable to load' : 'No orders yet'}</Text>
            <Text style={[T.bodySmall, { color: error ? C.error : C.muted, marginTop: S.xs }]}>
              {error ?? 'Start shopping to see your orders here!'}
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const st = statusStyle(item.order_status);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.orderId}>Order #{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.orderDate}>{timeAgo(item.placed_at)}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
            <View style={styles.itemsPreview}>
              <Text style={[T.caption, { color: C.text3 }]}>Tap to view order details and items</Text>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{item.total_amount.toFixed(0)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: C.white },
  header: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  headerTitle: { ...T.h2 },
  headerSub: { ...T.caption, marginTop: 2 },
  card: {
    marginHorizontal: S.lg, marginTop: S.sm,
    padding: S.md, borderRadius: R.xl,
    backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.pink, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
    gap: S.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  orderId: { ...T.h4 },
  orderDate: { ...T.caption, marginTop: 2 },
  statusBadge: { borderRadius: R.sm, paddingHorizontal: S.sm + 2, paddingVertical: S.xs },
  statusText: { fontSize: 12, fontWeight: '700' },
  itemsPreview: { gap: S.xs, paddingTop: S.xs, borderTopWidth: 1, borderColor: C.border },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: S.sm, borderTopWidth: 1, borderColor: C.border,
  },
  totalLabel: { ...T.caption, fontWeight: '600' },
  totalAmount: { ...T.h3 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
  emptyEmoji: { fontSize: 56 },
});
