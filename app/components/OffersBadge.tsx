import React from 'react';
import { View, Text } from 'react-native';

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
  // Position styles using absolute positioning
  const getPositionStyles = () => {
    switch (position) {
      case 'topLeft':
        return { top: 8, left: 8 };
      case 'bottomRight':
        return { bottom: 8, right: 8 };
      case 'bottomLeft':
        return { bottom: 8, left: 8 };
      case 'topRight':
      default:
        return { top: 8, right: 8 };
    }
  };

  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'medium':
        return {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 14,
          fontSize: 12
        };
      case 'large':
        return {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          fontSize: 14
        };
      case 'small':
      default:
        return {
          paddingHorizontal: 6,
          paddingVertical: 3,
          borderRadius: 12,
          fontSize: 10
        };
    }
  };

  const positionStyles = getPositionStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        {
          position: 'absolute',
          backgroundColor: color,
          zIndex: 1000,
          elevation: 20, // High elevation for Android
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
        },
        positionStyles
      ]}
    >
      <Text
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize: sizeStyles.fontSize,
          textAlign: 'center'
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export default OffersBadge;