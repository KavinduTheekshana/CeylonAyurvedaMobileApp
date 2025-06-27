// app/(investment)/index.tsx - FIXED VERSION
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// FIXED: Correct import path from (investment) directory
import investmentService from '../services/investmentService';
import { API_BASE_URL } from '@/config/api';

interface InvestmentOpportunity {
  id: number;
  name: string;
  city: string;
  address: string;
  image: string | null;
  description: string | null;
  investment_stats: {
    total_invested: number;
    investment_limit: number;
    remaining_amount: number;
    progress_percentage: number;
    total_investors: number;
    is_open_for_investment: boolean;
  };
}

interface UserInvestmentSummary {
  total_invested: number;
  total_investments: number;
  pending_investments: number;
  investments_by_location: Array<{
    location: {
      id: number;
      name: string;
      city: string;
    };
    total_amount: number;
    investment_count: number;
  }>;
}

const InvestmentScreen = () => {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [userSummary, setUserSummary] = useState<UserInvestmentSummary | null>(null);
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

      if (!guestMode) {
        await loadInvestmentData();
      } else {
        await loadOpportunities();
      }
    } catch (error) {
      console.error('Error loading investment data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadInvestmentData = async () => {
    try {
      const [summaryResponse, opportunitiesResponse] = await Promise.all([
        investmentService.getUserInvestmentSummary(),
        investmentService.getInvestmentOpportunities(),
      ]);

      if (summaryResponse.success) {
        setUserSummary(summaryResponse.data);
      }

      if (opportunitiesResponse.success) {
        // FIXED: Process image URLs properly
        const processedOpportunities = opportunitiesResponse.data.map((opportunity: InvestmentOpportunity) => ({
          ...opportunity,
          image: opportunity.image 
            ? (opportunity.image.startsWith('http') ? opportunity.image : `${API_BASE_URL}/storage/${opportunity.image}`)
            : null
        }));
        setOpportunities(processedOpportunities);
        console.log('Processed opportunities:', processedOpportunities); // Debug log
      }
    } catch (error) {
      console.error('Error loading investment data:', error);
      Alert.alert('Error', 'Failed to load investment data');
    }
  };

  const loadOpportunities = async () => {
    try {
      const response = await investmentService.getInvestmentOpportunities();
      if (response.success) {
        // FIXED: Process image URLs for guest users too
        const processedOpportunities = response.data.map((opportunity: InvestmentOpportunity) => ({
          ...opportunity,
          image: opportunity.image 
            ? (opportunity.image.startsWith('http') ? opportunity.image : `${API_BASE_URL}/storage/${opportunity.image}`)
            : null
        }));
        setOpportunities(processedOpportunities);
        console.log('Guest opportunities:', processedOpportunities); // Debug log
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    checkUserStatusAndLoadData();
  };

  const handleInvestmentPress = (opportunity: InvestmentOpportunity) => {
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

    // Navigate using the new structure
    router.push(`/(investment)/${opportunity.id}?locationName=${encodeURIComponent(opportunity.name)}`);
  };

  const renderOpportunityCard = (opportunity: InvestmentOpportunity) => {
    const { investment_stats } = opportunity;
    
    // FIXED: Debug image URL
    console.log('Rendering opportunity:', opportunity.name, 'Image URL:', opportunity.image);
    
    return (
      <TouchableOpacity
        key={opportunity.id}
        style={styles.opportunityCard}
        onPress={() => handleInvestmentPress(opportunity)}
      >
        {/* Location Image */}
        <View style={styles.imageContainer}>
          {opportunity.image ? (
            <Image
              source={{ uri: opportunity.image }}
              style={styles.locationImage}
              resizeMode="cover"
              onError={(error) => {
                console.log('Image load error for:', opportunity.name, error.nativeEvent.error);
              }}
              onLoad={() => {
                console.log('Image loaded successfully for:', opportunity.name);
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="map-pin" size={40} color="#9A563A" />
            </View>
          )}
          
          {/* Investment Status Badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: investment_stats.is_open_for_investment ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {investment_stats.is_open_for_investment ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.cardContent}>
          <Text style={styles.locationName} numberOfLines={1}>
            {opportunity.name}
          </Text>
          <View style={styles.locationDetails}>
            <Feather name="map-pin" size={14} color="#6B7280" />
            <Text style={styles.locationCity}>{opportunity.city}</Text>
          </View>

          {/* Investment Progress */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Investment Progress</Text>
              <Text style={styles.progressPercentage}>
                {investment_stats.progress_percentage.toFixed(0)}%
              </Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(investment_stats.progress_percentage, 100)}%` }
                ]} 
              />
            </View>
            
            <View style={styles.investmentStats}>
              <Text style={styles.investmentText}>
                £{investment_stats.total_invested.toLocaleString()} raised
              </Text>
              <Text style={styles.investmentText}>
                {investment_stats.total_investors} investors
              </Text>
            </View>
            
            <Text style={styles.remainingText}>
              £{investment_stats.remaining_amount.toLocaleString()} remaining
            </Text>
          </View>

          {/* Description */}
          {opportunity.description && (
            <Text style={styles.description} numberOfLines={2}>
              {opportunity.description}
            </Text>
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
        {/* User Investment Summary - Only for logged in users */}
        {!isGuest && userSummary && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Your Portfolio</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    £{userSummary.total_invested.toFixed(2)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Invested</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {userSummary.total_investments}
                  </Text>
                  <Text style={styles.summaryLabel}>Investments</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {userSummary.pending_investments}
                  </Text>
                  <Text style={styles.summaryLabel}>Pending</Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
          <Text style={styles.sectionTitle}>
            {isGuest ? 'Investment Opportunities' : 'Available Opportunities'}
          </Text>
          
          {opportunities.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="trending-up" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No Opportunities Available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for new investment opportunities
              </Text>
            </View>
          ) : (
            <View style={styles.opportunitiesList}>
              {opportunities.map(renderOpportunityCard)}
            </View>
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
    backgroundColor: '#fff',
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
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9A563A',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
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
  opportunitiesList: {
    gap: 16,
  },
  opportunityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    boxShadow: '0 2px 2px rgba(0, 0, 0, 0.01)',
  },
  imageContainer: {
    position: 'relative',
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
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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