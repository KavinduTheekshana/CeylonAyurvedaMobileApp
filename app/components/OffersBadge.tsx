import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OffersBadgeProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  color?: string;
  position?: 'topRight' | 'topLeft' | 'bottomRight' | 'bottomLeft';
}

const OffersBadge: React.FC<OffersBadgeProps> = ({
  size = 'small',
  text = 'Offers Available',
  color = '#FF6B6B',
  position = 'topRight'
}) => {
  // Determine position styles
  const positionStyles = {
    topRight: { top: 8, right: 8 },
    topLeft: { top: 8, left: 8 },
    bottomRight: { bottom: 8, right: 8 },
    bottomLeft: { bottom: 8, left: 8 }
  };

  // Determine size styles
  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 12,
      fontSize: 10
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 14,
      fontSize: 12
    },
    large: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      fontSize: 14
    }
  };

  return (
    <View
      style={[
        styles.container,
        positionStyles[position],
        {
          backgroundColor: color,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
          paddingVertical: sizeStyles[size].paddingVertical,
          borderRadius: sizeStyles[size].borderRadius
        }
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: sizeStyles[size].fontSize }
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    elevation: 2, // For Android shadow effect
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1
  },
  text: {
    color: 'white',
    fontWeight: 'bold'
  }
});

export default OffersBadge;