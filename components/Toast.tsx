import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToastProps {
  message: string;
  type: 'success' | 'info';
  visible: boolean;
  undoAction?: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Toast Component
// ---------------------------------------------------------------------------

export function Toast({ message, type, visible, undoAction, onDismiss }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Trigger haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleUndo = () => {
    if (undoAction) {
      undoAction();
      hideToast();
    }
  };

  if (!visible) {
    return null;
  }

  const backgroundColor = type === 'success' ? '#2e7d32' : '#1976d2';
  const iconName = type === 'success' ? 'checkmark-circle' : 'information-circle';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={hideToast}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity, backgroundColor }]}>
          <View style={styles.content}>
            <Ionicons name={iconName} size={24} color="white" style={styles.icon} />
            <Text style={styles.message}>{message}</Text>
          </View>

          {undoAction && (
            <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
              <Text style={styles.undoText}>Undo</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  undoButton: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  undoText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
