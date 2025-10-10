// app/(screens)/TreatmentHistoryDetailsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import TreatmentHistoryService, { TreatmentHistoryDetail } from '../services/treatmentHistoryService';
import { getTherapistDisplayName } from '../utils/therapistUtils';

const { width } = Dimensions.get('window');

export default function TreatmentHistoryDetailsScreen() {
  const router = useRouter();
  const { bookingId, bookingReference } = useLocalSearchParams();
  
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchTreatmentHistory();
    }
  }, [bookingId]);

  const fetchTreatmentHistory = async () => {
    try {
      setLoading(true);
      const response = await TreatmentHistoryService.getTreatmentHistoryByBooking(Number(bookingId));
      
      if (response.success && response.data) {
        setTreatmentHistory(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load treatment history');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching treatment history:', error);
      Alert.alert('Error', 'Failed to load treatment history. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const renderConditionStatus = (condition: string, description: string) => {
    const getStatusColor = () => {
      switch (condition) {
        case 'improved': return '#10B981';
        case 'worse': return '#EF4444';
        default: return '#F59E0B';
      }
    };

    const getStatusIcon = () => {
      switch (condition) {
        case 'improved': return 'trending-up';
        case 'worse': return 'trending-down';
        default: return 'trending-flat';
      }
    };

    return (
      <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
        <View style={styles.statusHeader}>
          <MaterialIcons name={getStatusIcon()} size={24} color={getStatusColor()} />
          <Text style={[styles.statusTitle, { color: getStatusColor() }]}>
            {condition ? condition.charAt(0).toUpperCase() + condition.slice(1) : 'No Change'}
          </Text>
        </View>
        <Text style={styles.statusDescription}>{description}</Text>
      </View>
    );
  };

  const renderPainImprovement = (painData: any) => {
    if (!painData) return null;

    const improvementColor = painData.improvement > 0 ? '#10B981' : 
                           painData.improvement < 0 ? '#EF4444' : '#F59E0B';

    return (
      <View style={styles.painCard}>
        <Text style={styles.sectionTitle}>Pain Level Assessment</Text>
        <View style={styles.painComparison}>
          <View style={styles.painItem}>
            <Text style={styles.painLabel}>Before</Text>
            <View style={[styles.painCircle, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.painNumber}>{painData.before}</Text>
            </View>
          </View>
          
          <MaterialIcons name="arrow-forward" size={24} color="#666" />
          
          <View style={styles.painItem}>
            <Text style={styles.painLabel}>After</Text>
            <View style={[styles.painCircle, { backgroundColor: '#10B981' }]}>
              <Text style={styles.painNumber}>{painData.after}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.improvementBadge, { backgroundColor: improvementColor + '20' }]}>
          <Text style={[styles.improvementText, { color: improvementColor }]}>
            {painData.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderTreatmentNotes = (notes: string) => {
    if (!notes) return null;

    return (
      <View style={styles.notesCard}>
        <Text style={styles.sectionTitle}>Treatment Notes</Text>
        <Text style={styles.notesText}>{notes}</Text>
      </View>
    );
  };

  const renderObservations = (observations: string) => {
    if (!observations) return null;

    return (
      <View style={styles.observationsCard}>
        <Text style={styles.sectionTitle}>Observations</Text>
        <Text style={styles.observationsText}>{observations}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading treatment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!treatmentHistory) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Treatment history not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonHeader}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Treatment History</Text>
        </View>

        {/* Treatment Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <MaterialIcons name="local-hospital" size={28} color="#9A563A" />
            <View style={styles.summaryInfo}>
              <Text style={styles.serviceName}>{treatmentHistory.service.title}</Text>
              <Text style={styles.bookingReference}>
                Ref: {treatmentHistory.booking.reference}
              </Text>
            </View>
          </View>
          
          <View style={styles.treatmentDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={20} color="#666" />
              <Text style={styles.detailText}>
                {getTherapistDisplayName({
                  name: treatmentHistory.therapist.name,
                  nickname: treatmentHistory.therapist.nickname
                })}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="event" size={20} color="#666" />
              <Text style={styles.detailText}>
                {treatmentHistory.booking.formatted_date} at {treatmentHistory.booking.formatted_time}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color="#666" />
              <Text style={styles.detailText}>
                Duration: {treatmentHistory.service.duration} minutes
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color="#666" />
              <Text style={styles.detailText}>
                {treatmentHistory.booking.address.line1}, {treatmentHistory.booking.address.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Treatment Notes */}
        {treatmentHistory.treatment_details.treatment_notes && 
          renderTreatmentNotes(treatmentHistory.treatment_details.treatment_notes)
        }

        {/* Observations */}
        {treatmentHistory.treatment_details.observations && 
          renderObservations(treatmentHistory.treatment_details.observations)
        }

        {/* Areas Treated */}
        {treatmentHistory.treatment_details.areas_treated && 
         treatmentHistory.treatment_details.areas_treated.length > 0 && (
          <View style={styles.areasCard}>
            <Text style={styles.sectionTitle}>Areas Treated</Text>
            <View style={styles.areasContainer}>
              {treatmentHistory.treatment_details.areas_treated.map((area, index) => (
                <View key={index} style={styles.areaTag}>
                  <Text style={styles.areaText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Treatment Outcome */}
        {treatmentHistory.treatment_details.patient_condition && (
          renderConditionStatus(
            treatmentHistory.treatment_details.patient_condition,
            treatmentHistory.treatment_details.condition_description
          )
        )}

        {/* Pain Assessment */}
        {treatmentHistory.treatment_details.pain_improvement && 
          renderPainImprovement(treatmentHistory.treatment_details.pain_improvement)
        }

        {/* Recommendations */}
        {treatmentHistory.recommendations && (
          <View style={styles.recommendationsCard}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <View style={styles.recommendationItem}>
              <MaterialIcons name="lightbulb" size={20} color="#9A563A" />
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationText}>
                  {treatmentHistory.recommendations}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Next Treatment Plan */}
        {treatmentHistory.next_treatment_plan && (
          <View style={styles.nextTreatmentCard}>
            <Text style={styles.sectionTitle}>Next Treatment Plan</Text>
            <View style={styles.nextTreatmentItem}>
              <MaterialIcons name="event-note" size={20} color="#9A563A" />
              <View style={styles.nextTreatmentContent}>
                <Text style={styles.nextTreatmentText}>
                  {treatmentHistory.next_treatment_plan}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Follow-up Notice */}
        {treatmentHistory.next_treatment_plan && (
          <View style={styles.followUpCard}>
            <MaterialIcons name="notification-important" size={24} color="#F59E0B" />
            <Text style={styles.followUpText}>
              Follow-up treatment recommended. Please contact your therapist to schedule your next appointment.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  backButtonHeader: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryInfo: {
    marginLeft: 16,
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  bookingReference: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  treatmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  notesCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  observationsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  observationsText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  painCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  painComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  painItem: {
    alignItems: 'center',
  },
  painLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  painCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  painNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  improvementBadge: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  improvementText: {
    fontSize: 14,
    fontWeight: '600',
  },
  areasCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  areaTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  areaText: {
    fontSize: 14,
    color: '#374151',
  },
  recommendationsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationContent: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nextTreatmentCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextTreatmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextTreatmentContent: {
    marginLeft: 12,
    flex: 1,
  },
  nextTreatmentText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  followUpCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  followUpText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#9A563A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});