import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState, useRef, useEffect } from 'react';

const SOUNDS = [
  { id: 'none', name: 'None', emoji: '🔇' },
  { id: 'rain', name: 'Rain', emoji: '🌧️' },
  { id: 'forest', name: 'Forest', emoji: '🌲' },
  { id: 'coffee', name: 'Coffee Shop', emoji: '☕' },
  { id: 'whitenoise', name: 'White Noise', emoji: '📻' },
];

export function AmbientSounds() {
  const [selectedSound, setSelectedSound] = useState('none');
  const [volume, setVolume] = useState(50);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const toggleSound = (soundId: string) => {
    if (soundId === 'none') {
      setPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setSelectedSound('none');
    } else {
      setSelectedSound(soundId);
      setPlaying(true);
      // In production, you'd load actual sound files here
      // For now, this is a UI-only implementation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Ambient Sounds</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPlaying(!playing)}
          disabled={selectedSound === 'none'}
        >
          {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => toggleSound(sound.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all ${
              selectedSound === sound.id
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <span className="text-2xl">{sound.emoji}</span>
            <span className="text-xs">{sound.name}</span>
          </button>
        ))}
      </div>

      {selectedSound !== 'none' && (
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">Volume</label>
          <Slider
            value={[volume]}
            onValueChange={(vals) => setVolume(vals[0])}
            max={100}
            step={1}
          />
        </div>
      )}
    </div>
  );
}