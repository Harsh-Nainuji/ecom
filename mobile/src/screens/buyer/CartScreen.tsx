import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ShoppingCart, Minus, Plus } from 'lucide-react-native';
import { useCart } from '../../context/CartContext';
import { pickPrimaryImage } from '../../lib/storage';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { C, S, R, BTN, T } from '../../lib/theme';
import { ScreenContainer } from '../../components/ScreenContainer';

const CARD_COLORS = [C.card0, C.card1, C.card2, C.card3];

import { useToast } from '../../context/ToastContext';

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const { items, loading, refresh, setQuantity, remove } = useCart();
  const { session } = useAuth();
  const { showToast } = useToast();

  const handleSetQuantity = async (variantId: string, quantity: number) => {
    await setQuantity(variantId, quantity);
    showToast('Cart updated', 'info');
  };

  const handleRemove = async (variantId: string) => {
    await remove(variantId);
    showToast('Item removed from cart', 'info');
  };

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (!session?.user) {
    return (
      <ScreenContainer>
        <ScreenPlaceholder
          title="Sign In Required"
          subtitle="Sign in or create an account to view and manage your shopping cart."
          footer={
            <TouchableOpacity
              style={[styles.browseBtn, { marginTop: 16 }]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.browseBtnText}>Sign In / Sign Up</Text>
            </TouchableOpacity>
          }
        />
      </ScreenContainer>
    );
  }

  const subtotal = items.reduce(
    (acc, item) => acc + (item.product_variant?.product?.price ?? 0) * item.quantity, 0,
  );
  const isEmpty = !loading && items.length === 0;

  return (
    <ScreenContainer>
      <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Cart</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 60 }} color={C.pink} />
          ) : (
            <View style={styles.emptyContainer}>
              <ShoppingCart size={48} color={C.rose} strokeWidth={1.5} style={{ marginBottom: S.xs }} />
              <Text style={T.h3}>Your cart is empty</Text>
              <Text style={[T.bodySmall, { color: C.muted }]}>Browse products and add items to cart</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Text style={styles.browseBtnText}>Browse Products</Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const bgColor = CARD_COLORS[index % CARD_COLORS.length];
          const variantLabel = item.product_variant?.size && item.product_variant?.color
            ? `${item.product_variant.size} • ${item.product_variant.color}`
            : item.product_variant?.size ?? item.product_variant?.color ?? '';
          const imageUrl = pickPrimaryImage(item.product_variant?.product);
          return (
            <View style={styles.card}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.imagePlaceholder, { backgroundColor: bgColor }]}>
                  <Text style={[styles.imageText, { color: C.rose }]}>
                    {item.product_variant?.product?.name?.[0]?.toUpperCase() ?? ''}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name} numberOfLines={2}>{item.product_variant?.product?.name ?? 'Unknown Product'}</Text>
                {variantLabel ? <Text style={styles.variant}>{variantLabel}</Text> : null}
                <Text style={styles.price}>₹{(item.product_variant?.product?.price ?? 0).toFixed(0)}</Text>
                <View style={styles.row}>
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      onPress={() => handleSetQuantity(item.variant_id, Math.max(1, item.quantity - 1))}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Minus size={14} color={C.rose} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => handleSetQuantity(item.variant_id, item.quantity + 1)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Plus size={14} color={C.rose} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(item.variant_id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.remove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.summary}>
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>Subtotal ({items.length} items)</Text>
          <Text style={styles.summaryValue}>₹{subtotal.toFixed(0)}</Text>
        </View>
        <View style={styles.rowBetween}>
          <Text style={styles.summaryLabel}>Delivery</Text>
          <Text style={styles.freeDelivery}>{subtotal >= 499 ? 'FREE' : `₹${49}`}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutButton, (isEmpty || loading) && styles.checkoutButtonDisabled]}
          onPress={() => navigation.navigate('Checkout')}
          disabled={isEmpty || loading}
          activeOpacity={0.9}
        >
          {loading ? <ActivityIndicator color={C.white} /> : <Text style={styles.checkoutText}>Proceed to Checkout</Text>}
        </TouchableOpacity>
      </View>
    </View>
  </ScreenContainer>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  headerTitle: { ...T.h2 },
  card: {
    flexDirection: 'row', gap: S.md, padding: S.md,
    marginHorizontal: S.lg, marginTop: S.sm, borderRadius: R.lg,
    backgroundColor: C.white, borderWidth: 1, borderColor: C.border,
    shadowColor: C.pink, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  productImage: { width: 80, height: 80, borderRadius: R.md, backgroundColor: C.card0 },
  imagePlaceholder: { width: 80, height: 80, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  imageText: { fontSize: 28, fontWeight: '800' },
  name: { ...T.h4 },
  variant: { ...T.caption },
  price: { ...T.price, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', gap: S.md,
    borderWidth: 1, borderColor: C.border, borderRadius: R.full,
    paddingHorizontal: S.md, paddingVertical: 5,
  },
  qtyValue: { ...T.h4 },
  remove: { ...T.caption, fontWeight: '700', color: C.rose },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
  browseBtn: { ...BTN.primary, paddingHorizontal: S.xl, height: 48, marginTop: S.sm },
  browseBtnText: { ...BTN.primaryText },
  summary: { padding: S.lg, borderTopWidth: 1, borderColor: C.border, backgroundColor: C.white, gap: S.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { ...T.bodySmall, color: C.muted },
  summaryValue: { ...T.h3 },
  freeDelivery: { fontSize: 14, fontWeight: '700', color: C.success },
  checkoutButton: { ...BTN.primary, marginTop: S.xs },
  checkoutButtonDisabled: { ...BTN.primary, ...BTN.disabled },
  checkoutText: { ...BTN.primaryText },
});
