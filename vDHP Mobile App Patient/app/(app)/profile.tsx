import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { patientService, authService } from '@/services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    city: '',
    state: '',
    country: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    insuranceProvider: '',
    insuranceMemberId: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const patientId = await AsyncStorage.getItem('patient_id');
      if (patientId) {
        const data = await patientService.getProfile(patientId);
        setPatient(data);
        setFormData({
          firstName: data?.first_name || '',
          lastName: data?.last_name || '',
          city: data?.city || '',
          state: data?.state || '',
          country: data?.country || '',
          emergencyContactName: data?.emergency_contact_name || '',
          emergencyContactRelationship: data?.emergency_contact_relationship || '',
          emergencyContactPhone: data?.emergency_contact_phone || '',
          insuranceProvider: data?.insurance_provider || '',
          insuranceMemberId: data?.insurance_member_id || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!patient) {
      return;
    }

    if (!formData.firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }

    if (!formData.lastName.trim()) {
      setErrorMessage('Last name is required');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const payload: any = {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
      };

      const optionalFields: Array<[string, string]> = [
        ['city', 'city'],
        ['state', 'state'],
        ['country', 'country'],
        ['emergencyContactName', 'emergency_contact_name'],
        ['emergencyContactRelationship', 'emergency_contact_relationship'],
        ['emergencyContactPhone', 'emergency_contact_phone'],
        ['insuranceProvider', 'insurance_provider'],
        ['insuranceMemberId', 'insurance_member_id'],
      ];

      optionalFields.forEach(([fieldKey, payloadKey]) => {
        const value = formData[fieldKey as keyof typeof formData];
        payload[payloadKey] = value.trim() ? value.trim() : null;
      });

      const updatedProfile = await patientService.updateProfile(patient.id, payload);
      setPatient(updatedProfile);
      setStatusMessage('Patient Info Saved Successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    router.replace('/(auth)/welcome');
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image 
              source={require('@/assets/images/virtusa-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {patient?.first_name?.[0] || ''}{patient?.last_name?.[0] || ''}
              </Text>
            </View>
            <Text style={styles.name}>
              {patient?.first_name} {patient?.last_name}
            </Text>
            <Text style={styles.email}>{patient?.user_id}</Text>
          </View>

          {!!statusMessage && (
            <Text style={styles.successText}>{statusMessage}</Text>
          )}
          {!!errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <Card style={styles.section} elevated>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => handleChange('firstName', text)}
              placeholder="Enter first name"
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => handleChange('lastName', text)}
              placeholder="Enter last name"
            />
            <Input
              label="City"
              value={formData.city}
              onChangeText={(text) => handleChange('city', text)}
              placeholder="Enter city"
            />
            <Input
              label="State"
              value={formData.state}
              onChangeText={(text) => handleChange('state', text)}
              placeholder="Enter state"
            />
            <Input
              label="Country"
              value={formData.country}
              onChangeText={(text) => handleChange('country', text)}
              placeholder="Enter country"
            />
          </Card>

          <Card style={styles.section} elevated>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <Input
              label="Contact Name"
              value={formData.emergencyContactName}
              onChangeText={(text) => handleChange('emergencyContactName', text)}
              placeholder="Enter emergency contact name"
            />
            <Input
              label="Relationship"
              value={formData.emergencyContactRelationship}
              onChangeText={(text) => handleChange('emergencyContactRelationship', text)}
              placeholder="Enter relationship"
            />
            <Input
              label="Phone"
              value={formData.emergencyContactPhone}
              onChangeText={(text) => handleChange('emergencyContactPhone', text)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
          </Card>

          <Card style={styles.section} elevated>
            <Text style={styles.sectionTitle}>Insurance</Text>
            <Input
              label="Insurance Provider"
              value={formData.insuranceProvider}
              onChangeText={(text) => handleChange('insuranceProvider', text)}
              placeholder="Enter insurance provider"
            />
            <Input
              label="Insurance Member ID"
              value={formData.insuranceMemberId}
              onChangeText={(text) => handleChange('insuranceMemberId', text)}
              placeholder="Enter member ID"
            />
          </Card>

          <Card style={styles.section} elevated>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {patient?.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '--'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{patient?.gender || '--'}</Text>
            </View>
          </Card>

          <GradientButton
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={saving}
            style={{ marginTop: 8, marginBottom: 16 }}
          />

          <GradientButton
            title="Log Out"
            onPress={handleLogout}
            variant="secondary"
            style={{ marginTop: 24 }}
          />
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  backButton: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 150,
    height: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
  },
  name: {
    fontSize: Typography.fontSizes.xxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  email: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.textSecondary,
  },
  successText: {
    color: Colors.dark.primary,
    fontSize: Typography.fontSizes.base,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: Typography.fontSizes.base,
    textAlign: 'center',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Typography.fontSizes.xl,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  infoLabel: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.textSecondary,
  },
  infoValue: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    fontWeight: Typography.fontWeights.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
