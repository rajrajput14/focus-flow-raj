import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AIHabitGenerator() {
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const generateHabits = async () => {
    if (!goal.trim()) {
      toast.error('Please enter a goal');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-habit-generator', {
        body: { goal },
      });

      if (error) throw error;

      setSuggestions(data.habits || []);
      toast.success('Habit suggestions generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate habits');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
          <Target className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold">AI Habit Generator</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Enter your goal and AI will suggest habits to help you achieve it
      </p>

      <div className="space-y-4">
        <Input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="E.g., Get fit, Learn Spanish, Be more productive..."
          className="glass-card"
          onKeyDown={(e) => e.key === 'Enter' && generateHabits()}
        />

        <Button
          onClick={generateHabits}
          disabled={loading || !goal.trim()}
          className="w-full gradient-primary text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating...
            </span>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Habits
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-3"
        >
          {suggestions.map((habit, i) => (
            <div key={i} className="glass-card rounded-lg p-4">
              <h4 className="mb-1 font-medium">{habit.title}</h4>
              <p className="mb-2 text-xs text-muted-foreground">{habit.frequency}</p>
              <p className="text-sm text-muted-foreground">{habit.strategy}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}