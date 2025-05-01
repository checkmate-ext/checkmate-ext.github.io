// app/utils/ResponsiveUtils.js - Enhanced version
import { Dimensions, Platform, PixelRatio, StatusBar } from 'react-native';

// Get dimensions with proper type safety
const window = Dimensions.get('window');
const screen = Dimensions.get('screen');

// Base dimensions that we're designing for (Standard iPhone dimensions)
const baseWidth = 375;
const baseHeight = 812;

// Scales based on current dimensions
const getWidthScale = () => window.width / baseWidth;
const getHeightScale = () => window.height / baseHeight;

// Dynamic scaling that updates with dimension changes
export const normalizeFont = (size) => {
    const scale = Math.min(getWidthScale(), getHeightScale());
    const newSize = size * scale;

    // Different handling for iOS and Android
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - (size >= 20 ? 2 : 1);
    }
};

// Scale dimensions based on screen width
export const horizontalScale = (size) => {
    return size * getWidthScale();
};

// Scale dimensions based on screen height
export const verticalScale = (size) => {
    return size * getHeightScale();
};

// Scale with a more moderate ratio for padding/margin etc
export const moderateScale = (size, factor = 0.5) => {
    return size + ((horizontalScale(size) - size) * factor);
};

// Get dynamic chart dimensions based on screen size
export const getChartDimensions = () => {
    const chartWidth = window.width * 0.85;
    // Chart height is proportional but capped
    const chartHeight = Math.min(220, window.height * 0.25);
    return { width: chartWidth, height: chartHeight };
};

// Get card width for grid layouts
export const getCardWidth = (numColumns = 2, padding = 10) => {
    const totalPadding = padding * (numColumns + 1);
    return (window.width - totalPadding) / numColumns;
};

// Safe area insets for notched devices
export const getSafeAreaInsets = () => {
    const isIphoneX =
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (window.height >= 812 || window.width >= 812);

    return {
        top: isIphoneX ? 44 : StatusBar.currentHeight || 20,
        bottom: isIphoneX ? 34 : 0,
        left: isIphoneX ? 44 : 0,
        right: isIphoneX ? 44 : 0,
    };
};

// Get responsive padding based on screen size
export const getResponsivePadding = () => {
    const baseScreenPadding = 24;
    if (window.width < 350) return baseScreenPadding * 0.75;
    if (window.width > 600) return baseScreenPadding * 1.5;
    return baseScreenPadding;
};

// Get optimal container width for forms
export const getOptimalFormWidth = () => {
    if (window.width >= 800) return 600; // For tablets/large screens
    if (window.width >= 500) return window.width * 0.85; // For medium phones
    return window.width * 0.92; // For small phones
};

// Responsive spacing utility for smaller screens
export const getResponsiveSpacing = (defaultValue) => {
    const scale = window.height < 700 ? 0.75 : window.height > 900 ? 1.1 : 1;
    return defaultValue * scale;
};

export default {
    normalizeFont,
    horizontalScale,
    verticalScale,
    moderateScale,
    getChartDimensions,
    getCardWidth,
    getSafeAreaInsets,
    getResponsivePadding,
    getOptimalFormWidth,
    getResponsiveSpacing,
    screenWidth: window.width,
    screenHeight: window.height
};