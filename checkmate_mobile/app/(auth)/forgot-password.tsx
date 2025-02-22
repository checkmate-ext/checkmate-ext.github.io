// app/(auth)/forgot-password.tsx
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { authStyles } from '../styles/auth';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');

    const handleResetPassword = () => {
        // Add your password reset logic here
        console.log('Reset password for:', email);
        alert('Password reset instructions sent to your email');
        router.back();
    };

    return (
        <View style={authStyles.container}>
            <Text style={authStyles.title}>Reset Password</Text>
            <Text style={authStyles.subtitle}>
                Enter your email to receive password reset instructions
            </Text>

            <TextInput
                style={authStyles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#666"
            />

            <TouchableOpacity style={authStyles.button} onPress={handleResetPassword}>
                <Text style={authStyles.buttonText}>Reset Password</Text>
            </TouchableOpacity>

            <Link href="/login" asChild>
                <TouchableOpacity style={authStyles.footer}>
                    <Text style={authStyles.linkText}>Back to Login</Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
}