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
import { router } from 'expo-router';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<Loop[]>([]);

  const fetchLoops = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoops(data);
        // Get actual favorites from API
        fetchFavorites();
      }
    } catch (error) {
      console.log('Error fetching loops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
      }
    } catch (error) {
      console.log('Error fetching favorites:', error);
    }
  };

  const toggleFavorite = async (loopId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${loopId}/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh both loops and favorites
        fetchLoops();
      }
    } catch (error) {
      console.log('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    fetchLoops();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoops();
  };

  const CategoryButton: React.FC<{ 
    title: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    color: string;
    onPress: () => void;
  }> = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.categoryButton, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={Colors.light.background} />
      <Text style={styles.categoryButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const FavoriteItem: React.FC<{ loop: Loop }> = ({ loop }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => router.push(`/loop/${loop.id}`)}
    >
      <View style={[styles.favoriteIcon, { backgroundColor: loop.color }]}>
        <Ionicons name="sync" size={16} color={Colors.light.background} />
      </View>
      <Text style={styles.favoriteText}>{loop.name}</Text>
      <TouchableOpacity 
        style={styles.favoriteAction}
        onPress={() => toggleFavorite(loop.id)}
      >
        <Ionicons 
          name={loop.is_favorite ? "heart" : "heart-outline"} 
          size={20} 
          color={loop.is_favorite ? Colors.light.secondary : Colors.light.textSecondary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const MyLoopItem: React.FC<{ 
    title: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    count?: number;
    category: string;
  }> = ({ title, icon, count, category }) => (
    <TouchableOpacity 
      style={styles.myLoopItem} 
      onPress={() => router.push(`/my-loops?category=${category}`)}
    >
      <Ionicons name={icon} size={20} color={Colors.light.textSecondary} />
      <Text style={styles.myLoopText}>{title}</Text>
      {count !== undefined && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your loops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <Ionicons name="sync" size={20} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={Colors.light.textSecondary} />
        </TouchableOpacity>
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

        {/* Favorites Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.length > 0 ? (
            favorites.map((loop) => (
              <FavoriteItem key={loop.id} loop={loop} />
            ))
          ) : (
            <Text style={styles.emptyText}>No favorites yet. Use the ❤️ icon on your loops to add them here!</Text>
          )}
        </View>

        {/* Recent Loops Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Loops</Text>
          {loops.length > 0 ? (
            loops.slice(0, 5).map((loop) => (
              <LoopCard key={loop.id} loop={loop} onToggleFavorite={toggleFavorite} />
            ))
          ) : (
            <Text style={styles.emptyText}>No loops yet</Text>
          )}
        </View>

        {/* My Loops Items */}
        <View style={styles.section}>
          <View style={styles.myLoopsList}>
            <MyLoopItem title="My Day" icon="today" count={3} category="my-day" />
            <MyLoopItem title="Important" icon="flag" count={2} category="important" />
            <MyLoopItem title="Planned" icon="calendar" count={5} category="planned" />
            <MyLoopItem title="Assigned to me" icon="person" count={1} category="assigned" />
          </View>
        </View>

        {/* Loop Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loop Library</Text>
          <View style={styles.categoryGrid}>
            <CategoryButton 
              title="Favorites" 
              icon="heart" 
              color={Colors.light.primary}
              onPress={() => router.push('/library?category=favorites')}
            />
            <CategoryButton 
              title="Personal" 
              icon="person" 
              color={Colors.light.accent1}
              onPress={() => router.push('/library?category=personal')}
            />
            <CategoryButton 
              title="Work" 
              icon="briefcase" 
              color={Colors.light.accent2}
              onPress={() => router.push('/library?category=work')}
            />
            <CategoryButton 
              title="Shared" 
              icon="people" 
              color={Colors.light.secondary}
              onPress={() => router.push('/library?category=shared')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.aiCreateButton}
            onPress={() => router.push('/ai-create-loop')}
          >
            <Ionicons name="sparkles" size={24} color={Colors.light.background} />
            <Text style={styles.aiCreateButtonText}>Create with AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create-loop')}
          >
            <Ionicons name="add" size={24} color={Colors.light.background} />
            <Text style={styles.createButtonText}>Create Manually</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
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
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
  },
  favoriteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  favoriteAction: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  myLoopsList: {
    gap: 8,
  },
  myLoopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
  },
  myLoopText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  countBadge: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
    marginTop: 8,
  },
  quickActions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  aiCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  aiCreateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 8,
  },
});

export default Dashboard;
