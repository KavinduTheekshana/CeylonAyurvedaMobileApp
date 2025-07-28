// app/(investment)/investors.tsx - New screen for displaying all investors
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

interface Investment {
  id: number;
  amount: number;
  investor_name: string;
  invested_at: string;
  status: string;
  reference: string;
  payment_method?: string;
}

const AllInvestorsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const locationId = params.locationId as string;
  const locationName = params.locationName as string;

  const [investors, setInvestors] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllInvestors();
  }, [locationId]);

  // Function to mask investor names
  const maskInvestorName = (name: string) => {
    if (!name || name.length <= 3) return name;
    const firstThree = name.substring(0, 3);
    const asterisks = '*'.repeat(name.length - 3);
    return firstThree + asterisks;
  };

  const loadAllInvestors = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        Alert.alert('Error', 'You must be logged in to view investors');
        router.back();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/investments/locations/${locationId}/investors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setInvestors(data.data || []);
      } else {
        throw new Error(data.message || 'Failed to load investors');
      }
    } catch (error) {
      console.error('Error loading investors:', error);
      Alert.alert('Error', 'Failed to load investors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllInvestors();
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

  const renderInvestorItem = ({ item }: { item: Investment }) => {
    const paymentDisplay = getPaymentMethodDisplay(item.payment_method || 'card');

    return (
      <View className="bg-white mx-4 mb-3 rounded-lg shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-center px-5 py-4">
          <View className="flex-1 mr-4">
            <Text className="text-base font-semibold text-gray-800 mb-1">
              {maskInvestorName(item.investor_name)}
            </Text>
            <Text className="text-sm text-gray-500 mb-1">
              {formatDate(item.invested_at)}
            </Text>
            <View className="flex-row items-center mb-1">
              <MaterialIcons 
                name={paymentDisplay.icon as any} 
                size={12} 
                color={paymentDisplay.color} 
              />
              <Text className="text-xs text-gray-400 ml-1">
                {paymentDisplay.text}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              Ref: {item.reference}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-lg font-bold text-[#9A563A] mb-2">
              £{item.amount.toLocaleString()}
            </Text>
            <View className={`px-3 py-1 rounded-full ${
              item.status === 'completed' ? 'bg-green-500' :
              item.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <Text className="text-white text-xs font-medium capitalize">
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSummaryCard = () => {
    const totalInvestment = investors.reduce((sum, investor) => sum + investor.amount, 0);
    const completedInvestments = investors.filter(inv => inv.status === 'completed').length;
    const pendingInvestments = investors.filter(inv => inv.status === 'pending').length;

    return (
      <View className="bg-white mx-4 mb-4 rounded-lg shadow-sm border border-gray-100 p-5">
        <Text className="text-lg font-bold text-gray-800 mb-4">Investment Summary ({locationName})</Text>
        
        <View className="flex-row justify-between mb-4">
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-[#9A563A] mb-1">
              {investors.length}
            </Text>
            <Text className="text-xs text-gray-500 text-center">Total Investors</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-green-600 mb-1">
              {completedInvestments}
            </Text>
            <Text className="text-xs text-gray-500 text-center">Completed</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-xl font-bold text-yellow-600 mb-1">
              {pendingInvestments}
            </Text>
            <Text className="text-xs text-gray-500 text-center">Pending</Text>
          </View>
        </View>

        {/* <View className="border-t border-gray-200 pt-4">
          <Text className="text-center text-sm text-gray-600">
            Total Investment Amount
          </Text>
          <Text className="text-center text-2xl font-bold text-[#9A563A] mt-1">
            £{totalInvestment.toLocaleString()}
          </Text>
        </View> */}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-16">
      <MaterialIcons name="people-outline" size={64} color="#D1D5DB" />
      <Text className="text-xl font-bold text-gray-400 mt-4 mb-2">No Investors Yet</Text>
      <Text className="text-base text-gray-500 text-center">
        Be the first to invest in {locationName}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800 flex-1 text-center mx-4" numberOfLines={1}>
            All Investors
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 justify-center items-center px-8">
          <ActivityIndicator size="large" color="#9A563A" />
          <Text className="mt-4 text-base text-gray-500">Loading investors...</Text>
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
          All Investors
        </Text>
        <TouchableOpacity className="p-2" onPress={onRefresh}>
          <Feather name="refresh-cw" size={20} color="#9A563A" />
        </TouchableOpacity>
      </View>



      <FlatList
        data={investors}
        renderItem={renderInvestorItem}
        keyExtractor={(item) => `${item.id}-${item.reference}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9A563A']}
            tintColor="#9A563A"
          />
        }
        ListHeaderComponent={investors.length > 0 ? renderSummaryCard : null}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={investors.length === 0 ? { flex: 1 } : { paddingVertical: 16 }}
        ItemSeparatorComponent={null}
      />
    </SafeAreaView>
  );
};

export default AllInvestorsScreen;