import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Package } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchCategories } from '../../lib/api/buyer';
import {
  fetchSellerProducts,
  upsertSellerProduct,
  deleteSellerProduct,
  adjustVariantStock,
} from '../../lib/api/seller';
import { pickPrimaryImage, uploadProductImage, getProductImageUrl } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import type { Category, Product } from '../../lib/types';
import { C, S, R, T } from '../../lib/theme';

const CARD_BG = [C.card0, C.card1, C.card2, C.card3];

function stockBadge(qty: number): { label: string; bg: string; color: string } {
  if (qty <= 0) return { label: 'Out of Stock', bg: '#fee2e2', color: C.error };
  if (qty <= 5) return { label: `${qty} Low Stock`, bg: '#fffbeb', color: C.warning };
  return { label: `${qty} in stock`, bg: '#d1fae5', color: '#065f46' };
}

export function SellerProductsScreen() {
  const { session, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'active' | 'inactive'>('draft');

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    try {
      const [prodData, catData] = await Promise.all([
        fetchSellerProducts(session.user.id),
        fetchCategories(),
      ]);
      setProducts(prodData ?? []);
      setCategories(catData ?? []);
      setError(null);
    } catch (err) {
      console.warn('Seller products load failed', err);
      setError('Unable to load products. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="My Products" subtitle="Sign in to view your listings." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="My Products" subtitle="Switch to a seller account to access this section." />;
  }

  const refresh = () => {
    setLoading(true);
    load();
  };

  const handleAddProduct = async () => {
    if (!session?.user) return;
    setSaving(true);
    try {
      await upsertSellerProduct(session.user.id, {
        name: 'New Premium Listing',
        price: 999,
        description: 'Edit this description to specify product features and sizing details.',
        category_id: categories[0]?.id ?? '',
        status: 'draft',
      });
      await load();
    } catch (err) {
      Alert.alert('Failed to add product', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async (variantId: string | undefined, delta: number) => {
    if (!variantId) {
      Alert.alert('No variant found', 'Products need at least one variant to adjust stock levels.');
      return;
    }
    setProducts((prev) =>
      prev.map((p) => {
        const productVariants = p.product_variants;
        if (!productVariants) return p;
        const hasVariant = productVariants.some((v) => v.id === variantId);
        if (!hasVariant) return p;
        return {
          ...p,
          product_variants: productVariants.map((v) =>
            v.id === variantId ? { ...v, stock: Math.max(0, v.stock + delta) } : v
          ),
        };
      })
    );

    try {
      await adjustVariantStock(variantId, delta);
    } catch (err) {
      console.warn('Stock update backend error', err);
      load();
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditDesc(product.description ?? '');
    setEditCategoryId(product.category_id ?? '');
    setEditStatus((product.status as any) ?? 'draft');
  };

  const closeEditModal = () => {
    setEditingProduct(null);
  };

  const handleSaveProduct = async () => {
    if (!editingProduct || !session?.user) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price greater than 0.');
      return;
    }

    try {
      await upsertSellerProduct(session.user.id, {
        id: editingProduct.id,
        name: editName.trim(),
        price: priceNum,
        description: editDesc.trim(),
        category_id: editCategoryId || null,
        status: editStatus,
      });
      closeEditModal();
      refresh();
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    }
  };

  const handleDeleteProduct = () => {
    if (!editingProduct) return;
    Alert.alert(
      'Delete Product?',
      `Are you sure you want to delete "${editingProduct.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSellerProduct(editingProduct.id);
              closeEditModal();
              refresh();
            } catch (err) {
              Alert.alert('Delete failed', (err as Error).message);
            }
          },
        },
      ]
    );
  };

  const handleAddImage = async () => {
    if (!editingProduct) return;

    const currentImages = editingProduct.product_images || [];
    if (currentImages.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 images per product.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    // File size check: 5MB limit
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('File Too Large', 'Image size must be under 5MB.');
      return;
    }

    if (!asset.base64) {
      Alert.alert('Error', 'Could not read image data.');
      return;
    }

    setSaving(true);
    try {
      const fileName = asset.fileName || `img_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      
      const newImg = await uploadProductImage(
        editingProduct.id,
        asset.base64,
        fileName,
        mimeType
      );

      const updatedImages = [...currentImages, newImg];
      const updatedProd = { ...editingProduct, product_images: updatedImages };
      setEditingProduct(updatedProd);
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updatedProd : p)));

      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (err) {
      Alert.alert('Upload Failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!editingProduct) return;

    Alert.alert(
      'Delete Image?',
      'Are you sure you want to remove this product image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const { error: dbError } = await supabase
                .from('product_images')
                .delete()
                .eq('id', imageId);
              
              if (dbError) throw dbError;

              await supabase.storage.from('product-images').remove([imageUrl]);

              const updatedImages = (editingProduct.product_images || []).filter((img) => img.id !== imageId);
              const updatedProd = { ...editingProduct, product_images: updatedImages };
              setEditingProduct(updatedProd);
              setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updatedProd : p)));
            } catch (err) {
              Alert.alert('Delete Image Failed', (err as Error).message);
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={refresh}
        showsVerticalScrollIndicator={false}
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
              <Package size={48} color={C.pink} strokeWidth={1.5} />
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
                  <TouchableOpacity style={styles.smallBtnOutline} onPress={() => openEditModal(item)}>
                    <Text style={[styles.smallBtnText, { color: C.rose }]}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />
      <Modal
        visible={editingProduct !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Product</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Product name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  placeholder="Price"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editDesc}
                  onChangeText={setEditDesc}
                  multiline={true}
                  numberOfLines={4}
                  placeholder="Describe your product..."
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Product Images ({editingProduct?.product_images?.length || 0}/5)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageScroll}>
                  {(editingProduct?.product_images || []).map((img) => {
                    const fullUrl = getProductImageUrl(img.image_url);
                    return (
                      <View key={img.id} style={styles.imageContainer}>
                        <Image source={{ uri: fullUrl || undefined }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.deleteImageBtn}
                          onPress={() => handleDeleteImage(img.id, img.image_url)}
                        >
                          <Text style={styles.deleteImageBtnText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  {(editingProduct?.product_images?.length || 0) < 5 && (
                    <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage}>
                      <Text style={styles.addImageBtnText}>+</Text>
                      <Text style={styles.addImageSubtext}>Add Image</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
                <Text style={[T.caption, { marginTop: 4 }]}>Maximum 5 images. Under 5MB per image.</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        editCategoryId === cat.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setEditCategoryId(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          editCategoryId === cat.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusRow}>
                  {['draft', 'active', 'inactive'].map((st) => (
                    <TouchableOpacity
                      key={st}
                      style={[
                        styles.statusBtn,
                        editStatus === st && styles.statusBtnActive,
                      ]}
                      onPress={() => setEditStatus(st as any)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          editStatus === st && styles.statusBtnTextActive,
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeEditModal}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProduct}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteProduct}>
                <Text style={styles.deleteBtnText}>Delete Product</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    backgroundColor: C.white, borderRadius: R.lg,
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
  smallBtnOutline: { flex: 1.2, borderRadius: R.sm, paddingVertical: 6, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  smallBtnText: { fontSize: 12, fontWeight: '700', color: C.text2 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: S.md },
  modalContent: { backgroundColor: C.white, borderRadius: R.lg, padding: S.lg, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: S.md, textAlign: 'center' },
  inputGroup: { marginBottom: S.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.text2, marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: S.xs, marginTop: 4 },
  categoryChip: { borderWidth: 1, borderColor: C.border, borderRadius: R.full, paddingHorizontal: S.sm, paddingVertical: 6, backgroundColor: C.surface },
  categoryChipActive: { borderColor: C.pink, backgroundColor: '#fdf2f8' },
  categoryChipText: { fontSize: 12, color: C.text2 },
  categoryChipTextActive: { color: C.pink, fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: S.sm, marginTop: 4 },
  statusBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingVertical: 8, alignItems: 'center', backgroundColor: C.surface },
  statusBtnActive: { borderColor: C.pink, backgroundColor: '#fdf2f8' },
  statusBtnText: { fontSize: 12, color: C.text2 },
  statusBtnTextActive: { color: C.pink, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: S.sm, marginTop: S.lg },
  saveBtn: { flex: 1, backgroundColor: C.rose, borderRadius: R.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: C.text2, fontWeight: '600', fontSize: 14 },
  deleteBtn: { marginTop: S.md, borderWidth: 1, borderColor: C.error, borderRadius: R.md, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fef2f2' },
  deleteBtnText: { color: C.error, fontWeight: '700', fontSize: 14 },
  imageScroll: { gap: S.sm, paddingVertical: 4 },
  imageContainer: { position: 'relative', width: 80, height: 80, borderRadius: R.md, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  previewImage: { width: 80, height: 80 },
  deleteImageBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  deleteImageBtnText: { color: C.white, fontSize: 12, fontWeight: '700', lineHeight: 14 },
  addImageBtn: { width: 80, height: 80, borderRadius: R.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.pink, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', gap: 2 },
  addImageBtnText: { fontSize: 20, color: C.rose, fontWeight: '700' },
  addImageSubtext: { fontSize: 9, color: C.muted, fontWeight: '600' },
});
