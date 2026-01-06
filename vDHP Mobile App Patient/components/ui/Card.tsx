import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'glass';
}

export function Card({ children, style, elevated = false, variant = 'default' }: CardProps) {
  if (variant === 'glass') {
    return (
      <BlurView intensity={20} tint="dark" style={[styles.card, styles.glass, style]}>
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.card, elevated && styles.elevated, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.backgroundCard,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  glass: {
    backgroundColor: Colors.dark.glass.background,
    borderColor: Colors.dark.glass.border,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0, // Subtle lighting from top
  },
  elevated: {
    shadowColor: Colors.dark.shadow.medium,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});
