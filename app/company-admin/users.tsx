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
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

export default function UserDefinitionScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    email: '',
    phone: '',
    photoBase64: ''
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
      setPhotoUri(result.assets[0].uri);
      setFormData({ ...formData, photoBase64: result.assets[0].base64 || '' });
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      Alert.alert('Hata', 'İsim, Soyisim ve E-posta alanları zorunludur.');
      return;
    }

    setLoading(true);
    // Simülasyon Veri Kaydı
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Başarılı', 'Kullanıcı tanımlaması başarıyla yapıldı.');
    }, 1500);
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
              <Text style={styles.label}>Departman / Görev</Text>
              <TextInput 
                style={styles.input} 
                value={formData.department} 
                onChangeText={t => setFormData({...formData, department: t})}
                placeholder="Örn: Muhasebe, Satış Temsilcisi vb."
              />
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

          {/* Yetkilendirme Başlığı */}
          <View style={styles.divider} />
          <View style={styles.authSection}>
            <Text style={styles.authTitle}>🔐 Yetkilendirme Ayarları</Text>
            <View style={styles.authPlaceholder}>
              <Text style={styles.authPlaceholderText}>Yetkilendirme modülleri ve rol tanımları çok yakında burada yapılandırılabilecek.</Text>
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
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },
  authSection: { marginTop: 20, marginBottom: 30 },
  authTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 15 },
  authPlaceholder: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1' },
  authPlaceholderText: { fontSize: 14, color: '#64748B', fontStyle: 'italic', textAlign: 'center' },
  saveBtn: { backgroundColor: '#0F172A', borderRadius: 16, height: 60, justifyContent: 'center', alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
