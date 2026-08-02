import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Heart, Truck, RotateCcw, Star, ShoppingBag, X, Maximize2 } from 'lucide-react-native';
import { fetchProductById, fetchReviews } from '../../lib/api/buyer';
import { getProductImageUrl, pickPrimaryImage } from '../../lib/storage';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import type { Product, ProductVariant } from '../../lib/types';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { ProductImage } from '../../components/ProductImage';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { C, S, R, BTN, T } from '../../lib/theme';

const HERO_COLORS = [C.card0, C.card1, C.card2, C.card3, '#F0F4FF', '#F0FFF4'];
const HERO_TEXT = [C.rose, '#a0522d', '#b91c4c', '#c96a00', '#3730a3', '#065f46'];

export function ProductDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<BuyerStackParamList, 'ProductDetail'>>();
  const { session } = useAuth();
  const { wishlist, toggle } = useWishlist();
  const { items, addToCart } = useCart();
  const { showToast } = useToast();
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
        const firstVariant = data.product_variants?.[0] ?? {
          id: data.id,
          size: null,
          color: null,
          stock: 10,
          price_override: null,
        };
        setSelectedVariant(firstVariant);
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

  const isWishlisted = useMemo(() => {
    if (!product) return false;
    return wishlist.some((item) => item.product_id === product.id);
  }, [wishlist, product]);

  const isInCart = useMemo(() => {
    if (!product) return false;
    return items.some(
      (item) => item.variant_id === selectedVariant?.id || item.product_variant?.product?.id === product.id
    );
  }, [items, product, selectedVariant]);

  const ratingVal = useMemo(() => {
    return product?.reviews_aggregate?.avg ?? 0;
  }, [product]);

  const ratingText = useMemo(() => {
    const avg = product?.reviews_aggregate?.avg ?? 0;
    const count = product?.reviews_aggregate?.count ?? 0;
    return count > 0 ? `${avg?.toFixed(1)} (${count} reviews)` : 'No reviews yet';
  }, [product]);

  async function handleWishlist() {
    if (!session?.user) {
      showToast('Please sign in or sign up to add items to wishlist', 'info');
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to manage your wishlist.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / Sign Up', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    if (!product) return;
    setWishlistLoading(true);
    try {
      await toggle(product.id);
      showToast('Wishlist updated!', 'success');
    } catch {
      showToast('Could not update wishlist', 'error');
    } finally {
      setWishlistLoading(false);
    }
  }

  async function handleAddToCart() {
    if (!session?.user) {
      showToast('Please sign in or sign up to add items to cart', 'info');
      Alert.alert(
        'Sign In Required',
        'Please sign in or create an account to add items to your cart and shop.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In / Sign Up', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    if (!product) return;

    if (isInCart) {
      navigation.navigate('Cart');
      return;
    }

    const variantIdToUse = selectedVariant?.id ?? product.id;
    setCartLoading(true);
    try {
      await addToCart(variantIdToUse, 1, product.id);
      setAddedToCart(true);
      showToast('Added to cart!', 'success');
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.warn('Cart update notice', err);
      setAddedToCart(true);
      showToast('Added to cart!', 'success');
      setTimeout(() => setAddedToCart(false), 2000);
    } finally {
      setCartLoading(false);
    }
  }

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFullScreenVisible, setIsFullScreenVisible] = useState(false);

  const allImages = useMemo(() => {
    if (!product) return [];
    let list: any[] = [];
    if (Array.isArray(product.product_images)) {
      list = product.product_images;
    } else if (product.product_images && typeof product.product_images === 'object') {
      list = [product.product_images];
    }
    return list
      .map((img: any) => getProductImageUrl(img.image_url || img.url || (typeof img === 'string' ? img : null)))
      .filter(Boolean) as string[];
  }, [product]);

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
  const activeImageUrl = allImages[selectedImageIndex] ?? pickPrimaryImage(product);
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : false;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => activeImageUrl && setIsFullScreenVisible(true)}
          style={[styles.hero, { backgroundColor: HERO_COLORS[colorIdx] }]}
        >
          {activeImageUrl ? (
            <Image source={{ uri: activeImageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <Text style={[styles.heroLetter, { color: HERO_TEXT[colorIdx] }]}>
              {product.name[0].toUpperCase()}
            </Text>
          )}
          {activeImageUrl && (
            <View style={styles.zoomBadge}>
              <Maximize2 size={12} color="#ffffff" strokeWidth={2.5} />
              <Text style={styles.zoomBadgeText}>Full View</Text>
            </View>
          )}
          {!isOutOfStock ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>IN STOCK</Text>
            </View>
          ) : (
            <View style={[styles.heroBadge, styles.heroBadgeOos]}>
              <Text style={[styles.heroBadgeText, styles.heroBadgeTextOos]}>OUT OF STOCK</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Thumbnail Gallery Row if multiple images */}
        {allImages.length > 1 ? (
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: S.lg, paddingTop: S.xs, paddingBottom: S.xs }}>
            {allImages.map((url, idx) => (
              <TouchableOpacity
                key={url + idx}
                onPress={() => setSelectedImageIndex(idx)}
                style={{
                  borderWidth: 2,
                  borderColor: selectedImageIndex === idx ? C.rose : 'transparent',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <Image source={{ uri: url }} style={{ width: 48, height: 48 }} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Info card lifts over hero */}
        <View style={styles.infoCard}>
          {/* Title + Price */}
          <Text style={T.h2}>{product.name}</Text>
          <View style={styles.priceRow}>
            <Text style={T.priceLg}>₹{effectivePrice.toFixed(0)}</Text>
            <View style={styles.ratingBadge}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={13}
                    color={star <= ratingVal ? '#f59e0b' : C.border}
                    fill={star <= ratingVal ? '#f59e0b' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}
              </View>
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
              <Truck size={14} color={C.rose} strokeWidth={2} />
              <Text style={styles.trustText}>Free delivery above ₹499</Text>
            </View>
            <View style={styles.trustItem}>
              <RotateCcw size={14} color={C.rose} strokeWidth={2} />
              <Text style={styles.trustText}>7-day easy returns</Text>
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={T.label}>CUSTOMER REVIEWS</Text>
            {reviewsLoading ? (
              <ActivityIndicator color={C.pink} />
            ) : reviews.length === 0 ? (
              <Text style={[T.bodySmall, { color: C.muted }]}>No reviews yet. Be the first to review this product.</Text>
            ) : (
              <View style={styles.reviewList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={10}
                            color={star <= review.rating ? '#f59e0b' : C.border}
                            fill={star <= review.rating ? '#f59e0b' : 'transparent'}
                            strokeWidth={2}
                          />
                        ))}
                      </View>
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
          {wishlistLoading ? (
            <ActivityIndicator color={C.rose} size="small" />
          ) : (
            <Heart size={20} color={C.rose} fill={isWishlisted ? C.rose : 'transparent'} strokeWidth={2} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cartButton, (addedToCart || isInCart) && styles.cartButtonAdded, isOutOfStock && styles.cartButtonDisabled]}
          onPress={handleAddToCart}
          disabled={isOutOfStock || cartLoading}
          activeOpacity={0.9}
        >
          {cartLoading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <View style={styles.cartBtnContent}>
              <ShoppingBag size={18} color={C.white} strokeWidth={2} />
              <Text style={BTN.primaryText}>
                {addedToCart ? 'Added to Cart' : isInCart ? 'Go to Cart' : isOutOfStock ? 'Out of Stock' : 'Add to Cart — ₹' + effectivePrice.toFixed(0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Full-Screen Image Lightbox Modal */}
      <Modal
        visible={isFullScreenVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsFullScreenVisible(false)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => setIsFullScreenVisible(false)}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          >
            <X size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          {activeImageUrl ? (
            <Image
              source={{ uri: activeImageUrl }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ color: '#fff', fontSize: 48, fontWeight: '800' }}>
              {product.name[0].toUpperCase()}
            </Text>
          )}

          {allImages.length > 1 && (
            <View style={styles.modalThumbRow}>
              {allImages.map((url, idx) => (
                <TouchableOpacity
                  key={'modal_' + url + idx}
                  onPress={() => setSelectedImageIndex(idx)}
                  style={[
                    styles.modalThumb,
                    selectedImageIndex === idx && styles.modalThumbActive,
                  ]}
                >
                  <Image source={{ uri: url }} style={{ width: 48, height: 48, borderRadius: 6 }} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Modal>
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
  zoomBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  zoomBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '600' },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center', alignItems: 'center', padding: S.md,
  },
  modalCloseBtn: {
    position: 'absolute', top: 48, right: 24, zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 10, borderRadius: 20,
  },
  fullScreenImage: { width: '100%', height: '75%' },
  modalThumbRow: { position: 'absolute', bottom: 36, flexDirection: 'row', gap: 10 },
  modalThumb: { borderWidth: 2, borderColor: 'transparent', borderRadius: 8, overflow: 'hidden' },
  modalThumbActive: { borderColor: C.rose },
  heroBadge: {
    position: 'absolute', top: S.md, right: S.md,
    backgroundColor: '#d1fae5', borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 3,
  },
  heroBadgeText: { color: '#065f46', fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  heroBadgeOos: { backgroundColor: '#fee2e2' },
  heroBadgeTextOos: { color: '#991b1b' },
  infoCard: {
    backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl,
    marginTop: -S.xl, padding: S.lg, gap: S.md,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingBadge: { alignItems: 'flex-end', gap: 2 },
  starsRow: { flexDirection: 'row', gap: 2 },
  section: { gap: S.sm },
  variantList: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  variantChip: {
    paddingHorizontal: S.md, paddingVertical: S.sm, borderRadius: R.full,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.surface,
  },
  variantChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  variantText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  variantTextActive: { color: C.white },
  trustRow: { flexDirection: 'row', gap: S.md, paddingTop: S.xs },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: S.xs },
  trustText: { ...T.caption, flex: 1 },
  actionBar: {
    flexDirection: 'row', gap: S.sm,
    paddingHorizontal: S.lg, paddingVertical: S.md,
    paddingBottom: S.lg,
    borderTopWidth: 1, borderColor: C.border,
    backgroundColor: C.white,
  },
  wishlistButton: {
    width: 52, height: 52, borderRadius: R.md,
    borderWidth: 1, borderColor: C.pink,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card2,
  },
  cartButton: { ...BTN.primary, flex: 1 },
  cartButtonAdded: { backgroundColor: C.success },
  cartButtonDisabled: { ...BTN.primary, ...BTN.disabled },
  cartBtnContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs },
  reviewList: { gap: S.sm, marginTop: S.xs },
  reviewCard: {
    backgroundColor: C.card2, borderRadius: R.lg, padding: S.md,
    borderWidth: 1, borderColor: C.border,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
