// App.js
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import {
    Feather,
    MaterialIcons,
    Ionicons,
    FontAwesome,
    AntDesign
} from '@expo/vector-icons';

export default function App() {
    const menuItems = [
        {
            title: 'Activity',
            items: [
                {
                    icon: <Feather name="bookmark" size={24} color="black"/>,
                    label: 'Archive Goals',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="repeat" size={24} color="black"/>,
                    label: 'Link Bank Account',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <FontAwesome name="circle-o" size={24} color="black"/>,
                    label: 'Billing & Subscriptions',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <FontAwesome name="credit-card" size={24} color="black"/>,
                    label: 'Payment Methods',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="shield" size={24} color="black"/>,
                    label: 'Account & Security',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
            ]
        },
        {
            title: 'General',
            items: [
                {
                    icon: <Ionicons name="settings-outline" size={24} color="black"/>,
                    label: 'Preferences',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Ionicons name="eye-outline" size={24} color="black"/>,
                    label: 'App Appearance',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <Feather name="help-circle" size={24} color="black"/>,
                    label: 'Help & Support',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },
                {
                    icon: <AntDesign name="like2" size={24} color="black"/>,
                    label: 'Rate Us',
                    rightIcon: <MaterialIcons name="keyboard-arrow-right" size={24} color="#ccc"/>
                },

            ]
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Feather name="user" size={40} color="black"/>
                        </View>
                    </View>

                    {/* PRO Badge */}
                    <View style={styles.proBadgeContainer}>
                        <View style={styles.proBadge}>
                            <Feather name="award" size={18} color="white"/>
                            <Text style={styles.proBadgeText}>Regular</Text>
                        </View>
                    </View>

                    <Text style={styles.userName}>Steve Young</Text>
                    <Text style={styles.userEmail}>steve.young@gmail.com</Text>

                    {/*<TouchableOpacity style={styles.infoButton}>*/}
                    {/*    <Text style={styles.infoButtonText}>Personal Info</Text>*/}
                    {/*</TouchableOpacity>*/}
                </View>

                {/* Menu Sections */}
                {menuItems.map((section, sectionIndex) => (
                    <View key={sectionIndex} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.items.map((item, itemIndex) => (
                            <TouchableOpacity
                                key={itemIndex}
                                style={[
                                    styles.menuItem,
                                    itemIndex === section.items.length - 1 && styles.lastMenuItem
                                ]}
                            >
                                <View style={styles.menuItemLeft}>
                                    {item.icon}
                                    <Text style={
                                        styles.menuItemText
                                    }>
                                        {item.label}
                                    </Text>
                                </View>
                                {item.rightIcon}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Logout Button */}
                <View style={styles.logoutContainer}>
                    <TouchableOpacity style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                        <Feather name="log-out" size={20} color="#f56342"/>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        margin: 20,
        paddingBottom: 50,
        marginBottom: 50,
    },
    profileHeader: {
        marginTop: 20,
        borderRadius: 10,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proBadgeContainer: {
        marginBottom: 10,
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f56342',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    proBadgeText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 16,
        color: '#666',
        marginBottom: 15,
    },
    boldText: {
        fontWeight: 'bold',
    },
    infoButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 24,
        marginTop: 10,
    },
    infoButtonText: {
        fontSize: 16,
    },
    section: {
        marginVertical: 15,
        paddingHorizontal: 10,
        paddingVertical: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 15,
        marginBottom: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 15,
        // borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
    },
    logoutContainer: {
        marginBottom: 30,
        paddingBottom: 40,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    logoutText: {
        color: '#f56342',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
});