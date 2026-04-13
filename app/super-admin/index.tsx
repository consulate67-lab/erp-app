import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

interface Company {
  id: string;
  name: string;
  city: string;
  district: string;
  logo_url: string;
  tax_number: string;
  admin_email: string;
  license_end_date: string;
  db_host: string;
  db_name: string;
  is_active: boolean;
}

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Firma çekme hatası: ", error);
    } else if (data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  const testSqlConnection = async (company: Company) => {
    setTestingId(company.id);
    // Simülasyon: 1.5 saniye bekle
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingId(null);
    Alert.alert('SQL Bağlantı Testi', `${company.db_host} sunucusuna bağlantı başarılı! (Mock)`);
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const total = companies.length;
    const active = companies.filter(c => c.is_active && new Date(c.license_end_date) >= now).length;
    const expiringSoon = companies.filter(c => {
      const d = new Date(c.license_end_date);
      return d >= now && d <= thirtyDaysLater;
    }).length;
    const passive = companies.filter(c => !c.is_active).length;

    return { total, active, expiringSoon, passive };
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.db_host?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const renderGridRow = ({ item, index }: { item: Company, index: number }) => {
    const isLicenseExpired = new Date(item.license_end_date) < new Date();
    const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

    return (
      <View style={[styles.gridRow, { backgroundColor: rowColor }]}>
        <View style={[styles.cell, { flex: 0.6 }]}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.placeholderLogo}><Text style={styles.placeholderLogoText}>{item.name.charAt(0)}</Text></View>
          )}
        </View>

        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellTextBold} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cellTextSub} numberOfLines={1}>{item.admin_email}</Text>
        </View>

        <View style={[styles.cell, { flex: 1.5 }]}>
          <Text style={styles.cellText}>{item.db_host || 'Tanımsız'}</Text>
          <Text style={styles.cellTextSub}>{item.db_name || '-'}</Text>
        </View>

        <View style={[styles.cell, { flex: 1.2 }]}>
          <Text style={styles.cellText}>{item.city}</Text>
          <Text style={styles.cellTextSub}>{item.district}</Text>
        </View>

        <View style={[styles.cell, { flex: 1.2 }]}>
          <Text style={[styles.cellText, isLicenseExpired && { color: '#EF4444', fontWeight: 'bold' }]}>
            {item.license_end_date}
          </Text>
        </View>

        <View style={[styles.cell, { flex: 1 }]}>
          <View style={[styles.statusBadge, { backgroundColor: item.is_active ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: item.is_active ? '#047857' : '#B91C1C' }]}>
              {item.is_active ? 'Aktif' : 'Pasif'}
            </Text>
          </View>
        </View>

        <View style={[styles.cell, { flex: 1.4, flexDirection: 'row', gap: 8 }]}>
           <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: '#F0F9FF' }]} 
            onPress={() => testSqlConnection(item)}
            disabled={testingId === item.id}
          >
            {testingId === item.id ? <ActivityIndicator size="small" color="#0369A1" /> : <Text style={[styles.smallBtnText, { color: '#0369A1' }]}>⚡ Test</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.smallBtn, { backgroundColor: '#F1F5F9' }]} 
            onPress={() => router.push(`/super-admin/company/${item.id}` as any)}
          >
            <Text style={[styles.smallBtnText, { color: '#475569' }]}>Yönet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} stickyHeaderIndices={[0]}>
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>ERP Kontrol Merkezi</Text>
            <Text style={styles.subtitle}>Sistem genelindeki tüm şirketlerin canlı takibi</Text>
          </View>
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => router.push('/super-admin/add-company' as any)}
          >
            <Text style={styles.addBtnText}>+ Yeni Şirket Ekle</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Statistics Row */}
        <View style={styles.statsRow}>
          <StatCard label="Toplam Şirket" value={stats.total} color="#475569" />
          <StatCard label="Aktif Lisans" value={stats.active} color="#10B981" />
          <StatCard label="Kritik (30 Gün)" value={stats.expiringSoon} color="#F59E0B" />
          <StatCard label="Durdurulanlar" value={stats.passive} color="#EF4444" />
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.searchSection}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Şirket adı, Host adresi veya yetkili e-postası ile hızlı ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* DataGrid Area */}
        <View style={styles.gridWrapper}>
          <Text style={styles.gridTitle}>İşletme Listesi</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#0F172A" style={{ marginVertical: 100 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.table}>
                <View style={styles.tableHead}>
                  <Text style={[styles.headCell, { flex: 0.6 }]}>Logo</Text>
                  <Text style={[styles.headCell, { flex: 2 }]}>Şirket Künyesi</Text>
                  <Text style={[styles.headCell, { flex: 1.5 }]}>SQL Bağlantısı</Text>
                  <Text style={[styles.headCell, { flex: 1.2 }]}>Lokasyon</Text>
                  <Text style={[styles.headCell, { flex: 1.2 }]}>Lisans Bitiş</Text>
                  <Text style={[styles.headCell, { flex: 1 }]}>Durum</Text>
                  <Text style={[styles.headCell, { flex: 1.4, textAlign: 'center' }]}>İşlemler</Text>
                </View>
                <FlatList
                  data={filteredCompanies}
                  keyExtractor={(item) => item.id}
                  renderItem={renderGridRow}
                  scrollEnabled={false}
                  ListEmptyComponent={<Text style={styles.emptyText}>Sonuç bulunamadı.</Text>}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <View style={[styles.statCard, { borderBottomColor: color }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFFFFF', padding: 30, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 4 },
  addBtn: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700' },
  content: { padding: 30 },
  statsRow: { flexDirection: 'row', gap: 20, marginBottom: 30, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 200, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 16, borderBottomWidth: 4, elevation: 2 },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '800', marginTop: 8 },
  searchSection: { marginBottom: 30 },
  searchInput: { backgroundColor: '#FFFFFF', height: 56, borderRadius: 16, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  gridWrapper: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  gridTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  table: { minWidth: 1100 },
  tableHead: { flexDirection: 'row', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingHorizontal: 12 },
  headCell: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  cell: { justifyContent: 'center' },
  logo: { width: 40, height: 40, borderRadius: 10 },
  placeholderLogo: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  placeholderLogoText: { color: '#FFFFFF', fontWeight: '900' },
  cellTextBold: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
  cellText: { fontSize: 14, color: '#334155' },
  cellTextSub: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  smallBtnText: { fontSize: 13, fontWeight: '700' },
  emptyText: { textAlign: 'center', padding: 50, color: '#94A3B8' }
});
