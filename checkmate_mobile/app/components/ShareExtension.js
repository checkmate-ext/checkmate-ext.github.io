// app/components/ShareExtension.js
import React from 'react';
import { TouchableOpacity, StyleSheet, Share, Platform } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useDeepLinkContext } from '../context/DeepLinkContext';

const ShareExtension = ({ url, title, compact = false }) => {
    const { generateShareUrl } = useDeepLinkContext();
    const theme = useTheme();

    const handleShare = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const deepLink = generateShareUrl(url);
        const baseMessage = `Check the reliability of this article with CheckMate!\n\n${title}\n\n`;

        try {
            if (Platform.OS === 'ios') {
                await Share.share({
                    title: 'Analyze with CheckMate',
                    message: baseMessage,
                    url: deepLink || url
                });
            } else {
                // Android merges URL into the message
                await Share.share({
                    title: 'Analyze with CheckMate',
                    message: `${baseMessage}${deepLink || url}`
                });
            }
        } catch (error) {
            console.error('Error sharing article:', error);
        }
    };

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
