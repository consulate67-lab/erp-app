import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Turkiye API Types
interface City { name: string; }
interface District { name: string; }

export default function EditCompanyScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    country: 'Türkiye',
    city: '',
    district: '',
    address: '',
    taxOffice: '',
    taxNumber: '',
    logoUri: '', 
    logo_url: '',
    dbHost: '',
    dbName: '',
    dbUser: '',
    dbPass: '',
    adminEmail: '',
    adminPass: '',
    licenseEndDate: '',
    is_active: true
  });

  useEffect(() => {
    fetchCompanyData();
    fetchCities();
  }, [id]);

  const fetchCities = () => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => setCities(data.data.sort((a: any, b: any) => a.name.localeCompare(b.name))))
      .catch(err => console.error("API Hatası:", err));
  };

  const fetchCompanyData = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      Alert.alert('Hata', 'Firma bilgileri getirilemedi.');
    } else if (data) {
      setFormData({
        name: data.name || '',
        country: data.country || 'Türkiye',
        city: data.city || '',
        district: data.district || '',
        address: data.street_address || '',
        taxOffice: data.tax_office || '',
        taxNumber: data.tax_number || '',
        logoUri: data.logo_url || '',
        logo_url: data.logo_url || '',
        dbHost: data.db_host || '',
        dbName: data.db_name || '',
        dbUser: data.db_user || '',
        dbPass: data.db_pass || '',
        adminEmail: data.admin_email || '',
        adminPass: data.admin_pass || '',
        licenseEndDate: data.license_end_date || '',
        is_active: data.is_active ?? true
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formData.city) {
      fetch(`https://turkiyeapi.dev/api/v1/provinces?name=${formData.city}`)
        .then(res => res.json())
        .then(data => {
          if (data.data && data.data.length > 0) {
            setDistricts(data.data[0].districts.sort((a: any, b: any) => a.name.localeCompare(b.name)));
          }
        })
        .catch(err => console.error("District API Hatası:", err));
    }
  }, [formData.city]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('companies')
      .update({
        name: formData.name,
        country: formData.country,
        city: formData.city,
        district: formData.district,
        street_address: formData.address,
        tax_office: formData.taxOffice,
        tax_number: formData.taxNumber,
        db_host: formData.dbHost,
        db_name: formData.dbName,
        db_user: formData.dbUser,
        db_pass: formData.dbPass,
        admin_email: formData.adminEmail,
        admin_pass: formData.adminPass,
        license_end_date: formData.licenseEndDate,
        is_active: formData.is_active
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      Alert.alert('Güncelleme Hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'Firma güncellendi, listeye dönülüyor...');
      router.replace('/super-admin' as any);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Firmayı Sil',
      'Bu firmayı ve tüm verilerini kalıcı olarak silmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Evet, Sil', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('companies').delete().eq('id', id);
            if (error) Alert.alert('Hata', error.message);
            else router.replace('/super-admin' as any);
          }
        }
      ]
    );
  };

  if (loading) return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#0F172A" /></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Listeye Dön</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{formData.name || 'Firma Düzenle'}</Text>
          <Text style={styles.subtitle}>Firma teknik ve idari bilgilerini buradan güncelleyebilirsiniz.</Text>
        </View>

        <View style={styles.grid}>
          {/* SOL KOLON */}
          <View style={styles.column}>
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}><Text>🏢</Text></View>
                <Text style={styles.sectionTitle}>Kurumsal Kimlik</Text>
                
                {/* Durum Switcleri (Aktif/Pasif) */}
                <TouchableOpacity 
                  style={[styles.statusToggle, { backgroundColor: formData.is_active ? '#D1FAE5' : '#FEE2E2' }]}
                  onPress={() => setFormData({...formData, is_active: !formData.is_active})}
                >
                  <Text style={[styles.statusToggleText, { color: formData.is_active ? '#065F46' : '#991B1B' }]}>
                    {formData.is_active ? '● AKTİF' : '○ PASİF'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.logoSection}>
                <View style={styles.logoUploadBtn}>
                  {formData.logo_url ? (
                    <Image source={{ uri: formData.logo_url }} style={styles.logoPreview} />
                  ) : (
                    <Text style={styles.logoUploadText}>Logo Yok</Text>
                  )}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 20 }]}>
                  <Text style={styles.label}>Firma Ticari Adı</Text>
                  <TextInput style={styles.input} value={formData.name} onChangeText={t => setFormData({...formData, name: t})} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Vergi Dairesi</Text>
                  <TextInput style={styles.input} value={formData.taxOffice} onChangeText={t => setFormData({...formData, taxOffice: t})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Vergi Numarası</Text>
                  <TextInput style={styles.input} value={formData.taxNumber} onChangeText={t => setFormData({...formData, taxNumber: t})} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>İl</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={formData.city} onValueChange={(val: string) => setFormData({...formData, city: val})} style={styles.picker}>
                      {cities.map((city, i) => <Picker.Item key={i} label={city.name} value={city.name} />)}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>İlçe</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={formData.district} onValueChange={(val: string) => setFormData({...formData, district: val})} style={styles.picker}>
                      {districts.map((district, i) => <Picker.Item key={i} label={district.name} value={district.name} />)}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Açık Adres</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline value={formData.address} onChangeText={t => setFormData({...formData, address: t})} />
              </View>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}><Text>🔑</Text></View>
                <Text style={styles.sectionTitle}>Yönetici Hesabı</Text>
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Yetkili E-Posta</Text>
                  <TextInput style={styles.input} value={formData.adminEmail} onChangeText={t => setFormData({...formData, adminEmail: t})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Şifre</Text>
                  <TextInput style={styles.input} secureTextEntry value={formData.adminPass} onChangeText={t => setFormData({...formData, adminPass: t})} />
                </View>
              </View>
            </View>
          </View>

          {/* SAĞ KOLON */}
          <View style={styles.column}>
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}><Text>🗄️</Text></View>
                <Text style={styles.sectionTitle}>SQL Veritabanı</Text>
              </View>
              <View style={styles.inputGroup}><Text style={styles.label}>Sunucu (Host)</Text><TextInput style={styles.input} value={formData.dbHost} onChangeText={t => setFormData({...formData, dbHost: t})} /></View>
              <View style={styles.inputGroup}><Text style={styles.label}>Veritabanı Adı</Text><TextInput style={styles.input} value={formData.dbName} onChangeText={t => setFormData({...formData, dbName: t})} /></View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}><Text style={styles.label}>Kullanıcı</Text><TextInput style={styles.input} value={formData.dbUser} onChangeText={t => setFormData({...formData, dbUser: t})} /></View>
                <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Şifre</Text><TextInput style={styles.input} secureTextEntry value={formData.dbPass} onChangeText={t => setFormData({...formData, dbPass: t})} /></View>
              </View>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}><Text>⏳</Text></View>
                <Text style={styles.sectionTitle}>Lisans Yönetimi</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sona Erme Tarihi</Text>
                <TextInput style={styles.input} value={formData.licenseEndDate} onChangeText={t => setFormData({...formData, licenseEndDate: t})} />
              </View>

              <TouchableOpacity style={styles.updateButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateButtonText}>Değişiklikleri Uygula</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Firmayı Kalıcı Olarak Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 40, alignSelf: 'center', width: '100%', maxWidth: 1200 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 30 },
  backLink: { marginBottom: 20 },
  backLinkText: { color: '#3B82F6', fontWeight: '700', fontSize: 16 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  grid: { flexDirection: 'row', gap: 30, flexWrap: 'wrap' },
  column: { flex: 1, minWidth: 350, gap: 30 },
  glassCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 30, borderWidth: 1, borderColor: '#E2E8F0', elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'space-between' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1 },
  statusToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusToggleText: { fontSize: 12, fontWeight: '800' },
  logoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoUploadBtn: { width: 90, height: 90, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  logoUploadText: { fontSize: 10, color: '#94A3B8' },
  row: { flexDirection: 'row', width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, height: 48, paddingHorizontal: 16, fontSize: 15 },
  pickerContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, height: 48, justifyContent: 'center' },
  picker: { width: '100%' },
  updateButton: { backgroundColor: '#0F172A', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  updateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  deleteButton: { marginTop: 20, height: 40, justifyContent: 'center', alignItems: 'center' },
  deleteButtonText: { color: '#EF4444', fontWeight: '700', fontSize: 14 }
});
