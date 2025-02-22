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
        marginBottom: moderateScale(40),
    },
    logo: {
        width: moderateScale(140),
        height: moderateScale(140),
    },
    title: {
        fontSize: moderateScale(32),
        fontWeight: '700',
        marginBottom: moderateScale(8),
        textAlign: 'center',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: moderateScale(16),
        marginBottom: moderateScale(24),
        textAlign: 'center',
        opacity: 0.87,
    },
    form: {
        width: '100%',
        borderRadius: moderateScale(16),
        gap: moderateScale(16),
    },
    inputContainer: {
        marginBottom: moderateScale(16),
    },
    buttonContainer: {
        gap: moderateScale(12),
        marginTop: moderateScale(8),
    },
    primaryButton: {
        borderRadius: moderateScale(8),
        paddingVertical: moderateScale(4),
    },
    secondaryButton: {
        borderRadius: moderateScale(8),
        borderWidth: 2,
    },
    socialButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: moderateScale(20),
        marginTop: moderateScale(24),
    },
    socialButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderRadius: moderateScale(12),
    },
    divider: {
        marginVertical: moderateScale(24),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: moderateScale(24),
        gap: moderateScale(4),
    },
});