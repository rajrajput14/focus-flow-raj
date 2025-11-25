import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Palette, Shield, Save, Fingerprint } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { AdvancedThemeCustomization } from '@/components/profile/AdvancedThemeCustomization';
import { ProductivityInsightsDashboard } from '@/components/profile/ProductivityInsightsDashboard';
import { PrivacyDataControls } from '@/components/profile/PrivacyDataControls';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { isAvailable, isEnabled, enableBiometricAuth, disableBiometricAuth, getBiometryName } = useBiometricAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    daily_focus_goal: 120,
    scroll_limit: 20,
    cool_down_time: 10,
    blocked_apps: [] as string[],
    notification_enabled: true,
    notification_frequency: 2,
    theme: 'auto',
  });
  const [xpData, setXpData] = useState({
    total_xp: 0,
    level: 1,
    tasks_completed: 0,
    habits_completed: 0,
  });
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setFormData({
        name: data.name || '',
        email: user.email || '',
        daily_focus_goal: data.daily_focus_goal || 120,
        scroll_limit: data.scroll_limit || 20,
        cool_down_time: data.cool_down_time || 10,
        blocked_apps: data.blocked_apps || [],
        notification_enabled: data.notification_enabled ?? true,
        notification_frequency: data.notification_frequency || 2,
        theme: data.theme || 'auto',
      });
    }

    // Load XP data
    const { data: xp } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (xp) {
      setXpData(xp);
    }

    // Load badges
    const { data: badgeData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id);

    setBadges(badgeData || []);
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.name,
        daily_focus_goal: formData.daily_focus_goal,
        scroll_limit: formData.scroll_limit,
        cool_down_time: formData.cool_down_time,
        blocked_apps: formData.blocked_apps,
        notification_enabled: formData.notification_enabled,
        notification_frequency: formData.notification_frequency,
        theme: formData.theme,
      })
      .eq('user_id', user.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive',
      });
      return;
    }

    if (formData.daily_focus_goal > 120) {
      toast({
        title: 'Great choice!',
        description: "Let's increase productivity together! 🚀",
      });
    }

    toast({
      title: 'Success',
      description: 'Profile updated successfully',
    });
    setHasChanges(false);
  };

  const appOptions = [
    'Instagram',
    'Facebook',
    'Twitter',
    'TikTok',
    'YouTube',
    'Reddit',
    'Snapchat',
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold gradient-text">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account and personalization preferences</p>
      </motion.div>

      <div className="grid gap-6">
        {/* Gamification Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Level & Progress
              </CardTitle>
              <CardDescription>Your productivity achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold">{xpData.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-2xl font-bold">{xpData.total_xp}</p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress to Level {xpData.level + 1}</span>
                  <span>{xpData.total_xp % 100}/100 XP</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${(xpData.total_xp % 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{xpData.tasks_completed}</p>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{xpData.habits_completed}</p>
                  <p className="text-xs text-muted-foreground">Habits Completed</p>
                </div>
              </div>

              {badges.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Badges Earned</p>
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div
                        key={badge.id}
                        className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium"
                      >
                        🏆 {badge.badge_type.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Personal Information</CardTitle>
              </div>
              <CardDescription>Update your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="opacity-60"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Productivity Goals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Productivity Goals</CardTitle>
              </div>
              <CardDescription>Set your daily focus targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="focus-goal">Daily Focus Goal (minutes)</Label>
                <Input
                  id="focus-goal"
                  type="number"
                  value={formData.daily_focus_goal}
                  onChange={(e) => handleChange('daily_focus_goal', parseInt(e.target.value))}
                  min={30}
                  max={720}
                />
              </div>
              <div>
                <Label htmlFor="scroll-limit">Scroll Limit per Session (minutes)</Label>
                <Select
                  value={formData.scroll_limit.toString()}
                  onValueChange={(value) => handleChange('scroll_limit', parseInt(value))}
                >
                  <SelectTrigger id="scroll-limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cool-down">Cool-Down Time (minutes)</Label>
                <Select
                  value={formData.cool_down_time.toString()}
                  onValueChange={(value) => handleChange('cool_down_time', parseInt(value))}
                >
                  <SelectTrigger id="cool-down">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications & Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Notifications & Theme</CardTitle>
              </div>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive focus reminders</p>
                </div>
                <Switch
                  checked={formData.notification_enabled}
                  onCheckedChange={(checked) => handleChange('notification_enabled', checked)}
                />
              </div>
              {formData.notification_enabled && (
                <div>
                  <Label htmlFor="notification-freq">Reminder Frequency</Label>
                  <Select
                    value={formData.notification_frequency.toString()}
                    onValueChange={(value) => handleChange('notification_frequency', parseInt(value))}
                  >
                    <SelectTrigger id="notification-freq">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Every 1 hour</SelectItem>
                      <SelectItem value="2">Every 2 hours</SelectItem>
                      <SelectItem value="4">Every 4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={formData.theme}
                  onValueChange={(value) => handleChange('theme', value)}
                >
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Biometric Authentication */}
        {isAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  <CardTitle>Biometric Authentication</CardTitle>
                </div>
                <CardDescription>Secure your app with {getBiometryName()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable {getBiometryName()}</Label>
                    <p className="text-sm text-muted-foreground">
                      Use {getBiometryName()} to quickly and securely sign in
                    </p>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const success = await enableBiometricAuth();
                        if (success) {
                          toast({
                            title: 'Success',
                            description: `${getBiometryName()} enabled successfully`,
                          });
                        } else {
                          toast({
                            title: 'Error',
                            description: `Failed to enable ${getBiometryName()}`,
                            variant: 'destructive',
                          });
                        }
                      } else {
                        disableBiometricAuth();
                        toast({
                          title: 'Disabled',
                          description: `${getBiometryName()} has been disabled`,
                        });
                      }
                    }}
                  />
                </div>
                {isEnabled && (
                  <div className="rounded-lg bg-primary/10 p-3 border border-primary/20">
                    <p className="text-sm text-primary">
                      ✓ {getBiometryName()} is enabled. You can now sign in using biometric authentication.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Advanced Theme Customization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AdvancedThemeCustomization />
        </motion.div>

        {/* Productivity Insights Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <ProductivityInsightsDashboard />
        </motion.div>

        {/* Privacy & Data Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <PrivacyDataControls />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="flex justify-end"
      >
        <Button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </motion.div>

      {hasChanges && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          You have unsaved changes
        </motion.p>
      )}
    </div>
  );
}
