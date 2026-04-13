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
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

// Turkiye API Types
interface City {
  name: string;
}
interface District {
  name: string;
}

export default function AddCompanyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Gelecek seneyi hesapla (Varsayılan Lisans Bitiş)
  const defaultEndDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    country: 'Türkiye',
    city: '',
    district: '',
    address: '',
    taxOffice: '',
    taxNumber: '',
    logoUri: '', 
    logoBase64: '',
    // SQL Bilgileri
    dbHost: '',
    dbName: '',
    dbUser: '',
    dbPass: '',
    // Admin Bilgileri
    adminEmail: '',
    adminPass: '',
    // Lisans Tarihi
    licenseEndDate: defaultEndDate
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, logoUri: result.assets[0].uri, logoBase64: result.assets[0].base64 || '' });
    }
  };

  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => setCities(data.data.sort((a: any, b: any) => a.name.localeCompare(b.name))))
      .catch(err => console.error("API Hatası:", err));
  }, []);

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
    } else {
      setDistricts([]);
      setFormData(prev => ({...prev, district: ''}));
    }
  }, [formData.city]);

  const handleSave = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!formData.name || !formData.adminEmail || !formData.adminPass || !formData.licenseEndDate) {
      setErrorMessage('Firma Adı, Admin E-Posta, Şifre ve Bitiş Tarihi zorunludur.');
      return;
    }

    setLoading(true);
    let logoStorageUrl = '';
    
    // (Mockup Logo yükleme simülasyonu)
    if (formData.logoBase64) {
      logoStorageUrl = 'https://kctzgsipckflngluxhyh.supabase.co/storage/v1/object/public/company_logos/default.png';
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([
          { 
            name: formData.name, 
            country: formData.country,
            city: formData.city,
            district: formData.district,
            street_address: formData.address,
            tax_office: formData.taxOffice,
            tax_number: formData.taxNumber,
            logo_url: logoStorageUrl,
            db_host: formData.dbHost,
            db_name: formData.dbName,
            db_user: formData.dbUser,
            db_pass: formData.dbPass,
            admin_email: formData.adminEmail,
            admin_pass: formData.adminPass,
            license_start_date: new Date().toISOString().split('T')[0],
            license_end_date: formData.licenseEndDate
          }
        ]);

      setLoading(false);

      if (error) {
        console.error("Supabase Error Object:", error);
        setErrorMessage(error.message || "Bilinmeyen bir Supabase kayıt hatası!");
      } else {
        setSuccessMessage('Firma ve Yönetici hesabı kaydedildi! Yönetim paneline yönlendiriliyorsunuz...');
        setTimeout(() => {
          router.replace('/super-admin' as any); 
        }, 1500);
      }
    } catch (e: any) {
      setLoading(false);
      console.error("CATCH Error:", e);
      setErrorMessage(e.message || "Beklenmeyen sistemsel bir hata oluştu.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.title}>Yeni Firma Kurulumu</Text>
          <Text style={styles.subtitle}>ERP platformuna yeni bir işletme entegre edin.</Text>
        </View>

        <View style={styles.grid}>
          {/* SOL KOLON: Temel Bilgiler */}
          <View style={styles.column}>
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}><Text>🏢</Text></View>
                <Text style={styles.sectionTitle}>Kurumsal Kimlik</Text>
              </View>

              <View style={styles.logoSection}>
                <TouchableOpacity style={styles.logoUploadBtn} onPress={pickImage}>
                  {formData.logoUri ? (
                    <Image source={{ uri: formData.logoUri }} style={styles.logoPreview} />
                  ) : (
                    <Text style={styles.logoUploadText}>+ Logo Seç</Text>
                  )}
                </TouchableOpacity>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 20 }]}>
                  <Text style={styles.label}>Firma Ticari Adı</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Örn: ABC A.Ş."
                    value={formData.name}
                    onChangeText={t => setFormData({...formData, name: t})}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Vergi Dairesi</Text>
                  <TextInput style={styles.input} value={formData.taxOffice} onChangeText={t => setFormData({...formData, taxOffice: t})} />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Vergi Numarası</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={formData.taxNumber} onChangeText={t => setFormData({...formData, taxNumber: t})} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>İl</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={formData.city} onValueChange={(val: string) => setFormData({...formData, city: val})} style={styles.picker}>
                      <Picker.Item label="Seçiniz" value="" color="#94A3B8" />
                      {cities.map((city, i) => <Picker.Item key={i} label={city.name} value={city.name} />)}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>İlçe</Text>
                  <View style={styles.pickerContainer}>
                    <Picker selectedValue={formData.district} onValueChange={(val: string) => setFormData({...formData, district: val})} enabled={formData.city !== ''} style={styles.picker}>
                      <Picker.Item label="Seçiniz" value="" color="#94A3B8" />
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
                <Text style={styles.sectionTitle}>Firma Yönetici (Admin) Hesabı</Text>
              </View>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Yetkili E-Posta</Text>
                  <TextInput style={styles.input} keyboardType="email-address" value={formData.adminEmail} onChangeText={t => setFormData({...formData, adminEmail: t})} placeholder="admin@firma.com" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Geçici Şifre</Text>
                  <TextInput style={styles.input} secureTextEntry value={formData.adminPass} onChangeText={t => setFormData({...formData, adminPass: t})} placeholder="••••••••" />
                </View>
              </View>
            </View>
          </View>

          {/* SAĞ KOLON: Teknik ve Lisans Bilgileri */}
          <View style={styles.column}>
            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}><Text>🗄️</Text></View>
                <Text style={styles.sectionTitle}>SQL Veritabanı Bağlantısı</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sunucu (Host / IP)</Text>
                <TextInput style={styles.input} value={formData.dbHost} onChangeText={t => setFormData({...formData, dbHost: t})} placeholder="192.168.1.100 veya localhost" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Veritabanı Adı (Database)</Text>
                <TextInput style={styles.input} value={formData.dbName} onChangeText={t => setFormData({...formData, dbName: t})} placeholder="ERP_FIRMA_DB" />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>SQL Kullanıcı (User)</Text>
                  <TextInput style={styles.input} value={formData.dbUser} onChangeText={t => setFormData({...formData, dbUser: t})} placeholder="sa" />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>SQL Şifre (Password)</Text>
                  <TextInput style={styles.input} secureTextEntry value={formData.dbPass} onChangeText={t => setFormData({...formData, dbPass: t})} placeholder="••••••••" />
                </View>
              </View>
            </View>

            <View style={styles.glassCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF7ED' }]}><Text>⏳</Text></View>
                <Text style={styles.sectionTitle}>Lisans ve Abonelik</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Bitiş Tarihi (YYYY-AA-GG)</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.licenseEndDate} 
                  onChangeText={t => setFormData({...formData, licenseEndDate: t})} 
                  placeholder="2027-04-13" 
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Firmayı Kaydet & Sistemi Kur</Text>}
              </TouchableOpacity>
              
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>Hata: {errorMessage}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={[styles.errorBox, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
                  <Text style={[styles.errorText, { color: '#047857' }]}>{successMessage}</Text>
                </View>
              ) : null}
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
  header: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748B' },
  grid: { flexDirection: 'row', gap: 30, flexWrap: 'wrap' },
  column: { flex: 1, minWidth: 350, gap: 30 },
  glassCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  row: { flexDirection: 'row', width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    height: 48,
    justifyContent: 'center'
  },
  picker: { width: '100%', height: '100%' },
  logoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoUploadBtn: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', overflow: 'hidden' },
  logoUploadText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  logoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  saveButton: {
    backgroundColor: '#0F172A', 
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  errorBox: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '600'
  }
});
