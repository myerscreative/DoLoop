import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContextType, User } from '../types';
import Constants from 'expo-constants';
import { showMessage } from 'react-native-flash-message';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// For development, use the current host for API calls since they get proxied to backend
const API_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.host}`
  : (Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '');
console.log('AuthContext: Using API_BASE_URL:', API_BASE_URL);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Starting login for', email);
    console.log('AuthContext: API_BASE_URL:', API_BASE_URL);
    try {
      const loginUrl = `${API_BASE_URL}/api/auth/login`;
      console.log('AuthContext: Login URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('AuthContext: Response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.log('AuthContext: Login error:', error);
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      console.log('AuthContext: Login successful, got data:', data);
      
      // Store auth data
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      showMessage({
        message: 'Welcome back!',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Login failed',
        type: 'danger',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      
      // Store auth data
      await AsyncStorage.setItem('auth_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      showMessage({
        message: 'Welcome to Doloop!',
        type: 'success',
      });
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Registration failed',
        type: 'danger',
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      setToken(null);
      setUser(null);
      
      showMessage({
        message: 'See you soon!',
        type: 'info',
      });
    } catch (error) {
      console.log('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};