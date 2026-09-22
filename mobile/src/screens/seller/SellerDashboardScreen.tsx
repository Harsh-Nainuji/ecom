import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Platform, Linking, Image } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { Plus, Package, ClipboardList, CreditCard, AlertTriangle, User, ExternalLink } from 'lucide-react-native';

import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchSellerDashboardStats, updateSellerProfile, fetchSellerPendingPayouts, type SellerDashboardStats, type SellerPendingPayout } from '../../lib/api/seller';
import type { SellerTabParamList } from '../../navigation/SellerTabs';
import { C, S, R, T } from '../../lib/theme';

type SellerTabNav = BottomTabNavigationProp<SellerTabParamList>;

const QUICK_ACTIONS: { label: string; icon: any; tab?: keyof SellerTabParamList }[] = [
  { label: 'Add Product', icon: Plus, tab: 'SellerProducts' },
  { label: 'View Orders', icon: Package, tab: 'SellerOrders' },
  { label: 'Profile', icon: User },
  { label: 'Payouts', icon: CreditCard },
];

export function SellerDashboardScreen() {
  const { session, profile, sellerProfile } = useAuth();
  const navigation = useNavigation<SellerTabNav>();
  const [stats, setStats] = useState<SellerDashboardStats | null>(null);
  const [pendingPayouts, setPendingPayouts] = useState<SellerPendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutDetails, setShowPayoutDetails] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile Edit State
  const [editProfile, setEditProfile] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    setLoading(true);
    try {
      const [data, payouts] = await Promise.all([
        fetchSellerDashboardStats(session.user.id),
        fetchSellerPendingPayouts(session.user.id)
      ]);
      setStats(data);
      setPendingPayouts(payouts);
      setError(null);
    } catch (err) {
      console.warn('Seller dashboard load failed', err);
      setStats(null);
      setError('Unable to load dashboard data. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session?.user, profile?.role]);

  useEffect(() => { load(); }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Seller Hub" subtitle="Sign in to view your seller dashboard." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="Seller Hub" subtitle="Switch to a seller account to access this section." />;
  }

  const kpis = [
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, sub: 'Lifetime', color: C.card2 },
    { label: 'Revenue', value: stats ? `₹${Math.round(stats.revenue).toLocaleString('en-IN')}` : '₹0', sub: 'Lifetime', color: C.card1 },
    { label: 'Live Products', value: stats?.liveProducts ?? 0, sub: `${stats?.lowStockSkus ?? 0} low stock`, color: C.card0 },
    { label: 'Low Stock', value: stats?.lowStockSkus ?? 0, sub: 'SKUs ≤ 5 units', color: C.card3 },
  ];

  const recentOrders = stats?.recentOrders ?? [];

  const handleQuickAction = (action: typeof QUICK_ACTIONS[number]) => {
    if (action.tab) {
      navigation.navigate(action.tab);
    } else if (action.label === 'Payouts') {
      setShowPayoutDetails(true);
    } else if (action.label === 'Profile') {
      setEditProfile(sellerProfile || {});
      setShowProfileModal(true);
    } else {
      Alert.alert(action.label, 'This feature is coming soon.');
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user) return;
    setSavingProfile(true);
    try {
      await updateSellerProfile(session.user.id, {
        business_name: editProfile.business_name,
        mobile: editProfile.mobile,
        gst_number: editProfile.gst_number,
        bank_account_name: editProfile.bank_account_name,
        bank_account_number: editProfile.bank_account_number,
        bank_ifsc: editProfile.bank_ifsc,
      });
      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully.');
      load();
    } catch (err) {
      Alert.alert('Error', (err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const renderDashboard = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={C.pink} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={T.h2}>Seller Hub</Text>
          <Text style={[T.caption, { marginTop: 2 }]}>FabZone Partner Dashboard</Text>
        </View>
        <View style={styles.sellerBadge}>
          <Text style={styles.sellerBadgeText}>SELLER</Text>
        </View>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {kpis.map((stat) => (
          <View key={stat.label} style={[styles.kpiCard, { backgroundColor: stat.color }]}>
            <Text style={styles.kpiValue}>{stat.value}</Text>
            <Text style={styles.kpiLabel}>{stat.label}</Text>
            <Text style={styles.kpiSub}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <TouchableOpacity key={a.label} style={styles.actionBtn} activeOpacity={0.8} onPress={() => handleQuickAction(a)}>
              <Icon size={20} color={C.rose} strokeWidth={2} />
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent Orders */}
      <Text style={styles.sectionTitle}>Recent Orders</Text>
      <View style={styles.ordersCard}>
        {recentOrders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={[T.bodySmall, { color: error ? C.error : C.muted }]}>
              {error ?? 'No recent orders yet.'}
            </Text>
          </View>
        ) : (
          recentOrders.map((order, i) => (
            <View key={order.id} style={[styles.orderRow, i < recentOrders.length - 1 && styles.orderRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={T.h4}>#{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[T.bodySmall, { color: C.text3 }]}>
                  {order.buyer_name}{order.shipping_city ? ` · ${order.shipping_city}` : ''}
                </Text>
                <Text style={[T.caption, { marginTop: 2 }]}>{new Date(order.placed_at).toLocaleDateString('en-IN')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 3 }}>
                <Text style={[T.h4, { color: C.text }]}>₹{order.total_amount.toFixed(0)}</Text>
                <View style={[styles.statusPill, { backgroundColor: C.card2 }]}>
                  <Text style={[styles.statusText, { color: C.rose }]}>{order.order_status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Stock Alert */}
      <View style={styles.alertCard}>
        <AlertTriangle size={24} color={C.warning} strokeWidth={2} />
        <View style={{ flex: 1 }}>
          <Text style={[T.h4, { color: C.warning }]}>Low Stock Alert</Text>
          <Text style={[T.caption, { marginTop: 2 }]}>
            {stats?.lowStockSkus ?? 0} SKU{stats && stats.lowStockSkus === 1 ? '' : 's'} below threshold
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (loading && !stats) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={C.pink} />
      </View>
    );
  }

  return (
    <>
      {renderDashboard()}
      
      {/* Payout Details Modal */}
      <Modal visible={showPayoutDetails} animationType="slide" transparent={true} onRequestClose={() => setShowPayoutDetails(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: '#f0fdf4', padding: 8, borderRadius: 12 }}>
                  <CreditCard color="#16a34a" size={20} />
                </View>
                <Text style={T.h3}>Payout Details</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPayoutDetails(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {sellerProfile ? (
                <View style={{ gap: S.sm }}>
                  <View style={styles.payoutCard}>
                    <Text style={T.label}>Pending Payout</Text>
                    <Text style={[T.h1, { color: C.pink, marginVertical: S.xs }]}>
                      ₹{pendingPayouts.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[T.caption, { color: C.text3 }]}>
                      Amount will be credited to your bank account below by the platform administration.
                    </Text>
                  </View>

                  <View style={styles.payoutCard}>
                    <Text style={[T.label, { marginBottom: S.sm }]}>Payout Orders History ({pendingPayouts.length})</Text>
                    {pendingPayouts.length === 0 ? (
                      <Text style={[T.bodySmall, { color: C.muted }]}>No payouts currently.</Text>
                    ) : (
                      pendingPayouts.map((payout) => {
                        const isPaid = payout.status === 'paid';
                        return (
                          <View key={payout.id} style={{ paddingVertical: S.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={T.bodySmall}>Order #{payout.order_id.slice(0, 8).toUpperCase()}</Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{
                                  backgroundColor: isPaid ? '#f0fdf4' : '#fffbeb',
                                  borderColor: isPaid ? '#bbf7d0' : '#fde68a',
                                  borderWidth: 1,
                                  borderRadius: 4,
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                }}>
                                  <Text style={{ fontSize: 9, fontWeight: '800', color: isPaid ? '#16a34a' : '#d97706' }}>
                                    {isPaid ? 'PAID' : 'PENDING'}
                                  </Text>
                                </View>
                                <Text style={[T.bodySmall, { fontWeight: '700' }]}>₹{payout.amount.toLocaleString('en-IN')}</Text>
                              </View>
                            </View>
                            <Text style={[T.caption, { color: C.text3, marginTop: 2 }]}>
                              {isPaid && payout.paid_at
                                ? `Paid on ${new Date(payout.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                : `Pending since: ${new Date(payout.payment_confirmed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                            </Text>
                            {isPaid && payout.payment_proof_url && (
                              <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}
                                onPress={() => Linking.openURL(payout.payment_proof_url!)}
                              >
                                <ExternalLink size={12} color={C.rose} />
                                <Text style={{ fontSize: 11, fontWeight: '700', color: C.rose }}>
                                  View Payment Proof / Receipt
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>


                  <View style={styles.payoutCard}>
                    <Text style={[T.label, { marginBottom: S.sm }]}>Bank Account Information</Text>
                  <View style={styles.payoutRow}>
                    <Text style={styles.payoutLabel}>Account Holder</Text>
                    <Text style={styles.payoutValue}>{sellerProfile.bank_account_name || 'N/A'}</Text>
                  </View>
                  <View style={styles.payoutRow}>
                    <Text style={styles.payoutLabel}>Account Number</Text>
                    <Text style={[styles.payoutValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 2 }]}>
                      {sellerProfile.bank_account_number ? `•••• ${sellerProfile.bank_account_number.slice(-4)}` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.payoutRow}>
                    <Text style={styles.payoutLabel}>IFSC Code</Text>
                    <Text style={styles.payoutValue}>{sellerProfile.bank_ifsc || 'N/A'}</Text>
                  </View>
                  <View style={[styles.payoutRow, { borderBottomWidth: 0, marginTop: S.sm, backgroundColor: sellerProfile.status === 'approved' ? '#f0fdf4' : '#fffbeb', padding: S.sm, borderRadius: R.md }]}>
                    <Text style={styles.payoutLabel}>Verification Status</Text>
                    <Text style={[styles.payoutValue, { color: sellerProfile.status === 'approved' ? C.success : C.warning }]}>
                      {(sellerProfile.status || 'pending').toUpperCase()}
                    </Text>
                  </View>
                  
                  <TouchableOpacity style={styles.editBankBtn} onPress={() => {
                    setShowPayoutDetails(false);
                    setEditProfile(sellerProfile || {});
                    setShowProfileModal(true);
                  }}>
                    <Text style={styles.editBankBtnText}>Update Bank Details</Text>
                  </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.payoutCard}>
                  <Text style={[T.bodySmall, { color: C.muted }]}>No payout details found. Please complete your seller registration.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent={true} onRequestClose={() => setShowProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ backgroundColor: '#eff6ff', padding: 8, borderRadius: 12 }}>
                  <User color="#2563eb" size={20} />
                </View>
                <Text style={T.h3}>Edit Profile</Text>
              </View>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.business_name || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, business_name: t })}
                  placeholder="Enter business name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.mobile || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, mobile: t })}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GST Number (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.gst_number || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, gst_number: t })}
                  placeholder="Enter GST number"
                  autoCapitalize="characters"
                />
              </View>

              <Text style={[T.h4, { marginTop: S.md, marginBottom: S.sm }]}>Bank Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.bank_account_name || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, bank_account_name: t })}
                  placeholder="Enter account holder name"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.bank_account_number || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, bank_account_number: t })}
                  placeholder="Enter account number"
                  keyboardType="number-pad"
                  secureTextEntry={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>IFSC Code</Text>
                <TextInput
                  style={styles.textInput}
                  value={editProfile.bank_ifsc || ''}
                  onChangeText={(t) => setEditProfile({ ...editProfile, bank_ifsc: t })}
                  placeholder="Enter IFSC code"
                  autoCapitalize="characters"
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, savingProfile && { opacity: 0.6 }]} 
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                <Text style={styles.saveBtnText}>{savingProfile ? 'Saving...' : 'Save Changes'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.sm },
  sellerBadge: { backgroundColor: C.card2, borderRadius: R.sm, paddingHorizontal: S.sm, paddingVertical: 4, borderWidth: 1, borderColor: C.pink },
  sellerBadgeText: { ...T.label, color: C.rose },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  kpiCard: { width: '47.5%', borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border, gap: 3 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: C.text },
  kpiLabel: { ...T.caption, fontWeight: '700' },
  kpiSub: { ...T.caption, color: C.success },
  sectionTitle: { ...T.h4, marginTop: S.xs },
  actionsRow: { flexDirection: 'row', gap: S.sm },
  actionBtn: { flex: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: R.lg, paddingVertical: S.md, borderWidth: 1, borderColor: C.border, gap: S.xs },
  actionLabel: { ...T.caption, fontWeight: '700', textAlign: 'center' },
  ordersCard: { borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm, padding: S.md, backgroundColor: C.white },
  orderRowBorder: { borderBottomWidth: 1, borderColor: C.border },
  statusPill: { borderRadius: R.sm, paddingHorizontal: S.xs + 2, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: S.md, backgroundColor: '#fffbeb', borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: '#fde68a' },
  emptyOrders: { padding: S.md, alignItems: 'center' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  closeBtn: { fontSize: 24, color: C.text2, fontWeight: '700' },
  payoutCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: S.md, borderWidth: 1, borderColor: C.border },
  payoutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: S.sm, borderBottomWidth: 1, borderColor: C.border },
  payoutLabel: { ...T.caption, fontWeight: '600', color: C.text2 },
  payoutValue: { ...T.caption, fontWeight: '700', color: C.text },
  editBankBtn: { marginTop: S.md, alignItems: 'center', paddingVertical: S.sm, borderWidth: 1, borderColor: C.border, borderRadius: R.md, backgroundColor: C.white },
  editBankBtnText: { color: C.text, fontWeight: '600', fontSize: 13 },
  inputGroup: { marginBottom: S.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: C.text2, marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14 },
  saveBtn: { backgroundColor: C.rose, borderRadius: R.md, paddingVertical: 14, alignItems: 'center', marginTop: S.md, marginBottom: S.xl },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: 14 },
});
