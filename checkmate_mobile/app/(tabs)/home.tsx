import {View, Animated, ScrollView, Image} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useState, useRef, useEffect} from 'react';
import {
    Button,
    Text,
    useTheme,
    Card,
    FAB
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import {LinearGradient} from 'expo-linear-gradient';

export default function Home() {
    const {signOut, user} = useAuth();
    const [loading, setLoading] = useState(false);

    const theme = {
        ...useTheme(),
        colors: {
            ...useTheme().colors,
            primary: '#8B7355',
            secondary: '#D2B48C',
            accent: '#6B4423',
            background: '#1A1612',
            surface: '#2A241E',
            text: '#E8DCC4',
            placeholder: '#A89880',
            backdrop: 'rgba(26, 22, 18, 0.5)',
        },
    };

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleLogout = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setLoading(true);
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Logout error:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <ScrollView>
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                        transform: [
                            {translateY: slideAnim},
                            {scale: scaleAnim}
                        ],
                        padding: 20,
                    }}
                >
                    <View style={{alignItems: 'center', marginVertical: 30}}>
                        <Animated.View
                            style={{
                                transform: [{scale: scaleAnim}],
                                shadowColor: theme.colors.secondary,
                                shadowOffset: {width: 0, height: 0},
                                shadowRadius: 20,
                                shadowOpacity: 0.3,
                            }}
                        >
                            <Image
                                source={require('../../assets/images/logo_no_title.png')}
                                style={{
                                    width: 150,
                                    height: 150,
                                    marginBottom: 10
                                }}
                                resizeMode="contain"
                            />
                        </Animated.View>
                        <Text
                            variant="displaySmall"
                            style={{
                                color: theme.colors.secondary,
                                textShadowColor: theme.colors.accent,
                                textShadowOffset: {width: 0, height: 0},
                                textShadowRadius: 8,
                                marginTop: 20,
                            }}
                        >
                            Welcome, User
                        </Text>
                    </View>

                    <Card
                        style={{
                            backgroundColor: theme.colors.surface,
                            marginBottom: 20,
                            borderRadius: 15,
                        }}
                    >
                        <Card.Content>
                            <Text
                                variant="titleLarge"
                                style={{color: theme.colors.text, marginBottom: 10}}
                            >
                                Dashboard
                            </Text>
                            <Text
                                variant="bodyLarge"
                                style={{color: theme.colors.text}}
                            >
                                Your content goes here
                            </Text>
                        </Card.Content>
                    </Card>

                    <Button
                        mode="contained"
                        onPress={handleLogout}
                        loading={loading}
                        icon="logout"
                        contentStyle={{paddingVertical: 8}}
                        buttonColor={theme.colors.accent}
                        textColor={theme.colors.text}
                        style={{
                            borderRadius: 12,
                            shadowColor: theme.colors.accent,
                            shadowOffset: {width: 0, height: 4},
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                            marginTop: 20,
                        }}
                    >
                        {loading ? 'Logging out...' : 'Logout'}
                    </Button>
                </Animated.View>
            </ScrollView>

            <FAB
                icon="account"
                style={{
                    position: 'absolute',
                    margin: 16,
                    right: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.accent,
                }}
                color={theme.colors.text}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Add your FAB action here
                }}
            />
        </LinearGradient>
    );
}