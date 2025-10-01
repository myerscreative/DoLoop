import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../constants/Colors';

export type ColorTheme = 'light' | 'dark';

export interface CustomColor {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  createdAt: Date;
}

interface ThemeContextType {
  theme: ColorTheme;
  colors: typeof Colors.light;
  toggleTheme: () => void;
  setTheme: (theme: ColorTheme) => void;
  
  // Custom colors for loops
  customColors: CustomColor[];
  addCustomColor: (name: string, color: string) => void;
  toggleColorFavorite: (colorId: string) => void;
  getLoopColors: () => string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@doloop_theme';
const CUSTOM_COLORS_STORAGE_KEY = '@doloop_custom_colors';

// Default loop colors
const DEFAULT_LOOP_COLORS = [
  '#FFC93A', // Yellow
  '#FF5999', // Hot Pink
  '#00CAD1', // Teal
  '#7D4DA2', // Purple
  '#FF6B35', // Orange
  '#4ECDC4', // Mint
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFEAA7', // Light Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Light Teal
  '#FFB6C1', // Light Pink
];

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ColorTheme>('light');
  const [customColors, setCustomColors] = useState<CustomColor[]>([]);

  // Load theme and custom colors on app start
  useEffect(() => {
    loadTheme();
    loadCustomColors();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setThemeState(savedTheme);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const loadCustomColors = async () => {
    try {
      const savedColors = await AsyncStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        setCustomColors(parsed.map((color: any) => ({
          ...color,
          createdAt: new Date(color.createdAt)
        })));
      }
    } catch (error) {
      console.log('Error loading custom colors:', error);
    }
  };

  const saveTheme = async (newTheme: ColorTheme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const saveCustomColors = async (colors: CustomColor[]) => {
    try {
      await AsyncStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(colors));
    } catch (error) {
      console.log('Error saving custom colors:', error);
    }
  };

  const setTheme = (newTheme: ColorTheme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const addCustomColor = (name: string, color: string) => {
    const newColor: CustomColor = {
      id: Date.now().toString(),
      name,
      color,
      isFavorite: false,
      createdAt: new Date(),
    };
    
    const updatedColors = [...customColors, newColor];
    setCustomColors(updatedColors);
    saveCustomColors(updatedColors);
  };

  const toggleColorFavorite = (colorId: string) => {
    const updatedColors = customColors.map(color => 
      color.id === colorId ? { ...color, isFavorite: !color.isFavorite } : color
    );
    setCustomColors(updatedColors);
    saveCustomColors(updatedColors);
  };

  const getLoopColors = (): string[] => {
    const favoriteCustomColors = customColors
      .filter(color => color.isFavorite)
      .map(color => color.color);
    
    return [...DEFAULT_LOOP_COLORS, ...favoriteCustomColors];
  };

  const colors = Colors[theme];

  const value: ThemeContextType = {
    theme,
    colors,
    toggleTheme,
    setTheme,
    customColors,
    addCustomColor,
    toggleColorFavorite,
    getLoopColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};