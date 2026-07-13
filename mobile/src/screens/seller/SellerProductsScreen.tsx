import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { adjustVariantStock, fetchSellerProducts, type SellerProduct, upsertSellerProduct } from '../../lib/api/seller';
import { pickPrimaryImage } from '../../lib/storage';
import { C, S, R, T } from '../../lib/theme';

const CARD_BG = [C.card0, C.card1, C.card2, C.card3];

function stockBadge(stock: number): { label: string; bg: string; color: string } {
  if (stock === 0) return { label: 'Out of Stock', bg: '#fee2e2', color: C.error };
  if (stock <= 5)  return { label: `Low · ${stock} left`, bg: '#fef3c7', color: '#92400e' };
  return { label: `In Stock · ${stock}`, bg: '#d1fae5', color: '#065f46' };
}

export function SellerProductsScreen() {
  const { session, profile } = useAuth();
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    setLoading(true);
    try {
      const data = await fetchSellerProducts(session.user.id);
      setProducts(data ?? []);
      setError(null);
    } catch (err) {
      console.warn('Seller products load failed', err);
      setProducts([]);
      setError('Unable to load products. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Seller Products" subtitle="Sign in to manage your catalog." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="Seller Products" subtitle="Switch to a seller account to access this section." />;
  }

  const handleAddProduct = async () => {
    if (!session.user) return;
    setSaving(true);
    try {
      const timestamp = new Date().toISOString().slice(11, 19);
      await upsertSellerProduct(session.user.id, {
        name: `New Product ${timestamp}`,
        price: 999,
        status: 'draft',
        description: 'Describe this product to help it sell.',
      });
      await refresh();
    } catch (err) {
      Alert.alert('Add product failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (product: SellerProduct) => {
    if (!session.user) return;
    setSaving(true);
    try {
      const nextStatus = product.status === 'active' ? 'inactive' : 'active';
      await upsertSellerProduct(session.user.id, { id: product.id, status: nextStatus });
      await refresh();
    } catch (err) {
      Alert.alert('Update failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (variantId: string | undefined, delta: number) => {
    if (!variantId) {
      Alert.alert('No variant', 'Add a variant before adjusting stock.');
      return;
    }
    setSaving(true);
    try {
      await adjustVariantStock(variantId, delta);
      await refresh();
    } catch (err) {
      Alert.alert('Stock update failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[T.h4, { flex: 1 }]}>{products.length} Products</Text>
            <TouchableOpacity
              style={[styles.addBtn, saving && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleAddProduct}
              disabled={saving}
            >
              <Text style={styles.addBtnText}>{saving ? 'Saving…' : '+ Add Product'}</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={{ marginTop: 80 }} color={C.pink} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={T.h4}>{error ? 'Unable to load products' : 'No products yet'}</Text>
              <Text style={[T.caption, { color: error ? C.error : C.muted, marginTop: S.xs }]}>
                {error ?? 'Tap “Add Product” to start selling.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const stockCount = item.product_variants?.[0]?.stock ?? 0;
          const stock = stockBadge(stockCount);
          const pal = CARD_BG[index % CARD_BG.length];
          const firstVariantId = item.product_variants?.[0]?.id;
          const imageUrl = pickPrimaryImage(item);
          return (
            <View style={styles.card}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.thumbImage} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: pal }]}>
                  <Text style={styles.thumbText}>{item.name[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={T.h4} numberOfLines={1}>{item.name}</Text>
                <Text style={T.caption}>{item.category_id ? 'Categorized' : 'Uncategorized'}</Text>
                <View style={styles.metaRow}>
                  <Text style={T.price}>₹{item.price.toLocaleString()}</Text>
                  <View style={[styles.stockPill, { backgroundColor: stock.bg }]}>
                    <Text style={[styles.stockText, { color: stock.color }]}>{stock.label}</Text>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => handleAdjustStock(firstVariantId, -1)}>
                    <Text style={styles.smallBtnText}>- Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtn} onPress={() => handleAdjustStock(firstVariantId, 1)}>
                    <Text style={styles.smallBtnText}>+ Stock</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.smallBtnOutline} onPress={() => handleToggleStatus(item)}>
                    <Text style={[styles.smallBtnText, { color: item.status === 'active' ? C.error : C.success }]}>
                      {item.status === 'active' ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  list: { paddingHorizontal: S.lg, paddingBottom: S.xxl, gap: S.sm },
  listHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: S.md },
  addBtn: { backgroundColor: C.rose, borderRadius: R.md, paddingHorizontal: S.md, paddingVertical: S.xs + 2 },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.white, borderRadius: R.xl,
    borderWidth: 1, borderColor: C.border, padding: S.sm,
  },
  thumb: { width: 64, height: 64, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  thumbImage: { width: 64, height: 64, borderRadius: R.lg, backgroundColor: C.card0 },
  thumbText: { fontSize: 26, fontWeight: '800', color: C.rose },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  stockPill: { borderRadius: R.sm, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  stockText: { fontSize: 10, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: S.sm, marginTop: S.xs },
  smallBtn: { flex: 1, backgroundColor: C.surface, borderRadius: R.sm, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  smallBtnOutline: { flex: 1.2, borderRadius: R.sm, paddingVertical: 6, alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: C.text2 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
  emptyEmoji: { fontSize: 48, color: C.pink },
});
