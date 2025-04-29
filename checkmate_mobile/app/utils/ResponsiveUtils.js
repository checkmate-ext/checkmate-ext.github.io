// app/utils/ResponsiveUtils.js
import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions that we're designing for (Standard iPhone dimensions)
const baseWidth = 375;
const baseHeight = 812;

// Scales
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Function to normalize font sizes across different screen sizes
export const normalizeFont = (size) => {
    const newSize = size * widthScale;

    // Different handling for iOS and Android
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
};

// Scale dimensions based on screen width
export const horizontalScale = (size) => {
    return size * widthScale;
};

// Scale dimensions based on screen height
export const verticalScale = (size) => {
    return size * heightScale;
};

// Scale with a more moderate ratio for padding/margin etc
export const moderateScale = (size, factor = 0.5) => {
    return size + (horizontalScale(size) - size) * factor;
};

// Get dynamic chart dimensions based on screen size
export const getChartDimensions = () => {
    // Chart width is 90% of screen width with padding
    const chartWidth = SCREEN_WIDTH * 0.85;

    // Chart height is proportional but capped
    const chartHeight = Math.min(220, SCREEN_HEIGHT * 0.25);

    return { width: chartWidth, height: chartHeight };
};

// Get card width for grid layouts
export const getCardWidth = (numColumns = 2, padding = 10) => {
    const totalPadding = padding * (numColumns + 1);
    return (SCREEN_WIDTH - totalPadding) / numColumns;
};

// Safe area insets for notched devices
export const getSafeAreaInsets = () => {
    const isIphoneX =
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (SCREEN_HEIGHT >= 812 || SCREEN_WIDTH >= 812);

    return {
        top: isIphoneX ? 44 : 20,
        bottom: isIphoneX ? 34 : 0,
        left: isIphoneX ? 44 : 0,
        right: isIphoneX ? 44 : 0,
    };
};

// Track screen dimensions changes (useful for orientation changes)
export const useDimensionsChange = (callback) => {
    React.useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            callback(window);
        });

        return () => {
            // For newer React Native versions
            if (typeof subscription?.remove === 'function') {
                subscription.remove();
            } else {
                // For older React Native versions
                Dimensions.removeEventListener('change', callback);
            }
        };
    }, [callback]);
};

export default {
    normalizeFont,
    horizontalScale,
    verticalScale,
    moderateScale,
    getChartDimensions,
    getCardWidth,
    getSafeAreaInsets,
    useDimensionsChange,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT
};