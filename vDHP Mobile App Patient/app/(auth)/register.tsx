import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { authService } from '@/services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: params.email as string || '',
    password: '',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const handleRegister = async () => {
    const newErrors: any = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required (YYYY-MM-DD)';

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      await authService.register({
        invitation_code: params.invitationCode,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
      });

      router.replace('/(auth)/consent');
    } catch (err: any) {
      setErrors({ general: err.response?.data?.detail || 'Registration failed' });
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Create Your Account</Text>
          <Text style={styles.subtitle}>Please fill in your details to get started</Text>

          <Card style={styles.card} elevated>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
              placeholder="Enter your first name"
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
              placeholder="Enter your last name"
              error={errors.lastName}
            />
            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              error={errors.email}
            />
            <Input
              label="Password"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Create a strong password"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              placeholder="YYYY-MM-DD"
              error={errors.dateOfBirth}
            />
            {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
          </Card>

          <GradientButton
            title="Create Account"
            onPress={handleRegister}
            loading={loading}
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
    paddingHorizontal: 32,
    paddingVertical: 40,
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
    marginBottom: 24,
  },
  card: {
    marginTop: 8,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: Typography.fontSizes.base,
    marginTop: 8,
  },
});
