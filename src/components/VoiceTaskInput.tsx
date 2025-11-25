import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceTaskInputProps {
  onTranscript: (text: string) => void;
  onAutoCreate?: () => void;
}

export const VoiceTaskInput = ({ onTranscript, onAutoCreate }: VoiceTaskInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      toast.success('Voice transcribed successfully!');
      
      // Auto-create task after a short delay
      setTimeout(() => {
        if (onAutoCreate) {
          onAutoCreate();
        }
      }, 500);
    };

    recognitionInstance.onerror = (event: any) => {
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access is required for voice task creation.');
      } else if (event.error === 'no-speech') {
        toast.error('Could not hear you, try again.');
      } else if (event.error === 'audio-capture') {
        toast.error('No microphone detected.');
      } else {
        toast.error('Please speak clearly.');
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onTranscript, onAutoCreate]);

  const toggleListening = async () => {
    if (!isSupported) {
      toast.error('Voice recognition not supported on this device');
      return;
    }

    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      try {
        recognition?.start();
        setIsListening(true);
        toast.info('Listening... Speak now');
      } catch (error) {
        toast.error('Failed to start voice recognition');
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleListening}
        className={`relative transition-all ${
          isListening 
            ? 'bg-accent text-accent-foreground border-accent shadow-lg' 
            : 'glass-card'
        }`}
      >
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="listening"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <Mic className="h-4 w-4" />
              <motion.div
                className="absolute inset-0 rounded-full bg-accent/30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Mic className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {isListening && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs text-muted-foreground"
          >
            Listening...
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
