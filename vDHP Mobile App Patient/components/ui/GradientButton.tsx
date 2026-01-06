import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import * as Haptics from 'expo-haptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'medium' | 'large';
  style?: ViewStyle;
}

export function GradientButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'large',
  style,
}: GradientButtonProps) {
  const gradientColors = Colors.dark.gradient[variant];

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
      style={[styles.container, style]}
    >
      <LinearGradient
        colors={disabled ? ['#3A4066', '#2D3154'] : (gradientColors as any)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, size === 'large' ? styles.large : styles.medium]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.dark.text} size="small" />
        ) : (
          <Text style={[styles.text, size === 'large' ? styles.textLarge : styles.textMedium]}>
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    shadowColor: Colors.dark.shadow.glow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  large: {
    height: 64,
    paddingHorizontal: 32,
  },
  medium: {
    height: 56,
    paddingHorizontal: 24,
  },
  text: {
    color: Colors.dark.text,
    fontWeight: Typography.fontWeights.bold,
    letterSpacing: 0.5,
  },
  textLarge: {
    fontSize: Typography.fontSizes.lg,
  },
  textMedium: {
    fontSize: Typography.fontSizes.base,
  },
});
