import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, X, Truck, Gift, ShoppingBag, Star, Sparkles, ArrowRight } from 'lucide-react-native';
import { fetchCategories, fetchFeaturedProducts, fetchHomeBanners, searchProducts } from '../../lib/api/buyer';
import { pickPrimaryImage } from '../../lib/storage';
import type { Category, HomeBanner, Product } from '../../lib/types';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, T } from '../../lib/theme';

const CARD_PALETTES = [
  { bg: C.card0, text: C.rose },
  { bg: C.card1, text: '#a0522d' },
  { bg: C.card2, text: '#b91c4c' },
  { bg: C.card3, text: '#c96a00' },
];

const SCREEN_WIDTH = Dimensions.get('window').width;

export function BuyerHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const featuredTitle = useMemo(
    () => (selectedCategory || query ? 'Search Results' : 'Featured Picks'),
    [selectedCategory, query],
  );

  async function loadInitial() {
    setLoading(true);
    try {
      const [cats, featured, bannerData] = await Promise.all([
        fetchCategories(),
        fetchFeaturedProducts(),
        fetchHomeBanners().catch((err) => {
          console.warn('Failed to load banners', err);
          return [];
        }),
      ]);
      setCategories((cats ?? []) as Category[]);
      setProducts((featured ?? []) as Product[]);
      setBanners(bannerData ?? []);
      setError(null);
    } catch (err) {
      console.warn('Failed to load home feed', err);
      setCategories([]);
      setProducts([]);
      setBanners([]);
      setError('Unable to load products right now. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }

  async function runSearch(text?: string, categoryId?: string | null) {
    const resolvedText = text ?? query;
    const resolvedCat = categoryId !== undefined ? categoryId : selectedCategory;
    setSearching(true);
    try {
      const results = await searchProducts(resolvedText, resolvedCat);
      setProducts(results ?? []);
      setError(null);
    } catch (err) {
      console.warn('Search failed', err);
      setProducts([]);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  }

  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    if (!query && !selectedCategory) return;
    runSearch(query, selectedCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedCategory]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={C.pink} />
        <Text style={[T.caption, { marginTop: S.sm }]}>Loading your store…</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      style={styles.container}
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={[styles.productGrid, { paddingBottom: insets.bottom + 40 }]}
      columnWrapperStyle={{ gap: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInitial} tintColor={C.pink} />}
      ListHeaderComponent={
        <View>
          {/* Hero Banner / Marketing Carousel */}
          {banners.length > 0 ? (
            <View style={styles.carouselContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                  setBannerIndex(idx);
                }}
              >
                {banners.map((banner) => (
                  <TouchableOpacity
                    key={banner.id}
                    activeOpacity={banner.link_url ? 0.8 : 1}
                    onPress={() => banner.link_url && Linking.openURL(banner.link_url)}
                    style={styles.carouselSlide}
                  >
                    <Image source={{ uri: banner.image_url }} style={styles.carouselImage} resizeMode="cover" />
                    {banner.title ? (
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.carouselOverlay}>
                        <Text style={styles.carouselTitle}>{banner.title}</Text>
                      </LinearGradient>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.carouselDots}>
                {banners.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.carouselDot,
                      idx === bannerIndex && styles.carouselDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>
          ) : (
            <LinearGradient colors={[C.rose, '#f46f90']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
              <View style={styles.heroBannerInner}>
                <View style={styles.heroTagRow}>
                  <View style={styles.heroTagDot} />
                  <Text style={styles.heroTag}>NEW ARRIVALS</Text>
                </View>
                <Text style={styles.heroTitle}>Style That{'\n'}Speaks You</Text>
                <Text style={styles.heroSubtitle}>Trendy fashion at your fingertips</Text>
                <TouchableOpacity style={styles.heroBtn} onPress={() => listRef.current?.scrollToOffset({ offset: 400, animated: true })} activeOpacity={0.9}>
                  <Text style={styles.heroBtnText}>Shop Now</Text>
                  <ArrowRight size={12} color={C.rose} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <View style={styles.heroAccent}>
                <Sparkles size={38} color={C.white} strokeWidth={1.5} />
                <View style={styles.heroAccentDot} />
              </View>
            </LinearGradient>
          )}

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Search size={18} color={C.muted} style={styles.searchIcon} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search kurtas, sneakers, accessories…"
              placeholderTextColor={C.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={C.muted} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
            {[{ id: 'all', name: 'All' }, ...categories].map((item) => {
              const isActive = (item.id === 'all' && !selectedCategory) || item.id === selectedCategory;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => {
                    setSelectedCategory(item.id === 'all' ? null : item.id);
                    if (item.id === 'all') loadInitial();
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Promo Strip */}
          <LinearGradient colors={[C.card2, C.peach]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.promoStrip}>
            <View style={styles.promoItem}>
              <Truck size={15} color={C.rose} strokeWidth={2} />
              <Text style={styles.promoText}>Free delivery above ₹499</Text>
            </View>
            <View style={styles.promoDivider} />
            <View style={styles.promoItem}>
              <Gift size={15} color={C.rose} strokeWidth={2} />
              <Text style={styles.promoText}>New user? 10% off</Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitleFeatured}>{featuredTitle}</Text>
            {searching && <ActivityIndicator size="small" color={C.pink} />}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <ShoppingBag size={22} color={C.rose} strokeWidth={2} />
          </View>
          <Text style={T.h4}>{error ? 'Something went wrong' : 'No products found'}</Text>
          <Text style={[T.bodySmall, { color: error ? C.error : C.muted }]}>
            {error ?? 'Try a different search or category.'}
          </Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const pal = CARD_PALETTES[index % CARD_PALETTES.length];
        const avg = item.reviews_aggregate?.avg ?? 0;
        const imageUrl = pickPrimaryImage(item);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: pal.bg }]}>
                <Text style={[styles.imageText, { color: pal.text }]}>{item.name[0].toUpperCase()}</Text>
              </View>
            )}
            {(item.reviews_aggregate?.count ?? 0) > 100 && (
              <View style={styles.cardBadge}>
                <Text style={styles.cardBadgeText}>Popular</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text numberOfLines={1} style={styles.productName}>{item.name}</Text>
              {avg > 0 ? (
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`${item.id}-star-${idx}`}
                      size={11}
                      color={idx < Math.round(avg) ? C.warning : '#e5e7eb'}
                      fill={idx < Math.round(avg) ? C.warning : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                  <Text style={styles.ratingCount}>({item.reviews_aggregate?.count ?? 0})</Text>
                </View>
              ) : (
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={`${item.id}-star-empty-${idx}`}
                      size={11}
                      color="#e5e7eb"
                      fill="none"
                      strokeWidth={1.5}
                    />
                  ))}
                  <Text style={styles.ratingCount}>(0)</Text>
                </View>
              )}
              <Text style={styles.productPrice}>₹{item.price.toFixed(0)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  heroBanner: {
    marginHorizontal: S.md, marginTop: S.md, marginBottom: S.sm,
    borderRadius: R.lg, padding: S.lg,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  heroBannerInner: { flex: 1, gap: S.xs },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: 2 },
  heroTagDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.white },
  heroTag: { ...T.label, color: C.white, fontSize: 10, letterSpacing: 1.5 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: C.white, lineHeight: 30 },
  heroSubtitle: { ...T.bodySmall, color: 'rgba(255, 255, 255, 0.85)', marginBottom: S.sm },
  heroBtn: {
    backgroundColor: C.white, borderRadius: R.sm,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  heroBtnText: { color: C.rose, fontWeight: '700', fontSize: 12 },
  heroAccent: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginLeft: S.md, position: 'relative',
  },
  heroAccentDot: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.white, top: 6, right: 4, opacity: 0.8,
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: R.md,
    marginHorizontal: S.md, marginVertical: S.sm,
    paddingHorizontal: S.md, height: 44,
    borderWidth: 1, borderColor: C.border,
  },
  searchIcon: { marginRight: S.sm },
  searchInput: { flex: 1, fontSize: 14, color: C.text2, paddingVertical: 0 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.md, marginBottom: S.xs, marginTop: S.sm,
  },
  sectionTitle: { ...T.h4, paddingHorizontal: S.md, marginBottom: S.sm, marginTop: S.md },
  sectionTitleFeatured: { ...T.h4 },
  categoryList: { paddingHorizontal: S.md, paddingBottom: S.sm, gap: S.sm },
  categoryChip: {
    borderWidth: 1, borderColor: C.border, borderRadius: R.full,
    paddingHorizontal: S.md, paddingVertical: 6,
    backgroundColor: C.white,
  },
  categoryChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  categoryChipText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: C.white },
  promoStrip: {
    marginHorizontal: S.md, borderRadius: R.md,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md,
    borderWidth: 1, borderColor: C.border,
  },
  promoItem: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flex: 1 },
  promoText: { fontSize: 11, color: C.rose, fontWeight: '600' },
  promoDivider: { width: 1, height: 14, backgroundColor: C.border },
  carouselContainer: { marginHorizontal: S.md, marginTop: S.md, marginBottom: S.sm, borderRadius: R.lg, overflow: 'hidden' },
  carouselSlide: { width: SCREEN_WIDTH - S.md * 2, height: 180, borderRadius: R.lg, overflow: 'hidden' },
  carouselImage: { width: '100%', height: '100%' },
  carouselOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: S.md, paddingTop: S.xl,
    justifyContent: 'flex-end',
  },
  carouselTitle: { color: C.white, fontWeight: '800', fontSize: 16, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  carouselDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: S.sm },
  carouselDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  carouselDotActive: { backgroundColor: C.rose, width: 14, borderRadius: 3 },
  productGrid: { paddingHorizontal: S.md, gap: 12 },
  card: {
    flex: 1, backgroundColor: C.white, borderRadius: R.md,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border,
    shadowColor: C.pink, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  productImage: {
    height: 140, width: '100%', backgroundColor: C.card0,
  },
  imagePlaceholder: {
    height: 140, alignItems: 'center', justifyContent: 'center',
  },
  imageText: { fontSize: 36, fontWeight: '800' },
  cardBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: C.rose, borderRadius: R.sm,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  cardBadgeText: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { padding: S.sm, gap: S.xs },
  productName: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingCount: { ...T.caption, fontSize: 10, marginLeft: 2 },
  productPrice: { fontSize: 14, fontWeight: '800', color: C.rose },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: S.sm },
  emptyIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.card2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
