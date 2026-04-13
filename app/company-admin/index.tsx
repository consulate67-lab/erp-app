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
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

// UI Bileşenleri (Tablar için)
import UserDefinitionForm from './users'; // Mevcut personel ekranını buraya dahil edebiliriz

export default function CompanyAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'theme'>('users');
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('admin_email', user.email)
      .single();

    if (data) setCompanyInfo(data);
    setLoading(false);
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#0F172A" /></View>;

  return (
    <View style={styles.container}>
      {/* Sidebar - Sol Menü */}
      <View style={styles.sidebar}>
        <View style={styles.logoContainer}>
          {companyInfo?.logo_url ? (
            <Image source={{ uri: companyInfo.logo_url }} style={styles.sidebarLogo} />
          ) : (
            <View style={styles.placeholderLogo}><Text style={styles.placeholderText}>{companyInfo?.name?.charAt(0)}</Text></View>
          )}
          <Text style={styles.companyTitle} numberOfLines={1}>{companyInfo?.name || 'Şirket Paneli'}</Text>
        </View>

        <View style={styles.menuItems}>
          <MenuItem 
            label="Kullanıcılar" 
            icon="👥" 
            active={activeTab === 'users'} 
            onPress={() => setActiveTab('users')} 
          />
          <MenuItem 
            label="Ayarlar" 
            icon="⚙️" 
            active={activeTab === 'settings'} 
            onPress={() => setActiveTab('settings')} 
          />
          <MenuItem 
            label="Tema Seçimi" 
            icon="🎨" 
            active={activeTab === 'theme'} 
            onPress={() => setActiveTab('theme')} 
          />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
          <Text style={styles.logoutText}>🚪 Güvenli Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Sağ Taraf */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {activeTab === 'users' && 'Kullanıcı Yönetimi'}
            {activeTab === 'settings' && 'İşletme Ayarları'}
            {activeTab === 'theme' && 'Görünüm ve Tema'}
          </Text>
          <Text style={styles.userEmail}>{companyInfo?.admin_email}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'users' && (
            <UserDefinitionForm isTab={true} />
          )}

          {activeTab === 'settings' && (
            <View style={styles.placeholderView}>
              <Text style={styles.placeholderEmoji}>🛠️</Text>
              <Text style={styles.placeholderTxt}>İşletme ayarları modülü çok yakında aktif edilecektir.</Text>
            </View>
          )}

          {activeTab === 'theme' && (
            <View style={styles.placeholderView}>
              <Text style={styles.placeholderEmoji}>🎨</Text>
              <Text style={styles.placeholderTxt}>Tema ve renk özelleştirme seçenekleri üzerinde çalışıyoruz.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function MenuItem({ label, icon, active, onPress }: any) {
  return (
    <TouchableOpacity 
      style={[styles.menuItem, active && styles.menuItemActive]} 
      onPress={onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },
  sidebar: { width: 280, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  sidebarLogo: { width: 64, height: 64, borderRadius: 16 },
  placeholderLogo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  companyTitle: { marginTop: 15, fontSize: 18, fontWeight: '800', color: '#0F172A', width: '100%', textAlign: 'center' },
  menuItems: { flex: 1, gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12 },
  menuItemActive: { backgroundColor: '#F1F5F9' },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#64748B' },
  menuLabelActive: { color: '#0F172A' },
  logoutBtn: { marginTop: 'auto', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  logoutText: { color: '#EF4444', fontWeight: '700', textAlign: 'center' },
  mainContent: { flex: 1 },
  header: { height: 80, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  userEmail: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  scrollContent: { padding: 40 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderView: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  placeholderEmoji: { fontSize: 64, marginBottom: 20 },
  placeholderTxt: { fontSize: 16, color: '#94A3B8', fontWeight: '500', textAlign: 'center' }
});
