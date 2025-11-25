import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AIDailyPlanner() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  const generatePlan = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-daily-planner', {
        body: { userId: user.id },
      });

      if (error) throw error;

      setPlan(data);
      toast.success('Daily plan generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold">AI Daily Planner</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Let AI generate your optimal daily plan with prioritized tasks, habits, and focus windows
      </p>

      <Button
        onClick={generatePlan}
        disabled={loading}
        className="mb-6 w-full gradient-primary text-white"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Generating Plan...
          </span>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Today's Plan
          </>
        )}
      </Button>

      {plan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {plan.tasks && plan.tasks.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Priority Tasks</h3>
              <div className="space-y-2">
                {plan.tasks.map((task: any, i: number) => (
                  <div key={i} className="glass-card rounded-lg p-3 text-sm">
                    {task.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.habits && plan.habits.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Suggested Habits</h3>
              <div className="space-y-2">
                {plan.habits.map((habit: string, i: number) => (
                  <div key={i} className="glass-card rounded-lg p-3 text-sm">
                    {habit}
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.focusWindows && plan.focusWindows.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Focus Windows</h3>
              <div className="space-y-2">
                {plan.focusWindows.map((window: string, i: number) => (
                  <div key={i} className="glass-card rounded-lg p-3 text-sm">
                    {window}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}