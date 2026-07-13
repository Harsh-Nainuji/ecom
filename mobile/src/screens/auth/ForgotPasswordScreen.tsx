import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { supabase } from '../../lib/supabase';
import { C, S, BTN, INPUT, T } from '../../lib/theme';

export function ForgotPasswordScreen({ navigation }: NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>) {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setMessage('');
    try {
      const targetEmail = email || session?.user?.email;
      if (!targetEmail) { setMessage('Enter your account email.'); setIsError(true); return; }
      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail);
      if (error) { setMessage(error.message); setIsError(true); }
      else { setMessage('Reset link sent — check your inbox.'); setIsError(false); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.brandDot} />
        <Text style={T.h2}>Reset password</Text>
        <Text style={[T.bodySmall, { color: C.muted, marginTop: S.xs, marginBottom: S.lg }]}>
          Enter your email and we'll send you a reset link.
        </Text>

        <View>
          <Text style={INPUT.label}>Email address</Text>
          <TextInput
            style={[INPUT.base, focused && INPUT.focused]}
            placeholder="you@example.com"
            placeholderTextColor={C.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        <Pressable style={[BTN.primary, submitting && BTN.disabled, { marginTop: S.md }]} onPress={handleSubmit} disabled={submitting}>
          <Text style={BTN.primaryText}>{submitting ? 'Sending…' : 'Send Reset Link'}</Text>
        </Pressable>

        {message ? (
          <View style={[styles.messageBanner, isError ? styles.messageBannerError : styles.messageBannerSuccess]}>
            <Text style={[styles.messageText, { color: isError ? C.error : C.success }]}>{message}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.xl, paddingBottom: S.xl, gap: S.md },
  backBtn: { marginBottom: S.lg },
  backText: { ...T.link, fontSize: 15 },
  brandDot: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.rose, marginBottom: S.md },
  messageBanner: { borderRadius: 12, padding: S.md, borderWidth: 1 },
  messageBannerSuccess: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  messageBannerError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  messageText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
