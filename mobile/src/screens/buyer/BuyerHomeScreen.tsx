import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchCategories, fetchFeaturedProducts, searchProducts } from '../../lib/api/buyer';
import { pickPrimaryImage } from '../../lib/storage';
import type { Category, Product } from '../../lib/types';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, T } from '../../lib/theme';

const CARD_PALETTES = [
  { bg: C.card0, text: C.rose },
  { bg: C.card1, text: '#a0522d' },
  { bg: C.card2, text: '#b91c4c' },
  { bg: C.card3, text: '#c96a00' },
];


export function BuyerHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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
      const [cats, featured] = await Promise.all([fetchCategories(), fetchFeaturedProducts()]);
      setCategories((cats ?? []) as Category[]);
      setProducts((featured ?? []) as Product[]);
      setError(null);
    } catch (err) {
      console.warn('Failed to load home feed', err);
      setCategories([]);
      setProducts([]);
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
      style={styles.container}
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.productGrid}
      columnWrapperStyle={{ gap: 12 }}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadInitial} tintColor={C.pink} />}
      ListHeaderComponent={
        <View>
          {/* Hero Banner */}
          <LinearGradient colors={[C.rose, '#f46f90']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroBanner}>
            <View style={styles.heroBannerInner}>
              <View style={styles.heroTagRow}>
                <View style={styles.heroTagDot} />
                <Text style={styles.heroTag}>NEW ARRIVALS</Text>
              </View>
              <Text style={styles.heroTitle}>Style That{'\n'}Speaks You</Text>
              <Text style={styles.heroSubtitle}>Trendy fashion at your fingertips</Text>
              <TouchableOpacity style={styles.heroBtn} onPress={() => {}}>
                <Text style={styles.heroBtnText}>Shop Now →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.heroAccent}>
              <MaterialCommunityIcons name="human-female-dance" size={52} color={C.white} />
              <View style={styles.heroAccentDot} />
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Feather name="search" size={18} color={C.muted} style={styles.searchIcon} />
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
                <Feather name="x" size={16} color={C.muted} />
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
              <Feather name="truck" size={16} color={C.white} />
              <Text style={styles.promoText}>Free delivery above ₹499</Text>
            </View>
            <View style={styles.promoDivider} />
            <View style={styles.promoItem}>
              <Feather name="gift" size={16} color={C.white} />
              <Text style={styles.promoText}>New user? 10% off</Text>
            </View>
          </LinearGradient>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{featuredTitle}</Text>
            {searching && <ActivityIndicator size="small" color={C.pink} />}
          </View>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="shopping-bag" size={22} color={C.rose} />
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
            activeOpacity={0.88}
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
              <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
              {avg > 0 && (
                <View style={styles.ratingRow}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Feather
                      key={`${item.id}-star-${idx}`}
                      name="star"
                      size={11}
                      color={idx < Math.round(avg) ? C.warning : '#e5e7eb'}
                    />
                  ))}
                  <Text style={styles.ratingCount}>({item.reviews_aggregate?.count ?? 0})</Text>
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
    borderRadius: R.xl, padding: S.lg,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    shadowColor: C.rose, shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  heroBannerInner: { flex: 1, gap: S.xs },
  heroTagRow: { flexDirection: 'row', alignItems: 'center', gap: S.xs, marginBottom: S.xs },
  heroTagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.rose },
  heroTag: { ...T.label, color: C.rose },
  heroTitle: { fontSize: 24, fontWeight: '800', color: C.text, lineHeight: 30 },
  heroSubtitle: { ...T.bodySmall, color: C.text3, marginBottom: S.sm },
  heroBtn: {
    backgroundColor: C.white, borderRadius: R.md,
    paddingHorizontal: S.md, paddingVertical: S.xs + 2,
    alignSelf: 'flex-start', shadowColor: '#fff', shadowOpacity: 0.2, shadowRadius: 8,
  },
  heroBtnText: { color: C.rose, fontWeight: '700', fontSize: 13 },
  heroAccent: {
    width: 76, height: 76, borderRadius: R.xxl,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: S.md, position: 'relative',
  },
  heroAccentDot: {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.white, top: 8, right: 6, opacity: 0.85,
  },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.white, borderRadius: R.lg,
    marginHorizontal: S.md, marginVertical: S.sm,
    paddingHorizontal: S.md, height: 48,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: C.pink, shadowOpacity: 0.1, shadowRadius: 10, elevation: 2,
  },
  searchIcon: { marginRight: S.sm },
  searchInput: { flex: 1, fontSize: 14, color: C.text2, paddingVertical: 0 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.md, marginBottom: S.sm, marginTop: S.xs,
  },
  sectionTitle: { ...T.h4, paddingHorizontal: S.md, marginBottom: S.sm, marginTop: S.sm },
  categoryList: { paddingHorizontal: S.md, paddingBottom: S.sm, gap: S.sm },
  categoryChip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.full,
    paddingHorizontal: S.md, paddingVertical: 7,
    backgroundColor: C.white,
  },
  categoryChipActive: { backgroundColor: C.rose, borderColor: C.rose },
  categoryChipText: { color: C.muted, fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: C.white },
  promoStrip: {
    marginHorizontal: S.md, borderRadius: R.lg,
    paddingVertical: S.sm, paddingHorizontal: S.md,
    flexDirection: 'row', alignItems: 'center', gap: S.md, marginBottom: S.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: C.peach, shadowOpacity: 0.2, shadowRadius: 12, elevation: 3,
  },
  promoItem: { flexDirection: 'row', alignItems: 'center', gap: S.xs, flex: 1 },
  promoText: { fontSize: 12, color: C.white, fontWeight: '600' },
  promoDivider: { width: 1.2, height: 18, backgroundColor: 'rgba(255,255,255,0.45)' },
  productGrid: { paddingHorizontal: S.sm, paddingBottom: 40, gap: S.sm },
  card: {
    flex: 1, backgroundColor: C.white, borderRadius: R.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: '#f4c7d2',
    shadowColor: C.pink, shadowOpacity: 0.16, shadowRadius: 10, elevation: 3,
  },
  productImage: {
    height: 130, width: '100%', backgroundColor: C.card0,
    borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
  },
  imagePlaceholder: {
    height: 130, alignItems: 'center', justifyContent: 'center',
    borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl,
  },
  imageText: { fontSize: 42, fontWeight: '800' },
  cardBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: C.rose, borderRadius: R.sm,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  cardBadgeText: { color: C.white, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardBody: { padding: S.sm, gap: 3 },
  productName: { fontSize: 13, fontWeight: '600', color: C.text, lineHeight: 18 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingCount: { ...T.caption, fontSize: 10, marginLeft: 4 },
  productPrice: { fontSize: 15, fontWeight: '800', color: C.rose },
  emptyContainer: { alignItems: 'center', paddingVertical: 48, gap: S.sm },
  emptyIcon: {
    width: 50, height: 50, borderRadius: R.full,
    backgroundColor: C.card2, borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
