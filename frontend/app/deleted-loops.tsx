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
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface DeletedLoop {
  id: string;
  name: string;
  description?: string;
  color: string;
  owner_id: string;
  reset_rule: string;
  deleted_at: Date;
  days_remaining: number;
}

const DeletedLoopsScreen: React.FC = () => {
  const { token } = useAuth();
  const [deletedLoops, setDeletedLoops] = useState<DeletedLoop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDeletedLoops = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/deleted`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeletedLoops(data);
      }
    } catch (error) {
      console.log('Error fetching deleted loops:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeletedLoops();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeletedLoops();
  };

  const handleRestore = async (loopId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${loopId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showMessage({
          message: 'Loop restored successfully!',
          type: 'success',
        });
        fetchDeletedLoops(); // Refresh the list
      } else {
        throw new Error('Failed to restore loop');
      }
    } catch (error) {
      showMessage({
        message: 'Failed to restore loop',
        type: 'danger',
      });
    }
  };

  const handlePermanentDelete = async (loopId: string) => {
    if (confirm('Permanently delete this loop? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/loops/${loopId}/permanent`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          showMessage({
            message: 'Loop permanently deleted',
            type: 'success',
          });
          fetchDeletedLoops(); // Refresh the list
        } else {
          throw new Error('Failed to permanently delete loop');
        }
      } catch (error) {
        showMessage({
          message: 'Failed to permanently delete loop',
          type: 'danger',
        });
      }
    }
  };

  const renderDeletedLoop = (loop: DeletedLoop) => {
    return (
      <View key={loop.id} style={[styles.loopCard, { borderLeftColor: loop.color }]}>
        <View style={styles.loopHeader}>
          <View style={styles.loopInfo}>
            <Text style={styles.loopName}>{loop.name}</Text>
            {loop.description && (
              <Text style={styles.loopDescription}>{loop.description}</Text>
            )}
            <Text style={styles.daysRemaining}>
              {loop.days_remaining} days remaining
            </Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={() => handleRestore(loop.id)}
          >
            <Ionicons name="refresh" size={16} color={Colors.light.background} />
            <Text style={styles.restoreButtonText}>Restore</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.permanentDeleteButton}
            onPress={() => handlePermanentDelete(loop.id)}
          >
            <Ionicons name="trash" size={16} color={Colors.light.background} />
            <Text style={styles.permanentDeleteButtonText}>Delete Forever</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading deleted loops...</Text>
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
        <Text style={styles.headerTitle}>Deleted Loops</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.light.accent1} />
          <Text style={styles.infoText}>
            Deleted loops are kept for 30 days. After that, they're permanently removed.
          </Text>
        </View>

        {deletedLoops.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trash-outline" size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyTitle}>No deleted loops</Text>
            <Text style={styles.emptyDescription}>
              Deleted loops will appear here for 30 days before being permanently removed.
            </Text>
          </View>
        ) : (
          <View style={styles.loopsContainer}>
            {deletedLoops.map(renderDeletedLoop)}
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
    paddingHorizontal: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 24,
  },
  loopsContainer: {
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
    opacity: 0.8, // Slightly faded to show it's deleted
  },
  loopHeader: {
    marginBottom: 16,
  },
  loopInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  daysRemaining: {
    fontSize: 12,
    color: Colors.light.error,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  restoreButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.accent1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 4,
  },
  permanentDeleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.error,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permanentDeleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 4,
  },
});

export default DeletedLoopsScreen;