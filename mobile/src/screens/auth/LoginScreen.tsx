import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { C, S, R, BTN, INPUT, T } from '../../lib/theme';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'Login'>) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Wordmark */}
        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>FabZone</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.sub}>Sign in to your account</Text>

        <View style={styles.form}>
          <View>
            <Text style={INPUT.label}>Email</Text>
            <TextInput
              style={[INPUT.base, emailFocused && INPUT.focused]}
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
          <View>
            <Text style={INPUT.label}>Password</Text>
            <TextInput
              style={[INPUT.base, passFocused && INPUT.focused]}
              placeholder="••••••••"
              placeholderTextColor={C.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
          </View>

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end' }}>
            <Text style={T.link}>Forgot password?</Text>
          </Pressable>
        </View>

        <Pressable
          style={[BTN.primary, submitting && BTN.disabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={BTN.primaryText}>{submitting ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={BTN.secondary}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={BTN.secondaryText}>Create an Account</Text>
        </Pressable>

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
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.xxl + 16, paddingBottom: S.xl, gap: S.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.lg },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rose },
  brand: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: 1.5 },
  heading: { ...T.h1, marginBottom: S.xs },
  sub: { ...T.bodySmall, color: C.muted, marginBottom: S.sm },
  form: { gap: S.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: S.sm, marginVertical: S.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { ...T.caption, paddingHorizontal: S.xs },
  legal: { ...T.caption, textAlign: 'center', color: C.muted, marginTop: S.sm },
});
