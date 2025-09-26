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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import Constants from 'expo-constants';
import { router } from 'expo-router';
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

const CreateLoopScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [resetRule, setResetRule] = useState<'manual' | 'daily' | 'weekly'>('manual');
  const [loading, setLoading] = useState(false);
  
  const { token } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim()) {
      showMessage({
        message: 'Please enter a loop name',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/loops`, {
        method: 'POST',
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
        const newLoop = await response.json();
        showMessage({
          message: 'Loop created successfully!',
          type: 'success',
        });
        router.replace(`/loop/${newLoop.id}`);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create loop');
      }
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Failed to create loop',
        type: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetRuleOptions = [
    { value: 'manual', label: 'Manual Reset', icon: 'hand-left', description: 'Reset manually when needed' },
    { value: 'daily', label: 'Daily Reset', icon: 'calendar', description: 'Reset every day' },
    { value: 'weekly', label: 'Weekly Reset', icon: 'calendar-outline', description: 'Reset every week' },
  ] as const;

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
          <Text style={styles.headerTitle}>Create Loop</Text>
          <View style={styles.headerPlaceholder} />
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
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Create Loop'}
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
  createButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CreateLoopScreen;