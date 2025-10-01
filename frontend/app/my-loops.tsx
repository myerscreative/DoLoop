import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import { Loop } from '../types';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

const MyLoopsScreen: React.FC = () => {
  const { category } = useLocalSearchParams<{ category: string }>();
  const { user, token } = useAuth();
  const [loops, setLoops] = useState<Loop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categoryInfo = {
    'my-day': {
      title: 'My Day',
      icon: 'today' as const,
      description: 'Loops scheduled for today',
      color: Colors.light.primary,
    },
    'important': {
      title: 'Important',
      icon: 'flag' as const,
      description: 'High priority loops',
      color: Colors.light.secondary,
    },
    'planned': {
      title: 'Planned',
      icon: 'calendar' as const,
      description: 'Scheduled loops',
      color: Colors.light.accent1,
    },
    'assigned': {
      title: 'Assigned to me',
      icon: 'person' as const,
      description: 'Loops where you have assigned tasks',
      color: Colors.light.accent2,
    },
  };

  const currentCategory = categoryInfo[category as keyof typeof categoryInfo] || categoryInfo['my-day'];

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
        // Apply filtering based on category
        const filteredLoops = filterLoopsByCategory(data, category as string);
        setLoops(filteredLoops);
      }
    } catch (error) {
      console.log('Error fetching loops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterLoopsByCategory = (allLoops: Loop[], filterCategory: string): Loop[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    switch (filterCategory) {
      case 'my-day':
        // Show daily loops and some weekly loops based on day
        return allLoops.filter(loop => 
          loop.reset_rule === 'daily' || 
          (loop.reset_rule === 'weekly' && Math.random() > 0.5) || // Random selection for demo
          (loop.progress || 0) > 0 // Loops with some progress
        );
      
      case 'important':
        // Show loops with high progress or recent activity
        return allLoops.filter(loop => 
          (loop.progress || 0) >= 50 || 
          (loop.total_tasks || 0) >= 5
        );
      
      case 'planned':
        // Show loops that are scheduled (weekly/manual with future planning)
        return allLoops.filter(loop => 
          loop.reset_rule === 'weekly' || 
          loop.reset_rule === 'manual'
        );
      
      case 'assigned':
        // Show loops where user might have tasks assigned
        // For now, show loops with incomplete tasks
        return allLoops.filter(loop => 
          (loop.total_tasks || 0) > (loop.completed_tasks || 0)
        );
      
      default:
        return allLoops;
    }
  };

  useEffect(() => {
    fetchLoops();
  }, [category]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoops();
  };

  const renderLoopCard = (loop: Loop) => {
    const progressWidth = `${loop.progress || 0}%`;
    
    return (
      <TouchableOpacity
        key={loop.id}
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
              color={Colors.light.textSecondary} 
            />
            <Text style={styles.resetText}>{loop.reset_rule}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={[styles.categoryIcon, { backgroundColor: currentCategory.color }]}>
              <Ionicons name={currentCategory.icon} size={20} color={Colors.light.background} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{currentCategory.title}</Text>
              <Text style={styles.headerSubtitle}>{currentCategory.description}</Text>
            </View>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your {currentCategory.title.toLowerCase()} loops...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={[styles.categoryIcon, { backgroundColor: currentCategory.color }]}>
            <Ionicons name={currentCategory.icon} size={20} color={Colors.light.background} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{currentCategory.title}</Text>
            <Text style={styles.headerSubtitle}>{currentCategory.description}</Text>
          </View>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {loops.length} loop{loops.length !== 1 ? 's' : ''} in {currentCategory.title.toLowerCase()}
          </Text>
        </View>

        {loops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={currentCategory.icon} size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>No loops in {currentCategory.title.toLowerCase()}</Text>
            <Text style={styles.emptyDescription}>
              Create some loops or adjust your filters to see content here.
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/ai-create-loop')}
            >
              <Ionicons name="sparkles" size={16} color={Colors.light.background} />
              <Text style={styles.createButtonText}>Create with AI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loopsContainer}>
            {loops.map(renderLoopCard)}
          </View>
        )}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerPlaceholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 6,
  },
  loopsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  loopCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loopInfo: {
    flex: 1,
    marginRight: 16,
  },
  loopName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  loopDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  loopStats: {
    alignItems: 'flex-end',
  },
  loopProgress: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  loopTaskCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBackground: {
    height: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  resetText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
});

export default MyLoopsScreen;