// app/(screens)/MessageAdminScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Modal,
    FlatList
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useLocation, type Location } from '../contexts/LocationContext';

export default function MessageAdminScreen() {
    const router = useRouter();
    const { selectedLocation } = useLocation();
    
    // Form state
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<Location | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    
    // Branch selection modal state
    const [branchModalVisible, setBranchModalVisible] = useState(false);
    const [availableBranches, setAvailableBranches] = useState<Location[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);
    
    // Error states
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    React.useEffect(() => {
        checkUserStatusAndLoadData();
        fetchAvailableBranches();
    }, []);

    React.useEffect(() => {
        // Set default branch to user's selected location
        if (selectedLocation && !selectedBranch) {
            setSelectedBranch(selectedLocation);
        }
    }, [selectedLocation]);

    const checkUserStatusAndLoadData = async () => {
        try {
            const userMode = await AsyncStorage.getItem('user_mode');
            const isGuestUser = userMode === 'guest';
            setIsGuest(isGuestUser);

            if (!isGuestUser) {
                // Load user data for logged-in users
                const userName = await AsyncStorage.getItem('user_name') || '';
                const userEmail = await AsyncStorage.getItem('user_email') || '';
                setName(userName);
                setEmail(userEmail);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const fetchAvailableBranches = async () => {
        setLoadingBranches(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/locations`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const mappedLocations: Location[] = data.data.map((location: any) => ({
                    id: location.id,
                    name: location.name,
                    slug: location.slug,
                    city: location.city,
                    address: location.address,
                    postcode: location.postcode || '',
                    latitude: location.latitude ? parseFloat(location.latitude) : null,
                    longitude: location.longitude ? parseFloat(location.longitude) : null,
                    phone: location.phone || null,
                    email: location.email || null,
                    description: location.description || null,
                    operating_hours: location.operating_hours || null,
                    image: location.image ? 
                        (location.image.startsWith('http') ? location.image : `${API_BASE_URL}/storage/${location.image}`) 
                        : null,
                    status: location.status !== false,
                    service_radius_miles: location.service_radius_miles || 5
                }));

                setAvailableBranches(mappedLocations);
                
                // Set default branch if not already set
                if (!selectedBranch && selectedLocation) {
                    const defaultBranch = mappedLocations.find(branch => branch.id === selectedLocation.id);
                    if (defaultBranch) {
                        setSelectedBranch(defaultBranch);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
        } finally {
            setLoadingBranches(false);
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!selectedBranch) {
            newErrors.branch = 'Please select a branch';
        }

        if (!subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!message.trim()) {
            newErrors.message = 'Message is required';
        } else if (message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters long';
        }

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSendMessage = async () => {
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const token = await AsyncStorage.getItem('access_token');
            
            const messageData = {
                subject: subject.trim(),
                message: message.trim(),
                name: name.trim(),
                email: email.trim(),
                branch_id: selectedBranch?.id,
                branch_name: selectedBranch?.name,
                is_guest: isGuest
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };

            // Add auth header if user is logged in
            if (token && !isGuest) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await axios.post(
                `${API_BASE_URL}/api/contact/message`,
                messageData,
                { headers }
            );

            if (response.data.success) {
                Alert.alert(
                    'Message Sent Successfully',
                    `Thank you for contacting us! The admin team at ${selectedBranch?.name} will respond to your message within 24 hours.`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Clear form
                                setSubject('');
                                setMessage('');
                                if (isGuest) {
                                    setName('');
                                    setEmail('');
                                }
                                router.back();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', response.data.message || 'Failed to send message. Please try again.');
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                // Handle validation errors
                if (error.response.data.errors) {
                    const validationErrors: {[key: string]: string} = {};
                    Object.entries(error.response.data.errors).forEach(([key, messages]) => {
                        validationErrors[key] = Array.isArray(messages) ? messages[0] : messages as string;
                    });
                    setErrors(validationErrors);
                } else {
                    Alert.alert('Error', 'Please check your input and try again.');
                }
            } else {
                Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBranchSelect = (branch: Location) => {
        setSelectedBranch(branch);
        setBranchModalVisible(false);
        // Clear branch error if it exists
        if (errors.branch) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.branch;
                return newErrors;
            });
        }
    };

    const renderBranchItem = ({ item }: { item: Location }) => (
        <TouchableOpacity
            style={[
                styles.branchItem,
                selectedBranch?.id === item.id && styles.selectedBranchItem
            ]}
            onPress={() => handleBranchSelect(item)}
        >
            <View style={styles.branchInfo}>
                <Text style={styles.branchName}>{item.name}</Text>
                <Text style={styles.branchAddress}>{item.address}</Text>
                <Text style={styles.branchCity}>{item.city}</Text>
            </View>
            {selectedBranch?.id === item.id && (
                <Feather name="check" size={20} color="#9A563A" />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardContainer}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Feather name="arrow-left" size={24} color="black" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Contact Admin</Text>
                        <View style={styles.placeholder} />
                    </View>

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <MaterialIcons name="support-agent" size={24} color="#9A563A" />
                            <Text style={styles.infoTitle}>Need Help?</Text>
                        </View>
                        <Text style={styles.infoText}>
                            Send us a message and our admin team will get back to you within 24 hours.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.formContainer}>
                        {/* Branch Selection */}
                        <Text style={styles.inputLabel}>Select Branch *</Text>
                        <TouchableOpacity
                            style={[
                                styles.branchSelector,
                                errors.branch && styles.inputError
                            ]}
                            onPress={() => setBranchModalVisible(true)}
                        >
                            <View style={styles.branchSelectorContent}>
                                <Feather name="map-pin" size={20} color="#9A563A" />
                                <View style={styles.branchSelectorText}>
                                    {selectedBranch ? (
                                        <>
                                            <Text style={styles.selectedBranchName}>{selectedBranch.name}</Text>
                                            <Text style={styles.selectedBranchAddress}>{selectedBranch.city}</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.branchSelectorPlaceholder}>Select a branch</Text>
                                    )}
                                </View>
                                <Feather name="chevron-down" size={20} color="#666" />
                            </View>
                        </TouchableOpacity>
                        {errors.branch && (
                            <Text style={styles.errorText}>{errors.branch}</Text>
                        )}

                        {/* Name Field */}
                        <Text style={styles.inputLabel}>Name *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.name && styles.inputError
                            ]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Your full name"
                            placeholderTextColor="#999"
                            editable={isGuest} // Only editable for guests
                        />
                        {errors.name && (
                            <Text style={styles.errorText}>{errors.name}</Text>
                        )}

                        {/* Email Field */}
                        <Text style={styles.inputLabel}>Email *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.email && styles.inputError
                            ]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Your email address"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={isGuest} // Only editable for guests
                        />
                        {errors.email && (
                            <Text style={styles.errorText}>{errors.email}</Text>
                        )}

                        {/* Subject Field */}
                        <Text style={styles.inputLabel}>Subject *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                errors.subject && styles.inputError
                            ]}
                            value={subject}
                            onChangeText={setSubject}
                            placeholder="What is this message about?"
                            placeholderTextColor="#999"
                        />
                        {errors.subject && (
                            <Text style={styles.errorText}>{errors.subject}</Text>
                        )}

                        {/* Message Field */}
                        <Text style={styles.inputLabel}>Message *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                errors.message && styles.inputError
                            ]}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Type your message here... (minimum 10 characters)"
                            placeholderTextColor="#999"
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        {errors.message && (
                            <Text style={styles.errorText}>{errors.message}</Text>
                        )}

                        {/* Character count */}
                        <Text style={styles.characterCount}>
                            {message.length} characters (minimum 10 required)
                        </Text>
                    </View>

                    {/* Send Button */}
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            isLoading && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendMessage}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="white" size="small" />
                                <Text style={styles.sendButtonText}>Sending...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Feather name="send" size={18} color="white" />
                                <Text style={styles.sendButtonText}>Send Message</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Additional Info */}
                    <View style={styles.additionalInfo}>
                        <Text style={styles.additionalInfoText}>
                            📧 Our admin team typically responds within 24 hours during business days.
                        </Text>
                        <Text style={styles.additionalInfoText}>
                            🔒 Your information will be kept secure and confidential.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Branch Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={branchModalVisible}
                onRequestClose={() => setBranchModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Branch</Text>
                            <TouchableOpacity
                                onPress={() => setBranchModalVisible(false)}
                                style={styles.modalCloseButton}
                            >
                                <Feather name="x" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {loadingBranches ? (
                            <View style={styles.modalLoadingContainer}>
                                <ActivityIndicator size="large" color="#9A563A" />
                                <Text style={styles.modalLoadingText}>Loading branches...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={availableBranches}
                                renderItem={renderBranchItem}
                                keyExtractor={(item) => item.id.toString()}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.branchList}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardContainer: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 44,
    },
    infoCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#81C784',
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2E7D32',
        marginLeft: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#4CAF50',
        lineHeight: 20,
    },
    formContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inputLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
    },
    branchSelector: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 16,
    },
    branchSelectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    branchSelectorText: {
        flex: 1,
        marginLeft: 10,
    },
    selectedBranchName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    selectedBranchAddress: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    branchSelectorPlaceholder: {
        fontSize: 16,
        color: '#999',
    },
    textArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 14,
        marginTop: -12,
        marginBottom: 16,
        marginLeft: 4,
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: -12,
        marginBottom: 8,
    },
    sendButton: {
        backgroundColor: '#9A563A',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#9A563A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: '#cccccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    additionalInfo: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    modalCloseButton: {
        padding: 4,
    },
    modalLoadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    modalLoadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    branchList: {
        padding: 20,
    },
    branchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    selectedBranchItem: {
        backgroundColor: '#E8F5E9',
        borderColor: '#9A563A',
    },
    branchInfo: {
        flex: 1,
    },
    branchName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    branchAddress: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    branchCity: {
        fontSize: 14,
        color: '#9A563A',
        fontWeight: '500',
    },
});