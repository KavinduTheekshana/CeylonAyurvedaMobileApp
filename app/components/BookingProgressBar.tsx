import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * A customizable progress bar component to show booking availability
 * @param {Object} props
 * @param {number} props.current - Current number of bookings
 * @param {number} props.max - Maximum capacity (default: 80)
 * @param {string} props.label - Optional label text
 */
const BookingProgressBar = ({ current = 0, max = 80, label = "Current Bookings" }) => {
  // Calculate percentage filled (making sure it doesn't exceed 100%)
  const percentage = Math.min(Math.round((current / max) * 100), 100);
  
  // Determine color based on availability
  const getBarColor = () => {
    if (percentage < 50) return "#4CAF50"; // Green for low bookings (plenty of availability)
    if (percentage < 75) return "#FFC107"; // Amber for medium bookings
    return "#F44336"; // Red for high bookings (limited availability)
  };

  // Determine status text
  const getStatusText = () => {
    if (percentage < 50) return "High Availability";
    if (percentage < 75) return "Medium Availability";
    if (percentage < 90) return "Limited Availability";
    return "Nearly Booked";
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.availabilityText}>{getStatusText()}</Text>
      </View>
      
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${percentage}%`,
              backgroundColor: getBarColor()
            }
          ]} 
        />
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{current} of {max} bookings</Text>
        <Text style={styles.percentageText}>{percentage}% Booked</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    padding: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statsText: {
    fontSize: 12,
    color: '#666',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
});

export default BookingProgressBar;