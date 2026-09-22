import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C, S, R, T } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { exportUserDataPDF } from '../../lib/pdfGenerator';
import { ShieldCheck, Download, Trash2, ArrowLeft, Lock, FileText } from 'lucide-react-native';

export function PrivacyConsentScreen({ navigation }: any) {
  const { session, profile, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExportData = async () => {
    if (!profile) return;
    setExporting(true);
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .or(`buyer_id.eq.${profile.id},seller_id.eq.${profile.id}`);

      await exportUserDataPDF(profile, count || 0);
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Permanent Account Deletion',
      'Under DPDPA 2023 (Right to Erasure), deleting your account will permanently purge your profile, address book, and catalog data. This action cannot be undone.\n\nAre you sure you want to delete your account permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              if (session?.user?.id) {
                // Delete seller profile if seller
                await supabase.from('seller_profiles').delete().eq('id', session.user.id);
                // Delete user profile
                await supabase.from('profiles').delete().eq('id', session.user.id);
              }
              await signOut();
              Alert.alert('Account Deleted', 'Your personal data has been deleted permanently.');
            } catch (err: any) {
              Alert.alert('Deletion Error', err.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Data Rights</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.banner}>
          <ShieldCheck size={28} color="#c2185b" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerTitle}>DPDPA 2023 & Consumer Protection Compliant</Text>
            <Text style={styles.bannerSubtitle}>
              You have full transparency and total control over your personal data under Indian law.
            </Text>
          </View>
        </View>

        {/* Consents Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Active Consents Granted</Text>
          <View style={styles.consentRow}>
            <Lock size={16} color={C.success} />
            <Text style={styles.consentText}>Identity & Authentication Processing (Granted)</Text>
          </View>
          <View style={styles.consentRow}>
            <Lock size={16} color={C.success} />
            <Text style={styles.consentText}>Address & Courier Logistics Processing (Granted)</Text>
          </View>
          <View style={styles.consentRow}>
            <Lock size={16} color={C.success} />
            <Text style={styles.consentText}>Transactional SMS & WhatsApp Order Updates (Granted)</Text>
          </View>
        </View>

        {/* Download Data Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Right to Data Portability</Text>
          <Text style={styles.sectionDesc}>
            Download a full PDF report containing all your registered personal data, order histories, and consent logs.
          </Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleExportData} disabled={exporting}>
            <Download size={18} color={C.white} />
            <Text style={styles.actionBtnText}>{exporting ? 'Generating PDF...' : 'Download My Data (PDF Report)'}</Text>
          </TouchableOpacity>
        </View>

        {/* Permanent Account Deletion Section */}
        <View style={[styles.sectionCard, { borderColor: '#fecdd3', backgroundColor: '#fff1f2' }]}>
          <Text style={[styles.sectionTitle, { color: '#e11d48' }]}>Right to be Forgotten (Account Deletion)</Text>
          <Text style={styles.sectionDesc}>
            Single-click permanent deletion. All your personal records, address data, and catalog listings will be purged from our database immediately.
          </Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#e11d48' }]}
            onPress={handleDeleteAccount}
            disabled={deleting}
          >
            <Trash2 size={18} color={C.white} />
            <Text style={styles.actionBtnText}>{deleting ? 'Deleting Account...' : 'Delete My Account Permanently'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: S.lg,
    paddingTop: 50, paddingBottom: S.md, backgroundColor: C.white,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  backBtn: { padding: S.xs, marginRight: S.sm },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  content: { padding: S.lg, gap: S.md },
  banner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf2f8',
    padding: S.md, borderRadius: R.lg, borderWidth: 1, borderColor: '#fbcfe8',
  },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: '#c2185b' },
  bannerSubtitle: { fontSize: 11, color: C.text2, marginTop: 2 },
  sectionCard: {
    backgroundColor: C.white, borderRadius: R.xl, padding: S.md,
    borderWidth: 1, borderColor: C.border, gap: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: C.text },
  sectionDesc: { fontSize: 12, color: C.text2, lineHeight: 18 },
  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  consentText: { fontSize: 12, fontWeight: '600', color: C.text },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.text, paddingVertical: 14, borderRadius: R.lg, marginTop: 6,
  },
  actionBtnText: { color: C.white, fontWeight: '800', fontSize: 13 },
});
