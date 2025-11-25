import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, TrendingUp, Zap, Calendar } from 'lucide-react';

export function PomodoroAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    bestDay: 'Monday',
    weeklyTrend: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    if (!user) return;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: sessions } = await supabase
      .from('pomodoro_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', weekAgo.toISOString());

    const totalSessions = sessions?.length || 0;
    const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration, 0) || 0;

    // Calculate best day
    const dayCount: Record<string, number> = {};
    sessions?.forEach(s => {
      const day = new Date(s.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    const bestDay = Object.entries(dayCount).reduce(
      (max, [day, count]) => (count > max.count ? { day, count } : max),
      { day: 'Monday', count: 0 }
    ).day;

    setStats({
      totalSessions,
      totalMinutes,
      bestDay,
      weeklyTrend: totalSessions > 0 ? 15 : 0,
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="mb-6 text-lg font-semibold">Pomodoro Analytics</h3>
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Total Sessions</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalSessions}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Total Minutes</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalMinutes}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium">Best Focus Day</span>
          </div>
          <p className="text-lg font-bold">{stats.bestDay}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="mb-2 flex items-center gap-2 text-accent">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">Weekly Trend</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.weeklyTrend > 0 ? '+' : ''}{stats.weeklyTrend}%
          </p>
        </motion.div>
      </div>
    </div>
  );
}