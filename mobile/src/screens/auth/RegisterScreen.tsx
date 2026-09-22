import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { ShoppingCart, Store, Truck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BuyerStackParamList } from '../../navigation/BuyerStack';
import { C, S, R, BTN, INPUT, T } from '../../lib/theme';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<BuyerStackParamList>>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'delivery'>('buyer');
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }
    if (!agreed) {
      Alert.alert('Consent required', 'You must agree to the Terms & Privacy Policy to create an account.');
      return;
    }
    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim(), role });
    } catch (err) {
      // Error already shown via Alert in AuthContext
    } finally {
      setSubmitting(false);
    }
  }

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.brandRow}>
          <View style={styles.brandDot} />
          <Text style={styles.brand}>FabZone</Text>
        </View>
        <Text style={T.h1}>Create account</Text>
        <Text style={[T.bodySmall, { color: C.muted, marginTop: S.xs, marginBottom: S.md }]}>Join as a Buyer or Seller</Text>

        {/* Role Toggle */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'buyer' && styles.roleBtnActive]}
            onPress={() => setRole('buyer')}
            activeOpacity={0.8}
          >
            <ShoppingCart size={24} color={role === 'buyer' ? C.rose : C.muted} strokeWidth={1.5} />
            <Text style={[styles.roleLabel, role === 'buyer' && styles.roleLabelActive]}>Buyer</Text>
            <Text style={[styles.roleDesc, role === 'buyer' && { color: C.rose }]}>Shop products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'seller' && styles.roleBtnActiveSeller]}
            onPress={() => setRole('seller')}
            activeOpacity={0.8}
          >
            <Store size={24} color={role === 'seller' ? '#a0522d' : C.muted} strokeWidth={1.5} />
            <Text style={[styles.roleLabel, role === 'seller' && styles.roleLabelActiveSeller]}>Seller</Text>
            <Text style={[styles.roleDesc, role === 'seller' && { color: '#a0522d' }]}>Sell products</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleBtn, role === 'delivery' && styles.roleBtnActiveDelivery]}
            onPress={() => setRole('delivery')}
            activeOpacity={0.8}
          >
            <Truck size={24} color={role === 'delivery' ? '#0369a1' : C.muted} strokeWidth={1.5} />
            <Text style={[styles.roleLabel, role === 'delivery' && styles.roleLabelActiveDelivery]}>Delivery</Text>
            <Text style={[styles.roleDesc, role === 'delivery' && { color: '#0369a1' }]}>Deliver orders</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={INPUT.label}>Full Name</Text>
            <TextInput
              style={[INPUT.base, nameFocused && INPUT.focused]}
              placeholder="Your full name"
              placeholderTextColor={C.muted}
              value={fullName}
              onChangeText={setFullName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
          </View>
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
              placeholder="Min 6 characters"
              placeholderTextColor={C.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
          </View>
        </View>

        {/* Consent Checkbox */}
        <Pressable 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: S.sm, paddingHorizontal: 2 }}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: R.sm,
            borderWidth: 2,
            borderColor: agreed ? C.rose : C.border,
            backgroundColor: agreed ? C.rose : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {agreed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
          </View>
          <Text style={{ flex: 1, ...T.bodySmall, color: C.text2 }}>
            I agree to the{' '}
            <Text style={{ color: C.rose, fontWeight: '600' }} onPress={() => navigation.navigate('Terms')}>
              Terms & Privacy Policy
            </Text>
          </Text>
        </Pressable>


        <Pressable
          style={[BTN.primary, (submitting || !agreed) && BTN.disabled]}
          onPress={handleSubmit}
          disabled={submitting || !agreed}
        >
          <Text style={BTN.primaryText}>
            {submitting ? 'Creating account…' : `Create ${role === 'buyer' ? 'Buyer' : role === 'seller' ? 'Seller' : 'Delivery Partner'} Account`}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login' as never)} style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={T.link}>Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.xxl, paddingBottom: S.xl, gap: S.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: S.sm },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rose },
  brand: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: 1.5 },
  roleRow: { flexDirection: 'row', gap: S.sm },
  roleBtn: {
    flex: 1, borderWidth: 1, borderColor: C.border,
    borderRadius: R.lg, paddingVertical: S.md,
    alignItems: 'center', gap: S.xs, backgroundColor: C.surface,
  },
  roleBtnActive: { borderColor: C.rose, backgroundColor: C.card2 },
  roleBtnActiveSeller: { borderColor: C.beige, backgroundColor: C.card1 },
  roleBtnActiveDelivery: { borderColor: '#0369a1', backgroundColor: '#e0f2fe' },
  roleLabel: { fontSize: 14, fontWeight: '700', color: C.muted },
  roleLabelActive: { color: C.rose },
  roleLabelActiveSeller: { color: '#a0522d' },
  roleLabelActiveDelivery: { color: '#0369a1' },
  roleDesc: { fontSize: 11, color: C.muted },
  form: { gap: S.md },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: S.sm },
  loginText: { fontSize: 14, color: C.muted },
});
