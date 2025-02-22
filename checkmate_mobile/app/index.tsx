import { View, Image, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function Index() {
    const colorScheme = useColorScheme();

    return (
        <View style={[
            styles.container,
            { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF' }
        ]}>
            <Image
                source={require('../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            <Text style={[
                styles.title,
                { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
            ]}>
                Welcome to Checkmate
            </Text>

            <Link href="/(auth)/login" asChild>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
            </Link>

            <Link href="/(auth)/signup" asChild>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign Up</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#8B6B44',
        padding: 15,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginBottom: 15,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#8B6B44',
    },
    secondaryButtonText: {
        color: '#8B6B44',
    },
});