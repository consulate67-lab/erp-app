import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';

export default function AddUserScreen() {
  const [loading, setLoading] = useState(false);
  
  // Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'Şube Yetkilisi' // Opsiyonel ilerisi için
  });

  const handleSave = () => {
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    // TODO: Supabase bağlantısı ile yeni kullanıcı kaydı (auth.signUp) ve ardından user_profiles tablosuna insert edilecek.
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Başarılı', `${formData.fullName} isimli personel başarıyla sisteme eklendi!`);
      // Temizle
      setFormData({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'Şube Yetkilisi' });
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Personel Tanımla</Text>
      <Text style={styles.pageDesc}>Firmanız için sisteme giriş yapabilecek yetkili kullanıcıları ekleyin.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Kullanıcı Bilgileri</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Örn: Ahmet Yılmaz"
            value={formData.fullName}
            onChangeText={t => setFormData({...formData, fullName: t})}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>E-Posta Adresi</Text>
            <TextInput 
              style={styles.input} 
              placeholder="ahmet@firma.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={t => setFormData({...formData, email: t})}
            />
          </View>

          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Telefon</Text>
             <TextInput 
              style={styles.input} 
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={t => setFormData({...formData, phone: t})}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Giriş Şifresi</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>Şifre</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••"
              secureTextEntry
              value={formData.password}
              onChangeText={t => setFormData({...formData, password: t})}
            />
          </View>

           <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={t => setFormData({...formData, confirmPassword: t})}
            />
          </View>
        </View>
        
        <Text style={styles.infoText}>* Kullanıcı bu şifre ile ERP sistemine doğrudan giriş yapacaktır.</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Personeli Kaydet</Text>}
      </TouchableOpacity>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 20,
  },
  pageDesc: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: -8,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#3B82F6', // Mavi tonlarında buton (Sistem admininden ayrıştırmak için)
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  }
});
