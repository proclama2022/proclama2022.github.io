import React, { useState } from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';

interface AvatarProps {
  uri?: string | null; // Avatar URL from Supabase Storage
  size?: number; // Default 80 (diameter in pixels)
  borderColor?: string; // Optional border color
  borderWidth?: number; // Default 0
  style?: ViewStyle; // Additional container styles
}

interface AvatarWithStatsProps extends AvatarProps {
  showStats?: boolean;
  stats?: {
    followers?: number;
    following?: number;
  };
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 80,
  borderColor,
  borderWidth = 0,
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [imageLoaded, setImageLoaded] = useState(!!uri);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageLoaded(false);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor || colors.border,
          borderWidth: borderWidth > 0 ? borderWidth : 0,
        },
        style,
      ]}
    >
      {uri && imageLoaded ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          onLoad={handleImageLoad}
          onError={handleImageError}
          resizeMode="cover"
        />
      ) : (
        <Ionicons
          name="person-circle-outline"
          size={size}
          color={colors.text}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    overflow: 'hidden',
  },
});

export default Avatar;
