// app/(investment)/[locationId].tsx - Updated with navigation to new screen for "View All"
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

interface LocationDetails {
  id: number;
  name: string;
  city: string;
  address: string;
  postcode: string;
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
    id: number;
    amount: number;
    investor_name: string;
    invested_at: string;
    status: string;
    reference: string;
    payment_method?: string;
  }>;
}

// Payment Method Types
type PaymentMethod = 'card' | 'bank_transfer';

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

  // New states for payment method selection
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  useEffect(() => {
    loadLocationDetails();
  }, [locationId]);

  // Function to mask investor names
  const maskInvestorName = (name: string) => {
    if (!name || name.length <= 3) return name;
    const firstThree = name.substring(0, 3);
    const asterisks = '*'.repeat(name.length - 3);
    return firstThree + asterisks;
  };

  const loadLocationDetails = async () => {
    try {
      setLoading(true);
      console.log(`Fetching location details for ID: ${locationId}`);

      // Get auth token
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Error', 'You must be logged in to view investment details');
        router.back();
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Try the investment API endpoint first
      let response = await fetch(`${API_BASE_URL}/api/investments/locations/${locationId}`, {
        method: 'GET',
        headers,
      });

      let data = await response.json();

      // If that doesn't work, try the alternative endpoint
      if (!response.ok || !data.success) {
        console.log('Primary endpoint failed, trying alternative...');
        response = await fetch(`${API_BASE_URL}/api/locations/${locationId}/investments`, {
          method: 'GET',
          headers,
        });
        data = await response.json();
        console.log('Alternative endpoint response:', data);
      }

      // If still no success, try a basic location endpoint and construct the data
      if (!response.ok || !data.success) {
        console.log('Investment endpoints failed, trying basic location endpoint...');
        response = await fetch(`${API_BASE_URL}/api/locations/${locationId}`, {
          method: 'GET',
          headers,
        });
        data = await response.json();
console.log('Basic location endpoint response:', data);
        if (response.ok && data.success) {
          // Construct investment data from basic location data
          const location = data.data;
          console.log('Constructing investment data from basic location endpoint', location);
          const constructedDetails: LocationDetails = {
            id: location.id,
            name: location.name,
            city: location.city,
            address: location.address,
            postcode: location.postcode || '',
            image: location.image ?
              (location.image.startsWith('http') ? location.image : `${API_BASE_URL}/storage/${location.image}`)
              : null,
            description: location.description,
            investment_stats: {
              total_invested: 0,
              investment_limit: 10000,
              remaining_amount: 10000,
              progress_percentage: 0,
              total_investors: 0,
              is_open_for_investment: true,
            },
            recent_investments: [],
          };
          setLocationDetails(constructedDetails);
        } else {
          throw new Error('Failed to load location details from any endpoint');
        }
      } else {
        // Process the successful investment data
        if (data.data) {
          const processedDetails: LocationDetails = {
            id: data.data.id,
            name: data.data.name,
            city: data.data.city,
            address: data.data.address,
            postcode: data.data.postcode || '',
            image: data.data.image ?
              (data.data.image.startsWith('http') ? data.data.image : `${API_BASE_URL}/storage/${data.data.image}`)
              : null,
            description: data.data.description,
            investment_stats: {
              total_invested: parseFloat(data.data.investment_stats?.total_invested || '0'),
              investment_limit: parseFloat(data.data.investment_stats?.investment_limit || '10000'),
              remaining_amount: parseFloat(data.data.investment_stats?.remaining_amount || '10000'),
              progress_percentage: parseFloat(data.data.investment_stats?.progress_percentage || '0'),
              total_investors: parseInt(data.data.investment_stats?.total_investors || '0'),
              is_open_for_investment: data.data.investment_stats?.is_open_for_investment !== false,
            },
            recent_investments: data.data.recent_investments || [],
          };
          setLocationDetails(processedDetails);
        } else {
          throw new Error('Invalid data structure received from API');
        }
      }
    } catch (error) {
      console.error('Error loading location details:', error);
      Alert.alert('Error', 'Failed to load investment details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Updated function to navigate to new screen instead of showing modal
  const handleViewAllInvestors = () => {
    console.log('Navigating to all investors screen for location:', locationId);

    // Navigate to all investors screen
    router.push({
      pathname: '/(investment)/investors',
      params: {
        locationId: locationId.toString(),
        locationName: locationDetails?.name || 'Location'
      }
    });
  };

  // Function to handle "View More Details" button - Updated to use the opportunities API
  const handleViewMoreDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Error', 'You must be logged in to view detailed information');
        return;
      }

      console.log('Navigating to detailed view for location:', locationId);

      // Navigate to details screen with just the locationId
      // The details screen will call the opportunities API
      router.push({
        pathname: '/(investment)/details',
        params: {
          locationId: locationId.toString()
        }
      });

    } catch (error) {
      console.error('Error navigating to detailed information:', error);
      Alert.alert('Error', 'Failed to navigate to detailed information');
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

  // Function to handle bank transfer investment
  const handleBankTransferInvestment = async () => {
    if (!validateInvestmentAmount()) return;

    setInvesting(true);
    setModalVisible(false);

    try {
      const amount = parseFloat(investmentAmount);
      const token = await AsyncStorage.getItem('access_token');
      console.log(token, 'token in bank transfer investment');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the createInvestment endpoint instead of the generic investments endpoint
      const investmentResponse = await fetch(`${API_BASE_URL}/api/investments/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          location_id: locationId,
          amount: amount,
          notes: investmentNotes,
          payment_method: 'bank_transfer', // Explicitly set payment method
        }),
      });

      const investmentData = await investmentResponse.json();

      if (investmentData.success) {
        Alert.alert(
          'Investment Request Submitted!',
          `Your investment request for £${amount} has been submitted successfully. Our admin team will contact you within 24 hours with bank transfer details.\n\nReference: ${investmentData.data.investment?.reference || 'N/A'}\n\nOnce the transfer is completed, your investment will be confirmed.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setInvestmentAmount('');
                setInvestmentNotes('');
                setPaymentMethod('card'); // Reset to default
                loadLocationDetails(); // Refresh the data
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error(investmentData.message || 'Failed to submit investment request');
      }

    } catch (error: any) {
      console.error('Bank transfer investment error:', error);
      Alert.alert('Investment Failed', error.message || 'Something went wrong. Please try again.');
    } finally {
      setInvesting(false);
    }
  };

  // Updated confirm investment function to handle both payment methods
  const confirmInvestment = async () => {
    if (paymentMethod === 'bank_transfer') {
      await handleBankTransferInvestment();
      return;
    }

    // Original card payment logic
    if (!validateInvestmentAmount()) return;

    setInvesting(true);
    setModalVisible(false);

    try {
      const amount = parseFloat(investmentAmount);
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        throw new Error('Authentication required');
      }

      // Use the createInvestment endpoint for card payments too
      const investmentResponse = await fetch(`${API_BASE_URL}/api/investments/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          location_id: locationId,
          amount: amount,
          notes: investmentNotes,
          payment_method: 'card', // Explicitly set payment method
        }),
      });

      const investmentData = await investmentResponse.json();

      if (!investmentData.success) {
        throw new Error(investmentData.message || 'Failed to create investment');
      }

      const { investment, payment_intent } = investmentData.data;

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
      const confirmResponse = await fetch(`${API_BASE_URL}/api/investments/confirm-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: payment_intent.payment_intent_id,
        }),
      });

      const confirmData = await confirmResponse.json();

      if (confirmData.success) {
        Alert.alert(
          'Investment Successful!',
          `Your investment of £${amount} has been processed successfully.\n\nReference: ${investment?.reference || 'N/A'}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setInvestmentAmount('');
                setInvestmentNotes('');
                setPaymentMethod('card'); // Reset to default
                loadLocationDetails(); // Refresh the data
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error(confirmData.message || 'Failed to confirm payment');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get payment method icon and text
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return {
          icon: 'account-balance',
          text: 'Bank Transfer',
          color: '#9A563A'
        };
      case 'card':
      default:
        return {
          icon: 'credit-card',
          text: 'Card Payment',
          color: '#9A563A'
        };
    }
  };

  // Payment Method Selection Component
  const PaymentMethodSelector = () => (
    <View className="mb-5">
      <Text className="text-sm font-medium text-gray-700 mb-3">Payment Method</Text>

      {/* Card Payment Option */}
      <TouchableOpacity
        className={`flex-row items-center p-4 mb-3 border-2 rounded-lg ${paymentMethod === 'card' ? 'border-[#9A563A] bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        onPress={() => setPaymentMethod('card')}
      >
        <View className={`w-5 h-5 rounded-full border-2 mr-3 ${paymentMethod === 'card' ? 'border-[#9A563A] bg-[#9A563A]' : 'border-gray-400'
          }`}>
          {paymentMethod === 'card' && (
            <View className="w-full h-full flex items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <MaterialIcons name="credit-card" size={20} color="#9A563A" />
            <Text className="text-base font-semibold text-gray-800 ml-2">Card Payment</Text>
          </View>
          <Text className="text-sm text-gray-500">Pay instantly with credit/debit card</Text>
        </View>
      </TouchableOpacity>

      {/* Bank Transfer Option */}
      <TouchableOpacity
        className={`flex-row items-center p-4 border-2 rounded-lg ${paymentMethod === 'bank_transfer' ? 'border-[#9A563A] bg-orange-50' : 'border-gray-200 bg-white'
          }`}
        onPress={() => setPaymentMethod('bank_transfer')}
      >
        <View className={`w-5 h-5 rounded-full border-2 mr-3 ${paymentMethod === 'bank_transfer' ? 'border-[#9A563A] bg-[#9A563A]' : 'border-gray-400'
          }`}>
          {paymentMethod === 'bank_transfer' && (
            <View className="w-full h-full flex items-center justify-center">
              <View className="w-2 h-2 bg-white rounded-full" />
            </View>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-1">
            <MaterialIcons name="account-balance" size={20} color="#9A563A" />
            <Text className="text-base font-semibold text-gray-800 ml-2">Bank Transfer</Text>
          </View>
          <Text className="text-sm text-gray-500">Our team will contact you with transfer details</Text>
        </View>
      </TouchableOpacity>

      {/* Bank Transfer Notice */}
      {paymentMethod === 'bank_transfer' && (
        <View className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <View className="flex-row items-start">
            <MaterialIcons name="info" size={16} color="#9A563A" />
            <View className="flex-1 ml-2">
              <Text className="text-sm text-[#9A563A] font-medium mb-1">Bank Transfer Process:</Text>
              <Text className="text-xs text-[#9A563A]">
                1. Submit your investment request{'\n'}
                2. Our team will contact you within 24 hours{'\n'}
                3. Complete bank transfer using provided details{'\n'}
                4. Investment confirmed after transfer verification
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-8">
          <ActivityIndicator size="large" color="#9A563A" />
          <Text className="mt-4 text-base text-gray-500">Loading investment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!locationDetails) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-8">
          <MaterialIcons name="error-outline" size={64} color="#DC2626" />
          <Text className="text-xl font-bold text-red-600 mt-4 mb-2">Failed to Load Details</Text>
          <Text className="text-base text-gray-500 text-center mb-6">Please try again later</Text>
          <TouchableOpacity
            className="bg-[#9A563A] px-6 py-3 rounded-lg"
            onPress={loadLocationDetails}
          >
            <Text className="text-white text-base font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1 text-center mx-4" numberOfLines={1}>
          {locationDetails.name}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Location Image */}
        <View className="relative h-48">
          {locationDetails.image ? (
            <Image
              source={{ uri: locationDetails.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-200 justify-center items-center">
              <Feather name="map-pin" size={48} color="#9A563A" />
            </View>
          )}

          {/* Investment Status Overlay */}
          <View className="absolute top-4 right-4">
            <View className={`px-3 py-1.5 rounded-lg ${locationDetails.investment_stats.is_open_for_investment ? 'bg-green-500' : 'bg-red-500'}`}>
              <Text className="text-white text-xs font-semibold">
                {locationDetails.investment_stats.is_open_for_investment ? 'Open for Investment' : 'Investment Closed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Info */}
        <View className="bg-white p-5 border-b border-gray-200">
          {/* View More Details Button - Compact and Centered */}
          <View className="flex-row justify-center mb-4 self-start">
            <TouchableOpacity
              className="border border-[#9A563A] rounded-lg px-4 py-2 flex-row items-center bg-white "
              onPress={handleViewMoreDetails}
            >
              <MaterialIcons name="info" size={16} color="#9A563A" />
              <Text className="text-[#9A563A] text-sm font-medium ml-2">View More Details</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-800 mb-2">{locationDetails.name}</Text>

          <View className="flex-row items-center mb-1">
            <Feather name="map-pin" size={16} color="#6B7280" />
            <Text className="text-sm text-gray-500 ml-1.5 flex-1">{locationDetails.address}</Text>
          </View>
          <Text className="text-base text-gray-500 mb-3">{locationDetails.city} {locationDetails.postcode}</Text>

          {locationDetails.description && (
            <Text className="text-sm text-gray-600 leading-5">{locationDetails.description}</Text>
          )}
        </View>

        {/* Investment Progress */}
        <View className="bg-white p-5 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-4">Investment Progress</Text>

          <View className="flex-row justify-around mb-5">
            <View className="items-center">
              <Text className="text-xl font-bold text-[#9A563A] mb-1">
                £{locationDetails.investment_stats.total_invested.toLocaleString()}
              </Text>
              <Text className="text-xs text-gray-500">Raised</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-[#9A563A] mb-1">
                {locationDetails.investment_stats.total_investors}
              </Text>
              <Text className="text-xs text-gray-500">Investors</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-[#9A563A] mb-1">
                {locationDetails.investment_stats.progress_percentage.toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-500">Complete</Text>
            </View>
          </View>

          <View className="mb-4">
            <View className="h-2 bg-gray-200 rounded-full mb-2">
              <View
                className="h-full bg-[#9A563A] rounded-full"
                style={{ width: `${Math.min(locationDetails.investment_stats.progress_percentage, 100)}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 text-center">
              £{locationDetails.investment_stats.remaining_amount.toLocaleString()} remaining of £{locationDetails.investment_stats.investment_limit.toLocaleString()} goal
            </Text>
          </View>
        </View>

        {/* Recent Investments */}
        {locationDetails.recent_investments.length > 0 && (
          <View className="bg-white p-5 border-b border-gray-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-gray-800">Recent Investments</Text>
              <TouchableOpacity
                className="px-3 py-1.5 bg-gray-100 rounded"
                onPress={handleViewAllInvestors}
              >
                <Text className="text-sm text-[#9A563A] font-medium">View All</Text>
              </TouchableOpacity>
            </View>

            {locationDetails.recent_investments.slice(0, 5).map((investment, index) => {
              const paymentDisplay = getPaymentMethodDisplay(investment.payment_method || 'card');
              return (
                <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800 mb-0.5">{maskInvestorName(investment.investor_name)}</Text>
                    <Text className="text-xs text-gray-500 mb-0.5">{formatDate(investment.invested_at)}</Text>
                    <View className="flex-row items-center mb-0.5">
                      <MaterialIcons name={paymentDisplay.icon as any} size={10} color={paymentDisplay.color} />
                      <Text className="text-xs text-gray-400 ml-1">{paymentDisplay.text}</Text>
                    </View>
                    <Text className="text-xs text-gray-400">Ref: {investment.reference}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-[#9A563A] mb-1.5">£{investment.amount.toLocaleString()}</Text>
                    <View className={`px-2 py-1 rounded ${investment.status === 'completed' ? 'bg-green-500' :
                      investment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                      <Text className="text-white text-xs font-medium">{investment.status}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Investment Form */}
        {locationDetails.investment_stats.is_open_for_investment && (
          <View className="bg-white p-5">
            <Text className="text-lg font-bold text-gray-800 mb-4">Make an Investment</Text>

            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">Investment Amount (£)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-gray-50"
                value={investmentAmount}
                onChangeText={setInvestmentAmount}
                placeholder="Enter amount (£10 - £10,000)"
                keyboardType="numeric"
                editable={!investing}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Minimum: £10 • Maximum: £10,000 • Available: £{locationDetails.investment_stats.remaining_amount.toLocaleString()}
              </Text>
            </View>

            {/* Payment Method Selector */}
            <PaymentMethodSelector />

            <View className="mb-5">
              <Text className="text-sm font-medium text-gray-700 mb-2">Notes (Optional)</Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-3 text-base bg-gray-50 min-h-20 text-top"
                value={investmentNotes}
                onChangeText={setInvestmentNotes}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                editable={!investing}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              className={`py-4 rounded-lg items-center mt-2 ${(!investmentAmount || investing) ? 'bg-gray-300' : 'bg-[#9A563A]'}`}
              onPress={handleInvestNow}
              disabled={!investmentAmount || investing}
            >
              {investing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-bold">
                  {paymentMethod === 'bank_transfer' ? 'Submit Investment Request' : `Invest £${investmentAmount || '0'}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-5">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
              {paymentMethod === 'bank_transfer' ? 'Confirm Investment Request' : 'Confirm Investment'}
            </Text>

            <View className="mb-6">
              <Text className="text-base text-gray-600 leading-6 text-center">
                You are about to {paymentMethod === 'bank_transfer' ? 'submit an investment request for' : 'invest'} <Text className="font-bold text-[#9A563A]">£{investmentAmount}</Text> in <Text className="font-bold text-gray-800">{locationDetails.name}</Text>
              </Text>

              {/* Payment Method Display */}
              <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                <View className="flex-row items-center">
                  <MaterialIcons
                    name={paymentMethod === 'bank_transfer' ? 'account-balance' : 'credit-card'}
                    size={16}
                    color={paymentMethod === 'bank_transfer' ? '#3B82F6' : '#9A563A'}
                  />
                  <Text className="text-sm font-medium text-gray-700 ml-2">
                    Payment Method: {paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'Card Payment'}
                  </Text>
                </View>
                {paymentMethod === 'bank_transfer' && (
                  <Text className="text-xs text-gray-500 mt-1">
                    Our team will contact you with transfer details within 24 hours.
                  </Text>
                )}
              </View>

              {investmentNotes && (
                <View className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Notes:</Text>
                  <Text className="text-sm text-gray-700">{investmentNotes}</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-base text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-lg bg-[#9A563A] items-center"
                onPress={confirmInvestment}
              >
                <Text className="text-base text-white font-bold">
                  {paymentMethod === 'bank_transfer' ? 'Submit Request' : 'Confirm & Pay'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default InvestmentDetailsScreen;