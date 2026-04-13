import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

interface Company {
  id: string;
  name: string;
  city: string;
  district: string;
  logo_url: string;
  license_end_date: string;
}

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, city, district, logo_url, license_end_date')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Firma çekme hatası: ", error);
    } else if (data) {
      setCompanies(data);
    }
    setLoading(false);
  };

  const renderCompanyCard = ({ item }: { item: Company }) => {
    const isLicenseExpired = new Date(item.license_end_date) < new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.placeholderLogo}>
              <Text style={styles.placeholderLogoText}>{item.name.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{item.name}</Text>
            <Text style={styles.companyLocation}>{item.city}, {item.district}</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, isLicenseExpired ? styles.badgeExpired : styles.badgeActive]}>
            <Text style={styles.statusText}>
              {isLicenseExpired ? "Lisans Süresi Bitti" : "Aktif Lisans"}
            </Text>
          </View>
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
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageDesc}>Sisteme kayıtlı tüm ERP firmalarını yönetin.</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/super-admin/add-company')}
        >
          <Text style={styles.addButtonText}>+ Yeni Firma</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : companies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Henüz hiç firma eklenmemiş.</Text>
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.id}
          renderItem={renderCompanyCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 16
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  pageDesc: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  listContainer: {
    padding: 24,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  placeholderLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLogoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  companyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  companyLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeActive: {
    backgroundColor: '#D1FAE5', // Açık yeşil
  },
  badgeExpired: {
    backgroundColor: '#FEE2E2', // Açık kırmızı
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857', // Yeşilin koyusu, (Kırmızı için conditional styling eklenebilir)
  },
  actionBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  }
});
