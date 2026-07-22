import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Landmark, FileText, Briefcase } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { C, S, R, BTN, INPUT, T, CARD } from '../../lib/theme';

export function SellerRegistrationScreen() {
  const { session, refreshProfile, signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [contactEmail, setContactEmail] = useState(session?.user?.email || '');
  const [contactMobile, setContactMobile] = useState('');

  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');

  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateStep(currentStep: number): boolean {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!businessName.trim()) newErrors.businessName = 'Business Name is required';
      if (!businessAddress.trim()) newErrors.businessAddress = 'Business Address is required';
      if (!contactEmail.trim() || !contactEmail.includes('@')) newErrors.contactEmail = 'Valid Email is required';
      if (!contactMobile.trim() || contactMobile.length < 10) newErrors.contactMobile = 'Valid 10-digit mobile is required';
    } else if (currentStep === 2) {
      // GSTIN: 15 chars (often optional if threshold is low, but let's enforce or validate format if entered)
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstNumber.trim()) {
        newErrors.gstNumber = 'GSTIN is required';
      } else if (!gstRegex.test(gstNumber.toUpperCase().trim())) {
        newErrors.gstNumber = 'Invalid GSTIN format (e.g. 29GGSSS1234F1Z5)';
      }

      // PAN: 10 chars
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panNumber.trim()) {
        newErrors.panNumber = 'PAN is required';
      } else if (!panRegex.test(panNumber.toUpperCase().trim())) {
        newErrors.panNumber = 'Invalid PAN format (e.g. ABCDE1234F)';
      }

      // Aadhaar: 12 digits
      const aadhaarRegex = /^[0-9]{12}$/;
      if (!aadharNumber.trim()) {
        newErrors.aadharNumber = 'Aadhaar Number is required';
      } else if (!aadhaarRegex.test(aadharNumber.trim())) {
        newErrors.aadharNumber = 'Aadhaar must be exactly 12 digits';
      }
    } else if (currentStep === 3) {
      if (!bankAccountName.trim()) newErrors.bankAccountName = 'Account Holder Name is required';
      if (!bankAccountNumber.trim() || bankAccountNumber.length < 9) newErrors.bankAccountNumber = 'Valid Account Number is required';
      
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!bankIfsc.trim()) {
        newErrors.bankIfsc = 'IFSC Code is required';
      } else if (!ifscRegex.test(bankIfsc.toUpperCase().trim())) {
        newErrors.bankIfsc = 'Invalid IFSC format (e.g. HDFC0000123)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3) || !session?.user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('seller_profiles').insert({
        id: session.user.id,
        business_name: businessName.trim(),
        business_address: businessAddress.trim(),
        email: contactEmail.trim().toLowerCase(),
        mobile: contactMobile.trim(),
        gst_number: gstNumber.toUpperCase().trim(),
        pan_number: panNumber.toUpperCase().trim(),
        aadhar_number: aadharNumber.trim(),
        bank_account_name: bankAccountName.trim(),
        bank_account_number: bankAccountNumber.trim(),
        bank_ifsc: bankIfsc.toUpperCase().trim(),
        status: 'pending',
        accepted_terms_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Registration Submitted',
        'Your profile has been saved. Our admin team will review and approve your seller profile shortly.',
        [{ text: 'OK', onPress: () => refreshProfile() }]
      );
    } catch (err) {
      Alert.alert('Submission Failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Registration</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut()}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Stepper Indicator */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={styles.stepWrapper}>
              <View
                style={[
                  styles.stepDot,
                  step >= s && styles.stepDotActive,
                  step > s && styles.stepDotCompleted,
                ]}
              >
                {step > s ? (
                  <Check size={14} color="#fff" strokeWidth={3} />
                ) : (
                  <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
                )}
              </View>
              {s < 3 && (
                <View
                  style={[
                    styles.stepConnector,
                    step > s && styles.stepConnectorActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        <View style={styles.stepLabelsRow}>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Profile</Text>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive, { textAlign: 'center' }]}>Tax & IDs</Text>
          <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive, { textAlign: 'right' }]}>Payouts</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepCard}>
            <View style={styles.introHeader}>
              <Briefcase size={28} color={C.rose} />
              <Text style={T.h3}>Business Details</Text>
              <Text style={styles.introSub}>Provide your core trading and contact information.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Business / Legal Name</Text>
              <TextInput
                style={[INPUT.base, errors.businessName && styles.inputError]}
                placeholder="e.g. Ira Collections"
                value={businessName}
                onChangeText={setBusinessName}
              />
              {errors.businessName && <Text style={styles.errorText}>{errors.businessName}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Business Address</Text>
              <TextInput
                style={[INPUT.base, styles.textArea, errors.businessAddress && styles.inputError]}
                placeholder="Full address of business headquarters"
                multiline
                numberOfLines={3}
                value={businessAddress}
                onChangeText={setBusinessAddress}
              />
              {errors.businessAddress && <Text style={styles.errorText}>{errors.businessAddress}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Contact Email</Text>
              <TextInput
                style={[INPUT.base, errors.contactEmail && styles.inputError]}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={contactEmail}
                onChangeText={setContactEmail}
              />
              {errors.contactEmail && <Text style={styles.errorText}>{errors.contactEmail}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Mobile Number</Text>
              <TextInput
                style={[INPUT.base, errors.contactMobile && styles.inputError]}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                value={contactMobile}
                onChangeText={setContactMobile}
              />
              {errors.contactMobile && <Text style={styles.errorText}>{errors.contactMobile}</Text>}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepCard}>
            <View style={styles.introHeader}>
              <ShieldCheck size={28} color={C.rose} />
              <Text style={T.h3}>Government IDs & Taxes</Text>
              <Text style={styles.introSub}>Required for legal compliance & GST invoice generation in India.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>GSTIN (GST Number)</Text>
              <TextInput
                style={[INPUT.base, errors.gstNumber && styles.inputError]}
                placeholder="15-character GSTIN"
                autoCapitalize="characters"
                maxLength={15}
                value={gstNumber}
                onChangeText={setGstNumber}
              />
              {errors.gstNumber && <Text style={styles.errorText}>{errors.gstNumber}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>PAN (Permanent Account Number)</Text>
              <TextInput
                style={[INPUT.base, errors.panNumber && styles.inputError]}
                placeholder="10-character PAN"
                autoCapitalize="characters"
                maxLength={10}
                value={panNumber}
                onChangeText={setPanNumber}
              />
              {errors.panNumber && <Text style={styles.errorText}>{errors.panNumber}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Aadhaar Number</Text>
              <TextInput
                style={[INPUT.base, errors.aadharNumber && styles.inputError]}
                placeholder="12-digit Aadhaar Number"
                keyboardType="numeric"
                maxLength={12}
                value={aadharNumber}
                onChangeText={setAadharNumber}
              />
              {errors.aadharNumber && <Text style={styles.errorText}>{errors.aadharNumber}</Text>}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepCard}>
            <View style={styles.introHeader}>
              <Landmark size={28} color={C.rose} />
              <Text style={T.h3}>Bank Account Details</Text>
              <Text style={styles.introSub}>Payouts will be direct-deposited into this bank account.</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Account Holder Name</Text>
              <TextInput
                style={[INPUT.base, errors.bankAccountName && styles.inputError]}
                placeholder="As it appears in bank passbook"
                value={bankAccountName}
                onChangeText={setBankAccountName}
              />
              {errors.bankAccountName && <Text style={styles.errorText}>{errors.bankAccountName}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Bank Account Number</Text>
              <TextInput
                style={[INPUT.base, errors.bankAccountNumber && styles.inputError]}
                placeholder="Your bank account number"
                keyboardType="numeric"
                secureTextEntry={false}
                value={bankAccountNumber}
                onChangeText={setBankAccountNumber}
              />
              {errors.bankAccountNumber && <Text style={styles.errorText}>{errors.bankAccountNumber}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={INPUT.label}>Bank IFSC Code</Text>
              <TextInput
                style={[INPUT.base, errors.bankIfsc && styles.inputError]}
                placeholder="11-character IFSC Code"
                autoCapitalize="characters"
                maxLength={11}
                value={bankIfsc}
                onChangeText={setBankIfsc}
              />
              {errors.bankIfsc && <Text style={styles.errorText}>{errors.bankIfsc}</Text>}
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.btnRow}>
          {step > 1 ? (
            <TouchableOpacity style={[BTN.secondary, styles.btnHalf]} onPress={handlePrev} disabled={loading}>
              <ArrowLeft size={18} color={C.rose} />
              <Text style={BTN.secondaryText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          {step < 3 ? (
            <TouchableOpacity style={[BTN.primary, styles.btnHalf]} onPress={handleNext}>
              <Text style={BTN.primaryText}>Continue</Text>
              <ArrowRight size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[BTN.primary, styles.btnHalf]} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={BTN.primaryText}>Submit</Text>
                  <Check size={18} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  logoutBtn: { paddingVertical: S.xs, paddingHorizontal: S.sm },
  logoutText: { ...T.link, fontSize: 13, color: C.muted },
  stepperContainer: {
    backgroundColor: C.white,
    paddingVertical: S.md,
    paddingHorizontal: S.xl,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: C.pink },
  stepDotCompleted: { backgroundColor: C.rose },
  stepDotText: { fontSize: 12, fontWeight: '700', color: C.muted },
  stepDotTextActive: { color: C.white },
  stepConnector: { flex: 1, height: 3, backgroundColor: C.border, marginHorizontal: S.xs },
  stepConnectorActive: { backgroundColor: C.pink },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: S.xs },
  stepLabel: { fontSize: 11, fontWeight: '600', color: C.muted, width: 60 },
  stepLabelActive: { color: C.rose },
  scroll: { padding: S.lg, gap: S.md, paddingBottom: S.xl },
  stepCard: {
    ...CARD.elevated,
    padding: S.lg,
    gap: S.md,
    backgroundColor: C.white,
  },
  introHeader: { alignItems: 'center', gap: S.xs, marginBottom: S.xs, textAlign: 'center' },
  introSub: { ...T.bodySmall, color: C.muted, textAlign: 'center', paddingHorizontal: S.sm },
  formGroup: { gap: 4 },
  textArea: { height: 72, paddingTop: S.sm, textAlignVertical: 'top' },
  inputError: { borderColor: C.error },
  errorText: { fontSize: 11, color: C.error, fontWeight: '600', marginLeft: 4 },
  btnRow: { flexDirection: 'row', gap: S.md, marginTop: S.sm },
  btnHalf: { flex: 1, flexDirection: 'row', gap: S.sm, alignItems: 'center', justifyContent: 'center' },
});
