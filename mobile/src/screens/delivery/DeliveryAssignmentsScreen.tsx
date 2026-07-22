import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bike, Phone, Map } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchDeliveryAssignments } from '../../lib/api/delivery';
import type { DeliveryAssignmentSummary, DeliveryState } from '../../lib/types';
import type { DeliveryStackParamList } from '../../navigation/DeliveryStack';
import { C, S, R, T, BTN } from '../../lib/theme';

const STATUS_STYLE: Record<DeliveryState | 'default', { bg: string; color: string; label: string }> = {
  unassigned: { bg: '#f3f4f6', color: C.muted, label: 'Unassigned' },
  assigned: { bg: '#e0e7ff', color: '#3730a3', label: 'Assigned' },
  out_for_delivery: { bg: '#dbeafe', color: '#1e40af', label: 'Out for delivery' },
  completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  failed: { bg: '#fee2e2', color: C.error, label: 'Failed' },
  default: { bg: '#f3f4f6', color: C.muted, label: '—' },
};

export function DeliveryAssignmentsScreen() {
  const { session, profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<DeliveryStackParamList>>();
  const [assignments, setAssignments] = useState<DeliveryAssignmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'delivery') return;
    setLoading(true);
    try {
      const data = await fetchDeliveryAssignments(session.user.id);
      setAssignments(data);
      setError(null);
    } catch (err) {
      console.warn('Delivery assignments failed', err);
      setAssignments([]);
      setError('Unable to load assignments. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Deliveries" subtitle="Sign in to view assignments." />;
  }

  if (profile?.role !== 'delivery') {
    return <ScreenPlaceholder title="Deliveries" subtitle="Switch to a delivery account to continue." />;
  }

  const activeCount = useMemo(
    () => assignments.filter((assignment) => assignment.delivery_status !== 'completed').length,
    [assignments],
  );

  return (
    <FlatList
      style={styles.list}
      data={assignments}
      keyExtractor={(assignment) => assignment.id}
      contentContainerStyle={styles.content}
      refreshing={loading}
      onRefresh={load}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <View>
            <Text style={T.h2}>My Deliveries</Text>
            <Text style={[T.caption, { marginTop: 2 }]}>{activeCount} active</Text>
          </View>
          {error ? <Text style={[T.caption, { color: C.error }]}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator style={{ marginTop: 80 }} color={C.pink} />
        ) : (
          <View style={styles.emptyContainer}>
            <Bike size={48} color={C.pink} strokeWidth={1.5} />
            <Text style={T.h4}>No assignments yet</Text>
            <Text style={[T.caption, { color: C.muted }]}>Refresh to check for new deliveries.</Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const st = STATUS_STYLE[item.delivery_status] ?? STATUS_STYLE.default;
        const isDone = item.delivery_status === 'completed';
        return (
          <TouchableOpacity
            style={[styles.card, isDone && styles.cardDone]}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.id })}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={T.h4}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={T.caption}>{new Date(item.placed_at).toLocaleString('en-IN')}</Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>

            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>BUYER</Text>
              <Text style={T.h4}>{item.buyer_name}</Text>
              <Text style={[T.bodySmall, { color: C.text3, marginTop: 2 }]}>{item.items_label}</Text>
            </View>

            <View style={styles.addressBlock}>
              <Text style={styles.infoLabel}>DELIVER TO</Text>
              <Text style={[T.body, { color: C.text2 }]}>{item.address || 'Address unavailable'}</Text>
            </View>

            <View style={styles.amountRow}>
              <Text style={T.label}>COD Amount</Text>
              <Text style={T.price}>₹{item.total_amount.toLocaleString()}</Text>
            </View>

            {!isDone && (
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => item.phone && Linking.openURL(`tel:${item.phone}`)}
                  activeOpacity={0.8}
                  disabled={!item.phone}
                >
                  <View style={styles.btnContent}>
                    <Phone size={14} color={C.text2} strokeWidth={2} />
                    <Text style={styles.callBtnText}>Call</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navBtn}
                  onPress={() => item.address && Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(item.address)}`)}
                  activeOpacity={0.8}
                  disabled={!item.address}
                >
                  <View style={styles.btnContent}>
                    <Map size={14} color={C.text2} strokeWidth={2} />
                    <Text style={styles.navBtnText}>Navigate</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.otpBtn} activeOpacity={0.8} onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.id })}>
                  <Text style={styles.otpBtnText}>Enter OTP</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: C.white },
  content: { paddingHorizontal: S.lg, paddingBottom: S.xxl, gap: S.sm },
  header: { paddingTop: S.lg, paddingBottom: S.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  card: {
    backgroundColor: C.white, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.border,
    padding: S.md, gap: S.sm,
    shadowColor: C.pink, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cardDone: { opacity: 0.6 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  statusPill: { borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  infoBlock: { gap: 2 },
  infoLabel: { ...T.label, marginBottom: 3 },
  addressBlock: { backgroundColor: C.surface, borderRadius: R.md, padding: S.sm, gap: 3, borderWidth: 1, borderColor: C.border },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: S.xs, borderTopWidth: 1, borderColor: C.border },
  actionsRow: { flexDirection: 'row', gap: S.sm },
  callBtn: { flex: 1, height: 44, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  callBtnText: { fontSize: 13, fontWeight: '700', color: C.text2 },
  navBtn: { flex: 1, height: 44, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface },
  navBtnText: { fontSize: 13, fontWeight: '700', color: C.text2 },
  otpBtn: { ...BTN.primary, flex: 1, height: 44 },
  otpBtnText: { ...BTN.primaryText, fontSize: 13 },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
});
