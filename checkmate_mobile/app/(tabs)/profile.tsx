// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Platform, Dimensions } from 'react-native';
import { Text, Card, Button, Avatar, Divider, useTheme, IconButton, Menu, Dialog, Portal, TextInput, HelperText } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { API_URL } from '../constants/Config';
import ResponsiveUtils from '../utils/ResponsiveUtils';
import createResponsiveStyles from '../styles/responsive-styles';

export default function Profile() {
    const { user, signOut, token } = useAuth();
    const [menuVisible, setMenuVisible] = useState(false);
    const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
    const [reportDialogVisible, setReportDialogVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [reportType, setReportType] = useState('Bug');
    const [reportMessage, setReportMessage] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [planDialogVisible, setPlanDialogVisible] = useState(false);
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    // Update dimensions when screen size changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });

        return () => {
            // Clean up based on RN version
            if (typeof subscription?.remove === 'function') {
                subscription.remove();
            }
        };
    }, []);

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
        },
    };

    // Get responsive styles
    const responsiveStyles = createResponsiveStyles(theme);

    const styles = StyleSheet.create({
        container: {
            padding: ResponsiveUtils.moderateScale(20),
            flex: 1,
        },
        header: {
            alignItems: 'center',
            marginBottom: ResponsiveUtils.moderateScale(20),
        },
        profileAvatar: {
            backgroundColor: theme.colors.accent,
            marginBottom: ResponsiveUtils.moderateScale(10),
        },
        username: {
            fontSize: ResponsiveUtils.normalizeFont(22),
            fontWeight: 'bold',
            color: theme.colors.text,
            marginTop: ResponsiveUtils.moderateScale(10),
        },
        email: {
            fontSize: ResponsiveUtils.normalizeFont(16),
            color: theme.colors.placeholder,
        },
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: ResponsiveUtils.moderateScale(20),
            borderRadius: ResponsiveUtils.moderateScale(15),
            padding: ResponsiveUtils.moderateScale(15),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 5,
        },
        cardTitle: {
            fontSize: ResponsiveUtils.normalizeFont(18),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: ResponsiveUtils.moderateScale(10),
        },
        menuButton: {
            position: 'absolute',
            top: ResponsiveUtils.moderateScale(10),
            right: ResponsiveUtils.moderateScale(10),
        },
        settingRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: ResponsiveUtils.moderateScale(12),
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(107, 68, 35, 0.2)',
            flexWrap: 'wrap', // Allow wrapping on smaller screens
        },
        settingLabel: {
            fontSize: ResponsiveUtils.normalizeFont(16),
            color: theme.colors.text,
            flex: 1, // Take available space
            paddingRight: ResponsiveUtils.moderateScale(10),
        },
        settingValue: {
            fontSize: ResponsiveUtils.normalizeFont(16),
            color: theme.colors.secondary,
            textAlign: 'right',
        },
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            marginVertical: ResponsiveUtils.moderateScale(15),
        },
        input: {
            marginBottom: ResponsiveUtils.moderateScale(15),
            backgroundColor: theme.colors.background,
        },
        dialogContent: {
            backgroundColor: theme.colors.surface,
        },
        dialogActions: {
            justifyContent: 'space-between',
            paddingHorizontal: ResponsiveUtils.moderateScale(10),
            paddingBottom: ResponsiveUtils.moderateScale(10),
        },
        logoutButton: {
            marginTop: ResponsiveUtils.moderateScale(20),
        },
        // Adjust dialog width based on screen size
        dialogStyle: {
            backgroundColor: theme.colors.surface,
            width: dimensions.width > 600
                ? Math.min(dimensions.width * 0.7, 500)
                : dimensions.width * 0.9,
            alignSelf: 'center',
        },
    });

    const handleChangePassword = async () => {
        // Validate passwords
        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }

        if (!newPassword) {
            setPasswordError('New password is required');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            return;
        }

        try {
            setPasswordLoading(true);
            setPasswordError('');

            const response = await axios.post(
                `${API_URL}/user/update-password`,
                { new_password: newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPasswordDialogVisible(false);

            // Reset fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (error) {
            console.error('Error changing password:', error);
            setPasswordError('Failed to update password. Please try again.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSubmitReport = async () => {
        if (!reportMessage) {
            return;
        }

        try {
            setReportLoading(true);

            const response = await axios.post(
                `${API_URL}/report`,
                {
                    reportType,
                    message: reportMessage
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setReportDialogVisible(false);
            setReportMessage('');

        } catch (error) {
            console.error('Error submitting report:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setReportLoading(false);
        }
    };

    const handleSubscriptionChange = async (newPlan) => {
        try {
            const response = await axios.post(
                `${API_URL}/user/update-plan`,
                { plan: newPlan },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPlanDialogVisible(false);

        } catch (error) {
            console.error('Error updating subscription:', error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleSignOut = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await signOut();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <LinearGradient
            colors={['#1A1612', '#241E19', '#2A241E']}
            style={{flex: 1}}
        >
            <SafeAreaView style={{flex: 1}}>
                <ScrollView>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Avatar.Text
                                size={ResponsiveUtils.moderateScale(100)}
                                label={user?.email ? user.email[0].toUpperCase() : 'U'}
                                style={styles.profileAvatar}
                                color={theme.colors.text}
                            />
                            <Text style={styles.username}>
                                {user?.email ? user.email.split('@')[0] : 'User'}
                            </Text>
                            <Text style={styles.email}>
                                {user?.email || 'user@example.com'}
                            </Text>
                        </View>

                        <Card style={styles.card}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <Text style={styles.cardTitle}>Account Settings</Text>
                                <Menu
                                    visible={menuVisible}
                                    onDismiss={() => setMenuVisible(false)}
                                    anchor={
                                        <IconButton
                                            icon="dots-vertical"
                                            iconColor={theme.colors.secondary}
                                            size={24}
                                            onPress={() => setMenuVisible(true)}
                                        />
                                    }
                                    contentStyle={{backgroundColor: theme.colors.surface}}
                                >
                                    <Menu.Item
                                        onPress={() => {
                                            setMenuVisible(false);
                                            setReportDialogVisible(true);
                                        }}
                                        title="Report Issue"
                                        titleStyle={{color: theme.colors.text}}
                                        leadingIcon="flag"
                                    />
                                    <Menu.Item
                                        onPress={handleSignOut}
                                        title="Logout"
                                        titleStyle={{color: theme.colors.text}}
                                        leadingIcon="logout"
                                    />
                                </Menu>
                            </View>

                            <Divider style={styles.divider} />

                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Email</Text>
                                <Text style={styles.settingValue} numberOfLines={1} ellipsizeMode="tail">
                                    {user?.email || 'user@example.com'}
                                </Text>
                            </View>

                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Subscription Plan</Text>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text
                                        style={[
                                            styles.settingValue,
                                            {
                                                color: user?.subscription_plan === 'Premium'
                                                    ? '#4CAF50'
                                                    : theme.colors.secondary
                                            }
                                        ]}
                                    >
                                        {user?.subscription_plan || 'Free'}
                                    </Text>
                                    <IconButton
                                        icon="pencil"
                                        iconColor={theme.colors.secondary}
                                        size={ResponsiveUtils.moderateScale(20)}
                                        onPress={() => setPlanDialogVisible(true)}
                                    />
                                </View>
                            </View>

                            <View style={styles.settingRow}>
                                <Text style={styles.settingLabel}>Password</Text>
                                <Button
                                    mode="text"
                                    onPress={() => setPasswordDialogVisible(true)}
                                    textColor={theme.colors.secondary}
                                >
                                    Change
                                </Button>
                            </View>

                            <View style={[styles.settingRow, {borderBottomWidth: 0}]}>
                                <Text style={styles.settingLabel}>Account Created</Text>
                                <Text style={styles.settingValue}>
                                    {user?.created_at
                                        ? new Date(user.created_at).toLocaleDateString()
                                        : new Date().toLocaleDateString()
                                    }
                                </Text>
                            </View>
                        </Card>

                        <Button
                            mode="contained"
                            onPress={handleSignOut}
                            icon="logout"
                            buttonColor={theme.colors.accent}
                            textColor={theme.colors.text}
                            style={[responsiveStyles.primaryButton, styles.logoutButton]}
                        >
                            Logout
                        </Button>
                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Password Change Dialog */}
            <Portal>
                <Dialog
                    visible={passwordDialogVisible}
                    onDismiss={() => setPasswordDialogVisible(false)}
                    style={styles.dialogStyle}
                >
                    <Dialog.Title style={{color: theme.colors.secondary}}>Change Password</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            mode="outlined"
                            style={styles.input}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                        />
                        <TextInput
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            mode="outlined"
                            style={styles.input}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                        />
                        <TextInput
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            mode="outlined"
                            style={styles.input}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                        />

                        {passwordError ? (
                            <HelperText type="error" visible={!!passwordError}>
                                {passwordError}
                            </HelperText>
                        ) : null}
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            onPress={() => setPasswordDialogVisible(false)}
                            textColor={theme.colors.text}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={handleChangePassword}
                            loading={passwordLoading}
                            textColor={theme.colors.secondary}
                        >
                            Update
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Report Dialog */}
            <Portal>
                <Dialog
                    visible={reportDialogVisible}
                    onDismiss={() => setReportDialogVisible(false)}
                    style={styles.dialogStyle}
                >
                    <Dialog.Title style={{color: theme.colors.secondary}}>Report an Issue</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Issue Type"
                            value={reportType}
                            onChangeText={setReportType}
                            mode="outlined"
                            style={styles.input}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                        />
                        <TextInput
                            label="Description"
                            value={reportMessage}
                            onChangeText={setReportMessage}
                            mode="outlined"
                            multiline
                            numberOfLines={4}
                            style={styles.input}
                            textColor={theme.colors.text}
                            outlineColor={theme.colors.primary}
                            activeOutlineColor={theme.colors.secondary}
                        />
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            onPress={() => setReportDialogVisible(false)}
                            textColor={theme.colors.text}
                        >
                            Cancel
                        </Button>
                        <Button
                            onPress={handleSubmitReport}
                            loading={reportLoading}
                            textColor={theme.colors.secondary}
                        >
                            Submit
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Subscription Dialog */}
            <Portal>
                <Dialog
                    visible={planDialogVisible}
                    onDismiss={() => setPlanDialogVisible(false)}
                    style={styles.dialogStyle}
                >
                    <Dialog.Title style={{color: theme.colors.secondary}}>Change Subscription</Dialog.Title>
                    <Dialog.Content>
                        <Text style={{color: theme.colors.text, marginBottom: ResponsiveUtils.moderateScale(10)}}>
                            Choose your subscription plan:
                        </Text>

                        <Button
                            mode={user?.subscription_plan === 'Free' ? 'contained' : 'outlined'}
                            style={{marginBottom: ResponsiveUtils.moderateScale(10)}}
                            buttonColor={user?.subscription_plan === 'Free' ? theme.colors.accent : undefined}
                            textColor={user?.subscription_plan === 'Free' ? theme.colors.text : theme.colors.secondary}
                        >
                            Free
                        </Button>

                        <Button
                            mode={user?.subscription_plan === 'Premium' ? 'contained' : 'outlined'}
                            buttonColor={user?.subscription_plan === 'Premium' ? theme.colors.accent : undefined}
                            textColor={user?.subscription_plan === 'Premium' ? theme.colors.text : theme.colors.secondary}
                        >
                            Premium
                        </Button>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button
                            onPress={() => setPlanDialogVisible(false)}
                            textColor={theme.colors.text}
                        >
                            Cancel
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </LinearGradient>
    );
}