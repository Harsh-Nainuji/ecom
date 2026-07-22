import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, RotateCcw } from 'lucide-react-native';
import { fetchAddresses, fetchCart, createOrder, createRazorpayOrder } from '../../lib/api/buyer';
import type { Address, CartItemWithProduct } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, BTN, T } from '../../lib/theme';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const { session } = useAuth();
  const { refresh } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!session?.user) return;
      setLoading(true);
      try {
        const [addr, cart] = await Promise.all([
          fetchAddresses(session.user.id),
          fetchCart(session.user.id),
        ]);
        setAddresses(addr ?? []);
        setSelected(addr?.find((a) => a.is_default) ?? addr?.[0] ?? null);
        setCartItems(cart ?? []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Checkout load failed', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product_variant?.product.price ?? 0) * item.quantity, 0);

  async function handlePlaceOrder() {
    if (!selected) {
      Alert.alert('Select address', 'Choose a delivery address to continue.');
      return;
    }

    const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      Alert.alert('Configuration error', 'Missing Razorpay key. Please contact support.');
      return;
    }

    setPlacing(true);
    try {
      const intent = await createRazorpayOrder(selected.id);

      const payment = await RazorpayCheckout.open({
        key: razorpayKey,
        amount: intent.amount,
        currency: intent.currency,
        name: 'FabZone',
        description: 'Secure payment',
        order_id: intent.order_id,
        prefill: {
          name: intent.prefill?.name ?? selected.recipient_name,
          email: intent.prefill?.email ?? undefined,
          contact: intent.prefill?.contact ?? selected.phone,
        },
        theme: { color: '#111827' },
      });

      const confirmation = await createOrder({
        address_id: selected.id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });

      await refresh();
      navigation.replace('OrderDetail', { orderId: confirmation.order_id });
    } catch (error) {
      const description = (error as { description?: string })?.description;
      if (description) {
        Alert.alert('Payment cancelled', description);
      } else {
        Alert.alert('Checkout failed', (error as Error).message ?? 'Something went wrong.');
      }
    } finally {
      setPlacing(false);
    }
  }

  if (!session?.user) {
    return <ScreenPlaceholder title="Sign in required" subtitle="Please sign in to checkout." />;
  }

  const delivery = subtotal >= 499 ? 0 : 49;
  const total = subtotal + delivery;

  if (loading) {
    return <ScreenPlaceholder title="Checkout" subtitle="Loading your addresses and cart..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        extraData={selected?.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Delivery Address</Text>
        }
        renderItem={({ item }) => {
          const isActive = selected?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.addressCard, isActive && styles.addressCardActive]}
              onPress={() => setSelected(item)}
              activeOpacity={0.8}
            >
              <View style={styles.addressRadioRow}>
                <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                  {isActive && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addressName}>{item.recipient_name}</Text>
                  <Text style={styles.addressLine}>{item.line1}</Text>
                  <Text style={styles.addressLine}>{item.city}, {item.state} {item.postal_code}</Text>
                  <Text style={styles.addressPhone}>{item.phone}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No saved addresses. Add one from your profile.</Text>
        }
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryAmt}>₹{subtotal.toFixed(0)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Delivery</Text><Text style={delivery === 0 ? styles.summaryFree : styles.summaryAmt}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</Text></View>
        <View style={[styles.summaryRow, styles.summaryTotal]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalAmt}>₹{total.toFixed(0)}</Text></View>
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <Lock size={12} color={C.muted} strokeWidth={2} />
            <Text style={styles.trustText}>Secured by Razorpay</Text>
          </View>
          <View style={styles.trustItem}>
            <RotateCcw size={12} color={C.muted} strokeWidth={2} />
            <Text style={styles.trustText}>7-day returns</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.orderButton, (!selected || placing) && styles.orderButtonDisabled]}
          disabled={!selected || placing}
          onPress={handlePlaceOrder}
          activeOpacity={0.9}
        >
          {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.orderText}>Pay ₹{total.toFixed(0)} · Place Order</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  listContent: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  sectionTitle: { ...T.h3, marginBottom: S.md },
  addressCard: { padding: S.md, borderRadius: R.lg, marginBottom: S.sm, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  addressCardActive: { borderColor: C.rose, backgroundColor: C.card2 },
  addressRadioRow: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioOuterActive: { borderColor: C.rose },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rose },
  addressName: { ...T.h4, marginBottom: 2 },
  addressLine: { ...T.bodySmall, color: C.text3 },
  addressPhone: { ...T.caption, marginTop: 2 },
  emptyText: { ...T.bodySmall, textAlign: 'center', color: C.muted, marginTop: S.xl },
  summary: { borderTopWidth: 1, borderColor: C.border, backgroundColor: C.white, padding: S.lg, gap: S.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...T.bodySmall, color: C.muted },
  summaryAmt: { ...T.h4, color: C.text },
  summaryFree: { ...T.h4, color: C.success },
  summaryTotal: { paddingTop: S.sm, borderTopWidth: 1, borderColor: C.border, marginTop: S.xs },
  totalLabel: { ...T.h3 },
  totalAmt: { ...T.priceLg },
  trustRow: { flexDirection: 'row', justifyContent: 'center', gap: S.xl, paddingVertical: S.xs },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { ...T.caption, color: C.muted },
  orderButton: { ...BTN.primary, marginTop: S.xs },
  orderButtonDisabled: { ...BTN.primary, ...BTN.disabled },
  orderText: { ...BTN.primaryText },
});

