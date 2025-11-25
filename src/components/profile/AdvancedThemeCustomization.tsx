import { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const accentColors = [
  { name: 'Purple', value: '#8B5CF6', hsl: '258 90% 66%' },
  { name: 'Blue', value: '#3B82F6', hsl: '217 91% 60%' },
  { name: 'Teal', value: '#14B8A6', hsl: '173 80% 40%' },
  { name: 'Orange', value: '#FB923C', hsl: '27 96% 61%' },
  { name: 'Pink', value: '#EC4899', hsl: '330 81% 60%' },
];

const iconStyles = [
  { name: 'Default (Purple)', value: 'default', preview: '🟣' },
  { name: 'Minimal (White on Gradient)', value: 'minimal', preview: '⚪' },
  { name: 'Dark (Black/Grey Minimal)', value: 'dark', preview: '⚫' },
];

const fontStyles = [
  { name: 'Clean', value: 'clean' },
  { name: 'Rounded', value: 'rounded' },
  { name: 'Compact', value: 'compact' },
];

export function AdvancedThemeCustomization() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [accentColor, setAccentColor] = useState('#8B5CF6');
  const [iconStyle, setIconStyle] = useState('default');
  const [fontStyle, setFontStyle] = useState('clean');
  const { theme, setTheme, isDark } = useDarkMode();

  useEffect(() => {
    // Load saved preferences
    const savedAccent = localStorage.getItem('userAccentColor');
    const savedIcon = localStorage.getItem('userAppIconStyle');
    const savedFont = localStorage.getItem('userFontPreference');

    if (savedAccent) {
      setAccentColor(savedAccent);
      // Re-apply saved accent color
      const color = accentColors.find(c => c.value === savedAccent);
      if (color) {
        document.documentElement.style.setProperty('--primary', color.hsl);
        document.documentElement.style.setProperty('--accent', color.hsl);
      }
    }
    if (savedIcon) setIconStyle(savedIcon);
    if (savedFont) {
      setFontStyle(savedFont);
      // Re-apply saved font
      const fontMap = {
        clean: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        rounded: "'Nunito', 'Quicksand', sans-serif",
        compact: "'Roboto Condensed', 'Arial Narrow', sans-serif",
      };
      document.body.style.fontFamily = fontMap[savedFont as keyof typeof fontMap];
    }
  }, []);

  const handleAccentChange = (value: string) => {
    setAccentColor(value);
    localStorage.setItem('userAccentColor', value);
    
    // Apply accent color to CSS variables
    const color = accentColors.find(c => c.value === value);
    if (color) {
      document.documentElement.style.setProperty('--primary', color.hsl);
      document.documentElement.style.setProperty('--accent', color.hsl);
    }
  };

  const handleIconStyleChange = (value: string) => {
    setIconStyle(value);
    localStorage.setItem('userAppIconStyle', value);
  };

  const handleFontStyleChange = (value: string) => {
    setFontStyle(value);
    localStorage.setItem('userFontPreference', value);
    
    // Apply font style to body
    const fontMap = {
      clean: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      rounded: "'Nunito', 'Quicksand', sans-serif",
      compact: "'Roboto Condensed', 'Arial Narrow', sans-serif",
    };
    document.body.style.fontFamily = fontMap[value as keyof typeof fontMap];
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast({
      title: t('toast.themeUpdated'),
      description: t('toast.themeSwitched', { 
        theme: newTheme === 'system' ? t('theme.system') : newTheme === 'dark' ? t('theme.dark') : t('theme.light')
      }),
    });
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="h-4 w-4" />;
    if (theme === 'dark') return <Moon className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>{t('theme.title')}</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <CardDescription>{t('theme.description')}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            {/* Theme Mode Selector */}
            <div className="space-y-3">
              <Label>{t('theme.mode')}</Label>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun className="h-4 w-4" />
                  {t('theme.light')}
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon className="h-4 w-4" />
                  {t('theme.dark')}
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  className="flex items-center justify-center gap-2"
                  onClick={() => handleThemeChange('system')}
                >
                  <Monitor className="h-4 w-4" />
                  {t('theme.system')}
                </Button>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm flex items-center gap-2">
                {getThemeIcon()}
                <span className="text-muted-foreground">
                  {theme === 'system' 
                    ? t('theme.systemPreference', { mode: isDark ? t('theme.dark') : t('theme.light') })
                    : t('theme.usingMode', { mode: theme === 'dark' ? t('theme.dark') : t('theme.light') })
                  }
                </span>
              </div>
            </div>

            {/* Accent Color Picker */}
            <div className="space-y-3">
              <Label>{t('theme.accentColor')}</Label>
              <div className="grid grid-cols-5 gap-3">
                {accentColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleAccentChange(color.value)}
                    className={`relative h-12 rounded-lg transition-all ${
                      accentColor === color.value
                        ? 'ring-2 ring-offset-2 ring-primary scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {accentColor === color.value && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xl">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {accentColors.find(c => c.value === accentColor)?.name || 'Custom'}
              </p>
            </div>

            {/* App Icon Style */}
            <div className="space-y-3">
              <Label htmlFor="icon-style">{t('theme.iconStyle')}</Label>
              <Select value={iconStyle} onValueChange={handleIconStyleChange}>
                <SelectTrigger id="icon-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <span className="flex items-center gap-2">
                        {style.preview} {style.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This preference will be applied when building the mobile app
              </p>
            </div>

            {/* Font Style Selector */}
            <div className="space-y-3">
              <Label htmlFor="font-style">{t('theme.fontStyle')}</Label>
              <Select value={fontStyle} onValueChange={handleFontStyleChange}>
                <SelectTrigger id="font-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontStyles.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="rounded-lg bg-muted/50 p-3 text-sm" style={{
                fontFamily: fontStyle === 'rounded' ? "'Comic Sans MS', cursive" : 
                           fontStyle === 'compact' ? "'Arial Narrow', sans-serif" : 'inherit'
              }}>
                {t('theme.preview')}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
