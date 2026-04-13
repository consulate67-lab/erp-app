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
  Platform
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
}

export default function SuperAdminDataGrid() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, city, district, logo_url, tax_number, admin_email, license_end_date')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Firma çekme hatası: ", error);
    } else if (data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  // Raporlama İstatistikleri
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(now.getDate() + 30);

    const total = companies.length;
    const active = companies.filter(c => new Date(c.license_end_date) >= now).length;
    const expiringSoon = companies.filter(c => {
      const d = new Date(c.license_end_date);
      return d >= now && d <= thirtyDaysLater;
    }).length;
    const expired = total - active;

    return { total, active, expiringSoon, expired };
  }, [companies]);

  // Arama Filtresi
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const renderGridRow = ({ item, index }: { item: Company, index: number }) => {
    const isLicenseExpired = new Date(item.license_end_date) < new Date();
    const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

    return (
      <View style={[styles.gridRow, { backgroundColor: rowColor }]}>
        <View style={[styles.cell, { flex: 0.8 }]}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.placeholderLogo}><Text style={styles.placeholderLogoText}>{item.name.charAt(0)}</Text></View>
          )}
        </View>
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellTextBold}>{item.name}</Text>
          <Text style={styles.cellTextSub}>{item.admin_email}</Text>
        </View>
        <View style={[styles.cell, { flex: 1.5 }]}>
          <Text style={styles.cellText}>{item.city}</Text>
          <Text style={styles.cellTextSub}>{item.district}</Text>
        </View>
        <View style={[styles.cell, { flex: 1.2 }]}>
          <Text style={styles.cellText}>{item.tax_number || '-'}</Text>
        </View>
        <View style={[styles.cell, { flex: 1.5 }]}>
          <View style={[styles.statusBadge, isLicenseExpired ? styles.badgeExpired : styles.badgeActive]}>
            <Text style={[styles.statusText, isLicenseExpired && { color: '#B91C1C' }]}>
              {isLicenseExpired ? "Süresi Doldu" : item.license_end_date}
            </Text>
          </View>
        </View>
        <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push(`/super-admin/company/${item.id}` as any)}
          >
            <Text style={styles.actionBtnText}>Yönet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageTitle}>Panel Yönetimi</Text>
          <Text style={styles.pageDesc}>Firma arama, takip ve raporlama merkezi.</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="🔍 Firma adı, e-posta veya şehir ile ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/super-admin/add-company' as any)}
        >
          <Text style={styles.addButtonText}>+ Yeni Firma Kur</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.mainLayout}>
          
          {/* Sol Taraf: DataGrid */}
          <View style={styles.dataGridWrapper}>
            <Text style={styles.sectionTitle}>Tüm Kayıtlı Firmalar ({filteredCompanies.length})</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#0F172A" style={{ marginTop: 50 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.gridTable}>
                  <View style={styles.gridHeader}>
                    <Text style={[styles.headerCell, { flex: 0.8 }]}>Logo</Text>
                    <Text style={[styles.headerCell, { flex: 2 }]}>Firma & Yetkili</Text>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>Lokasyon</Text>
                    <Text style={[styles.headerCell, { flex: 1.2 }]}>Vergi No</Text>
                    <Text style={[styles.headerCell, { flex: 1.5 }]}>Lisans</Text>
                    <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>İşlem</Text>
                  </View>
                  <FlatList
                    data={filteredCompanies}
                    keyExtractor={(item) => item.id}
                    renderItem={renderGridRow}
                    scrollEnabled={false} // Container ScrollView kullandığı için
                    ListEmptyComponent={
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Aradığınız kriterde firma bulunamadı.</Text>
                      </View>
                    }
                  />
                </View>
              </ScrollView>
            )}
          </View>

          {/* Sağ Taraf: Raporlar ve Widgets */}
          <View style={styles.sidebar}>
            <Text style={styles.sectionTitle}>Canlı Raporlar</Text>
            
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Toplam Firma</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
              <Text style={styles.statLabel}>Aktif Lisanslar</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.active}</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
              <Text style={styles.statLabel}>Yaklaşan Bitişler (30 Gün)</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.expiringSoon}</Text>
              <Text style={styles.statSubText}>Kritik Takip Gerekli</Text>
            </View>

            <View style={[styles.statCard, { borderLeftColor: '#EF4444' }]}>
              <Text style={styles.statLabel}>Süresi Dolanlar</Text>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.expired}</Text>
            </View>

            <View style={styles.promoCard}>
              <Text style={styles.promoTitle}>Hızlı İpucu</Text>
              <Text style={styles.promoText}>Lisans süresi bitmek üzere olan firmaları 'Yönet' butonundan tek tıkla güncelleyebilirsiniz.</Text>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 20
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  pageDesc: { fontSize: 15, color: '#64748B', marginTop: 4 },
  searchContainer: { flex: 2, minWidth: 300 },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 30 },
  mainLayout: { flexDirection: 'row', gap: 30, flexWrap: 'wrap' },
  dataGridWrapper: { flex: 3, minWidth: 600 },
  sidebar: { flex: 1, minWidth: 300 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 20 },
  gridTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 1000
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cell: { justifyContent: 'center' },
  logo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F1F5F9' },
  placeholderLogo: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  placeholderLogoText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  cellTextBold: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  cellText: { fontSize: 15, color: '#334155' },
  cellTextSub: { fontSize: 13, color: '#94A3B8' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: '#D1FAE5' },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeExpired: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  actionBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 6,
    borderLeftColor: '#3B82F6',
    marginBottom: 20,
  },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', textTransform: 'uppercase' },
  statValue: { fontSize: 32, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  statSubText: { fontSize: 12, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
  promoCard: {
    backgroundColor: '#0F172A',
    padding: 24,
    borderRadius: 16,
  },
  promoTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  promoText: { color: '#94A3B8', fontSize: 14, lineHeight: 20 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { color: '#94A3B8' }
});
