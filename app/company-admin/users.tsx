import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function UserDefinitionScreen({ isTab = false, onSaved }: { isTab?: boolean, onSaved?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    email: '',
    phone: '',
    photoBase64: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('admin_email', user.email)
        .single();

      if (company) {
        const { data: deps } = await supabase
          .from('P_Departman_Tip')
          .select('*')
          .eq('company_id', company.id)
          .order('name');
        
        setDepartments(deps || []);
      }
    } catch (e) {
      console.error("Departman loading error:", e);
    } finally {
      setLoadingDeps(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setFormData({ ...formData, photoBase64: result.assets[0].base64 || '' });
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.department) {
      Alert.alert('Hata', 'Lütfen tüm zorunlu alanları (Ad, Soyad, E-posta ve Departman) doldurun.');
      return;
    }

    setLoading(true);

    try {
      // 1. ADIM: Şirket ID Bul
      const { data: { user } } = await supabase.auth.getUser();
      const { data: company } = await supabase.from('companies').select('id').eq('admin_email', user?.email).single();

      if (!company) throw new Error("Şirket bulunamadı.");

      // 2. ADIM: Staff Tablosuna Kaydet
      const { error } = await supabase.from('staff').insert({
        company_id: company.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        photo_url: formData.photoBase64 ? `data:image/png;base64,${formData.photoBase64}` : null,
        is_active: true
      });

      if (error) throw error;

      Alert.alert('Başarılı', 'Kullanıcı başarıyla kaydedildi.');
      if (onSaved) onSaved();
      else if (!isTab) router.back();

    } catch (err: any) {
      Alert.alert('Hata', err.message);
    } finally {
      setLoading(false);
    }
  };

  const MainContainer = isTab ? View : ScrollView;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <MainContainer style={isTab ? {} : styles.container} contentContainerStyle={isTab ? {} : styles.scrollContent}>
        
        {!isTab && (
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.title}>Kullanıcı / Personel Tanıtımı</Text>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={{ color: '#EF4444', fontWeight: '700' }}>Çıkış Yap</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>İşletme bünyesindeki kullanıcıların bilgilerini ve yetkilerini yönetin.</Text>
          </View>
        )}

        <View style={[styles.card, isTab && { padding: 0, elevation: 0, shadowOpacity: 0 }]}>
          {/* Fotoğraf Bölümü */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoUploadBtn} onPress={pickImage}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderText}>📷</Text>
                  <Text style={styles.photoUploadText}>Fotoğraf Ekle</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.photoHint}>
              <Text style={styles.photoHintTitle}>Profil Fotoğrafı</Text>
              <Text style={styles.photoHintText}>Kare formatında, net bir fotoğraf seçiniz.</Text>
            </View>
          </View>

          <View style={styles.formGrid}>
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                <Text style={styles.label}>Adı</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.firstName} 
                  onChangeText={t => setFormData({...formData, firstName: t})}
                  placeholder="Örn: Ahmet"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Soyadı</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.lastName} 
                  onChangeText={t => setFormData({...formData, lastName: t})}
                  placeholder="Örn: Yılmaz"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Departman</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.department}
                  onValueChange={(val) => setFormData({...formData, department: val})}
                  style={styles.picker}
                >
                  <Picker.Item label="Departman Seçiniz..." value="" color="#94A3B8" />
                  {departments.map((dep) => (
                    <Picker.Item key={dep.id} label={dep.name} value={dep.name} />
                  ))}
                </Picker>
              </View>
              {departments.length === 0 && !loadingDeps && (
                 <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                   ⚠️ Hiç departman tanımlanmamış. Lütfen önce departmanları ekleyin.
                 </Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 15 }]}>
                <Text style={styles.label}>E-Posta Adresi</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="email-address"
                  value={formData.email} 
                  onChangeText={t => setFormData({...formData, email: t})}
                  placeholder="ahmet@firmaadi.com"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Telefon Numarası</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="phone-pad"
                  value={formData.phone} 
                  onChangeText={t => setFormData({...formData, phone: t})}
                  placeholder="05XX XXX XX XX"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kullanıcıyı Kaydet</Text>}
          </TouchableOpacity>
        </View>

      </MainContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scrollContent: { padding: 30, alignSelf: 'center', width: '100%', maxWidth: 800 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 6 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5 },
  photoSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 35, backgroundColor: '#F8FAFC', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  photoUploadBtn: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF', borderWidth: 2, borderStyle: 'dashed', borderColor: '#CBD5E1', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  photoPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center' },
  photoPlaceholderText: { fontSize: 24, marginBottom: 4 },
  photoUploadText: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  photoHint: { marginLeft: 25, flex: 1 },
  photoHintTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  photoHintText: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  formGrid: { width: '100%' },
  row: { flexDirection: 'row', width: '100%' },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 52, paddingHorizontal: 16, fontSize: 15, color: '#0F172A' },
  pickerContainer: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, height: 52, justifyContent: 'center', overflow: 'hidden' },
  picker: { width: '100%', height: 52 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  authPlaceholderText: { fontSize: 14, color: '#64748B', fontStyle: 'italic', textAlign: 'center' },
  saveBtn: { backgroundColor: '#0F172A', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
