import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import OrganSelector from '@/components/OrganSelector';
import PreviewConfirm from '@/components/PreviewConfirm';
import { RateLimitModal } from '@/components/RateLimitModal';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { Text } from '@/components/Themed';
import { useRateLimit } from '@/hooks/useRateLimit';
import { identifyPlant } from '@/services/plantnet';
import { useSettingsStore } from '@/stores/settingsStore';
import { OrganType } from '@/types';

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
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { language } = useSettingsStore();
  const { t } = useTranslation();
  const { allowed, remaining, limit, useScan } = useRateLimit();

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

    // Enforce rate limit before capturing
    if (!allowed) {
      setShowRateLimitModal(true);
      return;
    }

    setIsCapturing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    // Enforce rate limit before opening gallery
    if (!allowed) {
      setShowRateLimitModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.85, // Forces JPEG conversion from HEIC on iOS
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

    // Consume a scan slot before calling the API
    const scanAllowed = await useScan();
    if (!scanAllowed) {
      setShowRateLimitModal(true);
      setScreenState('camera');
      setCapturedUri(null);
      return;
    }

    setScreenState('identifying');
    const lang = language ?? 'en';

    // Call PlantNet API — identifyPlant handles caching and proxying
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      />

      {/* Camera overlay — absolute positioned on top of CameraView */}
      <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">
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
            {/* Rule of thirds grid */}
            <View style={styles.gridLineHorizontal1} />
            <View style={styles.gridLineHorizontal2} />
            <View style={styles.gridLineVertical1} />
            <View style={styles.gridLineVertical2} />

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
            style={[styles.galleryButton, !allowed && styles.disabledButton]}
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery"
          >
            <Ionicons
              name="images-outline"
              size={28}
              color={allowed ? '#fff' : 'rgba(255,255,255,0.4)'}
            />
            <Text style={[styles.galleryLabel, !allowed && styles.disabledLabel]}>
              Gallery
            </Text>
          </TouchableOpacity>

          {/* Shutter button */}
          <View style={styles.shutterWrapper}>
            <TouchableOpacity
              style={[
                styles.shutterOuter,
                (isCapturing || !allowed) && styles.shutterCapturing,
              ]}
              onPress={takePicture}
              disabled={isCapturing}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
            >
              <View
                style={[
                  styles.shutterInner,
                  !allowed && styles.shutterInnerDisabled,
                ]}
              />
            </TouchableOpacity>
            {/* Remaining scans badge */}
            {allowed && (
              <View style={styles.remainingBadge}>
                <Text style={styles.remainingText}>
                  {t('rateLimit.remaining', { remaining })}
                </Text>
              </View>
            )}
            {!allowed && (
              <View style={styles.remainingBadge}>
                <Text style={styles.limitReachedText}>
                  {t('rateLimit.title')}
                </Text>
              </View>
            )}
          </View>

          {/* Spacer to balance layout */}
          <View style={styles.bottomSpacer} />
        </View>
      </SafeAreaView>

      {/* Organ selector modal — shown after preview confirm */}
      <OrganSelector
        visible={screenState === 'organ'}
        onSelect={handleOrganSelect}
        onDismiss={handleOrganDismiss}
      />

      {/* Rate limit modal — shown when daily limit reached */}
      <RateLimitModal
        visible={showRateLimitModal}
        limit={limit}
        onClose={() => setShowRateLimitModal(false)}
      />

      {/* Banner ad — shown at bottom for free users */}
      <BannerAdWrapper />
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  // Grid lines
  gridLineHorizontal1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.33%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66.66%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
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
  disabledButton: {
    opacity: 0.5,
  },
  disabledLabel: {
    color: 'rgba(255,255,255,0.4)',
  },
  shutterWrapper: {
    alignItems: 'center',
    gap: 8,
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
  shutterInnerDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  remainingBadge: {
    alignItems: 'center',
  },
  remainingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    textAlign: 'center',
  },
  limitReachedText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
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
