import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { IconSymbol } from './IconSymbol';

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
}

export function Input({ label, error, secureTextEntry, ...props }: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, isFocused && styles.inputFocused, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.dark.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsSecure(!isSecure)}
            style={styles.iconButton}
            accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          >
            <IconSymbol
              name={isSecure ? 'eye' : 'eye.slash'}
              size={24}
              color={Colors.dark.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: Typography.fontSizes.lg,
    fontWeight: Typography.fontWeights.semibold,
    color: Colors.dark.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  inputFocused: {
    borderColor: Colors.dark.primary,
  },
  inputError: {
    borderColor: Colors.dark.error,
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSizes.base,
    color: Colors.dark.text,
    paddingHorizontal: 20,
    paddingVertical: 18,
    height: 64,
  },
  iconButton: {
    padding: 12,
    marginRight: 8,
  },
  error: {
    fontSize: Typography.fontSizes.sm,
    color: Colors.dark.error,
    marginTop: 8,
    marginLeft: 4,
  },
});
