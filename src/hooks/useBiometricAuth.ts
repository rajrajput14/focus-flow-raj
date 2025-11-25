import { useState, useEffect } from 'react';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export interface BiometricAuthState {
  isAvailable: boolean;
  biometryType: BiometryType | null;
  isEnabled: boolean;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricAuthState>({
    isAvailable: false,
    biometryType: null,
    isEnabled: false,
  });

  useEffect(() => {
    checkBiometricAvailability();
    loadBiometricPreference();
  }, []);

  const checkBiometricAvailability = async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      setState(prev => ({
        ...prev,
        isAvailable: result.isAvailable,
        biometryType: result.biometryType || null,
      }));
    } catch (error) {
      console.error('Biometric check error:', error);
    }
  };

  const loadBiometricPreference = () => {
    const enabled = localStorage.getItem('biometric_auth_enabled') === 'true';
    setState(prev => ({ ...prev, isEnabled: enabled }));
  };

  const authenticate = async (reason: string = 'Authenticate to access your account'): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !state.isAvailable) {
      return false;
    }

    try {
      await NativeBiometric.verifyIdentity({
        reason,
        title: 'Authentication Required',
        subtitle: 'Please authenticate to continue',
        description: reason,
      });
      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return false;
    }
  };

  const enableBiometricAuth = async () => {
    if (!state.isAvailable) {
      return false;
    }

    const success = await authenticate('Enable biometric authentication');
    if (success) {
      localStorage.setItem('biometric_auth_enabled', 'true');
      setState(prev => ({ ...prev, isEnabled: true }));
      return true;
    }
    return false;
  };

  const disableBiometricAuth = () => {
    localStorage.removeItem('biometric_auth_enabled');
    localStorage.removeItem('last_login_email');
    localStorage.removeItem('last_login_password');
    setState(prev => ({ ...prev, isEnabled: false }));
  };

  const getBiometryName = (): string => {
    switch (state.biometryType) {
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.FINGERPRINT:
        return 'Fingerprint';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Face Authentication';
      case BiometryType.IRIS_AUTHENTICATION:
        return 'Iris Authentication';
      default:
        return 'Biometric Authentication';
    }
  };

  return {
    ...state,
    authenticate,
    enableBiometricAuth,
    disableBiometricAuth,
    getBiometryName,
  };
}
