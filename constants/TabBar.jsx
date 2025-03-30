import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import React from 'react'
import { AntDesign, Feather } from '@expo/vector-icons';

const TabBar = ({ state, descriptors, navigation }) => {

    const primaryColor = '#9A563A';
    const greyColor = '#737373';

    const icons = {
        index: (props) => <AntDesign name="home" size={26} {...props} />,
        saved: (props) => <Feather name="compass" size={26} {...props} />,
        search: (props) => <AntDesign name="pluscircleo" size={26} {...props} />,
        profiles: (props) => <AntDesign name="user" size={26} {...props} />,
    };

    return (
        <View style={styles.tabbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel || options.title || route.name;

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
                            color: isFocused ? primaryColor : greyColor
                        })}
                        <Text style={{
                            color: isFocused ? primaryColor : greyColor,
                            fontSize: 11
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
    },
    tabbarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4
    }
});

export default TabBar;
