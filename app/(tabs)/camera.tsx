import React, { useRef, useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import OrganSelector from '@/components/OrganSelector';
import PreviewConfirm from '@/components/PreviewConfirm';
import { OrganType } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { identifyPlant } from '@/services/plantnet';

// ---------------------------------------------------------------------------
// Permission screen shown when camera access is denied or not yet granted
// ---------------------------------------------------------------------------

interface PermissionScreenProps {
  status: 'undetermined' | 'denied';
  requestPermission: () => void;
}

function PermissionScreen({ status, requestPermission }: PermissionScreenProps) {
  return (
    <View style={styles.permissionContainer}>
      <Ionicons name="camera-outline" size={64} color="#aaa" />
      <Text style={styles.permissionTitle}>Camera Access Needed</Text>
      <Text style={styles.permissionBody}>
        {status === 'denied'
          ? 'Camera permission was denied. Please enable it in your device settings to identify plants.'
          : 'Allow camera access so you can photograph plants for identification.'}
      </Text>
      {status === 'undetermined' && (
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
          accessibilityRole="button"
        >
          <Text style={styles.permissionButtonText}>Allow Camera</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main camera screen
// ---------------------------------------------------------------------------

type ScreenState = 'camera' | 'preview' | 'organ' | 'identifying';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { language } = useSettingsStore();

  // ------------------------------------------------------------------
  // Permission states
  // ------------------------------------------------------------------

  if (!permission) {
    // Permissions still loading
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    const status = permission.canAskAgain ? 'undetermined' : 'denied';
    return (
      <PermissionScreen
        status={status}
        requestPermission={requestPermission}
      />
    );
  }

  // ------------------------------------------------------------------
  // Capture handlers
  // ------------------------------------------------------------------

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: Platform.OS === 'android',
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
        setScreenState('preview');
      }
    } catch (err) {
      console.error('[CameraScreen] takePicture failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setCapturedUri(result.assets[0].uri);
      setScreenState('preview');
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
    setScreenState('camera');
  };

  const handlePreviewConfirm = (_organ: OrganType) => {
    // PreviewConfirm passes 'auto' as a placeholder — we show OrganSelector next
    setScreenState('organ');
  };

  const handleOrganSelect = async (organ: OrganType) => {
    if (!capturedUri) return;

    setScreenState('identifying');
    const lang = language ?? 'en';

    // Call PlantNet API — identifyPlant handles rate limiting, caching, and proxying
    const result = await identifyPlant({ imageUri: capturedUri, organ, lang });

    setScreenState('camera');
    setCapturedUri(null);

    // Navigate to results screen (plan 08) passing identification outcome
    router.push({
      pathname: '/results',
      params: {
        imageUri: capturedUri,
        organ,
        lang,
        success: result.success ? '1' : '0',
        error: result.error ?? '',
        // Serialise response as JSON for the results screen
        data: result.data ? JSON.stringify(result.data) : '',
      },
    });
  };

  const handleOrganDismiss = () => {
    // User dismissed organ selector — go back to preview
    setScreenState('preview');
  };

  const toggleFacing = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  // ------------------------------------------------------------------
  // Conditional renders for multi-step flow
  // ------------------------------------------------------------------

  if (screenState === 'preview' && capturedUri) {
    return (
      <PreviewConfirm
        imageUri={capturedUri}
        onRetake={handleRetake}
        onConfirm={handlePreviewConfirm}
      />
    );
  }

  if (screenState === 'identifying' && capturedUri) {
    return (
      <View style={styles.identifyingContainer}>
        <Image
          source={{ uri: capturedUri }}
          style={StyleSheet.absoluteFillObject}
          blurRadius={8}
        />
        <View style={styles.identifyingOverlay}>
          <Text style={styles.identifyingText}>Identifying plant...</Text>
          <Text style={styles.identifyingSubtext}>
            Powered by Pl@ntNet
          </Text>
        </View>
      </View>
    );
  }

  // ------------------------------------------------------------------
  // Camera view
  // ------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <SafeAreaView style={styles.cameraOverlay}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.topBarSpacer} />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={toggleFacing}
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Viewfinder guide */}
          <View style={styles.viewfinderContainer} pointerEvents="none">
            <View style={styles.viewfinder}>
              {/* Corner brackets */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <Text style={styles.viewfinderHint}>
              Center the plant in the frame
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomBar}>
            {/* Gallery button */}
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickFromGallery}
              accessibilityRole="button"
              accessibilityLabel="Choose from gallery"
            >
              <Ionicons name="images-outline" size={28} color="#fff" />
              <Text style={styles.galleryLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Shutter button */}
            <TouchableOpacity
              style={[styles.shutterOuter, isCapturing && styles.shutterCapturing]}
              onPress={takePicture}
              disabled={isCapturing}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <View style={styles.shutterInner} />
            </TouchableOpacity>

            {/* Spacer to balance layout */}
            <View style={styles.bottomSpacer} />
          </View>
        </SafeAreaView>
      </CameraView>

      {/* Organ selector modal — shown after preview confirm */}
      <OrganSelector
        visible={screenState === 'organ'}
        onSelect={handleOrganSelect}
        onDismiss={handleOrganDismiss}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarSpacer: {
    width: 44,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Viewfinder
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  viewfinder: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: CORNER_RADIUS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: CORNER_RADIUS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: CORNER_RADIUS,
  },
  viewfinderHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
  },

  // Bottom controls
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 36,
  },
  galleryButton: {
    alignItems: 'center',
    gap: 4,
    width: 64,
  },
  galleryLabel: {
    color: '#fff',
    fontSize: 12,
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
  bottomSpacer: {
    width: 64,
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionBody: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#2e7d32',
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Identifying / loading screen
  identifyingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  identifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  identifyingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  identifyingSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
});
