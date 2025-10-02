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
    console.log('LoopsContext: fetchLoops started');
    setRefreshing(true);
    try {
      // First try to load from AsyncStorage for offline support
      const storedLoops = await AsyncStorage.getItem('loops');
      console.log('AsyncStorage loops:', storedLoops);
      if (storedLoops) {
        const parsedLoops = JSON.parse(storedLoops);
        console.log('Parsed stored loops:', parsedLoops);
        setLoops(parsedLoops);
      } else {
        // Fallback data to prevent blank screen
        console.log('No stored loops, using fallback');
        const fallbackLoops = [{ id: 'temp', name: 'Temp Loop', progress: 0, completed_tasks: 0, total_tasks: 1, color: '#FFC93A' }];
        setLoops(fallbackLoops);
      }
      
      // Then fetch from backend to get latest data
      const token = await AsyncStorage.getItem('token');
      console.log('Token exists:', !!token);
      if (token) {
        console.log('Fetching from backend:', `${API_BASE_URL}/api/loops`);
        const response = await fetch(`${API_BASE_URL}/api/loops`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log('Backend response status:', response.status);
        if (response.ok) {
          const backendLoops = await response.json();
          console.log('Backend loops received:', backendLoops);
          setLoops(backendLoops);
          // Update local storage with fresh data
          await AsyncStorage.setItem('loops', JSON.stringify(backendLoops));
        } else {
          console.log('Backend response not ok:', await response.text());
        }
      }
    } catch (error) {
      console.log('Error fetching loops:', error);
    } finally {
      console.log('LoopsContext: fetchLoops completed');
      setRefreshing(false);
    }
  };

  // Load loops on mount
  useEffect(() => {
    console.log('LoopsContext: useEffect triggered, calling fetchLoops');
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