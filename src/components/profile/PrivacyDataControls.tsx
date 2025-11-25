import { useState } from 'react';
import { Shield, Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

export function PrivacyDataControls() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch all user data
      const [tasks, habits, notes, focusSessions, profile, habitLogs] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('focus_sessions').select('*').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('habit_logs').select('*').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        profile: profile.data,
        tasks: tasks.data,
        habits: habits.data,
        habitLogs: habitLogs.data,
        notes: notes.data,
        focusSessions: focusSessions.data,
        settings: {
          userAccentColor: localStorage.getItem('userAccentColor'),
          userAppIconStyle: localStorage.getItem('userAppIconStyle'),
          userFontPreference: localStorage.getItem('userFontPreference'),
          biometricEnabled: localStorage.getItem('biometricEnabled'),
        },
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: t('toast.success'),
        description: t('toast.dataExported'),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate data structure
      if (!importData.tasks && !importData.habits && !importData.notes) {
        throw new Error('Invalid backup file format');
      }

      // Import tasks (merge, don't overwrite)
      if (importData.tasks && Array.isArray(importData.tasks)) {
        const tasksToImport = importData.tasks.map((task: any) => ({
          ...task,
          user_id: user.id,
          id: undefined, // Let Supabase generate new IDs
        }));
        await supabase.from('tasks').insert(tasksToImport);
      }

      // Import habits
      if (importData.habits && Array.isArray(importData.habits)) {
        const habitsToImport = importData.habits.map((habit: any) => ({
          ...habit,
          user_id: user.id,
          id: undefined,
        }));
        await supabase.from('habits').insert(habitsToImport);
      }

      // Import notes
      if (importData.notes && Array.isArray(importData.notes)) {
        const notesToImport = importData.notes.map((note: any) => ({
          ...note,
          user_id: user.id,
          id: undefined,
        }));
        await supabase.from('notes').insert(notesToImport);
      }

      // Restore settings
      if (importData.settings) {
        Object.entries(importData.settings).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value as string);
        });
      }

      toast({
        title: t('toast.success'),
        description: t('toast.dataImported'),
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.error'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset input
    }
  };

  const handleClearLocalData = () => {
    // Clear only app data, not authentication
    const keysToRemove = [
      'userAccentColor',
      'userAppIconStyle',
      'userFontPreference',
      'biometricEnabled',
    ];

    keysToRemove.forEach(key => localStorage.removeItem(key));

    toast({
      title: t('toast.success'),
      description: t('toast.localDataCleared'),
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>{t('privacy.title')}</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <CardDescription>{t('privacy.description')}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-6">
            {/* Export Data */}
            <div className="flex items-start justify-between p-4 rounded-lg border border-border">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('privacy.exportTitle')}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('privacy.exportDescription')}
                </p>
              </div>
              <Button
                onClick={handleExportData}
                disabled={loading}
                variant="outline"
                className="ml-4"
              >
                {loading ? t('common.loading') : t('common.export')}
              </Button>
            </div>

            {/* Import Data */}
            <div className="flex items-start justify-between p-4 rounded-lg border border-border">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {t('privacy.importTitle')}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('privacy.importDescription')}
                </p>
              </div>
              <Button
                variant="outline"
                className="ml-4"
                onClick={() => document.getElementById('import-file')?.click()}
                disabled={loading}
              >
                {loading ? t('common.loading') : t('common.import')}
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportData}
              />
            </div>

            {/* Clear Local Data */}
            <div className="flex items-start justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Clear Local Data
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Remove all locally stored settings (does not affect cloud data)
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="ml-4">
                    Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear your local app settings like theme preferences and font choices.
                      Your cloud data (tasks, habits, notes) will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearLocalData}>
                      Clear Local Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Delete Account Placeholder */}
            <div className="flex items-start justify-between p-4 rounded-lg border border-muted bg-muted/30">
              <div className="flex-1">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Full account deletion is coming soon. For now, you can clear your local data above.
                </p>
              </div>
              <Button variant="ghost" disabled className="ml-4">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
