import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C, S, R, BTN, T } from '../../lib/theme';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (!email.trim() || !password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase = {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
    fontSize: 15,
    color: C.text,
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: C.card0 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: Math.max(S.xxl, insets.top + 24), paddingBottom: insets.bottom + S.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandDot} />
            <Text style={styles.brand}>FabZone</Text>
          </View>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to shop, sell, or deliver</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[inputBase, emailFocused && { borderColor: C.rose, backgroundColor: C.white }]}
              placeholder="you@example.com"
              placeholderTextColor={C.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.passwordBox, passFocused && { borderColor: C.rose, backgroundColor: C.white }]}>
              <TextInput
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: C.text,
                  paddingVertical: 0,
                }}
                placeholder="••••••••"
                placeholderTextColor={C.muted}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={12} style={styles.eyeBtn}>
                {showPassword ? (
                  <EyeOff size={20} color={C.muted} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={C.muted} strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgot}>
            <Text style={[T.link, { fontSize: 13 }]}>Forgot password?</Text>
          </Pressable>

          <Pressable style={[BTN.primary, submitting && BTN.disabled, { marginTop: S.sm }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={BTN.primaryText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[T.bodySmall, { color: C.muted }]}>New here?</Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={[T.link, { fontWeight: '700' }]}>Create an account</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={{ color: C.rose }}>Terms</Text> &{' '}
          <Text style={{ color: C.rose }}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: S.lg, gap: S.md, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: S.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.md },
  brandDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.rose },
  brand: { fontSize: 22, fontWeight: '900', color: C.text, letterSpacing: 1.5 },
  heading: { ...T.h1, marginBottom: S.xs, textAlign: 'center' },
  sub: { ...T.body, color: C.muted, textAlign: 'center' },
  card: {
    backgroundColor: C.white,
    borderRadius: R.xl,
    padding: S.lg,
    gap: S.md,
    shadowColor: C.pink,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  field: { gap: S.xs },
  label: { ...T.label, color: C.text2, fontSize: 13 },
  passwordBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: R.lg,
    paddingHorizontal: S.md,
    paddingVertical: S.md,
  },
  eyeBtn: { padding: 4, marginLeft: S.xs },
  forgot: { alignSelf: 'flex-end', marginTop: -S.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.xs, marginTop: S.sm },
  legal: { ...T.caption, textAlign: 'center', color: C.muted, marginTop: S.md },
});
