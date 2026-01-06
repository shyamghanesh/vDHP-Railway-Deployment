import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { authService } from '@/services/api';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';

export default function WelcomeScreen() {
  const router = useRouter();
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.trim().length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      await authService.registerSimple({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      // Reset form and return to welcome page
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      setShowRegister(false);
      setSuccessMessage('Account created successfully, Please Sign In');
    } catch (err: any) {
      setErrors({ general: err.response?.data?.detail || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  if (showRegister) {
    return (
      <LinearGradient
        colors={[Colors.dark.background, Colors.dark.backgroundElevated]}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/virtusa-logo.png')}
                style={styles.virtusaLogo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>
            </View>

            <Card style={styles.card} elevated>
              <Input
                label="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter your full name"
                autoCapitalize="words"
                error={errors.name}
              />
              <Input
                label="Email"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="10-digit phone number"
                keyboardType="phone-pad"
                error={errors.phone}
                maxLength={10}
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
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Re-enter your password"
                secureTextEntry
                error={errors.confirmPassword}
              />
              {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}
            </Card>

            <GradientButton
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              style={{ marginTop: 24 }}
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowRegister(false);
                setSuccessMessage('');
              }}
            >
              <Text style={styles.backButtonText}>← Back to Welcome</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.topLogos}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <Image
              source={require('@/assets/images/virtusa-logo.png')}
              style={styles.virtusaLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>vDHP Care Compass</Text>
            <Text style={styles.subtitle}>Your health journey, simplified</Text>
            {successMessage ? (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Card variant="glass" style={styles.glassCard}>
              <GradientButton
                title="New user? Register"
                onPress={() => {
                  setShowRegister(true);
                  setSuccessMessage('');
                }}
                variant="primary"
              />
              <GradientButton
                title="Get Started with Invitation Code"
                onPress={() => router.push('/(auth)/invitation')}
                variant="secondary"
                style={{ marginTop: 16 }}
              />
              <GradientButton
                title="Already have an account? Log In"
                onPress={() => router.push('/(auth)/login')}
                variant="secondary"
                style={{ marginTop: 16 }}
              />
            </Card>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

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
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 40,
  },
  topLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 0,
    marginBottom: 16,
    gap: 16,
  },
  appLogo: {
    width: 50,
    height: 50,
  },
  virtusaLogo: {
    width: 150,
    height: 50,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSizes.display,
    fontWeight: Typography.fontWeights.bold,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: Typography.fontSizes.xl,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  footer: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  card: {
    marginTop: 24,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: Typography.fontSizes.base,
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    fontWeight: Typography.fontWeights.medium,
  },
  successContainer: {
    backgroundColor: Colors.dark.primary + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  successText: {
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.primary,
    textAlign: 'center',
    fontWeight: Typography.fontWeights.medium,
  },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    width: '100%',
  },
});
