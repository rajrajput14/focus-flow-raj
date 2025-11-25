import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const indianLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी' },
  { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो' },
];

export function LanguagePreferences() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('userLanguage') || 'en';
    setSelectedLanguage(savedLanguage);
    
    // Apply language to document
    document.documentElement.lang = savedLanguage;
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    localStorage.setItem('userLanguage', languageCode);
    document.documentElement.lang = languageCode;

    const language = indianLanguages.find(lang => lang.code === languageCode);
    
    toast({
      title: 'Language Updated',
      description: `Language changed to ${language?.name} (${language?.nativeName})`,
    });
  };

  const filteredLanguages = indianLanguages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLang = indianLanguages.find(lang => lang.code === selectedLanguage);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Language Preferences</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <CardDescription>
              Choose your preferred language from all Indian languages
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            {/* Current Selection Display */}
            <div className="rounded-lg bg-primary/10 p-4 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Language</p>
                  <p className="text-xl font-semibold text-primary">
                    {selectedLang?.name}
                  </p>
                  <p className="text-2xl font-medium mt-1">
                    {selectedLang?.nativeName}
                  </p>
                </div>
                <Globe className="h-12 w-12 text-primary/50" />
              </div>
            </div>

            {/* Search Box */}
            <div className="space-y-2">
              <Label htmlFor="language-search">Search Languages</Label>
              <Input
                id="language-search"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Language Selector */}
            <div className="space-y-3">
              <Label htmlFor="language-select">Select Language</Label>
              <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue>
                    {selectedLang?.name} ({selectedLang?.nativeName})
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredLanguages.map((lang) => (
                    <SelectItem 
                      key={lang.code} 
                      value={lang.code}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{lang.name}</span>
                        <span className="text-muted-foreground">{lang.nativeName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Grid Display */}
            <div className="space-y-3">
              <Label>Quick Select</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {indianLanguages.slice(0, 6).map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedLanguage === lang.code
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <p className="font-medium text-sm">{lang.name}</p>
                    <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language Support
              </h4>
              <p className="text-xs text-muted-foreground">
                Focus Flow supports all {indianLanguages.length} official and widely-spoken Indian languages. 
                Your selected language will be saved and applied across the app. UI translations are 
                being progressively added for all supported languages.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
