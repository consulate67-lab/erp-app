import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity,
  ScrollView,
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
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    // Yeni eklenen db_host vb. veya admin bilgilerini de çekebiliriz
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

  const renderGridRow = ({ item, index }: { item: Company, index: number }) => {
    const isLicenseExpired = new Date(item.license_end_date) < new Date();
    const rowColor = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'; // Zebra striping

    return (
      <View style={[styles.gridRow, { backgroundColor: rowColor }]}>
        {/* Logo */}
        <View style={[styles.cell, { flex: 0.8 }]}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.placeholderLogo}><Text style={styles.placeholderLogoText}>{item.name.charAt(0)}</Text></View>
          )}
        </View>

        {/* Firma Adı */}
        <View style={[styles.cell, { flex: 2 }]}>
          <Text style={styles.cellTextBold}>{item.name}</Text>
          <Text style={styles.cellTextSub}>{item.admin_email}</Text>
        </View>

        {/* Konum */}
        <View style={[styles.cell, { flex: 1.5 }]}>
          <Text style={styles.cellText}>{item.city}</Text>
          <Text style={styles.cellTextSub}>{item.district}</Text>
        </View>

        {/* Vergi No */}
        <View style={[styles.cell, { flex: 1.2 }]}>
          <Text style={styles.cellText}>{item.tax_number || '-'}</Text>
        </View>

        {/* Lisans Durumu */}
        <View style={[styles.cell, { flex: 1.5 }]}>
          <View style={[styles.statusBadge, isLicenseExpired ? styles.badgeExpired : styles.badgeActive]}>
            <Text style={styles.statusText}>
              {isLicenseExpired ? "SKT: " + item.license_end_date : "Aktif (" + item.license_end_date + ")"}
            </Text>
          </View>
        </View>

        {/* İşlemler */}
        <View style={[styles.cell, { flex: 1, alignItems: 'center' }]}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Yönet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.pageTitle}>Firmalar Listesi</Text>
          <Text style={styles.pageDesc}>Veritabanındaki tüm platform üyelerini yönetin.</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/super-admin/add-company')}
        >
          <Text style={styles.addButtonText}>+ Yeni Firma Kur</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.scrollWrapper}>
          <View style={styles.gridContainer}>
            {/* Grid Header */}
            <View style={styles.gridHeader}>
              <Text style={[styles.headerCell, { flex: 0.8 }]}>Logo</Text>
              <Text style={[styles.headerCell, { flex: 2 }]}>Firma Adı & Yönetici</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Lokasyon</Text>
              <Text style={[styles.headerCell, { flex: 1.2 }]}>Vergi No</Text>
              <Text style={[styles.headerCell, { flex: 1.5 }]}>Lisans Durumu</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>İşlemler</Text>
            </View>

            {/* Grid Body */}
            {companies.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Hiç firma bulunamadı.</Text>
              </View>
            ) : (
              <FlatList
                data={companies}
                keyExtractor={(item) => item.id}
                renderItem={renderGridRow}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Çok açık modern gri
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 16
  },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  pageDesc: { fontSize: 15, color: '#64748B', marginTop: 4 },
  addButton: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  scrollWrapper: { padding: 30 },
  gridContainer: {
    minWidth: 1000, // Mobil cihazlarda sağa kaydırılabilmesi için sabit min genişlik
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
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
  placeholderLogoText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase' },
  cellTextBold: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 2 },
  cellText: { fontSize: 15, color: '#334155' },
  cellTextSub: { fontSize: 13, color: '#94A3B8' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeActive: { backgroundColor: '#D1FAE5' },
  badgeExpired: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  actionBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  actionBtnText: { color: '#4F46E5', fontSize: 14, fontWeight: '700' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { padding: 50, alignItems: 'center' },
  emptyStateText: { fontSize: 16, color: '#94A3B8' }
});
