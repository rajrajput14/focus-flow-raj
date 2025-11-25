import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ProductivityScore } from '@/components/analytics/ProductivityScore';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TimeRange = 'today' | 'week' | 'month' | 'all';

export default function Analytics() {
  const { user } = useAuth();
  const [range, setRange] = useState<TimeRange>('week');
  const [stats, setStats] = useState({
    totalFocusHours: 0,
    currentStreak: 0,
    scrollBreaks: 0,
    avgSessionDuration: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [sessionTypeData, setSessionTypeData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, range]);

  const loadAnalytics = async () => {
    if (!user) return;

    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'month') {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate = new Date('2000-01-01');
    }

    // Load focus sessions
    const { data: sessions } = await supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Load scroll breaks
    const { data: breaks } = await supabase
      .from('scroll_breaks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Load tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', startDate.toISOString());

    // Load habit logs
    const { data: habitLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Calculate stats
    const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duration || 0), 0) || 0;
    const totalHours = Math.round(totalMinutes / 60);
    const avgDuration = sessions?.length
      ? Math.round(totalMinutes / sessions.length)
      : 0;

    // Calculate task completion rate
    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate habit completion
    const habitCompletions = habitLogs?.length || 0;

    setStats({
      totalFocusHours: totalHours,
      currentStreak: 7, // Placeholder
      scrollBreaks: breaks?.length || 0,
      avgSessionDuration: avgDuration,
    });

    // Generate daily data for line chart (include habits and tasks)
    const dailyMap = new Map<string, { hours: number; tasks: number; habits: number }>();
    
    sessions?.forEach((session) => {
      const date = new Date(session.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const existing = dailyMap.get(date) || { hours: 0, tasks: 0, habits: 0 };
      dailyMap.set(date, { ...existing, hours: existing.hours + (session.duration || 0) / 60 });
    });

    tasks?.forEach((task) => {
      if (task.completed_at) {
        const date = new Date(task.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const existing = dailyMap.get(date) || { hours: 0, tasks: 0, habits: 0 };
        dailyMap.set(date, { ...existing, tasks: existing.tasks + 1 });
      }
    });

    habitLogs?.forEach((log) => {
      const date = new Date(log.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const existing = dailyMap.get(date) || { hours: 0, tasks: 0, habits: 0 };
      dailyMap.set(date, { ...existing, habits: existing.habits + 1 });
    });

    const dailyChartData = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      hours: Math.round(data.hours * 10) / 10,
      tasks: data.tasks,
      habits: data.habits,
    }));

    setDailyData(dailyChartData);

    // Generate session type distribution
    const typeMap = new Map<string, number>();
    sessions?.forEach((session) => {
      const type = session.session_type || 'deep_work';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const typeData = Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
    }));

    setSessionTypeData(typeData);

    // Generate heatmap (hour-wise activity)
    const hourMap = new Map<number, number>();
    sessions?.forEach((session) => {
      const hour = new Date(session.created_at).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    const heatmap = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      sessions: hourMap.get(i) || 0,
    }));

    setHeatmapData(heatmap);

    // Generate insights
    const peakHour = Array.from(hourMap.entries()).reduce(
      (max, [hour, count]) => (count > max.count ? { hour, count } : max),
      { hour: 0, count: 0 }
    );

    const newInsights = [
      `You completed ${totalTasks} tasks and ${habitCompletions} habit check-ins in this period.`,
      `Your highest focus time is between ${peakHour.hour}:00–${peakHour.hour + 1}:00.`,
      `Task completion rate: ${taskCompletionRate}%. ${taskCompletionRate < 70 ? 'Try breaking tasks into smaller subtasks!' : 'Great work!'}`,
      'Try enabling Focus Mode during your distracted hours.',
    ];

    setInsights(newInsights);
  };

  const statCards = [
    {
      title: 'Total Focus Hours',
      value: stats.totalFocusHours,
      icon: Clock,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Current Streak',
      value: stats.currentStreak,
      icon: Target,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Scroll Breaks',
      value: stats.scrollBreaks,
      icon: Zap,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: 'Avg Session (min)',
      value: stats.avgSessionDuration,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  const COLORS = ['hsl(235, 85%, 60%)', 'hsl(260, 80%, 65%)', 'hsl(280, 75%, 70%)', 'hsl(200, 80%, 60%)'];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Analytics & Insights</h1>
          <p className="text-muted-foreground">Track your productivity journey</p>
        </div>
        <Select value={range} onValueChange={(value) => setRange(value as TimeRange)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass-card glass-card-hover">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Daily Focus Time</CardTitle>
              <CardDescription>Hours spent in focus mode</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="date" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="hsl(235, 85%, 60%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(235, 85%, 60%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Session Type Distribution</CardTitle>
              <CardDescription>Breakdown by session type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sessionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sessionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Hourly Activity Heatmap</CardTitle>
            <CardDescription>Sessions by hour of day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={heatmapData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis dataKey="hour" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="sessions" fill="hsl(260, 80%, 65%)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Predictive Insights</CardTitle>
              <CardDescription>Based on your activity patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  💡 {insight}
                </p>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <ProductivityScore
            score={Math.round((stats.totalFocusHours / 10 + stats.currentStreak * 2 + (dailyData.length > 0 ? 30 : 0)))}
            taskCompletion={dailyData.reduce((sum, d) => sum + d.tasks, 0) > 0 ? 75 : 0}
            habitConsistency={dailyData.reduce((sum, d) => sum + d.habits, 0) > 0 ? 80 : 0}
            focusRegularity={stats.totalFocusHours > 0 ? 85 : 0}
          />
        </motion.div>
      </div>
    </div>
  );
}
