// app/(investment)/index.tsx - Updated without View More button
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

interface Therapist {
  id: number;
  name: string;
  email: string;
  phone: string;
  image: string | null;
  bio: string;
  work_start_date: string;
  status: boolean;
}

interface LocationInvestment {
  id: number;
  name: string;
  city: string;
  address: string;
  image: string | null;
  description: string | null;
  owner_name: string | null;
  owner_email: string | null;
  manager_name: string | null;
  manager_email: string | null;
  branch_phone: string | null;
  total_invested: number;
  investment_limit: number;
  total_investors: number;
  is_open_for_investment: boolean;
  remaining_amount: number;
  progress_percentage: number;
  therapists: Therapist[];
}

const InvestmentScreen = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationInvestment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    checkUserStatusAndLoadData();
  }, []);

  const checkUserStatusAndLoadData = async () => {
    try {
      const userMode = await AsyncStorage.getItem('user_mode');
      const guestMode = userMode === 'guest';
      setIsGuest(guestMode);

      // Load investment opportunities for everyone
      await loadInvestmentLocations();
    } catch (error) {
      console.error('Error loading investment data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInvestmentLocations = async () => {
    try {
      console.log('Fetching investment locations from:', `${API_BASE_URL}/api/investments/opportunities`);

      const response = await fetch(`${API_BASE_URL}/api/investments/opportunities`);
      
      // Check if response is ok first
      if (!response.ok) {
        console.error('Investment locations response not ok:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', contentType);
        const responseText = await response.text();
        console.error('Response text:', responseText.substring(0, 200) + '...');
        throw new Error('Server returned non-JSON response');
      }
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const processedLocations = data.data.map((location: any) => ({
          id: location.id,
          name: location.name,
          city: location.city,
          address: location.address,
          image: location.image ?
            (location.image.startsWith('http') ? location.image : `${API_BASE_URL}/storage/${location.image}`)
            : null,
          description: location.description,
          owner_name: location.owner_name,
          owner_email: location.owner_email,
          manager_name: location.manager_name,
          manager_email: location.manager_email,
          branch_phone: location.branch_phone,
          total_invested: parseFloat(location.total_invested || 0),
          investment_limit: parseFloat(location.investment_limit || 10000),
          total_investors: parseInt(location.total_investors || 0),
          is_open_for_investment: location.is_open_for_investment !== false,
          remaining_amount: parseFloat(location.remaining_amount || location.investment_limit || 10000),
          progress_percentage: parseFloat(location.progress_percentage || 0),
          therapists: location.therapists?.map((therapist: any) => ({
            id: therapist.id,
            name: therapist.name,
            email: therapist.email,
            phone: therapist.phone,
            image: therapist.image ? 
              (therapist.image.startsWith('http') ? therapist.image : `${API_BASE_URL}/storage/${therapist.image}`)
              : null,
            bio: therapist.bio,
            work_start_date: therapist.work_start_date,
            status: therapist.status,
          })) || [],
        }));

        setLocations(processedLocations);
        console.log('Processed investment locations:', processedLocations.length);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error loading investment locations:', error);
      Alert.alert('Error', 'Failed to load investment opportunities');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkUserStatusAndLoadData();
  };

  const handleInvestmentPress = (location: LocationInvestment) => {
    if (isGuest) {
      Alert.alert(
        'Login Required',
        'Please login to start investing',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/(auth)/LoginScreen') }
        ]
      );
      return;
    }

    console.log('Navigating to investment details for location:', location.id, location.name);
    // Navigate to investment details screen
    router.push({
      pathname: `/(investment)/[locationId]`,
      params: {
        locationId: location.id.toString(),
        locationName: location.name
      }
    });
  };

  const renderLocationCard = ({ item }: { item: LocationInvestment }) => {
    return (
      <TouchableOpacity
        style={styles.locationCard}
        onPress={() => handleInvestmentPress(item)}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_open_for_investment ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>
            {item.is_open_for_investment ? 'Open' : 'Closed'}
          </Text>
        </View>

        {/* Location Image */}
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.locationImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="map-pin" size={40} color="#9A563A" />
            </View>
          )}
        </View>

        {/* Location Info */}
        <View style={styles.cardContent}>
          <Text style={styles.locationName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.locationDetails}>
            <Feather name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.locationCity}>{item.city}</Text>
          </View>

          {/* Investment Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Investment Progress</Text>
              <Text style={styles.progressPercentage}>
                {item.progress_percentage.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(item.progress_percentage, 100)}%` }
                ]}
              />
            </View>

            <View style={styles.investmentStats}>
              <Text style={styles.investmentText}>
                £{item.total_invested.toLocaleString()} raised
              </Text>
              <Text style={styles.investmentText}>
                {item.total_investors} investors
              </Text>
            </View>

            <Text style={styles.remainingText}>
              £{item.remaining_amount.toLocaleString()} remaining of £{item.investment_limit.toLocaleString()}
            </Text>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Therapists count */}
          {item.therapists.length > 0 && (
            <View style={styles.therapistCount}>
              <MaterialIcons name="people" size={16} color="#6B7280" />
              <Text style={styles.therapistCountText}>
                {item.therapists.length} therapist{item.therapists.length !== 1 ? 's' : ''} available
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading investment opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investments</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9A563A']}
            tintColor="#9A563A"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Guest Notice */}
        {isGuest && (
          <View style={styles.guestNotice}>
            <MaterialIcons name="info-outline" size={24} color="#9A563A" />
            <View style={styles.guestNoticeContent}>
              <Text style={styles.guestNoticeTitle}>Investment Opportunities</Text>
              <Text style={styles.guestNoticeText}>
                Login to start investing in local wellness centers and earn returns
              </Text>
            </View>
          </View>
        )}

        {/* Investment Opportunities */}
        <View style={styles.opportunitiesSection}>
          <Text style={styles.sectionTitle}>Investment Opportunities</Text>

          {locations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="trending-up" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Opportunities Available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for new investment opportunities
              </Text>
            </View>
          ) : (
            <FlatList
              data={locations}
              renderItem={renderLocationCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  guestNotice: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  guestNoticeContent: {
    marginLeft: 12,
    flex: 1,
  },
  guestNoticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  guestNoticeText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  opportunitiesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  separator: {
    height: 16,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    height: 160,
  },
  locationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: 16,
  },
  locationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationCity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A563A',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9A563A',
    borderRadius: 4,
  },
  investmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  investmentText: {
    fontSize: 12,
    color: '#6B7280',
  },
  remainingText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  therapistCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  therapistCountText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InvestmentScreen;