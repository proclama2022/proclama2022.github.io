import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { Text } from '@/components/Themed';
import { OrganType } from '@/types';

interface Props {
  imageUri: string;
  onRetake: () => void;
  onConfirm: (organ: OrganType) => void;
}

export default function PreviewConfirm({ imageUri, onRetake, onConfirm }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen image preview */}
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Dark gradient overlay at bottom */}
      <View style={styles.overlay} />

      {/* Controls */}
      <SafeAreaView style={styles.controls}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onRetake}
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <Text style={styles.label}>Use this photo?</Text>
          <Text style={styles.sublabel}>
            Next, select which plant part is shown
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={onRetake}
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm('auto')}
              accessibilityRole="button"
            >
              <Text style={styles.confirmText}>Use Photo</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 280,
    // Manual gradient simulation with a semi-transparent dark background
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  controls: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  sublabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2e7d32',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
