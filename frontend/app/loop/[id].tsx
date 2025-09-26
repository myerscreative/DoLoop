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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/Colors';
import { Loop, Task } from '../../types';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

const LoopDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState<'recurring' | 'one-time'>('recurring');
  const [addingTask, setAddingTask] = useState(false);

  const fetchLoopData = async () => {
    if (!id) return;
    
    try {
      // Fetch loop details from the loops list (we could add a specific endpoint later)
      const loopsResponse = await fetch(`${API_BASE_URL}/api/loops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (loopsResponse.ok) {
        const loops = await loopsResponse.json();
        const currentLoop = loops.find((l: Loop) => l.id === id);
        setLoop(currentLoop || null);
      }

      // Fetch tasks
      const tasksResponse = await fetch(`${API_BASE_URL}/api/loops/${id}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }
    } catch (error) {
      console.log('Error fetching loop data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLoopData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoopData();
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh data to show updated status
        fetchLoopData();
        showMessage({
          message: 'Task completed! 🎉',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to complete task',
        type: 'danger',
      });
    }
  };

  const handleReloop = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${id}/reloop`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchLoopData();
        showMessage({
          message: 'Loop reset successfully! 🔄',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to reset loop',
        type: 'danger',
      });
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !id) return;
    
    setAddingTask(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${id}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loop_id: id,
          description: newTaskText.trim(),
          type: newTaskType,
        }),
      });

      if (response.ok) {
        setNewTaskText('');
        setShowAddTask(false);
        fetchLoopData();
        showMessage({
          message: 'Task added successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to add task',
        type: 'danger',
      });
    } finally {
      setAddingTask(false);
    }
  };

  const renderTask = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    
    if (isArchived) return null; // Don't show archived tasks
    
    return (
      <TouchableOpacity
        key={task.id}
        style={[
          styles.taskItem,
          isCompleted && styles.taskItemCompleted
        ]}
        onPress={() => !isCompleted && handleCompleteTask(task.id)}
        disabled={isCompleted}
      >
        <View style={styles.taskContent}>
          <View style={[
            styles.taskCheckbox,
            isCompleted && styles.taskCheckboxCompleted,
            { borderColor: loop?.color || Colors.light.primary }
          ]}>
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color={Colors.light.background} />
            )}
          </View>
          <View style={styles.taskTextContainer}>
            <Text style={[
              styles.taskText,
              isCompleted && styles.taskTextCompleted
            ]}>
              {task.description}
            </Text>
            <View style={styles.taskMeta}>
              <Text style={styles.taskType}>
                {task.type === 'recurring' ? 'Recurring' : 'One-time'}
              </Text>
              {isCompleted && task.completed_at && (
                <Text style={styles.taskCompletedTime}>
                  Completed {new Date(task.completed_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading loop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loop not found</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalActiveTasks = tasks.filter(t => t.status !== 'archived').length;
  const progress = totalActiveTasks > 0 ? Math.round((completedTasks / totalActiveTasks) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{loop.name}</Text>
        <TouchableOpacity onPress={handleReloop} style={styles.reloopButton}>
          <Ionicons name="refresh" size={24} color={loop.color} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Loop Info Card */}
        <View style={[styles.loopCard, { borderLeftColor: loop.color }]}>
          <View style={styles.loopHeader}>
            <View style={styles.loopInfo}>
              <Text style={styles.loopName}>{loop.name}</Text>
              {loop.description && (
                <Text style={styles.loopDescription}>{loop.description}</Text>
              )}
            </View>
            <View style={styles.loopStats}>
              <Text style={styles.loopProgress}>{progress}%</Text>
              <Text style={styles.loopTaskCount}>
                {completedTasks}/{totalActiveTasks}
              </Text>
            </View>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View 
                style={[styles.progressFill, { width: `${progress}%`, backgroundColor: loop.color }]} 
              />
            </View>
            <View style={styles.resetInfo}>
              <Ionicons 
                name={loop.reset_rule === 'manual' ? 'hand-left' : loop.reset_rule === 'daily' ? 'calendar' : 'calendar-outline'} 
                size={12} 
                color={Colors.light.textSecondary} 
              />
              <Text style={styles.resetText}>{loop.reset_rule} reset</Text>
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={styles.tasksSectionTitle}>Tasks</Text>
            <TouchableOpacity 
              style={[styles.addTaskButton, { backgroundColor: loop.color }]}
              onPress={() => setShowAddTask(true)}
            >
              <Ionicons name="add" size={20} color={Colors.light.background} />
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.length === 0 ? (
            <View style={styles.emptyTasks}>
              <Ionicons name="list" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTasksTitle}>No tasks yet</Text>
              <Text style={styles.emptyTasksDescription}>
                Add your first task to get started with this loop.
              </Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {tasks.map(renderTask)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowAddTask(false)} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Task</Text>
            <TouchableOpacity 
              onPress={handleAddTask}
              disabled={!newTaskText.trim() || addingTask}
              style={[styles.modalSaveButton, (!newTaskText.trim() || addingTask) && styles.modalSaveButtonDisabled]}
            >
              <Text style={[styles.modalSaveText, (!newTaskText.trim() || addingTask) && styles.modalSaveTextDisabled]}>
                {addingTask ? 'Adding...' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Description</Text>
              <TextInput
                style={styles.input}
                value={newTaskText}
                onChangeText={setNewTaskText}
                placeholder="What needs to be done?"
                placeholderTextColor={Colors.light.textSecondary}
                autoFocus
                maxLength={200}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Type</Text>
              <View style={styles.taskTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.taskTypeOption,
                    newTaskType === 'recurring' && styles.taskTypeOptionSelected
                  ]}
                  onPress={() => setNewTaskType('recurring')}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={newTaskType === 'recurring' ? loop.color : Colors.light.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'recurring' && styles.taskTypeTextSelected
                  ]}>
                    Recurring
                  </Text>
                  <Text style={styles.taskTypeDescription}>
                    Resets when loop resets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.taskTypeOption,
                    newTaskType === 'one-time' && styles.taskTypeOptionSelected
                  ]}
                  onPress={() => setNewTaskType('one-time')}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={newTaskType === 'one-time' ? loop.color : Colors.light.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'one-time' && styles.taskTypeTextSelected
                  ]}>
                    One-time
                  </Text>
                  <Text style={styles.taskTypeDescription}>
                    Archives when completed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 16,
  },
  errorButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  reloopButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loopCard: {
    backgroundColor: Colors.light.surface,
    margin: 16,
    borderRadius: 16,
    padding: 16,
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
    fontSize: 24,
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
    height: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
  tasksSection: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addTaskButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
    marginLeft: 4,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTasksDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  tasksList: {
    gap: 8,
  },
  taskItem: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
  },
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: Colors.light.success,
    borderColor: Colors.light.success,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 4,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskType: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  taskCompletedTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  modalSaveButton: {
    padding: 8,
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  modalSaveTextDisabled: {
    color: Colors.light.textSecondary,
  },
  modalContent: {
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskTypeContainer: {
    gap: 12,
  },
  taskTypeOption: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskTypeOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  taskTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    marginBottom: 4,
  },
  taskTypeTextSelected: {
    color: Colors.light.primary,
  },
  taskTypeDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 24,
  },
});

export default LoopDetailScreen;