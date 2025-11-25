import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HabitHistoryCalendarProps {
  habitId: string;
}

export function HabitHistoryCalendar({ habitId }: HabitHistoryCalendarProps) {
  const { user } = useAuth();
  const [completionDates, setCompletionDates] = useState<string[]>([]);

  useEffect(() => {
    loadHistory();
  }, [habitId]);

  const loadHistory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('habit_id', habitId)
      .eq('user_id', user.id);

    setCompletionDates(data?.map(d => d.completed_at) || []);
  };

  // Generate last 12 weeks
  const weeks = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
    const weekDays = [];
    for (let j = 0; j < 7; j++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + j);
      weekDays.push(day);
    }
    weeks.push(weekDays);
  }

  const isDayCompleted = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return completionDates.includes(dateStr);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Completion History</h4>
      <div className="flex gap-1">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1">
            {week.map((day, dayIdx) => (
              <motion.div
                key={dayIdx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (weekIdx * 7 + dayIdx) * 0.01 }}
                className={`h-3 w-3 rounded-sm ${
                  isDayCompleted(day)
                    ? 'bg-gradient-to-br from-primary to-accent'
                    : 'bg-muted'
                }`}
                title={day.toLocaleDateString()}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-muted" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-sm bg-gradient-to-br from-primary to-accent" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}