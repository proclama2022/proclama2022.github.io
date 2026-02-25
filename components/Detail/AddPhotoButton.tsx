import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ---------------------------------------------------------------------------
// AddPhotoButton
// ---------------------------------------------------------------------------

interface AddPhotoButtonProps {
  onPress: () => void;
  size?: number;
}

export function AddPhotoButton({ onPress, size = 110 }: AddPhotoButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { width: size, height: size }]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Add photo"
    >
      <Ionicons name="add" size={32} color="#999" />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  } as ViewStyle,
});
