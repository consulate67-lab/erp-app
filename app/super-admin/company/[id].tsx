import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '../../../lib/supabase';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchCompany();
  }, [id]);

  const fetchCompany = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Hata', 'Firma bilgileri getirilemedi.');
      console.error(error);
    } else {
      setCompany(data);
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: company.name,
        tax_office: company.tax_office,
        tax_number: company.tax_number,
        city: company.city,
        district: company.district,
        street_address: company.street_address,
        db_host: company.db_host,
        db_name: company.db_name,
        db_user: company.db_user,
        db_pass: company.db_pass,
        admin_email: company.admin_email,
        admin_pass: company.admin_pass,
        license_end_date: company.license_end_date
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      Alert.alert('Hata', error.message);
    } else {
      Alert.alert('Başarılı', 'Firma bilgileri güncellendi.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (!company) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Stack.Screen options={{ title: company.name || 'Firma Yönetimi' }} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Geri Dön</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Firma Yönetimi</Text>
      </View>

      <View style={styles.grid}>
        {/* Sol Kolon */}
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Genel Bilgiler</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Firma Adı</Text>
              <TextInput 
                style={styles.input} 
                value={company.name} 
                onChangeText={(t) => setCompany({...company, name: t})} 
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Vergi Dairesi</Text>
                <TextInput style={styles.input} value={company.tax_office} onChangeText={(t) => setCompany({...company, tax_office: t})} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Vergi No</Text>
                <TextInput style={styles.input} value={company.tax_number} onChangeText={(t) => setCompany({...company, tax_number: t})} />
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Şehir</Text>
                <TextInput style={styles.input} value={company.city} onChangeText={(t) => setCompany({...company, city: t})} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>İlçe</Text>
                <TextInput style={styles.input} value={company.district} onChangeText={(t) => setCompany({...company, district: t})} />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Yönetici Erişimi</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin E-Posta</Text>
              <TextInput style={styles.input} value={company.admin_email} onChangeText={(t) => setCompany({...company, admin_email: t})} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Admin Şifre</Text>
              <TextInput style={styles.input} value={company.admin_pass} onChangeText={(t) => setCompany({...company, admin_pass: t})} secureTextEntry />
            </View>
          </View>
        </View>

        {/* Sağ Kolon */}
        <View style={styles.column}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>SQL Veritabanı Yapılandırması</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sunucu (Host)</Text>
              <TextInput style={styles.input} value={company.db_host} onChangeText={(t) => setCompany({...company, db_host: t})} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Veritabanı Adı</Text>
              <TextInput style={styles.input} value={company.db_name} onChangeText={(t) => setCompany({...company, db_name: t})} />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.label}>Kullanıcı</Text>
                <TextInput style={styles.input} value={company.db_user} onChangeText={(t) => setCompany({...company, db_user: t})} />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Şifre</Text>
                <TextInput style={styles.input} value={company.db_pass} onChangeText={(t) => setCompany({...company, db_pass: t})} secureTextEntry />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={sectionTitleStyle(new Date(company.license_end_date) < new Date())}>Lisans Durumu</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Lisans Bitiş Tarihi</Text>
              <TextInput style={styles.input} value={company.license_end_date} onChangeText={(t) => setCompany({...company, license_end_date: t})} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const sectionTitleStyle = (isExpired: boolean) => [
  styles.sectionTitle,
  isExpired && { color: '#EF4444' }
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 30, alignSelf: 'center', width: '100%', maxWidth: 1200 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 20 },
  backBtnText: { color: '#64748B', fontSize: 16, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  grid: { flexDirection: 'row', gap: 24, flexWrap: 'wrap' },
  column: { flex: 1, minWidth: 350, gap: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, height: 44, paddingHorizontal: 12, fontSize: 15 },
  row: { flexDirection: 'row' },
  saveBtn: { backgroundColor: '#0F172A', borderRadius: 10, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' }
});
