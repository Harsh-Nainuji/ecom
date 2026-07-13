import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import type { DeliveryStackParamList } from '../../navigation/DeliveryStack';
import { fetchDeliveryOrder, updateDeliveryOrderStatus, verifyDeliveryOtp } from '../../lib/api/delivery';
import type { DeliveryOrderDetail } from '../../lib/types';
import { C, S, R, BTN, INPUT, T } from '../../lib/theme';

const DELIVERY_LABEL: Record<string, { text: string; tint: string }> = {
  unassigned: { text: 'Awaiting assignment', tint: C.muted },
  assigned: { text: 'Assigned · pending pickup', tint: '#1d4ed8' },
  out_for_delivery: { text: 'Out for delivery', tint: C.rose },
  completed: { text: 'Delivered', tint: C.success },
  failed: { text: 'Delivery failed', tint: C.error },
};

export function DeliveryDetailScreen() {
  const route = useRoute<RouteProp<DeliveryStackParamList, 'DeliveryDetail'>>();
  const { session, profile } = useAuth();
  const [order, setOrder] = useState<DeliveryOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user || !route.params?.orderId) return;
    setLoading(true);
    try {
      const data = await fetchDeliveryOrder(route.params.orderId);
      setOrder(data);
      setError(null);
    } catch (err) {
      console.warn('Delivery detail load failed', err);
      setOrder(null);
      setError('Unable to load this delivery. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [route.params?.orderId, session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  const statusLabel = useMemo(() => (order ? DELIVERY_LABEL[order.delivery_status] ?? DELIVERY_LABEL.unassigned : null), [order]);
  const showOtpSection = order?.order_status === 'out_for_delivery' && order.delivery_status !== 'completed';

  async function handleStartDelivery() {
    if (!order) return;
    setActionLoading(true);
    try {
      await updateDeliveryOrderStatus(order.id, 'out_for_delivery', 'out_for_delivery');
      await load();
    } catch (err) {
      Alert.alert('Update failed', (err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerify() {
    if (!order) return;
    if (otp.length < 4) {
      Alert.alert('Enter OTP', 'Please enter the 4-6 digit OTP shared with the customer.');
      return;
    }
    setActionLoading(true);
    setOtpError(null);
    try {
      await verifyDeliveryOtp(order.id, otp);
      setOtp('');
      await load();
      Alert.alert('✅ Delivery Confirmed', 'Order marked as delivered.');
    } catch (err) {
      setOtpError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  }

  if (!session?.user) {
    return <ScreenPlaceholder title="Deliveries" subtitle="Sign in to manage deliveries." />;
  }

  if (profile?.role !== 'delivery') {
    return <ScreenPlaceholder title="Deliveries" subtitle="Switch to a delivery account to continue." />;
  }

  if (!route.params?.orderId) {
    return <ScreenPlaceholder title="Deliveries" subtitle="No order selected." />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.pink} />
        <Text style={[T.caption, { marginTop: S.sm, color: C.muted }]}>Loading delivery…</Text>
      </View>
    );
  }

  if (!order) {
    return <ScreenPlaceholder title="Delivery unavailable" subtitle={error ?? 'This delivery could not be loaded.'} />;
  }

  const addressLines = [
    order.shipping_address.line1,
    order.shipping_address.line2,
    `${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}`,
  ].filter(Boolean);
  const itemsLabel = order.order_items.length
    ? order.order_items.map((item) => `${item.product.name} ×${item.quantity}`).join(' · ')
    : 'No items found';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.statusBanner, order.delivery_status === 'completed' && styles.statusBannerDone]}>
        <Text style={[styles.statusBannerText, statusLabel && { color: statusLabel.tint }]}>
          {statusLabel?.text ?? 'Delivery status'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ORDER DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={T.label}>Order ID</Text>
            <Text style={T.h4}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={T.label}>Items</Text>
            <Text style={[T.bodySmall, { flex: 1, textAlign: 'right' }]}>{itemsLabel}</Text>
          </View>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={T.label}>COD Amount</Text>
            <Text style={T.price}>₹{order.total_amount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CUSTOMER</Text>
        <View style={styles.card}>
          <Text style={T.h3}>{order.shipping_address.recipient_name}</Text>
          <Text style={[T.bodySmall, { color: C.text3, marginTop: 2 }]}>{order.shipping_address.phone}</Text>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => order.shipping_address.phone && Linking.openURL(`tel:${order.shipping_address.phone}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.callBtnText}>📞  Call Customer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DELIVERY ADDRESS</Text>
        <View style={styles.card}>
          <Text style={T.body}>{addressLines.join('\n')}</Text>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(addressLines.join(', '))}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.navBtnText}>🗺  Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {order.delivery_status === 'assigned' && (
        <TouchableOpacity
          style={[BTN.primary, { marginHorizontal: S.lg, marginBottom: S.sm }]}
          onPress={handleStartDelivery}
          disabled={actionLoading}
          activeOpacity={0.9}
        >
          <Text style={BTN.primaryText}>{actionLoading ? 'Updating…' : 'Start Delivery'}</Text>
        </TouchableOpacity>
      )}

      {showOtpSection && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY OTP VERIFICATION</Text>
          <View style={styles.card}>
            <Text style={[T.bodySmall, { color: C.muted }]}>📝  Ask the customer for their delivery OTP to confirm handover.</Text>
            <View>
              <Text style={INPUT.label}>Enter Customer OTP</Text>
              <TextInput
                style={[INPUT.base, focused && INPUT.focused, styles.otpInput]}
                placeholder="e.g. 4821"
                placeholderTextColor={C.muted}
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                editable={!actionLoading}
              />
              {otpError ? <Text style={[T.caption, { color: C.error, marginTop: 4 }]}>{otpError}</Text> : null}
            </View>
            <TouchableOpacity
              style={[BTN.primary, (!otp || actionLoading) && BTN.disabled]}
              onPress={handleVerify}
              disabled={!otp || actionLoading}
              activeOpacity={0.9}
            >
              <Text style={BTN.primaryText}>{actionLoading ? 'Verifying…' : 'Confirm OTP & Complete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingVertical: S.lg, gap: S.md, paddingBottom: S.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  statusBanner: {
    marginTop: S.lg, backgroundColor: C.card2, borderRadius: R.lg,
    paddingVertical: S.md, paddingHorizontal: S.lg,
    alignItems: 'center', borderWidth: 1, borderColor: C.pink,
  },
  statusBannerDone: { backgroundColor: '#d1fae5', borderColor: '#6ee7b7' },
  statusBannerText: { fontSize: 15, fontWeight: '800', color: C.text },
  section: { gap: S.xs },
  sectionTitle: { ...T.label, paddingLeft: S.xs },
  card: { backgroundColor: C.white, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: S.md, gap: S.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowBorder: { paddingTop: S.sm, borderTopWidth: 1, borderColor: C.border },
  callBtn: { backgroundColor: C.card2, borderRadius: R.md, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.pink },
  callBtnText: { fontSize: 14, fontWeight: '700', color: C.rose },
  navBtn: { backgroundColor: C.surface, borderRadius: R.md, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  navBtnText: { fontSize: 14, fontWeight: '700', color: C.text2 },
  otpInput: { textAlign: 'center', fontSize: 24, fontWeight: '800', letterSpacing: 8, height: 64 },
});
