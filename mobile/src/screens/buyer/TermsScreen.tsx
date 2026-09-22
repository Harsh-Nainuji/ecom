import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { C, S, R, T } from '../../lib/theme';

export function TermsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={T.h3}>Terms & Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={T.h2}>Terms of Service</Text>
          <Text style={[T.caption, { color: C.pink, fontWeight: '700', marginBottom: S.xs }]}>
            [Policy content pending from client]
          </Text>
          <Text style={styles.paragraph}>
            Welcome to FabZone. These Terms of Service ("Terms") govern your access to and use of our mobile application and services. By accessing or using our services, you agree to be bound by these Terms and our Privacy Policy.
          </Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. Your continued use of the platform constitutes agreement to any updated terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={T.h2}>Privacy Policy</Text>
          <Text style={[T.caption, { color: C.pink, fontWeight: '700', marginBottom: S.xs }]}>
            [Policy content pending from client]
          </Text>
          <Text style={styles.paragraph}>
            We value your privacy. We collect personal data such as your name, phone number, email address, and shipping address to fulfill your orders and process payments. We do not sell or share your personal information with third parties except as required to provide services (e.g. Supabase, Razorpay) or as legally required.
          </Text>
          <Text style={styles.paragraph}>
            You may request access to, correction of, or deletion of your personal data by contacting our support team.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={T.h2}>Refund and Cancellation Policy</Text>
          <Text style={[T.caption, { color: C.pink, fontWeight: '700', marginBottom: S.xs }]}>
            [Policy content pending from client]
          </Text>
          <Text style={styles.paragraph}>
            Orders can be cancelled before they are processed. Refund processing timeframes vary depending on the payment provider. Returns are subject to a 7-day window under specified conditions.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={T.h2}>Shipping Policy</Text>
          <Text style={[T.caption, { color: C.pink, fontWeight: '700', marginBottom: S.xs }]}>
            [Policy content pending from client]
          </Text>
          <Text style={styles.paragraph}>
            Products are shipped directly by their respective sellers. Expected delivery timeframes are typically 3-5 business days from order confirmation. Shipping fees are calculated at checkout.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: S.md,
  },
  backBtn: {
    padding: 4,
    borderRadius: R.sm,
    backgroundColor: C.card2,
  },
  scroll: {
    padding: S.lg,
    gap: S.lg,
    paddingBottom: S.xl * 2,
  },
  section: {
    gap: S.xs,
  },
  paragraph: {
    ...T.bodySmall,
    color: C.text2,
    lineHeight: 20,
  },
});
