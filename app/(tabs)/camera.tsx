import { MaterialIcons } from '@expo/vector-icons';
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

import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import OrganSelector from '@/components/OrganSelector';
import PreviewConfirm from '@/components/PreviewConfirm';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { RateLimitModal } from '@/components/RateLimitModal';
import { Text } from '@/components/Themed';
import { useRateLimit } from '@/hooks/useRateLimit';
import { assessPlantHealth } from '@/services/planthealth';
import { identifyPlant } from '@/services/plantnet';
import { useSettingsStore } from '@/stores/settingsStore';
import { OrganType } from '@/types';

interface PermissionScreenProps {
  status: 'undetermined' | 'denied';
  requestPermission: () => void;
}

function PermissionScreen({ status, requestPermission }: PermissionScreenProps) {
  return (
    <View style={styles.permissionContainer}>
      <MaterialIcons name="photo-camera" size={64} color="#484f58" />
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

type ScreenState = 'camera' | 'preview' | 'organ' | 'identifying';
type ScanMode = 'plant' | 'health';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('camera');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('plant');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { language } = useSettingsStore();
  const { t } = useTranslation();
  const { allowed, remaining, limit, useScan: checkAndUseScan } = useRateLimit();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    const status = permission.canAskAgain ? 'undetermined' : 'denied';
    return <PermissionScreen status={status} requestPermission={requestPermission} />;
  }

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;

    if (!allowed) {
      setUpgradeModalVisible(true);
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
    if (!allowed) {
      setUpgradeModalVisible(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.85,
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
    setScreenState('organ');
  };

  const handleOrganSelect = async (organ: OrganType) => {
    if (!capturedUri) return;

    const scanAllowed = await checkAndUseScan();
    if (!scanAllowed) {
      setUpgradeModalVisible(true);
      setScreenState('camera');
      setCapturedUri(null);
      return;
    }

    if (scanMode === 'health') {
      setScreenState('identifying');
      const lang = language ?? 'en';
      const result = await assessPlantHealth({ imageUri: capturedUri, lang });
      setScreenState('camera');
      setCapturedUri(null);

      router.push({
        pathname: '/disease-diagnosis',
        params: {
          imageUri: capturedUri,
          healthResult: result.success ? JSON.stringify(result.data) : '',
          error: result.error ?? '',
          success: result.success ? '1' : '0',
        },
      });
      return;
    }

    setScreenState('identifying');
    const lang = language ?? 'en';
    const result = await identifyPlant({ imageUri: capturedUri, organ, lang });

    setScreenState('camera');
    setCapturedUri(null);

    router.push({
      pathname: '/results',
      params: {
        imageUri: capturedUri,
        organ,
        lang,
        success: result.success ? '1' : '0',
        error: result.error ?? '',
        data: result.data ? JSON.stringify(result.data) : '',
      },
    });
  };

  const handleOrganDismiss = () => {
    setScreenState('preview');
  };

  const toggleFacing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

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
          <MaterialIcons name="eco" size={48} color="#13ec8e" />
          <Text style={styles.identifyingText}>Identifying plant...</Text>
          <Text style={styles.identifyingSubtext}>Powered by Pl@ntNet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      />

      <SafeAreaView style={styles.cameraOverlay} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <MaterialIcons name="close" size={26} color="#fff" />
            </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={toggleFacing}
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
          >
            <MaterialIcons name="flip-camera-android" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer} pointerEvents="none">
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.viewfinderHint}>
            Center plant in frame
          </Text>
        </View>

        <View style={styles.bottomBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.galleryButton, !allowed && styles.disabledButton]}
            onPress={pickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Choose from gallery"
          >
            <MaterialIcons
              name="photo-library"
              size={28}
              color={allowed ? '#fff' : 'rgba(255,255,255,0.4)'}
            />
          </TouchableOpacity>

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
            {allowed && (
              <Text style={styles.remainingText}>
                {t('rateLimit.remaining', { remaining })}
              </Text>
            )}
            {!allowed && (
              <Text style={styles.limitReachedText}>
                {t('rateLimit.title')}
              </Text>
            )}
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </SafeAreaView>

      <OrganSelector
        visible={screenState === 'organ'}
        onSelect={handleOrganSelect}
        onDismiss={handleOrganDismiss}
      />

      <RateLimitModal
        visible={showRateLimitModal}
        limit={limit}
        onClose={() => setShowRateLimitModal(false)}
      />

      <ProUpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        triggerReason="scan_limit"
      />

      <BannerAdWrapper />
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanModeToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanModeToggleActive: {
    backgroundColor: 'rgba(19,236,142,0.3)',
  },
  viewfinderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  viewfinder: {
    width: 260,
    height: 260,
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
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 12,
  },
  viewfinderHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  disabledButton: {
    opacity: 0.5,
  },
  shutterWrapper: {
    alignItems: 'center',
    gap: 10,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#13ec8e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCapturing: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#13ec8e',
  },
  shutterInnerDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  remainingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    fontWeight: '500',
  },
  limitReachedText: {
    color: 'rgba(255,100,100,0.9)',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacer: {
    width: 52,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#0d1117',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#f0f6fc',
  },
  permissionBody: {
    fontSize: 15,
    textAlign: 'center',
    color: '#8b949e',
    lineHeight: 22,
  },
  permissionButton: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#13ec8e',
    borderRadius: 14,
  },
  permissionButtonText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '700',
  },
  identifyingContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  identifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,17,23,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  identifyingText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f0f6fc',
    textAlign: 'center',
  },
  identifyingSubtext: {
    fontSize: 14,
    color: '#8b949e',
    textAlign: 'center',
  },
});
