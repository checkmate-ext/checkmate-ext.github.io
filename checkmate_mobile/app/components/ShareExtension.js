// app/components/ShareExtension.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useDeepLinkContext } from '../context/DeepLinkContext';

const ShareExtension = ({ url, title, compact = false }) => {
    const { generateShareUrl } = useDeepLinkContext();

    const theme = {
        ...useTheme(),
        colors: {
            ...useTheme().colors,
            primary: '#8B7355',
            secondary: '#D2B48C',
            accent: '#6B4423',
            text: '#E8DCC4',
        },
    };
    const handleShare = async () => {
        const deepLink = generateShareUrl(url)   // now an exp://… link
        await Share.share({
            message: `CheckMate analysis:\n${title}\n${url}\n\nOpen in app: ${deepLink}`,
            url: Platform.OS === 'ios' ? deepLink : url
        })
    }

 /*   const handleShare = async () => {
        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            // Generate share message
            const shareMessage = `Check the reliability of this article with CheckMate!\n\n${title}\n${url}\n\n`;
            const shareUrl = generateShareUrl(url);

            // Open system share dialog
            const result = await Share.share({
                message: shareMessage + (Platform.OS === 'ios' ? shareUrl : ''),
                url: Platform.OS === 'ios' ? shareUrl : url,
                title: 'Analyze with CheckMate',
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // Shared with activity type of result.activityType
                } else {
                    // Shared
                }
            } else if (result.action === Share.dismissedAction) {
                // Dismissed
            }
        } catch (error) {
            console.error('Error sharing article:', error);
        }
    };*/

    if (compact) {
        return (
            <IconButton
                icon="share-variant"
                mode="contained-tonal"
                containerColor={theme.colors.surface}
                iconColor={theme.colors.secondary}
                size={24}
                onPress={handleShare}
            />
        );
    }

    return (
        <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleShare}
            activeOpacity={0.7}
        >
            <IconButton
                icon="share-variant"
                iconColor={theme.colors.secondary}
                size={20}
            />
            <Text style={{ color: theme.colors.text }}>Share to CheckMate</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        marginVertical: 8,
    },
});

export default ShareExtension;