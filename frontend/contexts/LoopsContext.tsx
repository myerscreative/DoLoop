import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Loop } from '../types';
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface LoopsContextType {
  loops: Loop[];
  setLoops: (loops: Loop[]) => void;
  reorderLoops: (newLoops: Loop[]) => void;  // New method for reordering
  fetchLoops: () => Promise<void>;
  refreshing: boolean;
}

const LoopsContext = createContext<LoopsContextType | undefined>(undefined);

export const LoopsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load loops from AsyncStorage or backend on mount
  const fetchLoops = async () => {
    setRefreshing(true);
    try {
      // First try to load from AsyncStorage for offline support
      const storedLoops = await AsyncStorage.getItem('loops');
      if (storedLoops) {
        setLoops(JSON.parse(storedLoops));
      }
      
      // Then fetch from backend to get latest data
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/loops`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const backendLoops = await response.json();
          setLoops(backendLoops);
          // Update local storage with fresh data
          await AsyncStorage.setItem('loops', JSON.stringify(backendLoops));
        }
      }
    } catch (error) {
      console.log('Error fetching loops:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load loops on mount
  useEffect(() => {
    fetchLoops();
  }, []);

  const reorderLoops = async (newLoops: Loop[]) => {
    setLoops(newLoops);
    
    // Persist to AsyncStorage immediately for responsive UI
    await AsyncStorage.setItem('loops', JSON.stringify(newLoops));
    
    // Optionally sync to backend: make a PATCH request to FastAPI endpoint
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const loopIds = newLoops.map(loop => loop.id);
        await fetch(`${API_BASE_URL}/api/loops/reorder`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ loop_ids: loopIds }),
        });
      }
    } catch (error) {
      console.log('Error syncing loop order to backend:', error);
      // Could add retry logic or show user notification here
    }
  };

  return (
    <LoopsContext.Provider value={{ 
      loops, 
      setLoops, 
      reorderLoops, 
      fetchLoops, 
      refreshing 
    }}>
      {children}
    </LoopsContext.Provider>
  );
};

export const useLoops = () => {
  const context = useContext(LoopsContext);
  if (!context) {
    throw new Error('useLoops must be used within LoopsProvider');
  }
  return context;
};