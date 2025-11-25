import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Fingerprint } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const { isAvailable, isEnabled, authenticate, getBiometryName } = useBiometricAuth();
  const [showError, setShowError] = useState(false);
  const [biometricState, setBiometricState] = useState<'idle' | 'authenticating' | 'failed'>('idle');
  const [hasAttemptedBiometric, setHasAttemptedBiometric] = useState(false);

  // Hide splash screen on mount
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide();
    }
  }, []);

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!isAvailable || !isEnabled) return false;

    setBiometricState('authenticating');
    const success = await authenticate('Unlock Focus Flow');
    
    if (success) {
      // Get stored credentials
      const email = localStorage.getItem('last_login_email');
      const password = localStorage.getItem('last_login_password');
      
      if (email && password) {
        const { error } = await signIn(email, password);
        if (!error) {
          toast({
            title: 'Welcome back!',
            description: 'Authenticated successfully',
          });
          return true;
        }
      }
    }
    
    setBiometricState('failed');
    return false;
  };

  // Auto-trigger biometric on app start
  useEffect(() => {
    const tryBiometric = async () => {
      if (!loading && !user && !hasAttemptedBiometric && isAvailable && isEnabled) {
        setHasAttemptedBiometric(true);
        await handleBiometricAuth();
      }
    };
    tryBiometric();
  }, [loading, user, isAvailable, isEnabled, hasAttemptedBiometric]);

  // Navigation logic
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setShowError(true);
      }
    }, 8000);

    if (!loading && biometricState !== 'authenticating') {
      clearTimeout(timeout);
      if (user) {
        navigate('/dashboard');
      } else if (!isEnabled || biometricState === 'failed') {
        navigate('/auth');
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, navigate, biometricState, isEnabled]);

  // Show biometric failed state with retry
  if (biometricState === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="text-center space-y-6 max-w-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Authentication Failed</h2>
            <p className="text-muted-foreground">
              {getBiometryName()} authentication was unsuccessful
            </p>
          </div>
          <button 
            onClick={async () => {
              setBiometricState('idle');
              const success = await handleBiometricAuth();
              if (!success) {
                navigate('/auth');
              }
            }}
            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Try Again
          </button>
          <button 
            onClick={() => navigate('/auth')}
            className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Use Password Instead
          </button>
        </div>
      </div>
    );
  }

  if (showError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="text-center space-y-4">
          <p className="text-foreground">Loading is taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show biometric authentication in progress
  if (biometricState === 'authenticating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Fingerprint className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Authenticating</h2>
            <p className="text-muted-foreground">
              Please complete {getBiometryName()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
        <p className="text-muted-foreground">Loading Focus Flow...</p>
      </div>
    </div>
  );
};

export default Index;