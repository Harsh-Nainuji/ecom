import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertOctagon, Mail, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { C, S, R, BTN, T, CARD } from '../../lib/theme';

interface SellerSuspendedScreenProps {
  reason?: string | null;
}

export function SellerSuspendedScreen({ reason }: SellerSuspendedScreenProps) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Access Suspended</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <LogOut size={16} color={C.muted} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Main Alert Card */}
        <View style={styles.alertCard}>
          <View style={styles.iconContainer}>
            <AlertOctagon size={40} color={C.error} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Account Suspended</Text>
          <Text style={styles.subtitle}>
            Your seller privileges have been suspended or rejected by our administration team.
          </Text>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonTitle}>Reason for rejection/suspension:</Text>
            <Text style={styles.reasonText}>
              {reason || 'No specific reason was provided. This is usually due to mismatched tax IDs or bank verification issues.'}
            </Text>
          </View>
        </View>

        {/* Support Action */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>What should I do?</Text>
          <Text style={styles.supportText}>
            Please review your documents and email support to appeal or correct your registration details.
          </Text>
          
          <TouchableOpacity style={styles.emailBtn}>
            <Mail size={16} color={C.rose} />
            <Text style={styles.emailBtnText}>Email support@fabzone.dev</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={BTN.secondary} onPress={() => signOut()}>
          <Text style={BTN.secondaryText}>Return to Login</Text>
        </TouchableOpacity>
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
  alertCard: {
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
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: S.xs,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  title: { ...T.h2, color: C.error, textAlign: 'center' },
  subtitle: { ...T.bodySmall, color: C.muted, textAlign: 'center', lineHeight: 18 },
  reasonBox: {
    alignSelf: 'stretch',
    backgroundColor: '#fafafa',
    borderRadius: R.md,
    borderLeftWidth: 4,
    borderColor: C.error,
    padding: S.md,
    marginTop: S.sm,
  },
  reasonTitle: { fontSize: 12, fontWeight: '700', color: C.text, marginBottom: 4 },
  reasonText: { ...T.bodySmall, color: C.text2, lineHeight: 18 },
  supportCard: {
    ...CARD.base,
    backgroundColor: C.white,
    padding: S.md,
    gap: S.sm,
  },
  supportTitle: { ...T.h4 },
  supportText: { ...T.bodySmall, color: C.muted, lineHeight: 18 },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.pink,
    borderRadius: R.md,
    paddingVertical: S.sm,
    backgroundColor: C.white,
    marginTop: S.xs,
  },
  emailBtnText: { ...T.link, fontSize: 14 },
});
