// app/(screens)/TreatmentHistoryListScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import TreatmentHistoryService, { TreatmentHistory } from '../services/treatmentHistoryService';
import { getTherapistDisplayName } from '../utils/therapistUtils';

const { width } = Dimensions.get('window');

interface ExpandableCardProps {
  treatment: TreatmentHistory;
  isExpanded: boolean;
  onToggle: () => void;
  router: any;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({ treatment, isExpanded, onToggle, router }) => {
  const [animation] = useState(new Animated.Value(isExpanded ? 1 : 0));

  React.useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const getStatusColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'improved': return '#10B981';
      case 'worse': return '#EF4444';
      case 'same': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'improved': return 'trending-up';
      case 'worse': return 'trending-down';
      case 'same': return 'trending-flat';
      default: return 'help-outline';
    }
  };

  const renderPainImprovement = () => {
    if (!treatment.pain_improvement) return null;

    const { before, after, improvement, description } = treatment.pain_improvement;
    const improvementColor = improvement > 0 ? '#10B981' : improvement < 0 ? '#EF4444' : '#F59E0B';

    return (
      <View style={styles.painSection}>
        <Text style={styles.detailSectionTitle}>Pain Assessment</Text>
        <View style={styles.painComparison}>
          <View style={styles.painItem}>
            <Text style={styles.painLabel}>Before</Text>
            <View style={[styles.painCircle, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.painNumber}>{before}</Text>
            </View>
          </View>
          
          <MaterialIcons name="arrow-forward" size={20} color="#666" />
          
          <View style={styles.painItem}>
            <Text style={styles.painLabel}>After</Text>
            <View style={[styles.painCircle, { backgroundColor: '#10B981' }]}>
              <Text style={styles.painNumber}>{after}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.improvementBadge, { backgroundColor: improvementColor + '20' }]}>
          <Text style={[styles.improvementText, { color: improvementColor }]}>
            {description}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onToggle} activeOpacity={0.7}>
      {/* Card Header - Always Visible */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.serviceName} numberOfLines={1}>
            {treatment.service_title}
          </Text>
          
          <View style={styles.headerInfoRow}>
            <Text style={styles.referenceText}>Ref: {treatment.booking_reference}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.dateText}>{treatment.formatted_date}</Text>
          </View>
          
          <View style={styles.headerInfoRow}>
            <Text style={styles.timeText}>{treatment.treatment_time}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.therapistText}>
              Dr. {getTherapistDisplayName({
                name: treatment.therapist_name,
                nickname: treatment.therapist_nickname
              })}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {treatment.patient_condition && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(treatment.patient_condition) }]}>
              <MaterialIcons 
                name={getStatusIcon(treatment.patient_condition)} 
                size={14} 
                color="white" 
              />
              <Text style={styles.statusText}>
                {treatment.patient_condition.charAt(0).toUpperCase() + treatment.patient_condition.slice(1)}
              </Text>
            </View>
          )}
          
          <MaterialIcons 
            name={isExpanded ? "expand-less" : "expand-more"} 
            size={24} 
            color="#666" 
          />
        </View>
      </View>

      {/* Expandable Details */}
      <Animated.View 
        style={[
          styles.expandableContent,
          {
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1000],
            }),
            opacity: animation,
          }
        ]}
      >
        {isExpanded && (
          <View style={styles.detailsContainer}>
            {/* Treatment Notes */}
            {treatment.has_treatment_notes && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Treatment Notes</Text>
                <Text style={styles.fullDetailText}>
                  {treatment.treatment_notes || 'No detailed treatment notes available'}
                </Text>
              </View>
            )}

            {/* Observations */}
            {treatment.has_observations && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Observations</Text>
                <Text style={styles.fullDetailText}>
                  {treatment.observations || 'No specific observations recorded'}
                </Text>
              </View>
            )}

            {/* Areas Treated */}
            {treatment.areas_treated && treatment.areas_treated.length > 0 && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Areas Treated</Text>
                <View style={styles.areasContainer}>
                  {treatment.areas_treated.map((area, index) => (
                    <View key={index} style={styles.areaTag}>
                      <Text style={styles.areaText}>{area}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Pain Assessment */}
            {treatment.pain_improvement && renderPainImprovement()}

            {/* Recommendations */}
            {treatment.has_recommendations && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Recommendations</Text>
                <View style={styles.recommendationContent}>
                  <MaterialIcons name="lightbulb" size={16} color="#9A563A" />
                  <Text style={styles.fullRecommendationText}>
                    {treatment.recommendations || 'No specific recommendations provided'}
                  </Text>
                </View>
              </View>
            )}

            {/* Next Treatment Plan */}
            {treatment.next_treatment_plan && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Next Treatment Plan</Text>
                <View style={styles.nextTreatmentContent}>
                  <MaterialIcons name="event-note" size={16} color="#9A563A" />
                  <Text style={styles.fullRecommendationText}>
                    {treatment.next_treatment_plan}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function TreatmentHistoryListScreen() {
  const router = useRouter();
  const [treatments, setTreatments] = useState<TreatmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);

  useEffect(() => {
    fetchTreatmentHistories();
  }, []);

  const fetchTreatmentHistories = async (pageNumber = 1, shouldRefresh = false) => {
    try {
      if (shouldRefresh) {
        setRefreshing(true);
        setTreatments([]);
        setPage(1);
      } else if (pageNumber === 1) {
        setLoading(true);
      }

      const response = await TreatmentHistoryService.getUserTreatmentHistories(pageNumber);
      
      if (response.success) {
        if (shouldRefresh || pageNumber === 1) {
          setTreatments(response.data);
        } else {
          setTreatments(prev => [...prev, ...response.data]);
        }
        
        setHasMoreData(response.pagination.current_page < response.pagination.last_page);
        setPage(pageNumber);
      } else {
        Alert.alert('Error', response.message || 'Failed to load treatment histories');
      }
    } catch (error) {
      console.error('Error fetching treatment histories:', error);
      Alert.alert('Error', 'Failed to load treatment histories. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    fetchTreatmentHistories(1, true);
  }, []);

  const handleLoadMore = () => {
    if (hasMoreData && !loading) {
      fetchTreatmentHistories(page + 1);
    }
  };

  const toggleCard = (treatmentId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(treatmentId)) {
        newSet.delete(treatmentId);
      } else {
        newSet.add(treatmentId);
      }
      return newSet;
    });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="history" size={64} color="#9A563A" />
      <Text style={styles.emptyTitle}>No Treatment History</Text>
      <Text style={styles.emptyMessage}>
        Your completed treatments will appear here. Complete a booking to see your treatment history.
      </Text>
    </View>
  );

  if (loading && treatments.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Treatment History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9A563A" />
          <Text style={styles.loadingText}>Loading treatment histories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Treatment History</Text>
        <View style={styles.headerActions}>
          <Text style={styles.countText}>{treatments.length} treatments</Text>
        </View>
      </View>

      {/* Content */}
      {treatments.length === 0 ? (
        renderEmptyState()
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#9A563A"]}
              tintColor="#9A563A"
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const paddingToBottom = 20;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
              handleLoadMore();
            }
          }}
          scrollEventThrottle={400}
        >
          <View style={styles.listContainer}>
            {treatments.map((treatment) => (
              <ExpandableCard
                key={treatment.id}
                treatment={treatment}
                isExpanded={expandedCards.has(treatment.id)}
                onToggle={() => toggleCard(treatment.id)}
                router={router}
              />
            ))}
            
            {hasMoreData && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#9A563A" />
                <Text style={styles.loadMoreText}>Loading more...</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
    marginLeft: 16,
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  countText: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 6,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  referenceText: {
    fontSize: 12,
    color: '#9A563A',
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#999',
    marginHorizontal: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  therapistText: {
    fontSize: 12,
    color: '#9A563A',
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  expandableContent: {
    overflow: 'hidden',
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    width: 80,
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  fullDetailText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  areasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  areaTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  areaText: {
    fontSize: 12,
    color: '#374151',
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fullRecommendationText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  nextTreatmentContent: {
  flexDirection: 'row',
  alignItems: 'flex-start',
},
  painSection: {
    marginBottom: 16,
  },
  painComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  painItem: {
    alignItems: 'center',
  },
  painLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  painCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  painNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  improvementBadge: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  improvementText: {
    fontSize: 11,
    fontWeight: '600',
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});