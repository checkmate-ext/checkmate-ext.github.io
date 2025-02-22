import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';

export default function Home() {
    const colorScheme = useColorScheme();

    return (
        <ScrollView style={[
            styles.container,
            { backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF' }
        ]}>
            <View style={styles.header}>
                <Image
                    source={require('../../assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={[
                    styles.welcome,
                    { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
                ]}>
                    Welcome to Checkmate
                </Text>
            </View>

            {/* Add your home screen content here */}
            <View style={styles.content}>
                <Text style={[
                    styles.contentText,
                    { color: colorScheme === 'dark' ? '#FFFFFF' : '#000000' }
                ]}>
                    Your home screen content goes here
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8B6B44',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#2A2A2A',
        padding: 15,
        borderRadius: 8,
        color: '#FFF',
        marginBottom: 15,
        width: '100%',
    },
    button: {
        backgroundColor: '#8B6B44',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        color: '#8B6B44',
        marginTop: 15,
        textAlign: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#666',
    },
    linkText: {
        color: '#8B6B44',
        fontWeight: '600',
    },
    backButton: {
        marginTop: 20,
    },
    backButtonText: {
        color: '#8B6B44',
        fontSize: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logo: {
        width: 150,
        height: 150,
        marginBottom: 20,
    },
    welcome: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
    },
    contentText: {
        fontSize: 16,
        textAlign: 'center',
    },
});