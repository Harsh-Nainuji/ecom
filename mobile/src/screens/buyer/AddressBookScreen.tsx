import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ScreenPlaceholder } from '../../components/ScreenPlaceholder';
import { deleteAddress, fetchAddresses, setDefaultAddress, upsertAddress } from '../../lib/api/buyer';
import type { Address } from '../../lib/types';
import { C, S, R, BTN, INPUT, T } from '../../lib/theme';

const emptyForm: Address = {
  id: '',
  label: null,
  recipient_name: '',
  phone: '',
  line1: '',
  line2: null,
  city: '',
  state: '',
  postal_code: '',
  is_default: false,
};

export function AddressBookScreen() {
  const { session } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState<Address>(emptyForm);

  const load = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const data = await fetchAddresses(session.user.id);
      setAddresses(data ?? []);
    } catch (err) {
      Alert.alert('Load failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session?.user) {
    return <ScreenPlaceholder title="Addresses" subtitle="Sign in to manage your delivery addresses." />;
  }

  const startEdit = (addr?: Address) => {
    setEditing(addr ?? null);
    setForm(addr ? { ...addr } : { ...emptyForm });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.recipient_name || !form.phone || !form.line1 || !form.city || !form.state || !form.postal_code) {
      Alert.alert('Missing fields', 'Please fill all required address fields.');
      return;
    }
    setSaving(true);
    try {
      await upsertAddress(session.user.id, {
        id: editing?.id || undefined,
        label: form.label,
        recipient_name: form.recipient_name,
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        postal_code: form.postal_code,
        is_default: form.is_default,
      });
      resetForm();
      await load();
    } catch (err) {
      Alert.alert('Save failed', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete address?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(session.user.id, id);
            await load();
          } catch (err) {
            Alert.alert('Delete failed', (err as Error).message);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(session.user.id, id);
      await load();
    } catch (err) {
      Alert.alert('Update failed', (err as Error).message);
    }
  };

  const renderForm = () => (
    <View style={styles.formCard}>
      <Text style={T.h4}>{editing ? 'Edit Address' : 'New Address'}</Text>
      {['label', 'recipient_name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code'].map((key) => (
        <View key={key}>
          <Text style={INPUT.label}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</Text>
          <TextInput
            style={INPUT.base}
            placeholderTextColor={C.muted}
            value={(form as any)[key] ?? ''}
            onChangeText={(text) => setForm((f) => ({ ...f, [key]: text || null }))}
            keyboardType={key === 'phone' || key === 'postal_code' ? 'phone-pad' : 'default'}
            autoCapitalize={key === 'postal_code' ? 'characters' : 'sentences'}
          />
        </View>
      ))}
      <TouchableOpacity
        style={[styles.defaultRow, form.is_default && styles.defaultRowActive]}
        onPress={() => setForm((f) => ({ ...f, is_default: !f.is_default }))}
        activeOpacity={0.8}
      >
        <View style={[styles.radio, form.is_default && styles.radioActive]}>
          {form.is_default && <View style={styles.radioDot} />}
        </View>
        <Text style={T.body}>Set as default address</Text>
      </TouchableOpacity>
      <View style={styles.formActions}>
        <TouchableOpacity style={BTN.secondary} onPress={resetForm} activeOpacity={0.8}>
          <Text style={BTN.secondaryText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[BTN.primary, saving && BTN.disabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={BTN.primaryText}>{saving ? 'Saving…' : 'Save Address'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Address Book</Text>
        {editing || form.recipient_name ? (
          renderForm()
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => startEdit()} activeOpacity={0.8}>
            <Text style={BTN.primaryText}>+ Add New Address</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={C.pink} />
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingTop: S.md }}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={T.h4} numberOfLines={1}>
                    {item.label ? `${item.label} · ` : ''}
                    {item.recipient_name}
                  </Text>
                  {item.is_default && (
                    <Text style={styles.defaultBadge}>Default</Text>
                  )}
                </View>
                <Text style={[T.bodySmall, { color: C.text3 }]}>{item.phone}</Text>
                <Text style={[T.bodySmall, { color: C.text3 }]}>
                  {item.line1}
                  {item.line2 ? `, ${item.line2}` : ''}
                </Text>
                <Text style={[T.bodySmall, { color: C.text3 }]}>
                  {item.city}, {item.state} – {item.postal_code}
                </Text>
                <View style={styles.actions}>
                  {!item.is_default && (
                    <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
                      <Text style={styles.link}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => startEdit(item)}>
                    <Text style={styles.link}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={[styles.link, { color: C.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No saved addresses yet. Add one to use at checkout.</Text>
            }
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.white },
  scroll: { paddingHorizontal: S.lg, paddingTop: S.lg, paddingBottom: S.xxl, gap: S.md },
  heading: { ...T.h2, marginBottom: S.sm },
  addBtn: { ...BTN.primary, alignItems: 'center' },
  formCard: {
    gap: S.sm,
    padding: S.md,
    borderRadius: R.xl,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
  },
  defaultRow: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm, marginTop: S.xs,
  },
  defaultRowActive: {},
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: C.rose },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.rose },
  formActions: {
    flexDirection: 'row', gap: S.md, marginTop: S.sm,
  },
  card: {
    padding: S.md,
    borderRadius: R.xl,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: S.sm,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm, marginBottom: 2,
  },
  defaultBadge: {
    fontSize: 10, fontWeight: '700', color: C.rose,
    backgroundColor: C.card2, borderRadius: R.sm,
    paddingHorizontal: S.sm, paddingVertical: 2,
  },
  actions: {
    flexDirection: 'row', gap: S.md, marginTop: S.sm,
  },
  link: {
    ...T.caption, color: C.rose, fontWeight: '700',
  },
  empty: {
    ...T.bodySmall, color: C.muted, textAlign: 'center', marginTop: S.xl,
  },
});
