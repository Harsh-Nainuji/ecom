import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Clock, RefreshCw, LogOut, CheckCircle, HelpCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { C, S, R, BTN, T, CARD } from '../../lib/theme';

export function SellerPendingScreen() {
  const { session, sellerProfile, refreshProfile, signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Real-time listener for status change
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`seller-status-channel-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seller_profiles',
          filter: `id=eq.${session.user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          if (newStatus === 'approved') {
            Alert.alert(
              '🎉 Account Approved!',
              'Congratulations! Your seller registration has been approved. Tap below to launch your store dashboard.',
              [{ text: 'Open Seller Hub', onPress: () => refreshProfile() }]
            );
          } else {
            refreshProfile();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, refreshProfile]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account Review</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <LogOut size={16} color={C.muted} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Review Card */}
        <View style={styles.reviewCard}>
          <View style={styles.iconContainer}>
            <Clock size={40} color={C.warning} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Under Verification</Text>
          <Text style={styles.subtitle}>
            Your seller registration is currently being reviewed by our compliance team. Reviews are usually completed within 1–2 hours.
          </Text>

          <View style={styles.badge}>
            <ActivityIndicator size="small" color={C.warning} style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>WAITING FOR APPROVAL</Text>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Submitted Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Business Name</Text>
            <Text style={styles.detailVal}>{sellerProfile?.business_name || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GSTIN (GST Number)</Text>
            <Text style={styles.detailVal}>{sellerProfile?.gst_number || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN (Tax Card)</Text>
            <Text style={styles.detailVal}>{sellerProfile?.pan_number || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Registered Address</Text>
            <Text style={styles.detailVal}>{sellerProfile?.business_address || 'N/A'}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statusCheck}>
            <CheckCircle size={16} color={C.success} />
            <Text style={styles.statusCheckText}>Verification fields loaded successfully</Text>
          </View>
        </View>

        {/* Buttons */}
        <TouchableOpacity style={BTN.primary} onPress={handleManualRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.btnContent}>
              <RefreshCw size={16} color="#fff" />
              <Text style={BTN.primaryText}>Refresh Status</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <HelpCircle size={18} color={C.muted} />
          <Text style={styles.infoText}>
            Need to change submitted details? Please contact support@fabzone.dev with your registered email ID.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF8F9' },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  headerTitle: { ...T.h4, color: C.text },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: S.xs, paddingHorizontal: S.sm },
  logoutText: { ...T.link, fontSize: 13, color: C.muted },
  scroll: { padding: S.lg, gap: S.md, paddingBottom: S.xl },
  reviewCard: {
    ...CARD.elevated,
    backgroundColor: C.white,
    alignItems: 'center',
    padding: S.xl,
    gap: S.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.xs,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  title: { ...T.h2, color: C.text, textAlign: 'center' },
  subtitle: { ...T.bodySmall, color: C.muted, textAlign: 'center', lineHeight: 18 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: R.sm,
    marginTop: S.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#b45309' },
  detailsCard: {
    ...CARD.base,
    backgroundColor: C.white,
    padding: S.md,
    gap: S.sm,
  },
  detailsTitle: { ...T.h4, marginBottom: S.xs },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { ...T.bodySmall, color: C.muted },
  detailVal: { ...T.bodySmall, fontWeight: '600', color: C.text2, flex: 1, textAlign: 'right', marginLeft: S.lg },
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.xs },
  statusCheck: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusCheckText: { ...T.caption, color: C.success },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBox: { flexDirection: 'row', gap: S.sm, paddingHorizontal: S.sm, marginTop: S.xs },
  infoText: { ...T.caption, color: C.muted, flex: 1, lineHeight: 16 },
});
