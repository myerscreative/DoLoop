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
import { useTheme } from '../contexts/ThemeContext';
import { Loop } from '../types';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import SwipeableLoopCard from '../components/SwipeableLoopCard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [favorites, setFavorites] = useState<Loop[]>([]);
  const [minimizedCards, setMinimizedCards] = useState<Set<string>>(new Set());
  const [yourLoopsExpanded, setYourLoopsExpanded] = useState(true);
  const [favorites, setFavorites] = useState<Loop[]>([]);
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: colors.background,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logoContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    welcomeText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    themeButton: {
      padding: 8,
      marginRight: 8,
    },
    logoutButton: {
      padding: 8,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryButton: {
      width: '48%',
      aspectRatio: 1,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    categoryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.background,
      marginTop: 8,
    },
    loopCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
    },
    loopHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    loopInfo: {
      flex: 1,
    },
    loopName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    loopDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loopStats: {
      alignItems: 'flex-end',
      marginRight: 12,
    },
    loopProgress: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    loopTaskCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    heartButton: {
      padding: 4,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressBackground: {
      flex: 1,
      height: 6,
      backgroundColor: colors.surface,
      borderRadius: 3,
      marginRight: 12,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    resetInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resetText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    favoriteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
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
      color: colors.text,
    },
    favoriteAction: {
      padding: 4,
    },
    myLoopsList: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
    },
    myLoopItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.surface,
    },
    myLoopText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    countBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.background,
    },
    quickActions: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingBottom: 24,
      gap: 12,
    },
    aiCreateButton: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiCreateButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
      marginLeft: 8,
    },
    createButton: {
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    createButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
      marginLeft: 8,
    },
  });

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
  const toggleCardMinimized = (loopId: string) => {
    const newMinimized = new Set(minimizedCards);
    if (newMinimized.has(loopId)) {
      newMinimized.delete(loopId);
    } else {
      newMinimized.add(loopId);
    }
    setMinimizedCards(newMinimized);
  };

  const handleLoopsReorder = (newData: Loop[]) => {
    setLoops(newData);
    // TODO: Save new order to backend
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
      <Ionicons name={icon} size={24} color={colors.background} />
      <Text style={styles.categoryButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  const LoopCard: React.FC<{ 
    loop: Loop; 
    onToggleFavorite: (loopId: string) => Promise<void>;
  }> = ({ loop, onToggleFavorite }) => {
    const [isToggling, setIsToggling] = useState(false);

    const handleToggleFavorite = async (e: any) => {
      e.stopPropagation(); // Prevent navigation when tapping heart
      setIsToggling(true);
      try {
        await onToggleFavorite(loop.id);
      } catch (error) {
        console.log('Error toggling favorite:', error);
      } finally {
        setIsToggling(false);
      }
    };

    const progressWidth = `${loop.progress || 0}%`;
    
    return (
      <TouchableOpacity 
        style={[styles.loopCard, { borderLeftColor: loop.color }]}
        onPress={() => router.push(`/loop/${loop.id}`)}
      >
        <View style={styles.loopHeader}>
          <View style={styles.loopInfo}>
            <Text style={styles.loopName}>{loop.name}</Text>
            {loop.description && (
              <Text style={styles.loopDescription}>{loop.description}</Text>
            )}
          </View>
          <View style={styles.loopStats}>
            <Text style={styles.loopProgress}>{loop.progress || 0}%</Text>
            <Text style={styles.loopTaskCount}>
              {loop.completed_tasks || 0}/{loop.total_tasks || 0}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.heartButton}
            onPress={handleToggleFavorite}
            disabled={isToggling}
          >
            <Ionicons 
              name={loop.is_favorite ? "heart" : "heart-outline"} 
              size={24} 
              color={loop.is_favorite ? colors.secondary : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View 
              style={[styles.progressFill, { width: progressWidth, backgroundColor: loop.color }]} 
            />
          </View>
          <View style={styles.resetInfo}>
            <Ionicons 
              name={loop.reset_rule === 'manual' ? 'hand-left' : loop.reset_rule === 'daily' ? 'calendar' : 'calendar-outline'} 
              size={12} 
              color={colors.textSecondary} 
            />
            <Text style={styles.resetText}>{loop.reset_rule}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FavoriteItem: React.FC<{ loop: Loop }> = ({ loop }) => (
    <TouchableOpacity 
      style={styles.favoriteItem}
      onPress={() => router.push(`/loop/${loop.id}`)}
    >
      <View style={[styles.favoriteIcon, { backgroundColor: loop.color }]}>
        <Ionicons name="sync" size={16} color={colors.background} />
      </View>
      <Text style={styles.favoriteText}>{loop.name}</Text>
      <TouchableOpacity 
        style={styles.favoriteAction}
        onPress={() => toggleFavorite(loop.id)}
      >
        <Ionicons 
          name={loop.is_favorite ? "heart" : "heart-outline"} 
          size={20} 
          color={loop.is_favorite ? colors.secondary : colors.textSecondary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const MyLoopItem: React.FC<{ 
    title: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    count?: number;
    category?: string;
    onPress?: () => void;
  }> = ({ title, icon, count, category, onPress }) => (
    <TouchableOpacity 
      style={styles.myLoopItem} 
      onPress={onPress || (() => router.push(`/my-loops?category=${category}`))}
    >
      <Ionicons name={icon} size={20} color={colors.textSecondary} />
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Ionicons name="sync" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.userName}>{user?.name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
              <Ionicons 
                name={theme === 'dark' ? 'sunny' : 'moon'} 
                size={24} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
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
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for loops, tasks, notes, etc"
              placeholderTextColor={colors.textSecondary}
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
              <SwipeableLoopCard 
                key={loop.id} 
                loop={loop} 
                token={token!}
                onDelete={fetchLoops}
                onToggleFavorite={toggleFavorite} 
              />
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
            <MyLoopItem 
              title="Deleted Loops" 
              icon="trash-outline" 
              onPress={() => router.push('/deleted-loops')}
            />
          </View>
        </View>

        {/* Loop Library Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loop Library</Text>
          <View style={styles.categoryGrid}>
            <CategoryButton 
              title="Favorites" 
              icon="heart" 
              color={colors.primary}
              onPress={() => router.push('/library?category=favorites')}
            />
            <CategoryButton 
              title="Personal" 
              icon="person" 
              color={colors.accent1}
              onPress={() => router.push('/library?category=personal')}
            />
            <CategoryButton 
              title="Work" 
              icon="briefcase" 
              color={colors.accent2}
              onPress={() => router.push('/library?category=work')}
            />
            <CategoryButton 
              title="Shared" 
              icon="people" 
              color={colors.secondary}
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
            <Ionicons name="sparkles" size={24} color={colors.background} />
            <Text style={styles.aiCreateButtonText}>Create with AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/create-loop')}
          >
            <Ionicons name="add" size={24} color={colors.background} />
            <Text style={styles.createButtonText}>Create Manually</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

// Styles moved inside component for theme support

export default Dashboard;
