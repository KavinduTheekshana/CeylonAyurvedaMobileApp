import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { HeaderBackButton } from '@react-navigation/elements';

type RouteParams = {
    params: {
        serviceId: number;
        serviceName: string;
    };
};

const BookingScreen = () => {
    const route = useRoute<RouteProp<RouteParams, 'params'>>();
    const navigation = useNavigation();
    const { serviceId, serviceName } = route.params;

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: `Book ${serviceName}`,
            headerLeft: () => (
                <HeaderBackButton
                    onPress={() => navigation.goBack()}
                    tintColor="#000"
                />
            ),
        });
    }, [navigation, serviceName]);

    const handleSubmit = () => {
        // Validate form
        if (!name || !email || !phone || !date || !time) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        setLoading(true);

        // Sample booking submission - replace with your actual API
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                'Booking Successful',
                'Your appointment has been scheduled. We will contact you shortly to confirm.',
                [
                    {
                        text: 'OK',
                        // onPress: () => navigation.navigate()
                    }
                ]
            );
        }, 1500);

        // Actual API call would look something like:

        fetch('https://app.ceylonayurvedahealth.co.uk/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                serviceId,
                name,
                email,
                phone,
                date,
                time,
                notes
            }),
        })
        .then(response => response.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                Alert.alert(
                    'Booking Successful',
                    'Your appointment has been scheduled. We will contact you shortly to confirm.',
                    [
                        {
                            text: 'OK',
                            // onPress: () => navigation.navigate('Home')
                        }
                    ]
                );
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        })
        .catch(error => {
            setLoading(false);
            Alert.alert('Error', 'Failed to complete booking. Please try again.');
            console.error('Booking error:', error);
        });

    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.serviceTitle}>{serviceName}</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Name *</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email *</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone *</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.row}>
                    <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Date *</Text>
                        <TextInput
                            style={styles.input}
                            value={date}
                            onChangeText={setDate}
                            placeholder="DD/MM/YYYY"
                        />
                    </View>

                    <View style={[styles.inputGroup, styles.halfWidth]}>
                        <Text style={styles.label}>Time *</Text>
                        <TextInput
                            style={styles.input}
                            value={time}
                            onChangeText={setTime}
                            placeholder="HH:MM"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Additional Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any specific requirements or information"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.submitButtonText}>Confirm Booking</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    formContainer: {
        padding: 16,
    },
    serviceTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    submitButton: {
        backgroundColor: '#007bff',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default BookingScreen;