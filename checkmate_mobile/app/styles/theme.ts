import { MD3DarkTheme } from 'react-native-paper';

// Brand colors
const brand = {
    primary: '#D4B88C', // Lighter version of brown-gold
    secondary: '#B8860B', // Golden yellow from logo
    accent: '#FF6B6B', // Vibrant coral red for accents
    tertiary: '#4ECDC4', // Vibrant teal for additional accents
};

export const theme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: brand.primary,
        secondary: brand.secondary,
        tertiary: brand.tertiary,
        accent: brand.accent,
        background: '#121212',
        surface: '#1E1E1E',
        surfaceVariant: '#2D2416',
        error: '#FF453A',
        text: '#F8F5F2',
        onSurface: '#E8E0D8',
        disabled: 'rgba(216, 184, 140, 0.38)', // Based on light primary
        placeholder: 'rgba(216, 184, 140, 0.54)', // Based on light primary
        backdrop: 'rgba(0, 0, 0, 0.5)',
        elevation: {
            level0: 'transparent',
            level1: '#1E1E1E',
            level2: '#232323',
            level3: '#282828',
            level4: '#2D2D2D',
            level5: '#323232',
        },
    },
};
