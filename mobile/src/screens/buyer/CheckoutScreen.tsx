import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { openRazorpayCheckout } from '../../lib/razorpay';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, RotateCcw } from 'lucide-react-native';
import { fetchAddresses, fetchCart, createOrder, createRazorpayOrder, upsertAddress } from '../../lib/api/buyer';
import type { Address, CartItemWithProduct } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, BTN, INPUT, T } from '../../lib/theme';

export function CheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const { session } = useAuth();
  const { refresh } = useCart();
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<Address | null>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    recipient_name: '',
    phone: '',
    line1: '',
    city: '',
    state: '',
    postal_code: '',
    label: 'Home',
  });

  useEffect(() => {
    async function load() {
      if (!session?.user) return;
      setLoading(true);
      try {
        const [addr, cart] = await Promise.all([
          fetchAddresses(session.user.id),
          fetchCart(session.user.id),
        ]);
        const list = addr ?? [];
        setAddresses(list);
        setSelected(list.find((a) => a.is_default) ?? list[0] ?? null);
        if (list.length === 0) {
          setShowAddForm(true);
        }
        setCartItems(cart ?? []);
      } catch (error) {
        console.warn('Checkout load failed', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session?.user]);

  async function handleSaveInlineAddress() {
    if (!session?.user) return;
    if (!addressForm.recipient_name || !addressForm.phone || !addressForm.line1 || !addressForm.city || !addressForm.state || !addressForm.postal_code) {
      Alert.alert('Missing fields', 'Please fill in recipient name, phone, address line, city, state, and postal code.');
      return;
    }
    setSavingAddress(true);
    try {
      const created = await upsertAddress(session.user.id, {
        ...addressForm,
        is_default: addresses.length === 0,
      });
      const updated = [...addresses, created];
      setAddresses(updated);
      setSelected(created);
      setShowAddForm(false);
      setAddressForm({ recipient_name: '', phone: '', line1: '', city: '', state: '', postal_code: '', label: 'Home' });
      showToast('Shipping address saved!', 'success');
    } catch (err: any) {
      Alert.alert('Save failed', err.message || 'Could not save address.');
    } finally {
      setSavingAddress(false);
    }
  }

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product_variant?.product.price ?? 0) * item.quantity, 0);

  async function handlePlaceOrder() {
    if (!selected) {
      Alert.alert('Select address', 'Choose or add a delivery address to continue.');
      return;
    }

    const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      Alert.alert('Configuration error', 'Missing Razorpay key. Please contact support.');
      return;
    }

    setPlacing(true);
    try {
      const intent = await createRazorpayOrder(selected.id, session?.user.id);

      const payment = await openRazorpayCheckout({
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
        buyer_id: session?.user.id,
      });

      await refresh();
      showToast('Order placed successfully!', 'success');

      if (confirmation.order_ids && confirmation.order_ids.length > 1) {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.alert(`Your cart had items from ${confirmation.order_ids.length} different sellers, so it was split into ${confirmation.order_ids.length} separate orders for shipping.`);
          }
          navigation.replace('OrderDetail', { orderId: confirmation.order_ids[0] });
        } else {
          Alert.alert(
            'Order placed',
            `Your cart had items from ${confirmation.order_ids.length} different sellers, so it was split into ${confirmation.order_ids.length} separate orders for shipping. You can view each one from Order History.`,
            [{ text: 'View First Order', onPress: () => navigation.replace('OrderDetail', { orderId: confirmation.order_ids[0] }) }],
          );
        }
      } else {
        navigation.replace('OrderDetail', { orderId: confirmation.order_id });
      }
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
    return (
      <ScreenPlaceholder
        title="Sign In Required"
        subtitle="Please sign in or create an account to proceed to checkout."
        footer={
          <TouchableOpacity
            style={{ marginTop: 16, backgroundColor: C.rose, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 }}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Sign In / Sign Up</Text>
          </TouchableOpacity>
        }
      />
    );
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
          <View style={{ marginBottom: S.md }}>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {!showAddForm && (
                <TouchableOpacity onPress={() => setShowAddForm(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.addBtnText}>+ Add New</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddForm ? (
              <View style={styles.inlineFormCard}>
                <Text style={[T.h4, { marginBottom: S.sm }]}>New Delivery Address</Text>

                <TextInput
                  style={[INPUT.base, { marginBottom: S.xs }]}
                  placeholder="Recipient Full Name *"
                  placeholderTextColor={C.muted}
                  value={addressForm.recipient_name}
                  onChangeText={(val) => setAddressForm((f) => ({ ...f, recipient_name: val }))}
                />

                <TextInput
                  style={[INPUT.base, { marginBottom: S.xs }]}
                  placeholder="Phone Number *"
                  placeholderTextColor={C.muted}
                  keyboardType="phone-pad"
                  value={addressForm.phone}
                  onChangeText={(val) => setAddressForm((f) => ({ ...f, phone: val }))}
                />

                <TextInput
                  style={[INPUT.base, { marginBottom: S.xs }]}
                  placeholder="Flat / Building / Street Address *"
                  placeholderTextColor={C.muted}
                  value={addressForm.line1}
                  onChangeText={(val) => setAddressForm((f) => ({ ...f, line1: val }))}
                />

                <View style={{ flexDirection: 'row', gap: S.sm, marginBottom: S.xs }}>
                  <TextInput
                    style={[INPUT.base, { flex: 1 }]}
                    placeholder="City *"
                    placeholderTextColor={C.muted}
                    value={addressForm.city}
                    onChangeText={(val) => setAddressForm((f) => ({ ...f, city: val }))}
                  />
                  <TextInput
                    style={[INPUT.base, { flex: 1 }]}
                    placeholder="State *"
                    placeholderTextColor={C.muted}
                    value={addressForm.state}
                    onChangeText={(val) => setAddressForm((f) => ({ ...f, state: val }))}
                  />
                </View>

                <TextInput
                  style={[INPUT.base, { marginBottom: S.md }]}
                  placeholder="Postal Code / PIN *"
                  placeholderTextColor={C.muted}
                  keyboardType="number-pad"
                  value={addressForm.postal_code}
                  onChangeText={(val) => setAddressForm((f) => ({ ...f, postal_code: val }))}
                />

                <View style={{ flexDirection: 'row', gap: S.sm }}>
                  {addresses.length > 0 && (
                    <TouchableOpacity style={[BTN.secondary, { flex: 1 }]} onPress={() => setShowAddForm(false)}>
                      <Text style={BTN.secondaryText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[BTN.primary, { flex: 1 }, savingAddress && BTN.disabled]}
                    onPress={handleSaveInlineAddress}
                    disabled={savingAddress}
                  >
                    {savingAddress ? <ActivityIndicator color="#fff" /> : <Text style={BTN.primaryText}>Save & Deliver Here</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
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
          !showAddForm ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No saved addresses found.</Text>
              <TouchableOpacity style={[BTN.primary, { marginTop: S.sm }]} onPress={() => setShowAddForm(true)}>
                <Text style={BTN.primaryText}>+ Add Delivery Address</Text>
              </TouchableOpacity>
            </View>
          ) : null
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { ...T.h3 },
  addBtnText: { ...T.bodySmall, color: C.rose, fontWeight: '700' },
  inlineFormCard: { padding: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: C.rose, backgroundColor: C.card0, marginTop: S.sm },
  addressCard: { padding: S.md, borderRadius: R.lg, marginBottom: S.sm, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  addressCardActive: { borderColor: C.rose, backgroundColor: C.card2 },
  addressRadioRow: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioOuterActive: { borderColor: C.rose },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rose },
  addressName: { ...T.h4, marginBottom: 2 },
  addressLine: { ...T.bodySmall, color: C.text3 },
  addressPhone: { ...T.caption, marginTop: 2 },
  emptyContainer: { alignItems: 'center', paddingVertical: S.xl },
  emptyText: { ...T.bodySmall, textAlign: 'center', color: C.muted },
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

