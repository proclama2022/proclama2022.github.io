import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import { OrganType } from '@/types';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface OrganOption {
  key: OrganType;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  description: string;
}

const ORGANS: OrganOption[] = [
  {
    key: 'leaf',
    label: 'Leaf',
    icon: 'leaf',
    description: 'A single leaf or foliage',
  },
  {
    key: 'flower',
    label: 'Flower',
    icon: 'flower-outline',
    description: 'A bloom or petal',
  },
  {
    key: 'fruit',
    label: 'Fruit',
    icon: 'nutrition-outline',
    description: 'A berry, seed pod, or fruit',
  },
  {
    key: 'bark',
    label: 'Bark',
    icon: 'git-branch-outline',
    description: 'Trunk or branch texture',
  },
  {
    key: 'auto',
    label: 'Auto-detect',
    icon: 'sparkles-outline',
    description: 'Let PlantNet decide',
  },
];

interface Props {
  visible: boolean;
  onSelect: (organ: OrganType) => void;
  onDismiss?: () => void;
}

export default function OrganSelector({ visible, onSelect, onDismiss }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const tintColor = Colors[colorScheme].tint;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            <Text style={styles.title}>What part did you photograph?</Text>
            <Text style={styles.subtitle}>
              Selecting the right plant part improves accuracy
            </Text>

            <View style={styles.options}>
              {ORGANS.map((organ) => (
                <TouchableOpacity
                  key={organ.key}
                  style={styles.option}
                  onPress={() => onSelect(organ.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${organ.label}: ${organ.description}`}
                >
                  <View
                    style={[styles.iconContainer, { backgroundColor: tintColor + '1A' }]}
                  >
                    <Ionicons name={organ.icon} size={24} color={tintColor} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionLabel}>{organ.label}</Text>
                    <Text style={styles.optionDescription}>{organ.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>

            {onDismiss && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onDismiss}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#888',
    marginBottom: 20,
  },
  options: {
    gap: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionText: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
});
