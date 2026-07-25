import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Package, ClipboardList, CreditCard, AlertTriangle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchSellerDashboardStats, type SellerDashboardStats } from '../../lib/api/seller';
import type { SellerTabParamList } from '../../navigation/SellerTabs';
import { C, S, R, T } from '../../lib/theme';

type SellerTabNav = BottomTabNavigationProp<SellerTabParamList>;

const QUICK_ACTIONS: { label: string; icon: any; tab?: keyof SellerTabParamList }[] = [
  { label: 'Add Product', icon: Plus, tab: 'SellerProducts' },
  { label: 'View Orders', icon: Package, tab: 'SellerOrders' },
  { label: 'My Listings', icon: ClipboardList, tab: 'SellerProducts' },
  { label: 'Payouts', icon: CreditCard },
];

export function SellerDashboardScreen() {
  const { session, profile } = useAuth();
  const navigation = useNavigation<SellerTabNav>();
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    setLoading(true);
    try {
      const data = await fetchSellerDashboardStats(session.user.id);
      setStats(data);
      setError(null);
    } catch (err) {
      console.warn('Seller dashboard load failed', err);
      setStats(null);
      setError('Unable to load dashboard data. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role]);

  useEffect(() => { load(); }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Seller Hub" subtitle="Sign in to view your seller dashboard." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="Seller Hub" subtitle="Switch to a seller account to access this section." />;
  }

  const kpis = [
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, sub: 'Lifetime', color: C.card2 },
    { label: 'Revenue', value: stats ? `₹${Math.round(stats.revenue).toLocaleString('en-IN')}` : '₹0', sub: 'Lifetime', color: C.card1 },
    { label: 'Live Products', value: stats?.liveProducts ?? 0, sub: `${stats?.lowStockSkus ?? 0} low stock`, color: C.card0 },
    { label: 'Low Stock', value: stats?.lowStockSkus ?? 0, sub: 'SKUs ≤ 5 units', color: C.card3 },
  ];

  const recentOrders = stats?.recentOrders ?? [];

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    if (action.tab) {
      navigation.navigate(action.tab);
    } else {
      Alert.alert(action.label, 'This feature is coming soon.');
    }
  };

  const renderDashboard = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.pink} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={T.h2}>Seller Hub</Text>
          <Text style={[T.caption, { marginTop: 2 }]}>FabZone Partner Dashboard</Text>
        </View>
        <View style={styles.sellerBadge}>
          <Text style={styles.sellerBadgeText}>SELLER</Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {kpis.map((stat) => (
          <View key={stat.label} style={[styles.kpiCard, { backgroundColor: stat.color }]}>
            <Text style={styles.kpiValue}>{stat.value}</Text>
            <Text style={styles.kpiLabel}>{stat.label}</Text>
            <Text style={styles.kpiSub}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.8} onPress={() => handleQuickAction(a)}>
              <Icon size={20} color={C.rose} strokeWidth={2} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      <View style={styles.ordersCard}>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={[T.bodySmall, { color: error ? C.error : C.muted }]}>
              {error ?? 'No recent orders yet.'}
            </Text>
          </View>
        ) : (
          recentOrders.map((order, i) => (
            <View key={order.id} style={[styles.orderRow, i < recentOrders.length - 1 && styles.orderRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={T.h4}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[T.bodySmall, { color: C.text3 }]}>
                  {order.buyer_name}{order.shipping_city ? ` · ${order.shipping_city}` : ''}
                </Text>
                <Text style={[T.caption, { marginTop: 2 }]}>{new Date(order.placed_at).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={[T.h4, { color: C.text }]}>₹{order.total_amount.toFixed(0)}</Text>
                <View style={[styles.statusPill, { backgroundColor: C.card2 }]}>
                  <Text style={[styles.statusText, { color: C.rose }]}>{order.order_status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Stock Alert */}
      <View style={styles.alertCard}>
        <AlertTriangle size={24} color={C.warning} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={[T.h4, { color: C.warning }]}>Low Stock Alert</Text>
          <Text style={[T.caption, { marginTop: 2 }]}>
            {stats?.lowStockSkus ?? 0} SKU{stats && stats.lowStockSkus === 1 ? '' : 's'} below threshold
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={C.pink} />
      </View>
    );
  }

  return renderDashboard();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  sellerBadge: { backgroundColor: C.card2, borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 4, borderWidth: 1, borderColor: C.pink },
  sellerBadgeText: { ...T.label, color: C.rose },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  kpiCard: { width: '47.5%', borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, gap: 3 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: C.text },
  kpiLabel: { ...T.caption, fontWeight: '700' },
  kpiSub: { ...T.caption, color: C.success },
  sectionTitle: { ...T.h4, marginTop: S.xs },
  actionsRow: { flexDirection: 'row', gap: S.sm },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: S.md, borderWidth: 1, borderColor: C.border, gap: S.xs },
  actionLabel: { ...T.caption, fontWeight: '700', textAlign: 'center' },
  ordersCard: { borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, backgroundColor: C.white },
  orderRowBorder: { borderBottomWidth: 1, borderColor: C.border },
  statusPill: { borderRadius: R.sm, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: '#fffbeb', borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: '#fde68a' },
  emptyOrders: { padding: S.md, alignItems: 'center' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
});
