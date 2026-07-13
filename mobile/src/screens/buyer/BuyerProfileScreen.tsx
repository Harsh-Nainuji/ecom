import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, BTN, T } from '../../lib/theme';

export function BuyerProfileScreen() {
  const { profile, session, signOut } = useAuth();
  const { wishlist } = useWishlist();
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();

  if (!session) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestAvatarRing}>
          <Text style={styles.guestAvatarText}>👤</Text>
        </View>
        <Text style={T.h2}>Welcome to FabZone</Text>
        <Text style={[T.bodySmall, { color: C.muted, textAlign: 'center', marginBottom: S.sm }]}>
          Sign in to view your profile, orders and wishlist
        </Text>
        <TouchableOpacity style={[BTN.primary, { width: '100%' }]} onPress={() => navigation.navigate('Login' as never)}>
          <Text style={BTN.primaryText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[BTN.secondary, { width: '100%' }]} onPress={() => navigation.navigate('Register' as never)}>
          <Text style={BTN.secondaryText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menuItems = [
    { label: 'My Orders', sub: 'Track & view orders', onPress: () => {} },
    { label: 'Wishlist', sub: `${wishlist.length} saved items`, onPress: () => navigation.navigate('Wishlist') },
    { label: 'Address Book', sub: 'Manage delivery addresses', onPress: () => navigation.navigate('AddressBook') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: S.xxl }}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={T.h3}>{profile?.full_name ?? 'New Shopper'}</Text>
          <Text style={[T.label, { marginTop: 2 }]}>{profile?.role?.toUpperCase()}</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={T.h4}>{item.label}</Text>
              <Text style={[T.caption, { marginTop: 2 }]}>{item.sub}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  guestContainer: { flex: 1, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.xl, gap: S.md },
  guestAvatarRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.card2, alignItems: 'center', justifyContent: 'center', marginBottom: S.sm },
  guestAvatarText: { fontSize: 36 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: S.md, paddingHorizontal: S.lg, paddingVertical: S.lg, borderBottomWidth: 1, borderColor: C.border },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.pink, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontWeight: '800', color: C.white },
  menuSection: { marginHorizontal: S.lg, marginTop: S.lg, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.md, paddingVertical: S.md + 4, backgroundColor: C.white },
  menuRowBorder: { borderBottomWidth: 1, borderColor: C.border },
  logoutButton: { marginHorizontal: S.lg, marginTop: S.lg, height: 52, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card2, borderWidth: 1.5, borderColor: C.pink },
  logoutText: { color: C.rose, fontWeight: '700', fontSize: 15 },
});
