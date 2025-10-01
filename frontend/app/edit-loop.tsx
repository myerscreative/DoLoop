import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import Constants from 'expo-constants';
import { router, useLocalSearchParams } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

const colorOptions = [
  Colors.light.primary,   // Yellow
  Colors.light.secondary, // Pink
  Colors.light.accent1,   // Teal
  Colors.light.accent2,   // Purple
  '#FF8C42',              // Orange
  '#6BCF7F',              // Green
];

const EditLoopScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [resetRule, setResetRule] = useState<'manual' | 'daily' | 'weekly'>('manual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const { token } = useAuth();

  useEffect(() => {
    fetchLoopData();
  }, [id]);

  const fetchLoopData = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const loops = await response.json();
        const loop = loops.find((l: any) => l.id === id);
        if (loop) {
          setName(loop.name);
          setDescription(loop.description || '');
          setSelectedColor(loop.color);
          setResetRule(loop.reset_rule);
        }
      }
    } catch (error) {
      showMessage({
        message: 'Failed to load loop data',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showMessage({
        message: 'Please enter a loop name',
        type: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          reset_rule: resetRule,
        }),
      });

      if (response.ok) {
        showMessage({
          message: 'Loop updated successfully!',
          type: 'success',
        });
        router.back();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update loop');
      }
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Failed to update loop',
        type: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    console.log('Delete button clicked!'); // Debug log
    // For web compatibility, use a simple confirm
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this loop? This will also delete all tasks in this loop and cannot be undone.')) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Loop',
        'Are you sure you want to delete this loop? This will also delete all tasks in this loop and cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showMessage({
          message: 'Loop deleted successfully',
          type: 'success',
        });
        router.replace('/');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete loop');
      }
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Failed to delete loop',
        type: 'danger',
      });
    } finally {
      setDeleting(false);
    }
  };

  const resetRuleOptions = [
    { value: 'manual', label: 'Manual Reset', icon: 'hand-left', description: 'Reset manually when needed' },
    { value: 'daily', label: 'Daily Reset', icon: 'calendar', description: 'Reset every day' },
    { value: 'weekly', label: 'Weekly Reset', icon: 'calendar-outline', description: 'Reset every week' },
  ] as const;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading loop...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Loop</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            disabled={deleting}
          >
            <Ionicons name="trash-outline" size={24} color={Colors.light.error} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Loop Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Morning Routine, Weekly Cleaning"
                placeholderTextColor={Colors.light.textSecondary}
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this loop for?"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Choose Color</Text>
              <View style={styles.colorContainer}>
                {colorOptions.map((color, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons name="checkmark" size={16} color={Colors.light.background} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Reset Schedule</Text>
              <View style={styles.resetRuleContainer}>
                {resetRuleOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.resetRuleOption,
                      resetRule === option.value && styles.resetRuleOptionSelected
                    ]}
                    onPress={() => setResetRule(option.value)}
                  >
                    <View style={styles.resetRuleHeader}>
                      <Ionicons 
                        name={option.icon} 
                        size={20} 
                        color={resetRule === option.value ? Colors.light.primary : Colors.light.textSecondary} 
                      />
                      <Text style={[
                        styles.resetRuleLabel,
                        resetRule === option.value && styles.resetRuleLabelSelected
                      ]}>
                        {option.label}
                      </Text>
                    </View>
                    <Text style={[
                      styles.resetRuleDescription,
                      resetRule === option.value && styles.resetRuleDescriptionSelected
                    ]}>
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || deleting}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
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
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  formContainer: {
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
  textArea: {
    height: 80,
    paddingTop: 16,
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.light.text,
  },
  resetRuleContainer: {
    gap: 12,
  },
  resetRuleOption: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  resetRuleOptionSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  resetRuleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  resetRuleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
  resetRuleLabelSelected: {
    color: Colors.light.primary,
  },
  resetRuleDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 32,
  },
  resetRuleDescriptionSelected: {
    color: Colors.light.text,
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default EditLoopScreen;