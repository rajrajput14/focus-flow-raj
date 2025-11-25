import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Pomodoro() {
  const { user } = useAuth();
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);

    if (user) {
      await supabase.from('pomodoro_logs').insert({
        user_id: user.id,
        duration: sessionType === 'focus' ? focusDuration : breakDuration,
        session_type: sessionType,
      });
    }

    if (sessionType === 'focus') {
      toast.success('Focus session complete! Time for a break.');
      setSessionType('break');
      setTimeLeft(breakDuration * 60);
    } else {
      toast.success('Break complete! Ready for another focus session?');
      setSessionType('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(sessionType === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const switchSession = (type: 'focus' | 'break') => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(type === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = sessionType === 'focus'
    ? ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100
    : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text">Pomodoro Timer</h1>
        <p className="text-muted-foreground">Focus with the Pomodoro technique</p>
      </motion.div>

      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-3xl p-12 text-center"
        >
          <div className="mb-8 flex justify-center gap-4">
            <Button
              onClick={() => switchSession('focus')}
              variant={sessionType === 'focus' ? 'default' : 'outline'}
              className={sessionType === 'focus' ? 'gradient-primary text-white' : ''}
            >
              Focus
            </Button>
            <Button
              onClick={() => switchSession('break')}
              variant={sessionType === 'break' ? 'default' : 'outline'}
              className={sessionType === 'break' ? 'gradient-primary text-white' : ''}
            >
              Break
            </Button>
          </div>

          <div className="relative mx-auto mb-8 h-64 w-64">
            <svg className="h-full w-full -rotate-90 transform">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(235, 85%, 60%)" />
                  <stop offset="100%" stopColor="hsl(260, 80%, 65%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="mb-2 rounded-xl bg-gradient-to-br from-primary to-accent p-3">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <p className="text-5xl font-bold">{formatTime(timeLeft)}</p>
              <p className="text-sm text-muted-foreground capitalize">{sessionType} Session</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button
              onClick={toggleTimer}
              size="lg"
              className="gradient-primary gap-2 text-white"
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Start
                </>
              )}
            </Button>
            <Button onClick={resetTimer} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-4">
              <label className="mb-2 block text-sm text-muted-foreground">Focus (minutes)</label>
              <Input
                type="number"
                value={focusDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 25;
                  setFocusDuration(val);
                  if (sessionType === 'focus' && !isRunning) {
                    setTimeLeft(val * 60);
                  }
                }}
                min="1"
                className="text-center"
              />
            </div>
            <div className="glass-card rounded-xl p-4">
              <label className="mb-2 block text-sm text-muted-foreground">Break (minutes)</label>
              <Input
                type="number"
                value={breakDuration}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 5;
                  setBreakDuration(val);
                  if (sessionType === 'break' && !isRunning) {
                    setTimeLeft(val * 60);
                  }
                }}
                min="1"
                className="text-center"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}