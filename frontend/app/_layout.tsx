import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import FlashMessage from 'react-native-flash-message';
import AuthScreen from './auth';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Component that handles the auth state
const RootLayoutNav: React.FC = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return null; // TODO: Add loading screen
  }
  
  if (!user) {
    return <AuthScreen />;
  }
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="my-loops" options={{ headerShown: false }} />
      <Stack.Screen name="create-loop" options={{ headerShown: false }} />
      <Stack.Screen name="edit-loop" options={{ headerShown: false }} />
      <Stack.Screen name="ai-create-loop" options={{ headerShown: false }} />
      <Stack.Screen name="deleted-loops" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="loop/[id]" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
          <FlashMessage position="top" />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}