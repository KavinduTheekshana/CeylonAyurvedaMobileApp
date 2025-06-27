// app/(investment)/[locationId].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import investmentService from '../services/investmentService';

interface LocationDetails {
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
  recent_investments: Array<{
    amount: number;
    investor_name: string;
    invested_at: string;
  }>;
}

const InvestmentDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Get locationId from dynamic route and locationName from query params
  const locationId = parseInt(params.locationId as string);
  const locationName = params.locationName as string;

  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentNotes, setInvestmentNotes] = useState('');
  const [investing, setInvesting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadLocationDetails();
  }, [locationId]);

  const loadLocationDetails = async () => {
    try {
      setLoading(true);
      const response = await investmentService.getLocationInvestmentDetails(locationId);
      
      if (response.success) {
        setLocationDetails(response.data);
      } else {
        Alert.alert('Error', 'Failed to load investment details');
        router.back();
      }
    } catch (error) {
      console.error('Error loading location details:', error);
      Alert.alert('Error', 'Failed to load investment details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateInvestmentAmount = () => {
    const amount = parseFloat(investmentAmount);
    
    if (!investmentAmount || isNaN(amount)) {
      Alert.alert('Invalid Amount', 'Please enter a valid investment amount');
      return false;
    }
    
    if (amount < 10) {
      Alert.alert('Minimum Investment', 'Minimum investment amount is £10');
      return false;
    }
    
    if (amount > 10000) {
      Alert.alert('Maximum Investment', 'Maximum investment amount is £10,000');
      return false;
    }
    
    if (locationDetails && amount > locationDetails.investment_stats.remaining_amount) {
      Alert.alert(
        'Amount Exceeds Limit', 
        `This amount exceeds the remaining investment limit of £${locationDetails.investment_stats.remaining_amount.toLocaleString()}`
      );
      return false;
    }
    
    return true;
  };

  const handleInvestNow = () => {
    if (!validateInvestmentAmount()) return;
    setModalVisible(true);
  };

  const confirmInvestment = async () => {
    if (!validateInvestmentAmount()) return;
    
    setInvesting(true);
    setModalVisible(false);
    
    try {
      const amount = parseFloat(investmentAmount);
      
      // Create investment
      const investmentResponse = await investmentService.createInvestment(
        locationId,
        amount,
        investmentNotes
      );
      
      if (!investmentResponse.success) {
        throw new Error(investmentResponse.message || 'Failed to create investment');
      }
      
      const { investment, payment_intent } = investmentResponse.data;
      
      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Ceylon Ayurveda Health',
        paymentIntentClientSecret: payment_intent.client_secret,
        defaultBillingDetails: {
          // Pre-fill with user data if available
        },
      });
      
      if (initError) {
        throw new Error(initError.message);
      }
      
      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();
      
      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          throw new Error(paymentError.message);
        }
        return;
      }
      
      // Confirm payment with backend
      const confirmResponse = await investmentService.confirmPayment(
        payment_intent.payment_intent_id
      );
      
      if (confirmResponse.success) {
        Alert.alert(
          'Investment Successful!',
          `Your investment of £${amount} has been processed successfully.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setInvestmentAmount('');
                setInvestmentNotes('');
                loadLocationDetails(); // Refresh the data
                router.back();
              },
            },
          ]
        );
      }
      
    } catch (error: any) {
      console.error('Investment error:', error);
      Alert.alert('Investment Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading investment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Failed to Load Details</Text>
          <Text style={styles.errorSubtitle}>Please try again later</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLocationDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {locationDetails.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location Image */}
        <View style={styles.imageContainer}>
          {locationDetails.image ? (
            <Image
              source={{ uri: locationDetails.image }}
              style={styles.locationImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="map-pin" size={48} color="#9A563A" />
            </View>
          )}
          
          {/* Investment Status Overlay */}
          <View style={styles.statusOverlay}>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: locationDetails.investment_stats.is_open_for_investment 
                  ? '#10B981' 
                  : '#EF4444' 
              }
            ]}>
              <Text style={styles.statusText}>
                {locationDetails.investment_stats.is_open_for_investment ? 'Open for Investment' : 'Investment Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View style={styles.infoSection}>
          <Text style={styles.locationName}>{locationDetails.name}</Text>
          <View style={styles.locationDetails}>
            <Feather name="map-pin" size={16} color="#6B7280" />
            <Text style={styles.locationAddress}>{locationDetails.address}</Text>
          </View>
          <Text style={styles.locationCity}>{locationDetails.city}</Text>
          
          {locationDetails.description && (
            <Text style={styles.description}>{locationDetails.description}</Text>
          )}
        </View>

        {/* Investment Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Investment Progress</Text>
          
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                £{locationDetails.investment_stats.total_invested.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Raised</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {locationDetails.investment_stats.total_investors}
              </Text>
              <Text style={styles.statLabel}>Investors</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {locationDetails.investment_stats.progress_percentage.toFixed(0)}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min(locationDetails.investment_stats.progress_percentage, 100)}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              £{locationDetails.investment_stats.remaining_amount.toLocaleString()} remaining of £{locationDetails.investment_stats.investment_limit.toLocaleString()} goal
            </Text>
          </View>
        </View>

        {/* Recent Investments */}
        {locationDetails.recent_investments.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Investments</Text>
            {locationDetails.recent_investments.map((investment, index) => (
              <View key={index} style={styles.recentItem}>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentInvestor}>{investment.investor_name}</Text>
                  <Text style={styles.recentDate}>{formatDate(investment.invested_at)}</Text>
                </View>
                <Text style={styles.recentAmount}>£{investment.amount.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Investment Form */}
        {locationDetails.investment_stats.is_open_for_investment && (
          <View style={styles.investmentSection}>
            <Text style={styles.sectionTitle}>Make an Investment</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Investment Amount (£)</Text>
              <TextInput
                style={styles.amountInput}
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                placeholder="Enter amount (£10 - £10,000)"
                keyboardType="numeric"
                editable={!investing}
              />
              <Text style={styles.inputHint}>
                Minimum: £10 • Maximum: £10,000 • Available: £{locationDetails.investment_stats.remaining_amount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                value={investmentNotes}
                onChangeText={setInvestmentNotes}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                editable={!investing}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.investButton,
                (!investmentAmount || investing) && styles.investButtonDisabled
              ]}
              onPress={handleInvestNow}
              disabled={!investmentAmount || investing}
            >
              {investing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.investButtonText}>
                  Invest £{investmentAmount || '0'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Investment</Text>
            
            <View style={styles.confirmationDetails}>
              <Text style={styles.confirmationText}>
                You are about to invest <Text style={styles.confirmationAmount}>£{investmentAmount}</Text> in <Text style={styles.confirmationLocation}>{locationDetails.name}</Text>
              </Text>
              
              {investmentNotes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{investmentNotes}</Text>
                </View>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmInvestment}
              >
                <Text style={styles.confirmButtonText}>Confirm & Pay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#9A563A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
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
  statusOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  locationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
    flex: 1,
  },
  locationCity: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9A563A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBarContainer: {
    marginBottom: 16,
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
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  recentSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentInfo: {
    flex: 1,
  },
  recentInvestor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  recentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9A563A',
  },
  investmentSection: {
    backgroundColor: '#fff',
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  investButton: {
    backgroundColor: '#9A563A',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  investButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  investButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  confirmationDetails: {
    marginBottom: 24,
  },
  confirmationText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    textAlign: 'center',
  },
  confirmationAmount: {
    fontWeight: 'bold',
    color: '#9A563A',
  },
  confirmationLocation: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  notesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#9A563A',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default InvestmentDetailsScreen;