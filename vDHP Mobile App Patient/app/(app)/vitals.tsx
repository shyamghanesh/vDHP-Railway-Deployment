import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { vitalsService } from '@/services/api';

export default function VitalsScreen() {
  const router = useRouter();
  const [vitalsType, setVitalsType] = useState<'blood_pressure' | 'blood_sugar'>('blood_pressure');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [bloodSugar, setBloodSugar] = useState('');
  const [bloodSugarType, setBloodSugarType] = useState<'fasting' | 'postprandial' | 'random'>('fasting');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (vitalsType === 'blood_pressure') {
      if (!systolic || !diastolic) {
        Alert.alert('Error', 'Please enter both systolic and diastolic values');
        return;
      }
    } else {
      if (!bloodSugar) {
        Alert.alert('Error', 'Please enter blood sugar value');
        return;
      }
    }

    setLoading(true);
    try {
      const vitalsData: any = {
        vitals_type: vitalsType,
        measured_at: new Date().toISOString(),
        notes: notes || undefined,
      };

      if (vitalsType === 'blood_pressure') {
        vitalsData.systolic = parseInt(systolic);
        vitalsData.diastolic = parseInt(diastolic);
      } else {
        vitalsData.blood_sugar_value = parseFloat(bloodSugar);
        vitalsData.blood_sugar_unit = 'mg/dL';
        vitalsData.blood_sugar_type = bloodSugarType;
      }

      await vitalsService.createVitals(vitalsData);
      Alert.alert('Success', 'Vitals recorded successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Failed to save vitals:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save vitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Record Vitals</Text>
          </View>

          <Card style={styles.typeSelectorCard}>
            <Text style={styles.cardTitle}>Select Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, vitalsType === 'blood_pressure' && styles.typeButtonActive]}
                onPress={() => setVitalsType('blood_pressure')}
              >
                <Text style={[styles.typeButtonText, vitalsType === 'blood_pressure' && styles.typeButtonTextActive]}>
                  Blood Pressure
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, vitalsType === 'blood_sugar' && styles.typeButtonActive]}
                onPress={() => setVitalsType('blood_sugar')}
              >
                <Text style={[styles.typeButtonText, vitalsType === 'blood_sugar' && styles.typeButtonTextActive]}>
                  Blood Sugar
                </Text>
              </TouchableOpacity>
            </View>
          </Card>

          {vitalsType === 'blood_pressure' ? (
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Systolic (mmHg)</Text>
              <TextInput
                style={styles.input}
                value={systolic}
                onChangeText={setSystolic}
                placeholder="e.g., 120"
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="numeric"
              />
              <Text style={styles.inputLabel}>Diastolic (mmHg)</Text>
              <TextInput
                style={styles.input}
                value={diastolic}
                onChangeText={setDiastolic}
                placeholder="e.g., 80"
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="numeric"
              />
            </Card>
          ) : (
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Blood Sugar (mg/dL)</Text>
              <TextInput
                style={styles.input}
                value={bloodSugar}
                onChangeText={setBloodSugar}
                placeholder="e.g., 100"
                placeholderTextColor={Colors.dark.textTertiary}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.sugarTypeButtons}>
                {(['fasting', 'postprandial', 'random'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.sugarTypeButton, bloodSugarType === type && styles.sugarTypeButtonActive]}
                    onPress={() => setBloodSugarType(type)}
                  >
                    <Text style={[styles.sugarTypeButtonText, bloodSugarType === type && styles.sugarTypeButtonTextActive]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes..."
              placeholderTextColor={Colors.dark.textTertiary}
              multiline
              numberOfLines={3}
            />
          </Card>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Saving...' : 'Save Vitals'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  typeSelectorCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.borderLight,
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '20',
  },
  typeButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    fontWeight: Typography.fontWeights.medium,
  },
  typeButtonTextActive: {
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  inputCard: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: Typography.fontSizes.base,
    fontWeight: Typography.fontWeights.medium,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sugarTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sugarTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    alignItems: 'center',
  },
  sugarTypeButtonActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary + '20',
  },
  sugarTypeButtonText: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.text,
  },
  sugarTypeButtonTextActive: {
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.semibold,
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: '#FFFFFF',
  },
});

