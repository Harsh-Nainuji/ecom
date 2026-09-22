import { Alert, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Heart, MapPin, LogOut, ChevronRight, Store, HelpCircle, Trash2, FileText, ShieldCheck } from 'lucide-react-native';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, BTN, T } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export function BuyerProfileScreen() {
  const { profile, signOut, setActiveRole } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const [deleting, setDeleting] = useState(false);

  async function handleRequestDeletion() {
    if (!profile) return;
    Alert.alert(
      'Request Account Deletion',
      'Are you sure you want to request deletion of your account and all associated data? This request will be processed manually by our administration team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
               const { error } = await supabase
                 .from('account_deletion_requests')
                 .insert({ user_id: profile.id });

               if (error) throw error;
               Alert.alert('Request Submitted', 'Your account deletion request has been submitted successfully and will be processed manually by admin.');
            } catch (err: any) {
               Alert.alert('Submission Failed', err.message || 'Could not submit request.');
            } finally {
               setDeleting(false);
            }
          }
        }
      ]
    );
  }

  if (!profile) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIcon}>
          <User size={36} color={C.muted} strokeWidth={1.5} />
        </View>
        <Text style={T.h3}>Profile</Text>
        <Text style={[T.bodySmall, { color: C.muted, textAlign: 'center', marginBottom: S.md }]}>
          Sign in to manage your orders, wishlist, and saved addresses.
        </Text>
        <TouchableOpacity
          style={BTN.primary}
          onPress={() => navigation.navigate('Login' as never)}
          activeOpacity={0.8}
        >
          <Text style={BTN.primaryText}>Sign In / Register</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const menuItems = [
    ...(profile.role === 'seller'
      ? [
          {
            label: 'Switch to Seller Dashboard',
            icon: Store,
            onPress: () => setActiveRole('seller'),
          },
        ]
      : []),
    {
      label: 'Wishlist',
      icon: Heart,
      onPress: () => navigation.navigate('Wishlist' as never),
    },
    {
      label: 'Address Book',
      icon: MapPin,
      onPress: () => navigation.navigate('AddressBook' as never),
    },
    {
      label: 'Terms & Privacy Policy',
      icon: FileText,
      onPress: () => navigation.navigate('Terms' as never),
    },
    {
      label: 'Privacy & Data Rights (DPDPA 2023)',
      icon: ShieldCheck,
      onPress: () => navigation.navigate('PrivacyConsent' as never),
    },
    {
      label: 'Support / Help',
      icon: HelpCircle,
      onPress: () => {
        Alert.alert(
          'Support & Help',
          'For support, help, or queries, please email us at support@fabzone.dev.\n\n[Grievance Officer: contact details pending from client]'
        );
      },
    },
    {
      label: 'Request Account Deletion',
      icon: Trash2,
      onPress: handleRequestDeletion,
    },
  ];


  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + S.lg }]}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.full_name?.[0]?.toUpperCase() ?? ''}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={T.h2}>{profile.full_name ?? ''}</Text>
          <Text style={[T.caption, { color: C.rose, fontWeight: '700', letterSpacing: 0.5 }]}>
            {(profile.role ?? '').toUpperCase()} ACCOUNT
          </Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Icon size={18} color={C.text2} strokeWidth={2} />
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <ChevronRight size={18} color={C.muted} strokeWidth={2} />
            </TouchableOpacity>
          );
        })}
      </View>

      {deleting && (
        <View style={{ marginVertical: S.sm, alignItems: 'center' }}>
          <ActivityIndicator color={C.rose} />
          <Text style={[T.caption, { color: C.muted, marginTop: 4 }]}>Submitting deletion request...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={signOut}
        activeOpacity={0.8}
        disabled={deleting}
      >
        <LogOut size={16} color={C.error} strokeWidth={2} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white, paddingHorizontal: S.lg, paddingTop: S.lg },
  guestContainer: {
    flex: 1,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: S.xl,
    gap: S.sm,
  },
  guestIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    paddingVertical: S.lg,
    borderBottomWidth: 1,
    borderColor: C.border,
    marginBottom: S.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.card2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.pink,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: C.rose },
  menu: { gap: S.xs, marginBottom: S.xl },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderColor: C.border,
    height: 52,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  menuLabel: { fontSize: 15, fontWeight: '600', color: C.text2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.xs,
    borderWidth: 1,
    borderColor: C.error,
    backgroundColor: '#fef2f2',
    borderRadius: R.md,
    height: 48,
    marginTop: 'auto',
    marginBottom: S.xxl,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.error },
});
