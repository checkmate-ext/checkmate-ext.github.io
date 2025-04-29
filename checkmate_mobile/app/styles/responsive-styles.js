// app/styles/responsive-styles.js
import { StyleSheet } from 'react-native';
import ResponsiveUtils from '../utils/ResponsiveUtils';

/**
 * Creates responsive styles to be used across the application
 * @param {Object} theme - The current theme object with colors
 * @returns {Object} StyleSheet object with responsive styles
 */
export const createResponsiveStyles = (theme) => {
    return StyleSheet.create({
        // Container styles
        container: {
            padding: ResponsiveUtils.moderateScale(16),
            flex: 1,
        },
        centeredContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: ResponsiveUtils.moderateScale(16),
        },
        screenContainer: {
            flex: 1,
        },

        // Card styles
        card: {
            backgroundColor: theme.colors.surface,
            marginBottom: ResponsiveUtils.moderateScale(16),
            borderRadius: ResponsiveUtils.moderateScale(12),
            padding: ResponsiveUtils.moderateScale(16),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
        },
        compactCard: {
            backgroundColor: theme.colors.surface,
            marginBottom: ResponsiveUtils.moderateScale(10),
            borderRadius: ResponsiveUtils.moderateScale(8),
            padding: ResponsiveUtils.moderateScale(12),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 1},
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
        },

        // Typography styles
        title: {
            fontSize: ResponsiveUtils.normalizeFont(22),
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: ResponsiveUtils.moderateScale(16),
        },
        subtitle: {
            fontSize: ResponsiveUtils.normalizeFont(18),
            fontWeight: 'bold',
            color: theme.colors.secondary,
            marginBottom: ResponsiveUtils.moderateScale(12),
        },
        bodyText: {
            fontSize: ResponsiveUtils.normalizeFont(14),
            color: theme.colors.text,
            marginBottom: ResponsiveUtils.moderateScale(8),
        },
        caption: {
            fontSize: ResponsiveUtils.normalizeFont(12),
            color: theme.colors.placeholder,
        },

        // Form styles
        inputContainer: {
            marginBottom: ResponsiveUtils.moderateScale(16),
            backgroundColor: theme.colors.surface,
        },
        button: {
            borderRadius: ResponsiveUtils.moderateScale(8),
            paddingVertical: ResponsiveUtils.moderateScale(8),
            marginVertical: ResponsiveUtils.moderateScale(8),
        },
        primaryButton: {
            backgroundColor: theme.colors.accent,
            borderRadius: ResponsiveUtils.moderateScale(12),
            marginTop: ResponsiveUtils.moderateScale(16),
            paddingVertical: ResponsiveUtils.moderateScale(6),
            shadowColor: theme.colors.accent,
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
        },

        // Layout styles
        row: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        spaceBetween: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        centeredContent: {
            alignItems: 'center',
            justifyContent: 'center',
        },

        // Divider
        divider: {
            backgroundColor: theme.colors.primary,
            opacity: 0.3,
            height: 1,
            marginVertical: ResponsiveUtils.moderateScale(12),
        },

        // Error and notification styles
        errorText: {
            color: '#F44336',
            fontSize: ResponsiveUtils.normalizeFont(14),
            marginTop: ResponsiveUtils.moderateScale(4),
        },
        successText: {
            color: '#4CAF50',
            fontSize: ResponsiveUtils.normalizeFont(14),
            marginTop: ResponsiveUtils.moderateScale(4),
        },

        // List item styles
        listItem: {
            padding: ResponsiveUtils.moderateScale(12),
            backgroundColor: theme.colors.surface,
            borderRadius: ResponsiveUtils.moderateScale(8),
            marginBottom: ResponsiveUtils.moderateScale(8),
        },

        // Spacing utilities
        marginSmall: {
            margin: ResponsiveUtils.moderateScale(4),
        },
        marginMedium: {
            margin: ResponsiveUtils.moderateScale(8),
        },
        marginLarge: {
            margin: ResponsiveUtils.moderateScale(16),
        },
        paddingSmall: {
            padding: ResponsiveUtils.moderateScale(4),
        },
        paddingMedium: {
            padding: ResponsiveUtils.moderateScale(8),
        },
        paddingLarge: {
            padding: ResponsiveUtils.moderateScale(16),
        },

        // Screen-specific styles for auth screens
        authContainer: {
            flex: 1,
            padding: ResponsiveUtils.moderateScale(24),
            justifyContent: 'center',
        },
        logoContainer: {
            alignItems: 'center',
            marginBottom: ResponsiveUtils.moderateScale(30),
        },
        form: {
            width: '100%',
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: ResponsiveUtils.moderateScale(20),
        },
    });
};

export default createResponsiveStyles;