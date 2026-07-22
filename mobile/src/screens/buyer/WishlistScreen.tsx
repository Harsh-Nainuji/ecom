import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';
import { useWishlist } from '../../context/WishlistContext';
import { pickPrimaryImage } from '../../lib/storage';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, T } from '../../lib/theme';

const CARD_COLORS = [C.card0, C.card1, C.card2, C.card3];

export function WishlistScreen() {
  const { wishlist, toggle } = useWishlist();
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={{ paddingBottom: S.xl }}
      data={wishlist}
      keyExtractor={(item) => item.product_id}
      ListHeaderComponent={<Text style={styles.heading}>Wishlist ({wishlist.length})</Text>}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Heart size={48} color={C.rose} fill={C.card2} strokeWidth={1.5} style={{ marginBottom: S.xs }} />
          <Text style={T.h3}>Nothing saved yet</Text>
          <Text style={[T.bodySmall, { color: C.muted, marginTop: S.xs }]}>
            Tap the heart icon on any product to save it here
          </Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const imageUrl = pickPrimaryImage(item.product);
        return (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: CARD_COLORS[index % CARD_COLORS.length] }]}>
                <Text style={styles.imageText}>{item.product?.name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, gap: S.xs }}>
              <Text style={T.h4} numberOfLines={2}>{item.product?.name}</Text>
              <Text style={T.price}>₹{item.product?.price?.toFixed(0)}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => toggle(item.product_id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate('ProductDetail', { productId: item.product_id })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewBtnText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: C.white },
  heading: { ...T.h2, paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.sm },
  card: {
    flexDirection: 'row', gap: S.md, padding: S.md,
    marginHorizontal: S.lg, marginBottom: S.sm,
    borderRadius: R.lg, backgroundColor: C.white,
    borderWidth: 1, borderColor: C.border,
    shadowColor: C.pink, shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  productImage: { width: 80, height: 80, borderRadius: R.md, backgroundColor: C.card0 },
  imagePlaceholder: { width: 80, height: 80, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  imageText: { fontSize: 28, fontWeight: '800', color: C.rose },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: S.xs },
  remove: { fontSize: 13, fontWeight: '700', color: C.rose },
  viewBtn: { backgroundColor: C.rose, borderRadius: R.sm, paddingHorizontal: S.md, paddingVertical: 6 },
  viewBtnText: { color: C.white, fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: S.sm },
});
