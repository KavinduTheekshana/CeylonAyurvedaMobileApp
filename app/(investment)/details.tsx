// app/(investment)/details.tsx
import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, MaterialIcons } from '@expo/vector-icons';

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

interface LocationData {
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

const LocationDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the location data from params
  const locationData: LocationData = JSON.parse(params.locationData as string);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleInvestNow = () => {
    // Navigate to investment screen
    router.push({
      pathname: `/(investment)/[locationId]`,
      params: {
        locationId: locationData.id.toString(),
        locationName: locationData.name
      }
    });
  };

  const renderTherapistCard = ({ item }: { item: Therapist }) => (
    <View style={styles.therapistCard}>
      <View style={styles.therapistImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.therapistImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.therapistPlaceholder}>
            <MaterialIcons name="person" size={32} color="#9A563A" />
          </View>
        )}
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.status ? '#10B981' : '#EF4444' }
        ]} />
      </View>
      <View style={styles.therapistInfo}>
        <Text style={styles.therapistName}>{item.name}</Text>
        <View style={styles.therapistDetail}>
          <MaterialIcons name="phone" size={16} color="#6B7280" />
          <Text style={styles.therapistPhone}>{item.phone}</Text>
        </View>
        <View style={styles.therapistDetail}>
          <MaterialIcons name="email" size={16} color="#6B7280" />
          <Text style={styles.therapistEmail}>{item.email}</Text>
        </View>
        <View style={styles.therapistDetail}>
          <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
          <Text style={styles.therapistStartDate}>
            Started: {formatDate(item.work_start_date)}
          </Text>
        </View>
        {item.bio && (
          <Text style={styles.therapistBio} numberOfLines={3}>
            {item.bio}
          </Text>
        )}
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {locationData.name}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location Image */}
        {locationData.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: locationData.image }}
              style={styles.locationImage}
              resizeMode="cover"
            />
            {/* Status Overlay */}
            <View style={styles.statusOverlay}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: locationData.is_open_for_investment ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusText}>
                  {locationData.is_open_for_investment ? 'Open for Investment' : 'Investment Closed'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{locationData.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{locationData.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>City:</Text>
              <Text style={styles.infoValue}>{locationData.city}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={[styles.infoValue, !locationData.branch_phone && styles.notAvailable]}>
                {locationData.branch_phone || 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Management Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Owner:</Text>
              <Text style={[styles.infoValue, !locationData.owner_name && styles.notAvailable]}>
                {locationData.owner_name || 'Not available'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Owner Email:</Text>
              <Text style={[styles.infoValue, !locationData.owner_email && styles.notAvailable]}>
                {locationData.owner_email || 'Not available'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Manager:</Text>
              <Text style={[styles.infoValue, !locationData.manager_name && styles.notAvailable]}>
                {locationData.manager_name || 'Not available'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Manager Email:</Text>
              <Text style={[styles.infoValue, !locationData.manager_email && styles.notAvailable]}>
                {locationData.manager_email || 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Investment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Investment Details</Text>
          <View style={styles.investmentGrid}>
            <View style={styles.investmentItem}>
              <Text style={styles.investmentValue}>
                {/* £{locationData.total_invested.toLocaleString()} */}
              </Text>
              <Text style={styles.investmentLabel}>Total Invested</Text>
            </View>
            <View style={styles.investmentItem}>
              <Text style={styles.investmentValue}>
                {/* £{locationData.investment_limit.toLocaleString()} */}
              </Text>
              <Text style={styles.investmentLabel}>Investment Limit</Text>
            </View>
            <View style={styles.investmentItem}>
              <Text style={styles.investmentValue}>
                {locationData.total_investors}
              </Text>
              <Text style={styles.investmentLabel}>Total Investors</Text>
            </View>
            <View style={styles.investmentItem}>
              <Text style={styles.investmentValue}>
                {/* {locationData.progress_percentage.toFixed(1)}% */}
              </Text>
              <Text style={styles.investmentLabel}>Progress</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(locationData.progress_percentage, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.remainingText}>
              {/* £{locationData.remaining_amount.toLocaleString()} remaining */}
            </Text>
          </View>
        </View>

        {/* Description */}
        {locationData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>{locationData.description}</Text>
            </View>
          </View>
        )}

        {/* Therapists */}
        {/* {locationData.therapists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Therapists ({locationData.therapists.length})
            </Text>
            <FlatList
              data={locationData.therapists}
              renderItem={renderTherapistCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.therapistSeparator} />}
            />
          </View>
        )} */}

        {/* Invest Button */}
        {locationData.is_open_for_investment && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.investButton}
              onPress={handleInvestNow}
            >
              <Text style={styles.investButtonText}>Invest Now</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
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
    // backgroundColor: '#fff',
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
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    position: 'relative',
  },
  locationImage: {
    width: '100%',
    height: '100%',
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
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    width: 100,
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },
  investmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  investmentItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  investmentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9A563A',
    marginBottom: 4,
  },
  investmentLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 5,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9A563A',
    borderRadius: 5,
  },
  remainingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  therapistCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  therapistImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  therapistImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  therapistPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  therapistInfo: {
    flex: 1,
  },
  therapistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  therapistDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  therapistPhone: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  therapistEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  therapistStartDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  therapistBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
  therapistSeparator: {
    height: 8,
  },
  investButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9A563A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  investButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  notAvailable: {
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default LocationDetailsScreen;