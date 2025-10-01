import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Loop } from '../types';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { showMessage } from 'react-native-flash-message';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface SwipeableLoopCardProps {
  loop: Loop;
  token: string;
  onDelete: () => void;
  onToggleFavorite: (loopId: string) => Promise<void>;
}

const SwipeableLoopCard: React.FC<SwipeableLoopCardProps> = ({ 
  loop, 
  token, 
  onDelete, 
  onToggleFavorite 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${loop.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showMessage({
          message: 'Loop moved to deleted items',
          type: 'success',
        });
        onDelete();
      } else {
        throw new Error('Failed to delete loop');
      }
    } catch (error) {
      showMessage({
        message: 'Failed to delete loop',
        type: 'danger',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={handleDelete}
      disabled={isDeleting}
    >
      <View style={styles.deleteContent}>
        <Ionicons name="trash" size={24} color="white" />
        <Text style={styles.deleteText}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation();
    try {
      await onToggleFavorite(loop.id);
    } catch (error) {
      console.log('Error toggling favorite:', error);
    }
  };

  const progressWidth = `${loop.progress || 0}%`;

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity 
        style={[styles.loopCard, { borderLeftColor: loop.color }]}
        onPress={() => router.push(`/loop/${loop.id}`)}
        activeOpacity={0.8}
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
          >
            <Ionicons 
              name={loop.is_favorite ? "heart" : "heart-outline"} 
              size={24} 
              color={loop.is_favorite ? Colors.light.secondary : Colors.light.textSecondary} 
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
              color={Colors.light.textSecondary} 
            />
            <Text style={styles.resetText}>{loop.reset_rule}</Text>
            <Text style={styles.swipeHint}>← Swipe to delete</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  loopCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 12,
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
  heartButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
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
    justifyContent: 'space-between',
  },
  resetText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  swipeHint: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
  },
  deleteAction: {
    backgroundColor: Colors.light.error,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginBottom: 12,
    marginLeft: 8,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableLoopCard;