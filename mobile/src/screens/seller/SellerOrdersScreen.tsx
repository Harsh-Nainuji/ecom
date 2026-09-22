import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { fetchSellerOrders, getNextOrderStatus, type SellerOrder, updateOrderStatus } from '../../lib/api/seller';
import type { OrderStatus } from '../../lib/types';
import { C, S, R, T } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { uploadDeliveryProof } from '../../lib/storage';
import { Package, Truck } from 'lucide-react-native';


type SellerFilterTab = 'All' | 'Ready to Ship' | 'In Transit' | 'COD Pending' | 'Delivered' | 'Cancelled';

const FILTERS: SellerFilterTab[] = ['All', 'Ready to Ship', 'In Transit', 'COD Pending', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  pending:    { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
  paid:      { bg: '#ecfdf5', color: '#10b981', border: '#a7f3d0' },
  packed:    { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  shipped:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  out_for_delivery: { bg: '#faf5ff', color: '#8b5cf6', border: '#e9d5ff' },
  delivered: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
};

export function SellerOrdersScreen() {
  const { session, profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState<SellerFilterTab>('All');
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.user || profile?.role !== 'seller') return;
    setLoading(true);
    try {
      const data = await fetchSellerOrders(session.user.id);
      setOrders(data ?? []);
      setError(null);
    } catch (err) {
      console.warn('Seller orders load failed', err);
      setOrders([]);
      setError('Unable to load orders. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  }, [session, profile]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Ready to Ship') return ['pending', 'paid', 'packed'].includes(o.order_status);
    if (activeFilter === 'In Transit') return ['shipped', 'out_for_delivery'].includes(o.order_status);
    if (activeFilter === 'COD Pending') return o.payment_method === 'cod' && !o.payment_confirmed_at;
    if (activeFilter === 'Delivered') return o.order_status === 'delivered';
    if (activeFilter === 'Cancelled') return o.order_status === 'cancelled';
    return true;
  });

  // Real-time listener for orders table updates
  useEffect(() => {
    if (!session?.user?.id || profile?.role !== 'seller') return;

    const channel = supabase
      .channel(`seller-orders-channel-${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${session.user.id}`,
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, profile?.role, load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Seller Orders" subtitle="Sign in to view your orders." />;
  }

  if (profile?.role !== 'seller') {
    return <ScreenPlaceholder title="Seller Orders" subtitle="Switch to a seller account to access this section." />;
  }

  // Wholesale Dispatch State
  const [dispatchOrder, setDispatchOrder] = useState<SellerOrder | null>(null);
  const [shippingType, setShippingType] = useState<'retail' | 'wholesale'>('wholesale');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [lrNumber, setLrNumber] = useState('');
  const [etaDays, setEtaDays] = useState('3');
  const [lrImage, setLrImage] = useState<{ uri: string; base64: string; fileName: string; mimeType: string } | null>(null);
  const [packageImage, setPackageImage] = useState<{ uri: string; base64: string; fileName: string; mimeType: string } | null>(null);
  const [submittingDispatch, setSubmittingDispatch] = useState(false);

  const handleAdvanceStatus = async (order: SellerOrder) => {
    const next = getNextOrderStatus(order.order_status);
    if (!next || next === 'cancelled') return;

    if (next === 'shipped' || next === 'out_for_delivery') {
      setDispatchOrder(order);
      setShippingType('wholesale');
      setTransporterName('');
      setVehicleNumber('');
      setLrNumber('');
      setEtaDays('3');
      setLrImage(null);
      setPackageImage(null);
      return;
    }

    setLoading(true);
    try {
      await updateOrderStatus(order.id, next);
      await load();
    } catch (err) {
      console.warn('Update order status failed', err);
      setError('Failed to update order status.');
      setLoading(false);
    }
  };

  const handlePickLrImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need media permissions to upload LR receipt photo.');
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
    if (!asset.base64) return;

    setLrImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `lr_${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  };

  const handlePickPackageImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need media permissions to upload package photo.');
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
    if (!asset.base64) return;

    setPackageImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName: asset.fileName || `pkg_${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchOrder) return;
    const next = getNextOrderStatus(dispatchOrder.order_status);
    if (!next) return;

    setSubmittingDispatch(true);
    try {
      let lrImageUrl: string | undefined = undefined;
      let packageImageUrl: string | undefined = undefined;

      if (lrImage) {
        lrImageUrl = await uploadDeliveryProof(lrImage.base64, lrImage.fileName, lrImage.mimeType);
      }
      if (packageImage) {
        packageImageUrl = await uploadDeliveryProof(packageImage.base64, packageImage.fileName, packageImage.mimeType);
      }

      const updatePayload: any = {
        order_status: next,
        shipping_type: shippingType,
      };

      if (shippingType === 'wholesale') {
        if (transporterName.trim()) updatePayload.transporter_name = transporterName.trim();
        if (vehicleNumber.trim()) updatePayload.vehicle_number = vehicleNumber.trim();
        if (lrNumber.trim()) updatePayload.lr_number = lrNumber.trim();
        if (lrImageUrl) updatePayload.lr_image_url = lrImageUrl;
        if (packageImageUrl) updatePayload.package_image_url = packageImageUrl;
        const days = parseInt(etaDays) || 3;
        const etaDate = new Date();
        etaDate.setDate(etaDate.getDate() + days);
        updatePayload.estimated_delivery_at = etaDate.toISOString();
      }

      const { error: err } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', dispatchOrder.id);

      if (err) throw err;

      setDispatchOrder(null);
      await load();
    } catch (err: any) {
      Alert.alert('Dispatch Error', err.message);
    } finally {
      setSubmittingDispatch(false);
    }
  };



  return (
    <View style={styles.container}>
      {/* Filter chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={FILTERS}
        keyExtractor={(f) => f}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.filters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
            onPress={() => setActiveFilter(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, activeFilter === item && styles.filterTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />



      <FlatList
        data={filteredOrders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => {
          const st = STATUS_COLORS[item.order_status] ?? { bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' };
          const nextStatusLabel = getNextOrderStatus(item.order_status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderId}>#ORD-{item.id.slice(0, 8).toUpperCase()}</Text>
                  <Text style={styles.orderDate}>Placed on {new Date(item.placed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <View style={{
                      backgroundColor: item.payment_method === 'cod' ? '#fff7ed' : '#f0fdf4',
                      borderColor: item.payment_method === 'cod' ? '#ffedd5' : '#bbf7d0',
                      borderWidth: 1,
                      borderRadius: R.sm,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: item.payment_method === 'cod' ? '#ea580c' : '#16a34a' }}>
                        {(item.payment_method || 'online').toUpperCase()}
                      </Text>
                    </View>
                    {item.payment_method === 'cod' ? (
                      item.payment_confirmed_at ? (
                        <Text style={{ fontSize: 11, color: C.success, fontWeight: '600' }}>
                          Delivered on {new Date(item.payment_confirmed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#d97706', fontWeight: '600' }}>
                          COD Pending
                        </Text>
                      )
                    ) : (
                      item.payment_confirmed_at ? (
                        <Text style={{ fontSize: 11, color: C.success, fontWeight: '600' }}>
                          Paid on {new Date(item.payment_confirmed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: C.error, fontWeight: '600' }}>
                          Unpaid
                        </Text>
                      )
                    )}
                  </View>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg, borderColor: st.border }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>
                    {item.order_status.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.cardMid}>
                <View style={styles.buyerRow}>
                  <Text style={styles.buyerLabel}>Customer</Text>
                  <Text style={styles.buyerName} numberOfLines={1} ellipsizeMode="tail">{item.buyer_name}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <Text style={styles.itemsLabel}>Order Details</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: 12 }}>
                    <Text style={styles.itemsVal} numberOfLines={1} ellipsizeMode="tail">
                      {item.items.length} item{item.items.length !== 1 ? 's' : ''} • Ref: {item.items[0]?.productName || 'Generic'}
                    </Text>
                  </View>
                </View>

                {/* Wholesale transport info preview */}
                {(item.shipping_type === 'wholesale' || item.transporter_name || item.vehicle_number || item.lr_number) && (
                  <View style={{ backgroundColor: '#eff6ff', borderRadius: R.md, padding: S.sm, marginTop: 4, borderWidth: 1, borderColor: '#bfdbfe' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Truck size={14} color="#1d4ed8" />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#1e40af' }}>
                        Bulk Transport: {item.transporter_name || 'Commercial Logistics'}
                      </Text>
                    </View>
                    {item.vehicle_number ? (
                      <Text style={{ fontSize: 10, color: '#1e3a8a', fontWeight: '600', marginTop: 2 }}>
                        🚚 Gadi / Vehicle No: {item.vehicle_number}
                      </Text>
                    ) : null}
                    {item.lr_number ? (
                      <Text style={{ fontSize: 10, color: '#1e3a8a', fontWeight: '600', marginTop: 1 }}>
                        📄 Bilty / LR No: {item.lr_number}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              <View style={styles.cardBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.totalLabel}>Total Payout</Text>
                  <Text style={styles.totalPrice}>₹{item.total_amount.toLocaleString()}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#1e293b', borderRadius: R.lg, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    activeOpacity={0.8}
                    onPress={() => {
                      setDispatchOrder(item);
                      setShippingType(item.shipping_type || 'wholesale');
                      setTransporterName(item.transporter_name || '');
                      setVehicleNumber(item.vehicle_number || '');
                      setLrNumber(item.lr_number || '');
                      setEtaDays('3');
                      setLrImage(null);
                      setPackageImage(null);
                    }}
                  >
                    <Truck size={14} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>🚚 Bilty / Gadi Details</Text>
                  </TouchableOpacity>

                  {nextStatusLabel && (
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => handleAdvanceStatus(item)}>
                      <Text style={styles.actionBtnText}>Mark {nextStatusLabel.replace(/_/g, ' ')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={C.pink} />
              <Text style={styles.loadingText}>Loading orders...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Package size={56} color="#D1D5DB" strokeWidth={1.5} style={{ marginBottom: S.md }} />
              <Text style={styles.emptyTitle}>{error ? 'Connection Error' : 'No Orders Found'}</Text>
              <Text style={styles.emptySubtitle}>
                {error || 'There are no orders matching the selected filter right now.'}
              </Text>
            </View>
          )
        }
      />

      {/* Dispatch Details Modal */}
      <Modal
        visible={dispatchOrder !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDispatchOrder(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, padding: S.lg, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: S.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Truck color={C.rose} size={22} />
                <Text style={T.h3}>🚚 Add Transport / Bilty Details</Text>
              </View>
              <TouchableOpacity onPress={() => setDispatchOrder(null)}>
                <Text style={{ fontSize: 22, color: C.text2, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[T.caption, { color: C.text3, marginBottom: S.md, fontSize: 12, lineHeight: 18 }]}>
                Aapne wholesale gadi ya transporter se samaan bheja hai toh gadi number aur bilty photo daalein. Buyer ise dekh sakega.
              </Text>

              {/* Shipping Type Switch */}
              <View style={{ marginBottom: S.md }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 6 }}>Delivery Process Select Karein</Text>
                <View style={{ flexDirection: 'row', gap: S.sm }}>
                  <TouchableOpacity
                    style={{
                      flex: 1, borderWidth: 1.5, borderColor: shippingType === 'wholesale' ? C.rose : C.border,
                      backgroundColor: shippingType === 'wholesale' ? '#fdf2f8' : C.white,
                      borderRadius: R.md, paddingVertical: 12, alignItems: 'center'
                    }}
                    onPress={() => setShippingType('wholesale')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: shippingType === 'wholesale' ? C.rose : C.text2 }}>
                      🚚 Wholesale Cargo / Transport
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1, borderWidth: 1.5, borderColor: shippingType === 'retail' ? C.rose : C.border,
                      backgroundColor: shippingType === 'retail' ? '#fdf2f8' : C.white,
                      borderRadius: R.md, paddingVertical: 12, alignItems: 'center'
                    }}
                    onPress={() => setShippingType('retail')}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '800', color: shippingType === 'retail' ? C.rose : C.text2 }}>
                      🛵 Retail Local (OTP Delivery)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {shippingType === 'wholesale' && (
                <>
                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 4 }}>1. Transporter / Transport Co. Name (Transport Ka Naam)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14, backgroundColor: '#f8fafc' }}
                      placeholder="e.g. VRL Logistics, SafeExpress, Local Transport"
                      value={transporterName}
                      onChangeText={setTransporterName}
                    />
                  </View>

                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 4 }}>2. Vehicle / Truck Number (Gadi Ka Number)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14, backgroundColor: '#f8fafc' }}
                      placeholder="e.g. MH 12 AB 1234 / KA 01 XY 5678"
                      value={vehicleNumber}
                      onChangeText={setVehicleNumber}
                    />
                  </View>

                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 4 }}>3. Lorry Receipt / Bilty Number (LR No.)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14, backgroundColor: '#f8fafc' }}
                      placeholder="e.g. LR-908234"
                      value={lrNumber}
                      onChangeText={setLrNumber}
                    />
                  </View>

                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 4 }}>4. Estimated Delivery Time (Kitne din lagenge)</Text>
                    <TextInput
                      style={{ borderWidth: 1, borderColor: C.border, borderRadius: R.md, padding: S.sm, color: C.text, fontSize: 14, backgroundColor: '#f8fafc' }}
                      placeholder="3"
                      keyboardType="numeric"
                      value={etaDays}
                      onChangeText={setEtaDays}
                    />
                  </View>

                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 6 }}>5. Upload Bilty Receipt Photo (Bilty Ki Photo)</Text>
                    {lrImage ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image source={{ uri: lrImage.uri }} style={{ width: 60, height: 60, borderRadius: R.md, borderWidth: 1, borderColor: C.border }} />
                        <TouchableOpacity onPress={handlePickLrImage}>
                          <Text style={{ color: C.rose, fontWeight: '800', fontSize: 12 }}>📷 Change Bilty Photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.pink, borderRadius: R.md, padding: S.md, alignItems: 'center', backgroundColor: C.surface }}
                        onPress={handlePickLrImage}
                      >
                        <Text style={{ color: C.rose, fontWeight: '800', fontSize: 13 }}>📷 + Photo Upload Karein (Bilty Receipt)</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={{ marginBottom: S.md }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: C.text2, marginBottom: 6 }}>6. Upload Samaan / Box Goods Photo (Samaan Ki Photo)</Text>
                    {packageImage ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Image source={{ uri: packageImage.uri }} style={{ width: 60, height: 60, borderRadius: R.md, borderWidth: 1, borderColor: C.border }} />
                        <TouchableOpacity onPress={handlePickPackageImage}>
                          <Text style={{ color: C.rose, fontWeight: '800', fontSize: 12 }}>📦 Change Box Photo</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.pink, borderRadius: R.md, padding: S.md, alignItems: 'center', backgroundColor: C.surface }}
                        onPress={handlePickPackageImage}
                      >
                        <Text style={{ color: C.rose, fontWeight: '800', fontSize: 13 }}>📦 + Photo Upload Karein (Samaan/Box)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}

              <TouchableOpacity
                style={{ backgroundColor: C.rose, borderRadius: R.lg, paddingVertical: 16, alignItems: 'center', marginTop: S.sm, opacity: submittingDispatch ? 0.6 : 1 }}
                onPress={handleConfirmDispatch}
                disabled={submittingDispatch}
              >
                <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>
                  {submittingDispatch ? 'Saving Details...' : 'Save & Update Order'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  filters: { paddingHorizontal: S.md, paddingVertical: 12, gap: 10 },
  filterChip: { 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    borderRadius: 999, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  filterChipActive: { 
    backgroundColor: C.rose, 
    borderColor: C.rose,
    shadowColor: C.rose,
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  filterText: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  filterTextActive: { color: C.white },

  list: { paddingHorizontal: S.lg, paddingBottom: S.xxl, gap: S.md },
  card: { 
    backgroundColor: C.white, 
    borderRadius: R.xl, 
    borderWidth: 1, 
    borderColor: C.border, 
    padding: S.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: S.md
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { ...T.h3, color: C.text, fontSize: 16, fontWeight: '800' },
  orderDate: { ...T.caption, color: C.muted, marginTop: 4, fontWeight: '500' },
  statusPill: { borderRadius: R.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
  cardMid: { gap: S.sm },
  buyerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerLabel: { ...T.caption, color: C.muted, fontWeight: '600' },
  buyerName: { ...T.bodySmall, fontWeight: '700', color: C.text2, flex: 1, textAlign: 'right', paddingLeft: 12 },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemsLabel: { ...T.caption, color: C.muted, fontWeight: '600' },
  itemsVal: { ...T.bodySmall, color: C.text3, fontWeight: '500' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: S.xs },
  totalLabel: { ...T.caption, color: C.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  totalPrice: { fontSize: 24, color: C.rose, fontWeight: '900', marginTop: 2 },
  actionBtn: { backgroundColor: C.rose, borderRadius: R.lg, paddingHorizontal: 20, paddingVertical: 10, shadowColor: C.rose, shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  actionBtnText: { color: C.white, fontSize: 13, fontWeight: '700', textTransform: 'capitalize' },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  loadingText: { ...T.bodySmall, color: C.muted, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyTitle: { ...T.h3, color: C.text2 },
  emptySubtitle: { ...T.bodySmall, color: C.muted, marginTop: 6, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },
});
