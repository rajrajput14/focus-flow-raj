import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Target, Timer, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tasksToday: 0,
    tasksCompleted: 0,
    habitsCount: 0,
    pomodoroSessions: 0,
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const [completionData, setCompletionData] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch tasks today
    const { data: tasksToday } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_on', today.toISOString())
      .lt('scheduled_on', tomorrow.toISOString());

    // Fetch completed tasks
    const { data: tasksCompleted } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('scheduled_on', today.toISOString())
      .lt('scheduled_on', tomorrow.toISOString());

    // Fetch habits
    const { data: habits } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id);

    // Fetch pomodoro sessions today
    const { data: pomodoro } = await supabase
      .from('pomodoro_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    setStats({
      tasksToday: tasksToday?.length || 0,
      tasksCompleted: tasksCompleted?.length || 0,
      habitsCount: habits?.length || 0,
      pomodoroSessions: pomodoro?.filter((p) => p.session_type === 'focus').length || 0,
    });

    // Generate 7-day trend data
    const trendData = [];
    const completionData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const { data: dayTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'done')
        .gte('scheduled_on', date.toISOString())
        .lt('scheduled_on', nextDate.toISOString());

      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      trendData.push({
        day: dayName,
        tasks: dayTasks?.length || 0,
      });

      completionData.push({
        day: dayName,
        completed: dayTasks?.length || 0,
      });
    }

    setTrendData(trendData);
    setCompletionData(completionData);
  };

  const statCards = [
    {
      title: 'Tasks Today',
      value: stats.tasksToday,
      icon: CheckSquare,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Tasks Completed',
      value: stats.tasksCompleted,
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Active Habits',
      value: stats.habitsCount,
      icon: Target,
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Pomodoro Sessions',
      value: stats.pomodoroSessions,
      icon: Timer,
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your productivity overview.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card glass-card-hover rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">7-Day Task Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="hsl(235, 85%, 60%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(235, 85%, 60%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">Completion by Day</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Bar dataKey="completed" fill="hsl(260, 80%, 65%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}