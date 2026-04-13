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
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

// Turkiye API Types
interface City {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
  provinceId: number;
}

export default function AddCompanyScreen() {
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [taxOffices, setTaxOffices] = useState<string[]>([]);
  
  // Form States
  const [formData, setFormData] = useState({
    name: '',
    country: 'Türkiye',
    city: '',
    district: '',
    neighborhood: '',
    street: '',
    taxOffice: '',
    taxNumber: '',
    logoUri: '', // Fotoğraf yereldeki önizleme linki
    logoBase64: '' // Supabase için tutulan encode
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
      setFormData({ 
        ...formData, 
        logoUri: result.assets[0].uri, 
        logoBase64: result.assets[0].base64 || '' 
      });
    }
  };

  // Fetch Cities (İller)
  useEffect(() => {
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        if(data.status === 'OK' && data.data) {
          const sortedCities = data.data.map((c: any) => ({id: c.id, name: c.name}))
            .sort((a: City, b: City) => a.name.localeCompare(b.name));
          setCities(sortedCities);
        }
      }).catch(err => console.log('City fetch error', err));
      
    // Örnek Vergi Daireleri (Tam listeyi ücretsiz JSON repolardan çekeceğiz, şimdilik statik mock yapı)
    setTaxOffices(['Büyük Mükellefler V.D.', 'Şişli V.D.', 'Kadıköy V.D.', 'Ankara Başkent V.D.', 'İzmir Konak V.D.']);
  }, []);

  // Fetch Districts when City changes (İlçeler)
  useEffect(() => {
    if (formData.city) {
      // Find city ID
      const selectedCityObj = cities.find(c => c.name === formData.city);
      if(selectedCityObj) {
        fetch(`https://turkiyeapi.dev/api/v1/provinces/${selectedCityObj.id}`)
          .then(res => res.json())
          .then(data => {
            if(data.status === 'OK' && data.data && data.data.districts) {
              const dList = data.data.districts.map((d: any) => ({id: d.id, name: d.name}));
              setDistricts(dList);
            }
          }).catch(err => console.log('District fetch error', err));
      }
    } else {
      setDistricts([]);
    }
  }, [formData.city, cities]);

  const handleSave = async () => {
    if (!formData.name || !formData.city || !formData.district) {
      Alert.alert('Eksik Bilgi', 'Lütfen en az Firma Adı, İl ve İlçe bilgilerini giriniz.');
      return;
    }

    setLoading(true);
    
    // Tarih referansları (Bugünden başlayıp 1 yıllık lisans süresi örnek olarak eklendi)
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

    let logoStorageUrl = '';
    
    // Eğer bir logo seçildiyse Supabase Storage'a Yükleme Simülasyonu / Kod bloğu
    if (formData.logoBase64) {
      // Not: Supabase'de 'company_logos' isminde bir bucket açılmış olmalıdır.
      // const { data: imgData, error: imgError } = await supabase.storage
      //  .from('company_logos')
      //  .upload(`logos/${formData.name}_${Date.now()}.png`, decode(formData.logoBase64), { contentType: 'image/png' });
      // logoStorageUrl = imgData?.path || '';
      
      // Geçici mockup url
      logoStorageUrl = 'https://kctzgsipckflngluxhyh.supabase.co/storage/v1/object/public/company_logos/default.png';
    }

    const { data, error } = await supabase
      .from('companies')
      .insert([
        { 
          name: formData.name, 
          country: formData.country,
          city: formData.city,
          district: formData.district,
          neighborhood: formData.neighborhood,
          street_address: formData.street,
          tax_office: formData.taxOffice,
          tax_number: formData.taxNumber,
          logo_url: logoStorageUrl,
          license_start_date: startDate,
          license_end_date: endDate
        }
      ]);

    setLoading(false);

    if (error) {
      Alert.alert('Kayıt Başarısız', error.message);
      console.log("Supabase Insert Hatası:", error);
    } else {
      Alert.alert('Başarılı', 'Firma Supabase veritabanına başarıyla oluşturuldu!');
      setFormData({
        name: '', country: 'Türkiye', city: '', district: '', neighborhood: '', street: '', taxOffice: '', taxNumber: '', logoUri: '', logoBase64: ''
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Yeni Firma Tanımla</Text>
      <Text style={styles.pageDesc}>ERP sitemini kullanacak olan firmaları ve konum bilgilerini giriniz.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
        
        <View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoUploadBtn} onPress={pickImage}>
            {formData.logoUri ? (
              <Image source={{ uri: formData.logoUri }} style={styles.logoPreview} />
            ) : (
              <Text style={styles.logoUploadText}>+ Logo Yükle</Text>
            )}
          </TouchableOpacity>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 16 }]}>
            <Text style={styles.label}>Firma Adı</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Örn: ABC Teknolojileri A.Ş."
              value={formData.name}
              onChangeText={t => setFormData({...formData, name: t})}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Kurumsal Vergi Bilgileri</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vergi Dairesi</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.taxOffice}
              onValueChange={(val: string) => setFormData({...formData, taxOffice: val})}
              style={styles.picker}
            >
              <Picker.Item label="Vergi Dairesi Seçin..." value="" />
              {taxOffices.map((office, idx) => (
                <Picker.Item key={idx} label={office} value={office} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Vergi No</Text>
          <TextInput 
            style={styles.input} 
            placeholder="10 Haneli Vergi No"
            keyboardType="numeric"
            value={formData.taxNumber}
            onChangeText={t => setFormData({...formData, taxNumber: t})}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Lokasyon Bilgileri</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ülke</Text>
          <TextInput style={[styles.input, styles.disabledInput]} value="Türkiye" editable={false} />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, {flex: 1, marginRight: 10}]}>
            <Text style={styles.label}>İl (Şehir)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.city}
                onValueChange={(val: string) => {
                  setFormData({...formData, city: val, district: ''});
                }}
                style={styles.picker}
              >
                <Picker.Item label="İl Seçin..." value="" />
                {cities.map((city) => (
                  <Picker.Item key={city.id} label={city.name} value={city.name} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.inputGroup, {flex: 1}]}>
            <Text style={styles.label}>İlçe / Semt</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.district}
                onValueChange={(val: string) => setFormData({...formData, district: val})}
                style={styles.picker}
                enabled={districts.length > 0}
              >
                <Picker.Item label="İlçe Seçin..." value="" />
                {districts.map((d) => (
                  <Picker.Item key={d.id} label={d.name} value={d.name} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mahalle</Text>
          <TextInput 
            style={styles.input}
            placeholder="Mahalle Adı"
            value={formData.neighborhood}
            onChangeText={t => setFormData({...formData, neighborhood: t})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Açık Adres (Sokak/Bina/Daire)</Text>
          <TextInput 
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            placeholder="Açık adres bilgisi giriniz..."
            value={formData.street}
            onChangeText={t => setFormData({...formData, street: t})}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Firmayı Kaydet</Text>}
      </TouchableOpacity>

      <View style={{height: 40}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Çok açık mavi/gri temiz arka plan
  },
  content: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center', // Tablet ve web'de ortada kart gibi durması için
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
  disabledInput: {
    backgroundColor: '#E2E8F0',
    color: '#64748B',
  },
  pickerContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoUploadBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  logoUploadText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  logoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#10B981', // Canlı yeşil onay rengi
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
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
