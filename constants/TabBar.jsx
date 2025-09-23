import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons'; // Add Ionicons import

const TabBar = ({ state, descriptors, navigation }) => {

    const primaryColor = '#9A563A';
    const greyColor = '#737373';

    const icons = {
        index: (props) => <AntDesign name="home" size={26} {...props} />,
        bookings: (props) => <Feather name="calendar" size={26} {...props} />,
        search: (props) => <AntDesign name="pluscircleo" size={26} {...props} />,
        messages: (props) => <Ionicons name={props.focused ? "chatbubble" : "chatbubble-outline"} size={24} {...props} />, // Add messages icon
        profiles: (props) => <AntDesign name="user" size={26} {...props} />,
    };

    // Define custom labels for better display
    const labels = {
        index: 'Home',
        bookings: 'Bookings',
        search: 'Search',
        messages: 'Messages',
        profiles: 'Profile',
    };

    return (
        <View style={styles.tabbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = labels[route.name] || options.tabBarLabel || options.title || route.name;

                if (['_sitemap', '+not-found'].includes(route.name)) return null;

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };

                return (
                    <TouchableOpacity
                        key={route.name}
                        style={styles.tabbarItem}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    >
                        {icons[route.name] && icons[route.name]({
                            color: isFocused ? primaryColor : greyColor,
                            focused: isFocused // Pass focused state for conditional icons
                        })}
                        <Text style={{
                            color: isFocused ? primaryColor : greyColor,
                            fontSize: 11,
                            fontWeight: isFocused ? '600' : '400' // Add font weight for better visibility
                        }}>
                            {label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    )
}

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        bottom: 25,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 25,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 10,
        shadowOpacity: 0.3,
        elevation: 10, // Add elevation for Android shadow
    },
    tabbarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 5, // Add padding for better touch area
    }
});

export default TabBar;