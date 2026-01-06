import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { authService } from '@/services/api';

export default function InvitationScreen() {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!invitationCode.trim()) {
      setError('Please enter your invitation code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await authService.validateInvitation(invitationCode);
      
      if (result.valid) {
        router.push({
          pathname: '/(auth)/register',
          params: { invitationCode, email: result.email || '' },
        });
      } else {
        setError(result.message || 'Invalid invitation code');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to validate invitation code');
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
          <View>
            <Text style={styles.title}>Enter Invitation Code</Text>
            <Text style={styles.subtitle}>
              You should have received an invitation code from your healthcare provider
            </Text>

            <Card style={styles.card} elevated>
              <Input
                label="Invitation Code"
                value={invitationCode}
                onChangeText={setInvitationCode}
                placeholder="Enter your code"
                autoCapitalize="characters"
                error={error}
              />
            </Card>
          </View>

          <GradientButton
            title="Continue"
            onPress={handleValidate}
            loading={loading}
            disabled={!invitationCode.trim()}
          />
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
    justifyContent: 'space-between',
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
    marginBottom: 32,
    lineHeight: Typography.lineHeights.relaxed * Typography.fontSizes.lg,
  },
  card: {
    marginTop: 8,
  },
});
