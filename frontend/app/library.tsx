import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Loop } from '../types';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

// Mock data for library categories (in a real app, this would come from API)
const libraryData = {
  favorites: [
    { id: 'f1', name: 'Leave for work', color: Colors.light.primary },
    { id: 'f2', name: 'Kids ready for school', color: Colors.light.secondary },
    { id: 'f3', name: 'Bike ride', color: Colors.light.accent1 },
    { id: 'f4', name: 'Go surfing', color: Colors.light.accent2 },
    { id: 'f5', name: 'Date night', color: Colors.light.primary },
  ],
  personal: [
    { id: 'p1', name: 'Go to pool', color: Colors.light.accent1 },
    { id: 'p2', name: 'Go to pool with kids', color: Colors.light.accent1 },
    { id: 'p3', name: 'Go for a hike', color: Colors.light.accent2 },
    { id: 'p4', name: 'Fishing trip', color: Colors.light.accent1 },
    { id: 'p5', name: 'Dog Boarding', color: Colors.light.secondary },
  ],
  work: [
    { id: 'w1', name: 'Leave for work', color: Colors.light.accent2 },
    { id: 'w2', name: 'Sales Meeting Prep', color: Colors.light.accent2 },
    { id: 'w3', name: 'Board Meeting Prep', color: Colors.light.accent2 },
    { id: 'w4', name: 'Leave Office for home', color: Colors.light.accent2 },
    { id: 'w5', name: 'Order Processing', color: Colors.light.accent2 },
  ],
  shared: [
    { id: 's1', name: 'Camping with Friends', color: Colors.light.secondary },
    { id: 's2', name: 'Trade show prep', color: Colors.light.secondary },
    { id: 's3', name: 'Groceries', color: Colors.light.secondary },
    { id: 's4', name: 'Shopping list', color: Colors.light.secondary },
  ],
};

const LibraryScreen: React.FC = () => {
  const { token } = useAuth();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [userLoops, setUserLoops] = useState<Loop[]>([]);

  useEffect(() => {
    fetchUserLoops();
  }, []);

  const fetchUserLoops = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserLoops(data);
      }
    } catch (error) {
      console.log('Error fetching user loops:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserLoops();
    setRefreshing(false);
  };

  const LibraryItem: React.FC<{ 
    item: any; 
    onPress: () => void; 
    showAdd?: boolean;
  }> = ({ item, onPress, showAdd = false }) => (
    <TouchableOpacity style={styles.libraryItem} onPress={onPress}>
      <View style={[styles.itemIcon, { backgroundColor: item.color }]}>
        <Ionicons name="sync" size={16} color={Colors.light.background} />
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
      {showAdd && (
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const CategorySection: React.FC<{ 
    title: string; 
    items: any[]; 
    showAdd?: boolean;
    onAddPress?: () => void;
  }> = ({ title, items, showAdd = true, onAddPress }) => (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{title}</Text>
        {showAdd && (
          <TouchableOpacity style={styles.categoryAddButton} onPress={onAddPress}>
            <Ionicons name="add" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.categoryItems}>
        {items.map((item) => (
          <LibraryItem
            key={item.id}
            item={item}
            onPress={() => {
              // If it's a user loop, navigate to it
              if (userLoops.find(loop => loop.id === item.id)) {
                router.push(`/loop/${item.id}`);
              } else {
                // If it's a template, create a new loop from it
                router.push(`/create-loop?template=${item.id}`);
              }
            }}
            showAdd={!userLoops.find(loop => loop.id === item.id)}
          />
        ))}
      </View>
    </View>
  );

  // Filter displayed categories based on the category parameter
  const shouldShowCategory = (cat: string) => !category || category === cat;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loop Library</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={Colors.light.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for loops, tasks, notes, etc"
              placeholderTextColor={Colors.light.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Category Sections */}
        {shouldShowCategory('favorites') && (
          <CategorySection 
            title="Favorites" 
            items={libraryData.favorites}
            onAddPress={() => {/* TODO: Add to favorites */}}
          />
        )}

        {shouldShowCategory('personal') && (
          <CategorySection 
            title="Personal" 
            items={libraryData.personal}
            onAddPress={() => router.push('/create-loop?category=personal')}
          />
        )}

        {shouldShowCategory('work') && (
          <CategorySection 
            title="Work" 
            items={libraryData.work}
            onAddPress={() => router.push('/create-loop?category=work')}
          />
        )}

        {shouldShowCategory('shared') && (
          <CategorySection 
            title="Shared" 
            items={libraryData.shared}
            onAddPress={() => router.push('/create-loop?category=shared')}
          />
        )}

        {/* Add Library Group */}
        <View style={styles.addGroupContainer}>
          <TouchableOpacity 
            style={styles.addGroupButton}
            onPress={() => {/* TODO: Add new library group */}}
          >
            <Ionicons name="add" size={20} color={Colors.light.primary} />
            <Text style={styles.addGroupText}>Add a Library Group</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.light.text,
  },
  categorySection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  categoryAddButton: {
    padding: 4,
  },
  categoryItems: {
    gap: 4,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    padding: 4,
  },
  addGroupContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  addGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.backgroundSecondary,
    borderStyle: 'dashed',
  },
  addGroupText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default LibraryScreen;