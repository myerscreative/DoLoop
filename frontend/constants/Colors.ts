/**
 * Doloop Color Palette
 * Based on user's specified vibrant color scheme
 */

const tintColorLight = '#FFC93A';
const tintColorDark = '#FFC93A';

export const Colors = {
  light: {
    // Primary Brand Colors
    primary: '#FFC93A',      // Vibrant Yellow
    secondary: '#FF5999',    // Hot Pink
    accent1: '#00CAD1',      // Teal
    accent2: '#7D4DA2',      // Purple
    
    // UI Colors
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundSecondary: '#FFF4D0', // Cream
    surface: '#F8F9FA',
    
    // Status Colors
    success: '#00CAD1',      // Teal for completed
    warning: '#FFC93A',      // Yellow for in-progress
    error: '#FF5999',        // Pink for errors/urgent
    
    // Interactive
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    // Primary Brand Colors (same vibrant colors)
    primary: '#FFC93A',      // Vibrant Yellow
    secondary: '#FF5999',    // Hot Pink
    accent1: '#00CAD1',      // Teal
    accent2: '#7D4DA2',      // Purple
    
    // UI Colors (dark theme)
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    backgroundSecondary: '#1D1E20',
    surface: '#2A2B2D',
    
    // Status Colors
    success: '#00CAD1',
    warning: '#FFC93A',
    error: '#FF5999',
    
    // Interactive
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Helper function to get current theme colors
export const useThemeColor = (
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) => {
  // For now, default to light theme
  // TODO: Implement proper theme detection
  const theme = 'light';
  const colorFromProps = props[theme];
  
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
};

// Common gradients using the palette
export const Gradients = {
  primary: ['#FFC93A', '#FF5999'],     // Yellow to Pink
  secondary: ['#00CAD1', '#7D4DA2'],   // Teal to Purple
  warm: ['#FF5999', '#FFC93A'],        // Pink to Yellow
  cool: ['#7D4DA2', '#00CAD1'],        // Purple to Teal
};