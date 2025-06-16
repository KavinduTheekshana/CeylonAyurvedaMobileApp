// app/components/HeaderMessageButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface HeaderMessageButtonProps {
    size?: number;
    color?: string;
    style?: any;
}

const HeaderMessageButton: React.FC<HeaderMessageButtonProps> = ({
    size = 24,
    color = '#9A563A',
    style
}) => {
    const router = useRouter();

    const handlePress = () => {
        router.push('/(screens)/MessageAdminScreen');
    };

    return (
        <TouchableOpacity
            style={[styles.container, style]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <MaterialIcons name="headset-mic" size={size} color={color} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 8,
        marginRight: 8,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HeaderMessageButton;