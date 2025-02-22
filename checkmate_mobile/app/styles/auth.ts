import { StyleSheet } from 'react-native';
import { moderateScale } from 'react-native-size-matters';

export const authStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: moderateScale(24),
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: moderateScale(48), // Increased spacing
        paddingTop: moderateScale(20),
    },
    logo: {
        width: moderateScale(150), // Slightly larger logo
        height: moderateScale(150),
    },
    title: {
        fontSize: moderateScale(36), // Larger title
        fontWeight: '700',
        marginBottom: moderateScale(8),
        textAlign: 'center',
        letterSpacing: 1.2, // Enhanced letter spacing
    },
    subtitle: {
        fontSize: moderateScale(16),
        marginBottom: moderateScale(24),
        textAlign: 'center',
        opacity: 0.9, // Increased opacity for better visibility on dark background
        letterSpacing: 0.5,
    },
    form: {
        width: '100%',
        borderRadius: moderateScale(20), // More pronounced rounding
        gap: moderateScale(20), // Increased spacing between elements
        paddingHorizontal: moderateScale(4), // Slight padding for shadow containment
    },
    inputContainer: {
        marginBottom: moderateScale(20),
        borderRadius: moderateScale(13),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonContainer: {
        gap: moderateScale(16), // Increased gap
        marginTop: moderateScale(12),
    },
    primaryButton: {
        borderRadius: moderateScale(12), // More rounded corners
        paddingVertical: moderateScale(6), // Taller buttons
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    secondaryButton: {
        borderRadius: moderateScale(12),
        borderWidth: 2,
        paddingVertical: moderateScale(6),
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: moderateScale(24), // Increased gap between social buttons
        marginTop: moderateScale(28),
        paddingVertical: moderateScale(8),
    },
    socialButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5, // Slightly thicker border
        borderRadius: moderateScale(16),
        padding: moderateScale(12),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    divider: {
        marginVertical: moderateScale(28), // Increased margin
        height: StyleSheet.hairlineWidth * 2, // Slightly thicker divider
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: moderateScale(28),
        gap: moderateScale(6),
        paddingBottom: moderateScale(16),
    },
});