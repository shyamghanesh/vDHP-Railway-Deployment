import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/ui/GradientButton';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { patientService } from '@/services/api';

export default function ConsentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAgree = async () => {
    setLoading(true);

    try {
      // 1. Get patient details from AsyncStorage
      const patientId = await AsyncStorage.getItem('patient_id'); // Your internal DB patient ID
      const patientFhirId = await AsyncStorage.getItem('patient_fhir_id'); // The FHIR server's patient ID
      const patientName = await AsyncStorage.getItem('patient_name'); // e.g., "John Doe"

      if (!patientId) {
        // Handle error: essential patient identifier is missing
        const errorMessage = 'Patient identifiers not found. Please try logging in again.';
        console.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const consentDateTime = new Date().toISOString();

      const localConsentPayload = {
        consent_type: 'data_usage',
        consent_version: '1.0',
        consent_text: CONSENT_TEXT,
        is_agreed: true,
      };
      await patientService.createConsent(localConsentPayload);

      // Only create FHIR consent if we have a FHIR ID (optional for local dev)
      if (patientFhirId) {
        const fhirConsentPayload = {
          resourceType: 'Consent',
          status: 'active',
          scope: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/consentscope', code: 'patient-privacy' }] },
          category: [{ coding: [{ system: 'http://loinc.org', code: '59284-0' }] }],
          patient: {
            reference: `Patient/${patientFhirId}`,
            display: patientName || 'Patient',
          },
          dateTime: consentDateTime,
          organization: [{ display: 'vDHP Care Compass' }],
          provision: {
            type: 'permit',
            purpose: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ActReason', code: 'TREAT' }],
            class: [{ system: 'http://hl7.org/fhir/resource-types', code: 'Observation' }],
            code: [{ coding: [{ system: 'http://loinc.org', code: '8716-3' }] }],
          },
        };

        await patientService.createFhirConsent(fhirConsentPayload);
      }

      // 4. Navigate to the dashboard on success
      router.replace('/(app)/dashboard');
    } catch (err) {
      const errorMessage = 'Failed to save consent. Please try again.';
      console.error(errorMessage, err);
      setError(errorMessage);
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Privacy & Data Consent</Text>
            <Text style={styles.subtitle}>Please review and accept our terms</Text>
          </View>

          <Card style={styles.card} elevated>
            <ScrollView style={styles.consentScroll}>
              <Text style={styles.consentText}>{CONSENT_TEXT}</Text>
            </ScrollView>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </Card>

          <View style={styles.footer}>
            <GradientButton
              title="I Agree & Continue"
              onPress={handleAgree}
              loading={loading}
              variant="success"
            />
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const CONSENT_TEXT = `vDHP Care Compass - Patient Consent Agreement

By using vDHP Care Compass, you agree to the following:

1. DATA COLLECTION & USE
We collect and store your health information to provide you with personalized care. This includes medical history, vital signs, prescriptions, and communications with your healthcare providers.

2. DATA SHARING
Your health data will be shared with your authorized healthcare providers to deliver coordinated care. We will never sell your personal health information to third parties.

3. HIPAA COMPLIANCE
All data is protected under HIPAA regulations and stored with industry-standard encryption.

4. YOUR RIGHTS
You have the right to:
• Access your health data at any time
• Request corrections to your information
• Revoke consent (which may limit app functionality)
• Download your complete health records

5. DATA SECURITY
We use advanced encryption and security measures to protect your information.

Version 1.0 - Last updated: November 2024`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: Typography.fontSizes.xxxl,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: Typography.fontSizes.lg,
    color: Colors.dark.textSecondary,
  },
  card: {
    flex: 1,
    marginBottom: 24,
  },
  consentScroll: {
    maxHeight: 400,
  },
  consentText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.base,
  },
  footer: {
    paddingTop: 16,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: Typography.fontSizes.base,
    marginTop: 16,
    textAlign: 'center',
  },
});
