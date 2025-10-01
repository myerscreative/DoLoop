import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { showMessage } from 'react-native-flash-message';

const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface AITask {
  description: string;
  type: 'recurring' | 'one-time';
}

interface AILoopResponse {
  name: string;
  description: string;
  color: string;
  reset_rule: 'manual' | 'daily' | 'weekly';
  tasks: AITask[];
}

const AICreateLoopScreen: React.FC = () => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('personal');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AILoopResponse | null>(null);
  const [creating, setCreating] = useState(false);
  
  const { token } = useAuth();

  const categories = [
    { value: 'personal', label: 'Personal', color: Colors.light.accent1, icon: 'person' },
    { value: 'work', label: 'Work', color: Colors.light.accent2, icon: 'briefcase' },
    { value: 'shared', label: 'Shared', color: Colors.light.secondary, icon: 'people' },
    { value: 'general', label: 'General', color: Colors.light.primary, icon: 'apps' },
  ] as const;

  const generateLoop = async () => {
    if (!description.trim()) {
      showMessage({
        message: 'Please describe what kind of loop you want to create',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/generate-loop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          category,
        }),
      });

      if (response.ok) {
        const aiData: AILoopResponse = await response.json();
        setAiResponse(aiData);
        showMessage({
          message: 'AI generated your loop! Review and create it.',
          type: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate loop');
      }
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'AI generation failed',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLoopFromAI = async () => {
    if (!aiResponse) return;

    setCreating(true);
    try {
      // Create the loop
      const loopResponse = await fetch(`${API_BASE_URL}/api/loops`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: aiResponse.name,
          description: aiResponse.description,
          color: aiResponse.color,
          reset_rule: aiResponse.reset_rule,
        }),
      });

      if (!loopResponse.ok) {
        throw new Error('Failed to create loop');
      }

      const newLoop = await loopResponse.json();

      // Create all tasks
      for (const task of aiResponse.tasks) {
        await fetch(`${API_BASE_URL}/api/loops/${newLoop.id}/tasks`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            loop_id: newLoop.id,
            description: task.description,
            type: task.type,
          }),
        });
      }

      showMessage({
        message: 'AI-powered loop created successfully! 🎉',
        type: 'success',
      });

      router.replace('/');
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Failed to create loop',
        type: 'danger',
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedCategory = categories.find(c => c.value === category) || categories[0];

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
          <Text style={styles.headerTitle}>AI Loop Creator</Text>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={24} color={Colors.light.primary} />
          </View>
        </View>

        <ScrollView style={styles.content}>
          {!aiResponse ? (
            // AI Generation Phase
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Describe Your Loop</Text>
              <Text style={styles.sectionSubtitle}>
                Tell AI what routine or checklist you want to create. Be as detailed as possible!
              </Text>

              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="e.g., 'Morning routine to get ready for work' or 'Weekly house cleaning checklist' or 'Getting ready for a camping trip'"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />

              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      { backgroundColor: cat.color },
                      category === cat.value && styles.categoryOptionSelected
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Ionicons name={cat.icon} size={24} color={Colors.light.background} />
                    <Text style={styles.categoryText}>{cat.label}</Text>
                    {category === cat.value && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={16} color={Colors.light.background} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                onPress={generateLoop}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.light.background} />
                ) : (
                  <Ionicons name="sparkles" size={20} color={Colors.light.background} />
                )}
                <Text style={styles.generateButtonText}>
                  {loading ? 'AI is thinking...' : 'Generate Loop with AI'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // AI Result Review Phase
            <View style={styles.reviewSection}>
              <View style={styles.aiResultHeader}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.light.success} />
                <Text style={styles.aiResultTitle}>AI Generated Your Loop!</Text>
                <Text style={styles.aiResultSubtitle}>Review and customize before creating</Text>
              </View>

              <View style={[styles.previewCard, { borderLeftColor: aiResponse.color }]}>
                <View style={styles.previewHeader}>
                  <View style={[styles.previewIcon, { backgroundColor: aiResponse.color }]}>
                    <Ionicons name={selectedCategory.icon} size={20} color={Colors.light.background} />
                  </View>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewTitle}>{aiResponse.name}</Text>
                    <Text style={styles.previewDescription}>{aiResponse.description}</Text>
                    <Text style={styles.previewRule}>
                      Resets: {aiResponse.reset_rule} • {aiResponse.tasks.length} tasks
                    </Text>
                  </View>
                </View>

                <View style={styles.tasksPreview}>
                  <Text style={styles.tasksTitle}>Tasks ({aiResponse.tasks.length})</Text>
                  {aiResponse.tasks.map((task, index) => (
                    <View key={index} style={styles.taskPreviewItem}>
                      <View style={styles.taskPreviewRadio}>
                        <View style={[styles.taskPreviewRadioInner, { borderColor: aiResponse.color }]} />
                      </View>
                      <Text style={styles.taskPreviewText}>{task.description}</Text>
                      <View style={styles.taskTypeTag}>
                        <Ionicons 
                          name={task.type === 'recurring' ? 'refresh' : 'checkmark-circle'} 
                          size={12} 
                          color={Colors.light.textSecondary} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.regenerateButton}
                  onPress={() => {
                    setAiResponse(null);
                    generateLoop();
                  }}
                >
                  <Ionicons name="refresh" size={16} color={Colors.light.textSecondary} />
                  <Text style={styles.regenerateButtonText}>Regenerate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.createButton, creating && styles.createButtonDisabled]}
                  onPress={createLoopFromAI}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator color={Colors.light.background} />
                  ) : (
                    <Ionicons name="add" size={20} color={Colors.light.background} />
                  )}
                  <Text style={styles.createButtonText}>
                    {creating ? 'Creating...' : 'Create Loop'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
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
  aiIcon: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  inputSection: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  descriptionInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 120,
    marginBottom: 24,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  categoryOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  categoryOptionSelected: {
    borderWidth: 3,
    borderColor: Colors.light.text,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
    marginTop: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
  },
  reviewSection: {
    padding: 24,
  },
  aiResultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  aiResultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 8,
  },
  aiResultSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    marginBottom: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  previewRule: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  tasksPreview: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.backgroundSecondary,
    paddingTop: 16,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  taskPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskPreviewRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskPreviewRadioInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  taskPreviewText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  taskTypeTag: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  regenerateButtonText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});

export default AICreateLoopScreen;