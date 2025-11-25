import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, Fingerprint } from 'lucide-react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { Separator } from '@/components/ui/separator';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { isAvailable, isEnabled, authenticate, getBiometryName } = useBiometricAuth();
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  useEffect(() => {
    // Check if user has stored credentials and biometric is enabled
    const storedEmail = localStorage.getItem('last_login_email');
    if (isLogin && isAvailable && isEnabled && storedEmail) {
      setEmail(storedEmail);
      setShowBiometricButton(true);
    }
  }, [isLogin, isAvailable, isEnabled]);

  const handleBiometricLogin = async () => {
    const storedEmail = localStorage.getItem('last_login_email');
    const storedPassword = localStorage.getItem('last_login_password');

    if (!storedEmail || !storedPassword) {
      toast.error('No saved credentials found');
      return;
    }

    setLoading(true);

    try {
      const authenticated = await authenticate(`Sign in with ${getBiometryName()}`);
      
      if (authenticated) {
        const { error } = await signIn(storedEmail, storedPassword);
        if (error) {
          toast.error(error.message || 'Failed to sign in');
        } else {
          toast.success('Welcome back!');
        }
      } else {
        toast.error('Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (!isLogin && !name)) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || 'Failed to sign in');
        } else {
          // Store credentials for biometric auth (in production, use secure storage)
          localStorage.setItem('last_login_email', email);
          localStorage.setItem('last_login_password', password);
          toast.success('Welcome back!');
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          toast.error(error.message || 'Failed to sign up');
        } else {
          toast.success('Account created successfully!');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="mb-2 text-3xl font-bold gradient-text">FocusFlow</h1>
            <p className="text-muted-foreground">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="glass-card border-white/30"
                  disabled={loading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="glass-card border-white/30"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="glass-card border-white/30"
                disabled={loading}
              />
            </div>

            {showBiometricButton && isLogin && (
              <>
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  className="w-full gradient-primary text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Fingerprint className="h-5 w-5" />
                      Sign in with {getBiometryName()}
                    </span>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground glass-card">
                      Or continue with email
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}