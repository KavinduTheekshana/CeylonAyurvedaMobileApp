// components/InvestmentProgress.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface InvestmentProgressProps {
  totalInvested: number;
  totalInvestments: number;
  investmentsByLocation: Array<{
    location: {
      id: number;
      name: string;
      city: string;
    };
    total_amount: number;
    investment_count: number;
  }>;
  isGuest?: boolean;
}

const InvestmentProgress: React.FC<InvestmentProgressProps> = ({
  totalInvested,
  totalInvestments,
  investmentsByLocation,
  isGuest = false
}) => {
  // Mock data for demonstration when user has no investments
  const hasInvestments = totalInvested > 0;
  
  // Calculate progress for visual representation (example: goal of £1000)
  const investmentGoal = 1000;
  const progressPercentage = Math.min((totalInvested / investmentGoal) * 100, 100);

  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.iconContainer}>
            <Feather name="trending-up" size={24} color="#9A563A" />
          </View>
          <Text style={styles.guestTitle}>Investment Portfolio</Text>
          <Text style={styles.guestSubtitle}>
            Login to track your investments and earn returns
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Feather name="trending-up" size={20} color="#9A563A" />
        </View>
        <Text style={styles.title}>Investment Portfolio</Text>
      </View>

      {/* Main Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>£{totalInvested.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalInvestments}</Text>
          <Text style={styles.statLabel}>Investments</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress to Goal</Text>
          <Text style={styles.progressPercentage}>{progressPercentage.toFixed(0)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressSubtext}>
          £{(investmentGoal - totalInvested).toFixed(2)} remaining to reach £{investmentGoal} goal
        </Text>
      </View>

      {/* Investments by Location */}
      {investmentsByLocation.length > 0 && (
        <View style={styles.locationsContainer}>
          <Text style={styles.locationsTitle}>Your Investments</Text>
          {investmentsByLocation.slice(0, 3).map((investment, index) => (
            <View key={investment.location.id} style={styles.locationItem}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {investment.location.name}
                </Text>
                <Text style={styles.locationCity}>{investment.location.city}</Text>
              </View>
              <View style={styles.locationStats}>
                <Text style={styles.locationAmount}>
                  £{investment.total_amount.toFixed(2)}
                </Text>
                <Text style={styles.locationCount}>
                  {investment.investment_count} investment{investment.investment_count !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ))}
          
          {investmentsByLocation.length > 3 && (
            <Text style={styles.moreText}>
              +{investmentsByLocation.length - 3} more locations
            </Text>
          )}
        </View>
      )}

      {/* No Investments State */}
      {!hasInvestments && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Start Your Investment Journey</Text>
          <Text style={styles.emptySubtitle}>
            Invest in local wellness centers and earn returns while supporting your community
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9A563A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    marginBottom: 20,
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
  progressSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  locationsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 12,
    color: '#6B7280',
  },
  locationStats: {
    alignItems: 'flex-end',
  },
  locationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A563A',
    marginBottom: 2,
  },
  locationCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  guestContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default InvestmentProgress;