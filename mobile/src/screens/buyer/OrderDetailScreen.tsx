import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { ClipboardList, CreditCard, Package, Truck, Bike, Check, X, Star } from 'lucide-react-native';
import { cancelOrder, createReview, fetchOrderDetail } from '../../lib/api/buyer';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import type { OrderDetail } from '../../lib/types';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { useAuth } from '../../context/AuthContext';
import { C, S, R, BTN, INPUT, T, CARD } from '../../lib/theme';

const ORDER_FLOW: { key: OrderDetail['order_status']; label: string }[] = [
  { key: 'pending',          label: 'Order Placed' },
  { key: 'paid',             label: 'Payment Confirmed' },
  { key: 'packed',           label: 'Packed' },
  { key: 'shipped',          label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const STEP_ICONS: Record<OrderDetail['order_status'], any> = {
  pending: ClipboardList,
  paid: CreditCard,
  packed: Package,
  shipped: Truck,
  out_for_delivery: Bike,
  delivered: Check,
  cancelled: X,
};

export function OrderDetailScreen() {
  const route = useRoute<RouteProp<BuyerStackParamList, 'OrderDetail'>>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const { session } = useAuth();

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const data = await fetchOrderDetail(session.user.id, route.params.orderId);
      setOrder(data);
      setError(null);
    } catch (err) {
      console.warn('Order detail failed', err);
      setOrder(null);
      setError('Unable to load this order.');
    } finally {
      setLoading(false);
    }
  }, [route.params.orderId, session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Order details" subtitle="Sign in to view this order." />;
  }

  const currentIdx = useMemo(() =>
    ORDER_FLOW.findIndex(s => s.key === order?.order_status), [order]);

  const otpVisible = useMemo(() => order?.order_status === 'out_for_delivery', [order]);
  const isCancelled = useMemo(() => order?.order_status === 'cancelled', [order]);
  const canCancel = useMemo(() => ['pending', 'paid'].includes(order?.order_status ?? ''), [order]);
  const isDelivered = useMemo(() => order?.order_status === 'delivered', [order]);

  async function handleCancel() {
    if (!session?.user || !order) return;
    Alert.alert('Cancel order?', 'This order will be cancelled and cannot be restored.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(session.user.id, order.id);
            await load();
          } catch (err) {
            Alert.alert('Cancellation failed', (err as Error).message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  async function handleSubmitReview(productId: string) {
    if (!session?.user || !order) return;
    if (reviewRating < 1 || reviewRating > 5) {
      Alert.alert('Select rating', 'Please choose a rating between 1 and 5 stars.');
      return;
    }
    setReviewSubmitting(true);
    try {
      await createReview({
        orderId: order.id,
        productId,
        buyerId: session.user.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewProductId(null);
      setReviewRating(5);
      setReviewComment('');
      Alert.alert('Review submitted', 'Thank you for your feedback.');
      await load();
    } catch (err) {
      Alert.alert('Review failed', (err as Error).message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.pink} />
      </View>
    );
  }

  if (!order) {
    return <ScreenPlaceholder title="Not found" subtitle={error ?? 'Order could not be loaded.'} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View>
          <Text style={T.label}>Order ID</Text>
          <Text style={T.h3}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <Text style={[T.caption, { marginTop: 2 }]}>{new Date(order.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={T.label}>Total</Text>
          <Text style={T.priceLg}>₹{order.total_amount.toFixed(0)}</Text>
        </View>
      </View>

      {/* OTP Display */}
      {otpVisible && order?.delivery_otps?.otp_code && (
        <View style={[CARD.base, { backgroundColor: '#fdf2f8', borderColor: '#fbcfe8', borderWidth: 1 }]}>
          <Text style={[T.h4, { color: '#9d174d', marginBottom: 4 }]}>Delivery OTP</Text>
          <Text style={[T.bodySmall, { color: '#831843', marginBottom: 12 }]}>
            Share this secure code with your delivery executive. It is valid for 24 hours.
          </Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#be185d', letterSpacing: 12, textAlign: 'center' }}>
            {order.delivery_otps.otp_code}
          </Text>
        </View>
      )}

      {/* Cancel action */}
      {canCancel && (
        <TouchableOpacity
          style={[styles.cancelButton, cancelling && styles.cancelButtonDisabled]}
          onPress={handleCancel}
          disabled={cancelling}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelButtonText}>
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Timeline */}
      <View style={CARD.base}>
        <Text style={[T.h4, { marginBottom: S.md }]}>Order Status</Text>
        {isCancelled ? (
          <View style={styles.cancelledRow}>
            <X size={18} color={C.error} strokeWidth={2.5} />
            <View style={{ flex: 1 }}>
              <Text style={[T.h4, { color: C.error }]}>Order Cancelled</Text>
              <Text style={[T.caption, { color: C.muted, marginTop: 2 }]}>This order has been cancelled by the customer.</Text>
            </View>
          </View>
        ) : (
          ORDER_FLOW.map((step, i) => {
            const isDone = i <= currentIdx;
            const isActive = i === currentIdx;
            const isLast = i === ORDER_FLOW.length - 1;
            const IconComponent = isActive ? STEP_ICONS[step.key] : Check;
            return (
              <View key={step.key} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.timelineDot, isDone ? styles.timelineDotDone : styles.timelineDotPending, isActive && styles.timelineDotActive]}>
                    {isDone && <IconComponent size={14} color={isActive ? C.white : C.rose} strokeWidth={2.5} />}
                  </View>
                  {!isLast && <View style={[styles.timelineLine, isDone && i < currentIdx && styles.timelineLineDone]} />}
                </View>
                <View style={[styles.timelineContent, isActive && styles.timelineContentActive]}>
                  <Text style={[T.h4, !isDone && { color: C.muted }]}>{step.label}</Text>
                  {isActive && <Text style={[T.caption, { color: C.rose, marginTop: 2 }]}>Current status</Text>}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Items */}
      <View style={CARD.base}>
        <Text style={[T.h4, { marginBottom: S.md }]}>Items Ordered</Text>
        {order.order_items.map((item, i) => (
          <View key={item.id} style={[styles.itemRow, i < order.order_items.length - 1 && styles.itemRowBorder]}>
            <View style={styles.itemRowLeft}>
              <View style={styles.itemDot} />
              <Text style={[T.body, { flex: 1 }]} numberOfLines={2}>{item.product.name}</Text>
            </View>
            <View style={styles.itemRowRight}>
              <Text style={[T.caption, { marginHorizontal: S.sm }]}>×{item.quantity}</Text>
              <Text style={T.h4}>₹{item.total_price.toFixed(0)}</Text>
            </View>
            {isDelivered && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  setReviewProductId(item.product.id);
                  setReviewRating(5);
                  setReviewComment('');
                }}
              >
                <Text style={styles.reviewButtonText}>Write Review</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Review form */}
      {reviewProductId && order && (
        <View style={CARD.base}>
          <Text style={[T.h4, { marginBottom: S.sm }]}>Write a Review</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                <Star
                  size={24}
                  color={star <= reviewRating ? '#f59e0b' : C.border}
                  fill={star <= reviewRating ? '#f59e0b' : 'transparent'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience (optional)"
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            value={reviewComment}
            onChangeText={setReviewComment}
          />
          <View style={styles.reviewActions}>
            <TouchableOpacity onPress={() => setReviewProductId(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[T.caption, { color: C.muted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[BTN.primary, { height: 36, paddingHorizontal: S.md }, reviewSubmitting && BTN.disabled]}
              onPress={() => reviewProductId && handleSubmitReview(reviewProductId)}
              disabled={reviewSubmitting}
            >
              <Text style={[BTN.primaryText, { fontSize: 13 }]}>{reviewSubmitting ? 'Submitting…' : 'Submit Review'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shipping */}
      <View style={CARD.base}>
        <Text style={[T.h4, { marginBottom: S.sm }]}>Delivery Address</Text>
        <Text style={[T.h4, { color: C.text2 }]}>{order.shipping_address.recipient_name}</Text>
        <Text style={[T.bodySmall, { color: C.text3, marginTop: 4 }]}>{order.shipping_address.line1}</Text>
        {order.shipping_address.line2 ? <Text style={[T.bodySmall, { color: C.text3 }]}>{order.shipping_address.line2}</Text> : null}
        <Text style={[T.bodySmall, { color: C.text3 }]}>
          {order.shipping_address.city}, {order.shipping_address.state} – {order.shipping_address.postal_code}
        </Text>
        <Text style={[T.caption, { marginTop: S.xs }]}>{order.shipping_address.phone}</Text>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingVertical: S.lg, gap: S.sm, paddingBottom: S.xxl },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: C.card2, borderRadius: R.lg, padding: S.md,
    borderWidth: 1, borderColor: C.border,
  },
  amountBadge: { alignItems: 'flex-end' },
  timelineRow: { flexDirection: 'row', gap: S.sm, minHeight: 52 },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  timelineDotPending: { borderColor: C.border, backgroundColor: C.white },
  timelineDotDone: { borderColor: C.rose, backgroundColor: C.card2 },
  timelineDotActive: { borderColor: C.rose, backgroundColor: C.rose },
  timelineLine: { flex: 1, width: 2, backgroundColor: C.border, marginVertical: 2 },
  timelineLineDone: { backgroundColor: C.pink },
  timelineContent: { flex: 1, paddingTop: 6, paddingBottom: S.md, paddingLeft: S.xs },
  timelineContentActive: { backgroundColor: C.card2, borderRadius: R.md, paddingLeft: S.sm, marginLeft: -S.xs },
  cancelButton: {
    borderWidth: 1, borderColor: C.error, borderRadius: R.lg,
    paddingVertical: S.sm, alignItems: 'center', backgroundColor: '#fef2f2',
  },
  cancelButtonDisabled: { opacity: 0.6 },
  cancelButtonText: { color: C.error, fontWeight: '700', fontSize: 14 },
  cancelledRow: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingVertical: S.sm },
  itemRow: { flexDirection: 'column', paddingVertical: S.sm, gap: S.xs },
  itemRowBorder: { borderBottomWidth: 1, borderColor: C.border },
  itemRowLeft: { flexDirection: 'row', alignItems: 'center', gap: S.xs },
  itemRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  itemDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.pink },
  reviewButton: {
    alignSelf: 'flex-start', marginTop: S.xs,
    borderWidth: 1, borderColor: C.rose, borderRadius: R.md,
    paddingHorizontal: S.sm, paddingVertical: 4,
  },
  reviewButtonText: { color: C.rose, fontSize: 12, fontWeight: '700' },
  starRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.sm },
  reviewInput: {
    ...INPUT.base, minHeight: 80, textAlignVertical: 'top', paddingTop: S.sm,
  },
  reviewActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.sm },
  otpCard: {
    backgroundColor: C.card2, borderRadius: R.lg,
    borderWidth: 1, borderColor: C.pink,
    padding: S.lg, alignItems: 'center',
  },
  otpCode: {
    fontSize: 40, fontWeight: '800', color: C.rose,
    letterSpacing: 10, textAlign: 'center',
  },
});
