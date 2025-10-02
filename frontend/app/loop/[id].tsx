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
  Alert,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/Colors';
import { Loop, Task } from '../../types';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';
import DateTimePicker from '@react-native-community/datetimepicker';

// Use different URLs for web vs mobile
const API_BASE_URL = (() => {
  // For web development (localhost), call backend directly
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:8001';
  }
  // For mobile and deployed environments, use the preview URL
  return Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';
})();

const LoopDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const { theme, colors } = useTheme();
  const [loop, setLoop] = useState<Loop | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskType, setNewTaskType] = useState<'recurring' | 'one-time'>('recurring');
  const [addingTask, setAddingTask] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [showEditTask, setShowEditTask] = useState(false);
  
  // Modal states
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTaskId, setCurrentTaskId] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [taskTags, setTaskTags] = useState<string[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [currentAttachments, setCurrentAttachments] = useState<any[]>([]);

  // Create styles using theme colors with useMemo to ensure hooks execute first
  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors?.background || '#FFFFFF',
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
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      fontSize: 18,
      color: colors.text,
      marginBottom: 16,
    },
    errorButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    errorButtonText: {
      color: colors.background,
      fontWeight: '600',
    },
    cleanHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: 20,
      backgroundColor: loop?.color || colors.primary,
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButton: {
      padding: 8,
    },
    loopIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.background,
    },
    headerAction: {
      padding: 8,
    },
    content: {
      flex: 1,
    },
    progressCard: {
      backgroundColor: colors.surface,
      margin: 16,
      padding: 16,
      borderRadius: 12,
    },
    progressText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.backgroundSecondary,
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
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyTasksDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    tasksList: {
      paddingHorizontal: 16,
    },
    // Clean Task Design Styles
    cleanTaskContainer: {
      marginBottom: 8,
    },
    cleanTaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      minHeight: 60,
    },
    cleanTaskContent: {
      flex: 1,
      marginLeft: 12,
    },
    cleanTaskText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 6,
    },
    taskTextCompleted: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
    },
    taskIndicators: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    indicatorWrapper: {
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    indicatorButton: {
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 12,
    },
    taskRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 2,
    },
    taskRadioCompleted: {
      backgroundColor: colors.backgroundSecondary,
    },
    taskRadioFill: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    quickActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    quickActionButton: {
      padding: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 20,
    },
    addStepButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.backgroundSecondary,
      borderStyle: 'dashed',
    },
    addStepText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundSecondary,
      backgroundColor: colors.background,
    },
    modalCloseButton: {
      padding: 12,
      minWidth: 70,
    },
    modalCloseText: {
      fontSize: 16,
      color: colors.textSecondary,
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
      color: colors.text,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
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
      color: colors.background,
    },
    modalSaveTextDisabled: {
      color: colors.textSecondary,
    },
    modalContent: {
      padding: 24,
      paddingTop: 32,
    },
    inputContainer: {
      marginBottom: 32,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 18,
      fontSize: 16,
      color: colors.text,
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 56,
    },
    textArea: {
      minHeight: 120,
      textAlignVertical: 'top',
    },
    taskTypeContainer: {
      gap: 16,
    },
    taskTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 64,
    },
    taskTypeOptionSelected: {
      backgroundColor: colors.backgroundSecondary,
      borderColor: colors.primary,
    },
    taskTypeText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 16,
    },
    // Date Picker Styles
    datePickerWrapper: {
      minHeight: 300,
      justifyContent: 'center',
    },
    dateDisplay: {
      alignItems: 'center',
      marginTop: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    dateDisplayText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    datePickerContainer: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    datePickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.backgroundSecondary,
    },
    datePickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    datePicker: {
      height: 200,
    },
    // Tag Management Styles
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },
    tagText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    tagInputContainer: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-end',
    },
    tagInput: {
      flex: 1,
    },
    addTagButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Attachment Modal Styles
    attachmentContainer: {
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
    },
    imagePreviewContainer: {
      width: '100%',
      height: 200,
      backgroundColor: colors.backgroundSecondary,
    },
    imagePreview: {
      width: '100%',
      height: '100%',
    },
    imageFallback: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    imageFallbackText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginTop: 8,
      textAlign: 'center',
    },
    imageFallbackSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    attachmentItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    attachmentInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    attachmentDetails: {
      marginLeft: 12,
      flex: 1,
    },
    attachmentName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    attachmentSize: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    attachmentActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    attachmentActionButton: {
      padding: 8,
      marginLeft: 8,
    },
    emptyAttachments: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyAttachmentsText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
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
      color: colors.textSecondary,
      marginLeft: 12,
    },
    actionValue: {
      fontSize: 12,
      color: colors.primary,
      marginRight: 8,
    },
  }), [colors, theme]);

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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskText(task.description);
    setShowEditTask(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTaskText.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editTaskText.trim(),
        }),
      });

      if (response.ok) {
        setShowEditTask(false);
        setEditingTask(null);
        setEditTaskText('');
        fetchLoopData();
        showMessage({
          message: 'Task updated successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to update task',
        type: 'danger',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                fetchLoopData();
                showMessage({
                  message: 'Task deleted successfully!',
                  type: 'success',
                });
              }
            } catch (error) {
              showMessage({
                message: 'Failed to delete task',
                type: 'danger',
              });
            }
          },
        },
      ]
    );
  };

  // Real functionality implementations
  const handleAddDueDate = (taskId: string) => {
    setCurrentTaskId(taskId);
    setShowDueDatePicker(true);
  };

  const handleDueDateChange = async (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDueDatePicker(false);
    }
    
    if (selectedDate && currentTaskId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTaskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            due_date: selectedDate.toISOString(),
          }),
        });

        if (response.ok) {
          fetchLoopData();
          showMessage({
            message: 'Due date added successfully!',
            type: 'success',
          });
        }
      } catch (error) {
        showMessage({
          message: 'Failed to add due date',
          type: 'danger',
        });
      }
      
      if (Platform.OS === 'ios') {
        setShowDueDatePicker(false);
      }
    }
  };

  const handleAssignTask = (taskId: string) => {
    setCurrentTaskId(taskId);
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignEmail.trim() || !currentTaskId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_email: assignEmail.trim(),
        }),
      });

      if (response.ok) {
        setShowAssignModal(false);
        setAssignEmail('');
        fetchLoopData();
        showMessage({
          message: 'Task assigned successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to assign task',
        type: 'danger',
      });
    }
  };

  const handleAddTag = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setCurrentTaskId(taskId);
    setTaskTags(task?.tags || []);
    setNewTag('');
    setShowTagModal(true);
  };

  const handleTagSubmit = async () => {
    if (!newTag.trim() || !currentTaskId) return;
    
    const trimmedTag = newTag.trim();
    if (taskTags.includes(trimmedTag)) {
      showMessage({
        message: 'Tag already exists!',
        type: 'warning',
      });
      return;
    }

    const updatedTags = [...taskTags, trimmedTag];
    setTaskTags(updatedTags);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: updatedTags,
        }),
      });

      if (response.ok) {
        setNewTag('');
        fetchLoopData();
        showMessage({
          message: 'Tag added successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to add tag',
        type: 'danger',
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = taskTags.filter(tag => tag !== tagToRemove);
    setTaskTags(updatedTags);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: updatedTags,
        }),
      });

      if (response.ok) {
        fetchLoopData();
        showMessage({
          message: 'Tag removed successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to remove tag',
        type: 'danger',
      });
    }
  };

  const handleAddNote = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    setCurrentTaskId(taskId);
    setNoteText(task?.notes || '');
    setShowNoteModal(true);
  };

  const handleNoteSubmit = async () => {
    if (!currentTaskId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/${currentTaskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: noteText,
        }),
      });

      if (response.ok) {
        setShowNoteModal(false);
        setNoteText('');
        fetchLoopData();
        showMessage({
          message: 'Note saved successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      showMessage({
        message: 'Failed to save note',
        type: 'danger',
      });
    }
  };

  const handleAttachFile = async (taskId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const task = tasks.find(t => t.id === taskId);
        const currentAttachments = task?.attachments || [];
        const newAttachment = {
          type: 'file',
          name: file.name,
          uri: file.uri,
          size: file.size,
          mimeType: file.mimeType,
        };
        
        const updatedAttachments = [...currentAttachments, newAttachment];
        
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attachments: updatedAttachments,
          }),
        });

        if (response.ok) {
          fetchLoopData();
          showMessage({
            message: 'File attached successfully!',
            type: 'success',
          });
        }
      }
    } catch (error) {
      showMessage({
        message: 'Failed to attach file',
        type: 'danger',
      });
    }
  };

  const handleAttachImage = async (taskId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7, // Reduce quality for better performance
        base64: true, // Get base64 data for reliable display
      });

      if (!result.canceled && result.assets[0]) {
        const image = result.assets[0];
        const task = tasks.find(t => t.id === taskId);
        const currentAttachments = task?.attachments || [];
        
        // Use base64 data URI for reliable display across platforms
        const imageUri = image.base64 ? `data:image/jpeg;base64,${image.base64}` : image.uri;
        
        const newAttachment = {
          type: 'image',
          name: `image_${Date.now()}.jpg`,
          uri: imageUri,
          originalUri: image.uri, // Keep original URI as backup
          width: image.width,
          height: image.height,
          size: image.fileSize,
        };
        
        const updatedAttachments = [...currentAttachments, newAttachment];
        
        const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attachments: updatedAttachments,
          }),
        });

        if (response.ok) {
          fetchLoopData();
          showMessage({
            message: 'Image attached successfully!',
            type: 'success',
          });
        }
      }
    } catch (error) {
      showMessage({
        message: 'Failed to attach image',
        type: 'danger',
      });
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
  }> = ({ icon, label, onPress, value, color = colors.textSecondary }) => (
    <TouchableOpacity 
      style={styles.actionRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.actionLabel}>{label}</Text>
      {value && <Text style={styles.actionValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const renderTaskDetails = (task: Task) => {
    const details = [];
    
    if (task.assigned_email) {
      details.push(`Assigned to: ${task.assigned_email}`);
    }
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      details.push(`Due: ${dueDate.toLocaleDateString()}`);
    }
    
    if (task.tags && task.tags.length > 0) {
      details.push(`Tags: ${task.tags.join(', ')}`);
    }
    
    if (task.notes) {
      details.push(`Note: ${task.notes}`);
    }
    
    if (task.attachments && task.attachments.length > 0) {
      details.push(`📎 ${task.attachments.length} file(s)`);
    }
    
    return details;
  };

  const renderTask = (task: Task, index: number) => {
    const isCompleted = task.status === 'completed';
    const isArchived = task.status === 'archived';
    const isExpanded = expandedTasks.has(task.id);
    const taskDetails = renderTaskDetails(task);
    
    if (isArchived) return null; // Don't show archived tasks
    
    return (
      <View key={task.id} style={styles.cleanTaskContainer}>
        {/* Main Task Row with Visual Indicators */}
        <TouchableOpacity 
          style={[
            styles.cleanTaskItem,
            isDragging && { backgroundColor: colors.backgroundSecondary }
          ]}
          onPress={() => handleEditTask(task)}
          activeOpacity={0.7}
        >
          {/* Task Radio Button */}
          <TouchableOpacity
            style={[
              styles.taskRadio,
              isCompleted && styles.taskRadioCompleted,
              { borderColor: loop?.color || colors.primary }
            ]}
            onPress={() => !isCompleted && handleCompleteTask(task.id)}
            disabled={isCompleted}
          >
            {isCompleted && (
              <View style={[styles.taskRadioFill, { backgroundColor: loop?.color || colors.primary }]} />
            )}
          </TouchableOpacity>
          
          {/* Task Content */}
          <View style={styles.cleanTaskContent}>
            <Text style={[
              styles.cleanTaskText,
              isCompleted && styles.taskTextCompleted
            ]}>
              {task.description}
            </Text>
            
            {/* Visual Indicators Row - NOW CLICKABLE */}
            <View style={styles.taskIndicators}>
              {/* Person Icon - Clickable for Assignment */}
              {task.assigned_email && (
                <TouchableOpacity 
                  style={styles.indicatorButton}
                  onPress={() => handleAssignTask(task.id)}
                >
                  <Ionicons name="person" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              
              {/* Recurring Icon */}
              {task.type === 'recurring' && (
                <View style={styles.indicatorWrapper}>
                  <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                </View>
              )}
              
              {/* Attachment Icon - Clickable for View */}
              {task.attachments && task.attachments.length > 0 && (
                <TouchableOpacity 
                  style={styles.indicatorButton}
                  onPress={() => {
                    setCurrentAttachments(task.attachments || []);
                    setShowAttachmentsModal(true);
                  }}
                >
                  <Ionicons 
                    name={task.attachments.some(att => att.type === 'image') ? "camera" : "attach"} 
                    size={16} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              )}
              
              {/* Notes Icon - Clickable for Notes */}
              {task.notes && (
                <TouchableOpacity 
                  style={styles.indicatorButton}
                  onPress={() => handleAddNote(task.id)}
                >
                  <Ionicons name="chatbubble" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              
              {/* Calendar Icon - Clickable for Due Date */}
              {task.due_date && (
                <TouchableOpacity 
                  style={styles.indicatorButton}
                  onPress={() => handleAddDueDate(task.id)}
                >
                  <Ionicons name="calendar" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              
              {/* Tags Icon - Clickable for Tag Management */}
              {task.tags && task.tags.length > 0 && (
                <TouchableOpacity 
                  style={styles.indicatorButton}
                  onPress={() => handleAddTag(task.id)}
                >
                  <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Completion Status */}
          {isCompleted && (
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          )}
        </TouchableOpacity>
        
        {/* Quick Action Buttons for Missing Features */}
        <View style={styles.quickActions}>
          {!task.assigned_email && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleAssignTask(task.id)}
            >
              <Ionicons name="person-add-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {(!task.attachments || task.attachments.length === 0) && (
            <>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleAttachImage(task.id)}
              >
                <Ionicons name="camera-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => handleAttachFile(task.id)}
              >
                <Ionicons name="attach-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
          
          {!task.notes && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleAddNote(task.id)}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {!task.due_date && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleAddDueDate(task.id)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          {(!task.tags || task.tags.length === 0) && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => handleAddTag(task.id)}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => handleDeleteTask(task.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading loop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loop) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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

  // Handle task reordering
  const handleTasksReorder = async (newData: Task[]) => {
    setTasks(newData);
    // TODO: Save new order to backend
    console.log('Tasks reordered:', newData.map(t => ({ id: t.id, description: t.description })));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Clean Header Design */}
      <View style={styles.cleanHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.background} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.loopIcon}>
            <Ionicons name="sync" size={16} color={loop.color} />
          </View>
          <Text style={styles.headerTitle}>Loop Lists</Text>
        </View>
        
        <TouchableOpacity onPress={handleReloop} style={styles.headerAction}>
          <Ionicons name="refresh-outline" size={22} color={colors.background} />
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
            <Ionicons name="list" size={48} color={colors.textSecondary} />
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
                { backgroundColor: loop?.color || colors.primary },
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
                placeholderTextColor={colors.textSecondary}
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
                    color={newTaskType === 'recurring' ? (loop?.color || colors.primary) : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'recurring' && { color: loop?.color || colors.primary }
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
                    color={newTaskType === 'one-time' ? (loop?.color || colors.primary) : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.taskTypeText,
                    newTaskType === 'one-time' && { color: loop?.color || colors.primary }
                  ]}>
                    One Time Task
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={showEditTask} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => {
                setShowEditTask(false);
                setEditingTask(null);
                setEditTaskText('');
              }} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Edit Task</Text>
              <Text style={styles.modalSubtitle}>in "{loop.name}"</Text>
            </View>
            <TouchableOpacity 
              onPress={handleUpdateTask}
              disabled={!editTaskText.trim()}
              style={[
                styles.modalSaveButton, 
                { backgroundColor: loop?.color || colors.primary },
                !editTaskText.trim() && styles.modalSaveButtonDisabled
              ]}
            >
              <Text style={[styles.modalSaveText, !editTaskText.trim() && styles.modalSaveTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Task Description</Text>
              <TextInput
                style={styles.input}
                value={editTaskText}
                onChangeText={setEditTaskText}
                placeholder="What needs to be done?"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                maxLength={200}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Due Date Picker Modal */}
      <Modal visible={showDueDatePicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowDueDatePicker(false)} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Set Due Date</Text>
            </View>
            <TouchableOpacity 
              onPress={() => handleDueDateChange(null, selectedDate)}
              style={[
                styles.modalSaveButton, 
                { backgroundColor: loop?.color || colors.primary }
              ]}
            >
              <Text style={styles.modalSaveText}>Set Date</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDueDateChange}
                minimumDate={new Date()}
                style={styles.datePicker}
                textColor={colors.text}
              />
              
              {Platform.OS === 'android' && (
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayText}>
                    Selected Date: {selectedDate.toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Assign Modal */}
      <Modal visible={showAssignModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAssignModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Assign Task</Text>
            </View>
            <TouchableOpacity 
              onPress={handleAssignSubmit}
              disabled={!assignEmail.trim()}
              style={[
                styles.modalSaveButton, 
                { backgroundColor: loop?.color || colors.primary },
                !assignEmail.trim() && styles.modalSaveButtonDisabled
              ]}
            >
              <Text style={[styles.modalSaveText, !assignEmail.trim() && styles.modalSaveTextDisabled]}>
                Assign
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={assignEmail}
                onChangeText={setAssignEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Tag Modal */}
      <Modal visible={showTagModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTagModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Manage Tags</Text>
            </View>
            <View style={styles.modalCloseButton} />
          </View>
          
          <View style={styles.modalContent}>
            {/* Existing Tags */}
            {taskTags.length > 0 && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Tags</Text>
                <View style={styles.tagsContainer}>
                  {taskTags.map((tag, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.tagChip}
                      onPress={() => handleRemoveTag(tag)}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Add New Tag */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Add New Tag</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={[styles.input, styles.tagInput]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Enter tag name"
                  placeholderTextColor={colors.textSecondary}
                  maxLength={50}
                  onSubmitEditing={handleTagSubmit}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={handleTagSubmit}
                  disabled={!newTag.trim()}
                  style={[
                    styles.addTagButton,
                    { backgroundColor: loop?.color || colors.primary },
                    !newTag.trim() && styles.modalSaveButtonDisabled
                  ]}
                >
                  <Ionicons 
                    name="add" 
                    size={20} 
                    color={!newTag.trim() ? colors.textSecondary : colors.background} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Note Modal */}
      <Modal visible={showNoteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowNoteModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Add Note</Text>
            </View>
            <TouchableOpacity 
              onPress={handleNoteSubmit}
              style={[
                styles.modalSaveButton, 
                { backgroundColor: loop?.color || colors.primary }
              ]}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Enter note..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Attachments Modal */}
      <Modal visible={showAttachmentsModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAttachmentsModal(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>Attachments</Text>
              <Text style={styles.modalSubtitle}>{currentAttachments.length} file(s)</Text>
            </View>
            <View style={styles.modalCloseButton} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            {currentAttachments.map((attachment, index) => (
              <View key={index} style={styles.attachmentContainer}>
                {/* Image Preview for image attachments */}
                {attachment.type === 'image' && attachment.uri && (
                  <View style={styles.imagePreviewContainer}>
                    <Image 
                      source={{ uri: attachment.uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('Image loading error:', error, 'URI:', attachment.uri);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', attachment.uri);
                      }}
                      onLoadStart={() => {
                        console.log('Image loading started:', attachment.uri);
                      }}
                    />
                    {/* Fallback content if image doesn't load */}
                    <View style={styles.imageFallback}>
                      <Ionicons 
                        name="image-outline" 
                        size={48} 
                        color={colors.textSecondary} 
                      />
                      <Text style={styles.imageFallbackText}>
                        {attachment.name || 'Image Preview'}
                      </Text>
                      <Text style={styles.imageFallbackSubtext}>
                        Tap expand to view
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* File Info Row */}
                <View style={styles.attachmentItem}>
                  <View style={styles.attachmentInfo}>
                    <Ionicons 
                      name={attachment.type === 'image' ? 'image' : 'document'} 
                      size={24} 
                      color={colors.primary} 
                    />
                    <View style={styles.attachmentDetails}>
                      <Text style={styles.attachmentName}>
                        {attachment.name || `${attachment.type === 'image' ? 'Image' : 'File'} ${index + 1}`}
                      </Text>
                      {attachment.size && (
                        <Text style={styles.attachmentSize}>
                          {(attachment.size / 1024).toFixed(1)} KB
                        </Text>
                      )}
                      {attachment.type === 'image' && attachment.width && attachment.height && (
                        <Text style={styles.attachmentSize}>
                          {attachment.width} × {attachment.height}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  <View style={styles.attachmentActions}>
                    {attachment.type === 'image' && attachment.uri && (
                      <TouchableOpacity 
                        style={styles.attachmentActionButton}
                        onPress={() => {
                          Alert.alert(
                            'Full Size Image',
                            'Tap to view full size image',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'View', 
                                onPress: () => {
                                  // In a real app, this would open the image in full screen
                                  Alert.alert('Image Viewer', `Viewing: ${attachment.name}\nURI: ${attachment.uri}`);
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Ionicons name="expand-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={styles.attachmentActionButton}
                      onPress={() => {
                        if (attachment.uri) {
                          Alert.alert(
                            'File Information', 
                            `Name: ${attachment.name || 'Unknown'}\nType: ${attachment.type || 'Unknown'}\nSize: ${attachment.size ? (attachment.size / 1024).toFixed(1) + ' KB' : 'Unknown'}\nURI: ${attachment.uri}`,
                            [{ text: 'OK' }]
                          );
                        }
                      }}
                    >
                      <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            {currentAttachments.length === 0 && (
              <View style={styles.emptyAttachments}>
                <Ionicons name="attach" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyAttachmentsText}>No attachments</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default LoopDetailScreen;