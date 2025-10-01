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
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const TaskActionRow: React.FC<{ 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    onPress?: () => void;
    value?: string;
    color?: string;
  }> = ({ icon, label, onPress, value, color = Colors.light.textSecondary }) => (
    <TouchableOpacity 
      style={styles.actionRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.actionLabel}>{label}</Text>
      {value && <Text style={styles.actionValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />}
    </TouchableOpacity>
  );

  const renderTask = (task: Task, index: number) => {
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    const isExpanded = expandedTasks.has(task.id);
    
    if (isArchived) return null; // Don't show archived tasks
    
    return (
      <View key={task.id} style={styles.taskContainer}>
        {/* Main Task Row */}
        <View style={styles.taskItem}>
          <View style={styles.taskMainContent}>
            {/* Task Content */}
            <TouchableOpacity
              style={styles.taskMainRow}
              onPress={() => !isCompleted && handleCompleteTask(task.id)}
              disabled={isCompleted}
            >
              <View style={[
                styles.taskRadio,
                isCompleted && styles.taskRadioCompleted,
                { borderColor: loop?.color || Colors.light.primary }
              ]}>
                {isCompleted && (
                  <View style={[styles.taskRadioFill, { backgroundColor: loop?.color || Colors.light.primary }]} />
                )}
              </View>
              <Text style={[
                styles.taskText,
                isCompleted && styles.taskTextCompleted
              ]}>
                {task.description}
              </Text>
              <View style={styles.taskIcons}>
                {task.type === 'recurring' && (
                  <Ionicons name="refresh" size={14} color={Colors.light.textSecondary} />
                )}
                {isCompleted && (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.light.success} />
                )}
              </View>
            </TouchableOpacity>

            {/* Expand/Collapse Button */}
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => toggleTaskExpanded(task.id)}
            >
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={Colors.light.textSecondary} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Task Actions - Only show when expanded */}
        {isExpanded && (
          <View style={styles.taskActions}>
            <TaskActionRow 
              icon="create-outline" 
              label="Edit Task" 
              onPress={() => {/* TODO: Implement task edit modal */}}
            />
            <TaskActionRow 
              icon="trash-outline" 
              label="Delete Task" 
              onPress={() => {/* TODO: Implement task delete with confirmation */}}
              color={Colors.light.error}
            />
            <View style={styles.actionSeparator} />
            <TaskActionRow 
              icon="calendar-outline" 
              label="Add Due Date" 
              onPress={() => {/* TODO: Implement date picker */}}
            />
            <TaskActionRow 
              icon="person-outline" 
              label="Assign to" 
              onPress={() => {/* TODO: Implement user assignment */}}
            />
            <TaskActionRow 
              icon="pricetag-outline" 
              label="Add Tag" 
              onPress={() => {/* TODO: Implement tagging */}}
            />
            <TaskActionRow 
              icon="attach-outline" 
              label="Attach File" 
              onPress={() => {/* TODO: Implement file attachment */}}
            />
            <TaskActionRow 
              icon="camera-outline" 
              label="Attach Image" 
              onPress={() => {/* TODO: Implement image attachment */}}
            />
            <TaskActionRow 
              icon="chatbubble-outline" 
              label="Add Note" 
              onPress={() => {/* TODO: Implement note adding */}}
            />
          </View>
        )}
      </View>
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
      {/* Header styled like your design concept */}
      <View style={[styles.header, { backgroundColor: loop.color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.background} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.loopIcon}>
            <Ionicons name="sync" size={20} color={loop.color} />
          </View>
          <Text style={styles.headerTitle}>{loop.name}</Text>
        </View>
        <TouchableOpacity onPress={handleReloop} style={styles.headerAction}>
          <Ionicons name="refresh" size={24} color={Colors.light.background} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            if (confirm('Delete this loop? This cannot be undone.')) {
              fetch(`${API_BASE_URL}/api/loops/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).then(response => {
                if (response.ok) {
                  alert('Loop deleted!');
                  router.replace('/');
                } else {
                  alert('Delete failed');
                }
              });
            }
          }}
          style={styles.headerAction}
        >
          <Ionicons name="trash" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {completedTasks} of {totalActiveTasks} tasks completed ({progress}%)
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${progress}%`, backgroundColor: loop.color }]} 
            />
          </View>
        </View>

        {/* Tasks List */}
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
            {tasks.map((task, index) => renderTask(task, index))}
          </View>
        )}

        {/* Add Task Button */}
        <TouchableOpacity 
          style={styles.addStepButton}
          onPress={() => setShowAddTask(true)}
        >
          <Ionicons name="add" size={20} color={loop.color} />
          <Text style={[styles.addStepText, { color: loop.color }]}>Add List Item</Text>
        </TouchableOpacity>
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
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Add New Task</Text>
              <Text style={styles.modalSubtitle}>to "{loop.name}"</Text>
            </View>
            <TouchableOpacity 
              onPress={handleAddTask}
              disabled={!newTaskText.trim() || addingTask}
              style={[
                styles.modalSaveButton, 
                { backgroundColor: loop?.color || Colors.light.primary },
                (!newTaskText.trim() || addingTask) && styles.modalSaveButtonDisabled
              ]}
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
                    newTaskType === 'recurring' && [styles.taskTypeOptionSelected, { borderColor: loop?.color }]
                  ]}
                  onPress={() => setNewTaskType('recurring')}
                >
                  <Ionicons 
                    name="refresh" 
                    size={16} 
                    color={newTaskType === 'recurring' ? (loop?.color || Colors.light.primary) : Colors.light.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'recurring' && { color: loop?.color || Colors.light.primary }
                  ]}>
                    Loop Item (Recurring)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.taskTypeOption,
                    newTaskType === 'one-time' && [styles.taskTypeOptionSelected, { borderColor: loop?.color }]
                  ]}
                  onPress={() => setNewTaskType('one-time')}
                >
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={16} 
                    color={newTaskType === 'one-time' ? (loop?.color || Colors.light.primary) : Colors.light.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'one-time' && { color: loop?.color || Colors.light.primary }
                  ]}>
                    One Time Task
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  loopIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
  },
  headerAction: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  progressCard: {
    backgroundColor: Colors.light.surface,
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyTasks: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
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
    paddingHorizontal: 16,
  },
  taskContainer: {
    marginBottom: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  taskItem: {
    backgroundColor: 'transparent',
  },
  taskItemCompleted: {
    opacity: 0.7,
  },
  taskMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  expandButton: {
    padding: 12,
    paddingRight: 16,
  },
  taskRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskRadioCompleted: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  taskRadioFill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  taskText: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.light.textSecondary,
  },
  taskIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  taskActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
    paddingVertical: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 12,
  },
  actionValue: {
    fontSize: 12,
    color: Colors.light.primary,
    marginRight: 8,
  },
  actionSeparator: {
    height: 1,
    backgroundColor: Colors.light.backgroundSecondary,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  addStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.backgroundSecondary,
    borderStyle: 'dashed',
  },
  addStepText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundSecondary,
    backgroundColor: Colors.light.background,
  },
  modalCloseButton: {
    padding: 12,
    minWidth: 70,
  },
  modalCloseText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  modalTitleContainer: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  modalSaveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    opacity: 0.5,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  taskTypeOptionSelected: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  taskTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
});

export default LoopDetailScreen;