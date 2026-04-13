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
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'theme' | 'permissions' | 'logs'>('users');
  const [viewMode, setViewMode] = useState<'list' | 'add'>('list');
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Firma Bilgisi
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('admin_email', user.email)
      .single();

    if (company) {
      setCompanyInfo(company);
      // Personel Listesi
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('company_id', company.id);
      setUsers(staff || []);
    }
    setLoading(false);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('staff').update({ is_active: !currentStatus }).eq('id', userId);
    if (!error) fetchData();
  };

  const deleteUser = async (userId: string) => {
    Alert.alert('Emin misiniz?', 'Bu kullanıcıyı silmek üzeresiniz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Evet, Sil', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('staff').delete().eq('id', userId);
        if (!error) fetchData();
      }}
    ]);
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
          <MenuItem label="Kullanıcılar" icon="👥" active={activeTab === 'users'} onPress={() => { setActiveTab('users'); setViewMode('list'); }} />
          <MenuItem label="Yetkilendirme" icon="🔐" active={activeTab === 'permissions'} onPress={() => setActiveTab('permissions')} />
          <MenuItem label="Sistem Logları" icon="📜" active={activeTab === 'logs'} onPress={() => setActiveTab('logs')} />
          <View style={styles.menuDivider} />
          <MenuItem label="Ayarlar" icon="⚙️" active={activeTab === 'settings'} onPress={() => setActiveTab('settings')} />
          <MenuItem label="Tema Seçimi" icon="🎨" active={activeTab === 'theme'} onPress={() => setActiveTab('theme')} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
          <Text style={styles.logoutText}>🚪 Güvenli Çıkış</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content - Sağ Taraf */}
      <View style={styles.mainContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>
              {activeTab === 'users' && 'Kullanıcı Yönetimi'}
              {activeTab === 'permissions' && 'Yetki Tanımları'}
              {activeTab === 'logs' && 'Sistem Aktivite Logları'}
              {activeTab === 'settings' && 'İşletme Ayarları'}
              {activeTab === 'theme' && 'Görünüm ve Tema'}
            </Text>
            {activeTab === 'users' && (
               <Text style={styles.headerSubtitle}>Toplam {users.length} kayıtlı personel listeleniyor.</Text>
            )}
          </View>
          
          {activeTab === 'users' && viewMode === 'list' && (
            <TouchableOpacity style={styles.addBtn} onPress={() => { setSelectedUser(null); setViewMode('add'); }}>
              <Text style={styles.addBtnText}>+ Yeni Kullanıcı Tanımla</Text>
            </TouchableOpacity>
          )}

          {activeTab === 'users' && viewMode === 'add' && (
            <TouchableOpacity style={styles.backBtn} onPress={() => setViewMode('list')}>
              <Text style={styles.backBtnText}>← Listeye Dön</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {activeTab === 'users' && viewMode === 'list' && (
            <View style={styles.dataGrid}>
              <View style={styles.gridHeader}>
                <Text style={[styles.gridHeaderCol, { flex: 2 }]}>Personel</Text>
                <Text style={[styles.gridHeaderCol, { flex: 1.5 }]}>Departman</Text>
                <Text style={[styles.gridHeaderCol, { flex: 1.5 }]}>E-Posta</Text>
                <Text style={[styles.gridHeaderCol, { flex: 1 }]}>Durum</Text>
                <Text style={[styles.gridHeaderCol, { flex: 1, textAlign: 'right' }]}>İşlemler</Text>
              </View>
              {users.map((u, i) => (
                <View key={u.id} style={[styles.gridRow, i % 2 === 0 && { backgroundColor: '#F8FAFC' }]}>
                  <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.avatarMini}><Text style={styles.avatarTxt}>{u.first_name?.[0] || '?'}</Text></View>
                    <Text style={styles.userName}>{u.first_name} {u.last_name}</Text>
                  </View>
                  <Text style={[styles.gridDataCol, { flex: 1.5 }]}>{u.department || '-'}</Text>
                  <Text style={[styles.gridDataCol, { flex: 1.5 }]}>{u.email}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={[styles.badge, { backgroundColor: u.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
                      <Text style={[styles.badgeTxt, { color: u.is_active ? '#166534' : '#991B1B' }]}>
                        {u.is_active ? 'Aktif' : 'Pasif'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                    <TouchableOpacity onPress={() => { setSelectedUser(u); setViewMode('add'); }}>
                      <Text style={{ fontSize: 18 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleUserStatus(u.id, u.is_active)}>
                      <Text style={{ fontSize: 18 }}>{u.is_active ? '⏸️' : '▶️'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteUser(u.id)}>
                      <Text style={{ fontSize: 18 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'users' && viewMode === 'add' && (
            <UserDefinitionForm 
              isTab={true} 
              initialData={selectedUser}
              onSaved={() => { 
                setViewMode('list'); 
                setSelectedUser(null);
                fetchData(); 
              }} 
            />
          )}

          {activeTab === 'permissions' && (
            <View style={styles.placeholderView}>
              <Text style={styles.placeholderEmoji}>🔐</Text>
              <Text style={styles.placeholderTxt}>Modüler yetki sistemi (Satış, Stok, Muhasebe) buradan yönetilecek.</Text>
            </View>
          )}

          {activeTab === 'logs' && (
            <View style={styles.placeholderView}>
              <Text style={styles.placeholderEmoji}>📜</Text>
              <Text style={styles.placeholderTxt}>Giriş saatleri, oturum süreleri ve işlem geçmişi burada dökülecektir.</Text>
            </View>
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
  sidebar: { width: 260, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#E2E8F0', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  sidebarLogo: { width: 64, height: 64, borderRadius: 16 },
  placeholderLogo: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  companyTitle: { marginTop: 15, fontSize: 16, fontWeight: '800', color: '#0F172A', width: '100%', textAlign: 'center' },
  menuItems: { flex: 1, gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10 },
  menuItemActive: { backgroundColor: '#F1F5F9' },
  menuIcon: { fontSize: 18, marginRight: 12 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  menuLabelActive: { color: '#0F172A' },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  logoutBtn: { marginTop: 'auto', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  logoutText: { color: '#EF4444', fontWeight: '700', textAlign: 'center', fontSize: 13 },
  mainContent: { flex: 1 },
  header: { height: 100, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  userEmail: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  addBtn: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  backBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  backBtnText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  scrollContent: { padding: 40 },
  dataGrid: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  gridHeader: { flexDirection: 'row', padding: 16, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  gridHeaderCol: { fontSize: 13, fontWeight: '700', color: '#475569' },
  gridDataCol: { fontSize: 13, color: '#475569' },
  gridRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  avatarMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarTxt: { fontSize: 12, fontWeight: '800', color: '#475569' },
  userName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderView: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  placeholderEmoji: { fontSize: 64, marginBottom: 20 },
  placeholderTxt: { fontSize: 16, color: '#94A3B8', fontWeight: '500', textAlign: 'center' }
});
