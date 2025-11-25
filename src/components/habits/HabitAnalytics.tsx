import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target } from 'lucide-react';

interface HabitAnalyticsProps {
  completionRate: number;
  missedDays: number;
  weeklyTrend: number;
  currentStreak: number;
}

export function HabitAnalytics({ completionRate, missedDays, weeklyTrend, currentStreak }: HabitAnalyticsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="mb-2 flex items-center gap-2 text-primary">
          <Target className="h-4 w-4" />
          <span className="text-xs font-medium">Completion Rate</span>
        </div>
        <p className="text-2xl font-bold">{completionRate}%</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="mb-2 flex items-center gap-2 text-accent">
          <Calendar className="h-4 w-4" />
          <span className="text-xs font-medium">Missed Days</span>
        </div>
        <p className="text-2xl font-bold">{missedDays}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="mb-2 flex items-center gap-2 text-primary">
          <TrendingUp className="h-4 w-4" />
          <span className="text-xs font-medium">Weekly Trend</span>
        </div>
        <p className="text-2xl font-bold">
          {weeklyTrend > 0 ? '+' : ''}{weeklyTrend}%
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-4"
      >
        <div className="mb-2 flex items-center gap-2 text-accent">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-medium">Current Streak</span>
        </div>
        <p className="text-2xl font-bold">{currentStreak} days</p>
      </motion.div>
    </div>
  );
}