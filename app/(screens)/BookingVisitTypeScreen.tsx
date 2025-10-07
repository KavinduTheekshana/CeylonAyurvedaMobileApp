import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Alert
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HeaderBackButton } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import { useLocation } from '../contexts/LocationContext';

type RootStackParamList = {
    BookingVisitTypeScreen: {
        serviceId: number;
        serviceName: string;
        duration: number;
    };
    BookingTherapistScreen: {
        serviceId: number;
        serviceName: string;
        duration: number;
        visitType: 'home' | 'branch';
    };
};

type BookingVisitTypeScreenRouteProp = RouteProp<RootStackParamList, 'BookingVisitTypeScreen'>;
type BookingVisitTypeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HOME_VISIT_FEE = 19.99;

const BookingVisitTypeScreen = () => {
    const route = useRoute<BookingVisitTypeScreenRouteProp>();
    const navigation = useNavigation<BookingVisitTypeScreenNavigationProp>();
    const { serviceId, serviceName, duration } = route.params;
    const { selectedLocation } = useLocation();

    const [selectedVisitType, setSelectedVisitType] = useState<'home' | 'branch' | null>(null);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: 'Select Visit Type',
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation]);

    const handleContinue = () => {
        if (!selectedVisitType) {
            Alert.alert('Selection Required', 'Please select a visit type to continue');
            return;
        }

        navigation.navigate('BookingTherapistScreen', {
            serviceId,
            serviceName,
            duration,
            visitType: selectedVisitType
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Header */}
                    

                    {/* Branch Visit Option */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedVisitType === 'branch' && styles.optionCardSelected
                        ]}
                        onPress={() => setSelectedVisitType('branch')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionHeader}>
                            <View style={styles.iconContainer}>
                                <Feather 
                                    name="home" 
                                    size={28} 
                                    color={selectedVisitType === 'branch' ? '#9A563A' : '#666'} 
                                />
                            </View>
                            <View style={styles.radioContainer}>
                                <View style={[
                                    styles.radioOuter,
                                    selectedVisitType === 'branch' && styles.radioOuterSelected
                                ]}>
                                    {selectedVisitType === 'branch' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                            </View>
                        </View>

                        <Text style={styles.optionTitle}>Branch Visit</Text>
                        <Text style={styles.optionDescription}>
                            Visit our clinic at your selected location
                        </Text>

                        {selectedLocation && (
                            <View style={styles.locationInfo}>
                                <Feather name="map-pin" size={14} color="#9A563A" />
                                <Text style={styles.locationText}>
                                    {selectedLocation.name}
                                </Text>
                            </View>
                        )}

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>Professional clinic environment</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>All equipment available</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>No additional fee</Text>
                            </View>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Additional Fee:</Text>
                            <Text style={styles.priceFree}>FREE</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Home Visit Option */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedVisitType === 'home' && styles.optionCardSelected
                        ]}
                        onPress={() => setSelectedVisitType('home')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.optionHeader}>
                            <View style={styles.iconContainer}>
                                <Feather 
                                    name="map-pin" 
                                    size={28} 
                                    color={selectedVisitType === 'home' ? '#9A563A' : '#666'} 
                                />
                            </View>
                            <View style={styles.radioContainer}>
                                <View style={[
                                    styles.radioOuter,
                                    selectedVisitType === 'home' && styles.radioOuterSelected
                                ]}>
                                    {selectedVisitType === 'home' && (
                                        <View style={styles.radioInner} />
                                    )}
                                </View>
                            </View>
                        </View>

                        <Text style={styles.optionTitle}>Home Visit</Text>
                        <Text style={styles.optionDescription}>
                            We come to your location for maximum convenience
                        </Text>

                        <View style={styles.featureList}>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>Service at your comfort</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>No travel required</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text style={styles.featureText}>Flexible scheduling</Text>
                            </View>
                        </View>

                        <View style={styles.priceContainer}>
                            <Text style={styles.priceLabel}>Additional Fee:</Text>
                            <Text style={styles.priceValue}>£{HOME_VISIT_FEE.toFixed(2)}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Feather name="info" size={20} color="#9A563A" />
                        <Text style={styles.infoText}>
                            Home visit fee covers travel and setup at your location
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Continue Button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[
                        styles.continueButton,
                        !selectedVisitType && styles.continueButtonDisabled
                    ]}
                    onPress={handleContinue}
                    disabled={!selectedVisitType}
                >
                    <Text style={styles.continueButtonText}>
                        Continue to Select Therapist
                    </Text>
                    <Feather name="arrow-right" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 100,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
    },
    optionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    optionCardSelected: {
        borderColor: '#9A563A',
        backgroundColor: '#FFF9F5',
    },
    optionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioContainer: {
        padding: 4,
    },
    radioOuter: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#9A563A',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#9A563A',
    },
    optionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    optionDescription: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 16,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9F5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    locationText: {
        fontSize: 14,
        color: '#9A563A',
        marginLeft: 8,
        fontWeight: '600',
    },
    featureList: {
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    priceLabel: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '600',
    },
    priceFree: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#10B981',
    },
    priceValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#9A563A',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#FFF9F5',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#9A563A',
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#9A563A',
        marginLeft: 12,
        lineHeight: 20,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    continueButton: {
        backgroundColor: '#9A563A',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8,
    },
    continueButtonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    continueButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BookingVisitTypeScreen;