import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { fetchProductById, fetchReviews, toggleWishlist, updateCartItem } from '../../lib/api/buyer';
import { pickPrimaryImage } from '../../lib/storage';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import type { Product, ProductVariant } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { C, S, R, BTN, T } from '../../lib/theme';

const HERO_COLORS = [C.card0, C.card1, C.card2, C.card3, '#F0F4FF', '#F0FFF4'];
const HERO_TEXT  = [C.rose, '#a0522d', '#b91c4c', '#c96a00', '#3730a3', '#065f46'];

export function ProductDetailScreen() {
  const route = useRoute<RouteProp<BuyerStackParamList, 'ProductDetail'>>();
  const { session } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string; createdAt: string; buyerName: string }[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colorIdx = useMemo(() => {
    if (!product) return 0;
    return product.id.charCodeAt(product.id.length - 1) % HERO_COLORS.length;
  }, [product]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setReviewsLoading(true);
      try {
        const [data, reviewData] = await Promise.all([
          fetchProductById(route.params.productId),
          fetchReviews(route.params.productId),
        ]);
        setProduct(data);
        setSelectedVariant(data.product_variants?.[0] ?? null);
        setReviews(reviewData);
        setError(null);
      } catch (err) {
        console.warn('Product load failed', err);
        setProduct(null);
        setSelectedVariant(null);
        setReviews([]);
        setError('Unable to load this product right now.');
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }
    load();
  }, [route.params.productId]);

  const ratingStars = useMemo(() => {
    const avg = product?.reviews_aggregate?.avg ?? 0;
    const full = Math.floor(avg);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }, [product]);

  const ratingText = useMemo(() => {
    const avg = product?.reviews_aggregate?.avg ?? 0;
    const count = product?.reviews_aggregate?.count ?? 0;
    return count > 0 ? `${avg?.toFixed(1)} (${count} reviews)` : 'No reviews yet';
  }, [product]);

  async function handleWishlist() {
    if (!session?.user) { Alert.alert('Sign in required', 'Please sign in to add to wishlist.'); return; }
    if (!product) return;
    setWishlistLoading(true);
    try {
      await toggleWishlist(session.user.id, product.id);
      Alert.alert('❤️ Added to wishlist!');
    } catch {
      Alert.alert('Wishlist updated');
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!session?.user) { Alert.alert('Sign in required', 'Please sign in to add to cart.'); return; }
    if (!selectedVariant) return;
    setCartLoading(true);
    try {
      await updateCartItem(session.user.id, selectedVariant.id, 1);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch {
      Alert.alert('Cart', 'Added to cart (demo mode)');
    } finally {
      setCartLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.pink} />
        <Text style={[T.caption, { marginTop: S.sm }]}>Loading product…</Text>
      </View>
    );
  }

  if (!product) {
    return <ScreenPlaceholder title="Product unavailable" subtitle={error ?? 'This item may have been removed.'} />;
  }

  const effectivePrice = selectedVariant?.price_override ?? product.price;
  const heroImageUrl = pickPrimaryImage(product);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: HERO_COLORS[colorIdx] }]}>
          {heroImageUrl ? (
            <Image source={{ uri: heroImageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.heroLetter, { color: HERO_TEXT[colorIdx] }]}>
              {product.name[0].toUpperCase()}
            </Text>
          )}
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>IN STOCK</Text>
          </View>
        </View>

        {/* Info card lifts over hero */}
        <View style={styles.infoCard}>
          {/* Title + Price */}
          <Text style={T.h2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={T.priceLg}>₹{effectivePrice.toFixed(0)}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStars}>{ratingStars}</Text>
              <Text style={[T.caption, { marginTop: 1 }]}>{ratingText}</Text>
            </View>
          </View>

          {/* Variants */}
          {(product.product_variants?.length ?? 0) > 0 && (
            <View style={styles.section}>
              <Text style={T.label}>
                {product.product_variants?.[0]?.color ? 'SELECT COLOR & SIZE' : 'SELECT SIZE'}
              </Text>
              <View style={styles.variantList}>
                {product.product_variants?.map((variant) => {
                  const label = variant.size && variant.color
                    ? `${variant.size} • ${variant.color}`
                    : variant.size ?? variant.color ?? 'Default';
                  const isActive = selectedVariant?.id === variant.id;
                  return (
                    <TouchableOpacity
                      key={variant.id}
                      style={[styles.variantChip, isActive && styles.variantChipActive]}
                      onPress={() => setSelectedVariant(variant)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.variantText, isActive && styles.variantTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={T.label}>ABOUT</Text>
            <Text style={T.body}>{product.description ?? 'A quality product from our curated collection.'}</Text>
          </View>

          {/* Trust signals */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🚚</Text>
              <Text style={styles.trustText}>Free delivery above ₹499</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>↩️</Text>
              <Text style={styles.trustText}>7-day easy returns</Text>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={T.label}>CUSTOMER REVIEWS</Text>
            {reviewsLoading ? (
              <ActivityIndicator color={C.pink} />
            ) : reviews.length === 0 ? (
              <Text style={[T.body, { color: C.muted }]}>No reviews yet. Be the first to review this product.</Text>
            ) : (
              <View style={styles.reviewList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewStars}>
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </Text>
                      <Text style={[T.caption, { color: C.muted }]}>
                        {new Date(review.createdAt).toLocaleDateString('en-IN')}
                      </Text>
                    </View>
                    <Text style={[T.caption, { color: C.text2, marginBottom: 2 }]}>{review.buyerName}</Text>
                    {review.comment ? <Text style={T.bodySmall}>{review.comment}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlist}
          disabled={wishlistLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.wishlistIcon}>{wishlistLoading ? '…' : '♥'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cartButton, addedToCart && styles.cartButtonAdded, (!selectedVariant && !addedToCart) && styles.cartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={!selectedVariant || cartLoading || addedToCart}
          activeOpacity={0.9}
        >
          {cartLoading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={BTN.primaryText}>
              {addedToCart ? '✓  Added to Cart' : '🛒  Add to Cart — ₹' + effectivePrice.toFixed(0)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingBottom: 100 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  hero: { height: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroLetter: { fontSize: 100, fontWeight: '800' },
  heroBadge: {
    position: 'absolute', top: S.md, right: S.md,
    backgroundColor: '#d1fae5', borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 3,
  },
  heroBadgeText: { color: '#065f46', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  infoCard: {
    backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    marginTop: -S.xl, padding: S.lg, gap: S.md,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingBadge: { alignItems: 'flex-end', gap: 2 },
  ratingStars: { fontSize: 13, color: C.warning, letterSpacing: 2 },
  section: { gap: S.sm },
  variantList: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  variantChip: {
    paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.full,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface,
  },
  variantChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  variantText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  variantTextActive: { color: C.white },
  trustRow: { flexDirection: 'row', gap: S.md, paddingTop: S.xs },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.xs },
  trustIcon: { fontSize: 14 },
  trustText: { ...T.caption, flex: 1 },
  actionBar: {
    flexDirection: 'row', gap: S.sm,
    paddingHorizontal: S.lg, paddingVertical: S.md,
    paddingBottom: S.lg,
    borderTopWidth: 1, borderColor: C.border,
    backgroundColor: C.white,
  },
  wishlistButton: {
    width: 52, height: 52, borderRadius: R.lg,
    borderWidth: 1.5, borderColor: C.pink,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card2,
  },
  wishlistIcon: { fontSize: 20, color: C.rose },
  cartButton: { ...BTN.primary, flex: 1 },
  cartButtonAdded: { backgroundColor: C.success },
  cartButtonDisabled: { ...BTN.primary, ...BTN.disabled },
  reviewList: { gap: S.sm, marginTop: S.xs },
  reviewCard: {
    backgroundColor: C.card2, borderRadius: R.xl, padding: S.md,
    borderWidth: 1, borderColor: C.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewStars: { fontSize: 13, color: C.warning, letterSpacing: 2 },
});
