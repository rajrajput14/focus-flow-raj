import { useState, useEffect } from 'react';
import { TrendingUp, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';

interface TaskData {
  date: string;
  count: number;
}

interface FocusSession {
  start_time: string;
  duration: number;
}

export function ProductivityInsightsDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [taskTrend, setTaskTrend] = useState<TaskData[]>([]);
  const [habitConsistency, setHabitConsistency] = useState(0);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [stats, setStats] = useState({
    totalFocusMinutes: 0,
    avgDailyTasks: 0,
    bestFocusDay: 'N/A',
    bestHabitStreak: 0,
  });

  useEffect(() => {
    if (user && isOpen) {
      loadProductivityData();
    }
  }, [user, isOpen]);

  const loadProductivityData = async () => {
    if (!user) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    // Load tasks completed in last 7 days
    const { data: tasks } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgoStr);

    // Process task trend data
    const trendMap: { [key: string]: number } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayKey = days[date.getDay()];
      trendMap[dayKey] = 0;
    }

    tasks?.forEach(task => {
      if (task.completed_at) {
        const date = new Date(task.completed_at);
        const dayKey = days[date.getDay()];
        if (trendMap[dayKey] !== undefined) {
          trendMap[dayKey]++;
        }
      }
    });

    const trendData = Object.entries(trendMap).map(([date, count]) => ({ date, count }));
    setTaskTrend(trendData);

    // Calculate average daily tasks
    const totalTasks = tasks?.length || 0;
    setStats(prev => ({ ...prev, avgDailyTasks: Math.round(totalTasks / 7) }));

    // Load habit logs for last 7 days
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', sevenDaysAgoStr);

    // Calculate habit consistency
    const daysWithHabits = new Set(
      habitLogs?.map(log => new Date(log.completed_at).toDateString()) || []
    ).size;
    setHabitConsistency((daysWithHabits / 7) * 100);

    // Get best habit streak
    const { data: habits } = await supabase
      .from('habits')
      .select('streak')
      .eq('user_id', user.id)
      .order('streak', { ascending: false })
      .limit(1);

    if (habits && habits.length > 0) {
      setStats(prev => ({ ...prev, bestHabitStreak: habits[0].streak || 0 }));
    }

    // Load focus sessions
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('start_time, duration')
      .eq('user_id', user.id)
      .gte('start_time', sevenDaysAgoStr);

    setFocusSessions(sessions || []);

    // Calculate total focus minutes
    const totalMinutes = sessions?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0;
    setStats(prev => ({ ...prev, totalFocusMinutes: Math.round(totalMinutes) }));

    // Find best focus day
    if (sessions && sessions.length > 0) {
      const dayMinutes: { [key: string]: number } = {};
      sessions.forEach(session => {
        const day = days[new Date(session.start_time).getDay()];
        dayMinutes[day] = (dayMinutes[day] || 0) + (session.duration || 0);
      });
      const bestDay = Object.entries(dayMinutes).sort(([, a], [, b]) => b - a)[0];
      setStats(prev => ({ ...prev, bestFocusDay: bestDay ? bestDay[0] : 'N/A' }));
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="glass-card">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>{t('insights.title')}</CardTitle>
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
            <CardDescription>{t('insights.description')}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-6">
            {/* Weekly Task Completion Trend */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                {t('insights.weeklyTasks')}
              </h4>
              <div className="flex items-end justify-between gap-2 h-32">
                {taskTrend.map((day, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-muted rounded-t relative" style={{ height: '100%' }}>
                      <div
                        className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-accent rounded-t transition-all"
                        style={{ height: `${Math.min((day.count / Math.max(...taskTrend.map(d => d.count), 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.date}</span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Habit Consistency Gauge */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Flame className="h-4 w-4" />
                {t('insights.habitConsistency')}
              </h4>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeDasharray={`${habitConsistency * 2.51} 251`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{Math.round(habitConsistency)}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('insights.completedHabits', { count: Math.round(habitConsistency / 100 * 7) })}
                  </p>
                </div>
              </div>
            </div>

            {/* Focus Session Heatmap */}
            <div className="space-y-3">
              <h4 className="font-medium">{t('insights.focusHeatmap')}</h4>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const date = new Date();
                  date.setDate(date.getDate() - (6 - dayIdx));
                  const dayStart = new Date(date.setHours(0, 0, 0, 0));
                  const dayEnd = new Date(date.setHours(23, 59, 59, 999));
                  
                  const sessionsThisDay = focusSessions.filter(s => {
                    const sessionDate = new Date(s.start_time);
                    return sessionDate >= dayStart && sessionDate <= dayEnd;
                  }).length;

                  const intensity = Math.min(sessionsThisDay * 25, 100);

                  return (
                    <div
                      key={dayIdx}
                      className="aspect-square rounded"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${intensity}%)`,
                        border: '1px solid hsl(var(--border))'
                      }}
                      title={`${sessionsThisDay} sessions`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Darker = more focus sessions that day
              </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-2xl font-bold text-primary">{stats.totalFocusMinutes}</p>
                <p className="text-xs text-muted-foreground">{t('insights.totalFocusMinutes')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-2xl font-bold text-primary">{stats.avgDailyTasks}</p>
                <p className="text-xs text-muted-foreground">{t('insights.avgDailyTasks')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-2xl font-bold text-primary">{stats.bestFocusDay}</p>
                <p className="text-xs text-muted-foreground">{t('insights.bestFocusDay')}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                <p className="text-2xl font-bold text-primary">{stats.bestHabitStreak}</p>
                <p className="text-xs text-muted-foreground">{t('insights.bestHabitStreak')}</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
