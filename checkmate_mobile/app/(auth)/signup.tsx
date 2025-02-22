// app/(auth)/signup.tsx
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { authStyles } from '../styles/auth';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = () => {
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        // Add your signup logic here
        console.log('Signing up:', email, password);
        router.replace('/(tabs)/home');
    };

    return (
        <View style={authStyles.container}>
            <Text style={authStyles.title}>Create Account</Text>

            <TextInput
                style={authStyles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#666"
            />

            <TextInput
                style={authStyles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#666"
            />

            <TextInput
                style={authStyles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#666"
            />

            <TouchableOpacity style={authStyles.button} onPress={handleSignUp}>
                <Text style={authStyles.buttonText}>Sign Up</Text>
            </TouchableOpacity>

            <View style={authStyles.footer}>
                <Text style={authStyles.footerText}>Already have an account? </Text>
                <Link href="/login" asChild>
                    <TouchableOpacity>
                        <Text style={authStyles.linkText}>Log In</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}