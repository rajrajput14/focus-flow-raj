import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Target, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
}

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [open, setOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    frequency: 'daily',
  });
  const [habitLogs, setHabitLogs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      loadHabits();
      loadTodayLogs();
    }
  }, [user]);

  const loadHabits = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load habits');
    } else {
      setHabits(data || []);
    }
  };

  const loadTodayLogs = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_at', today);

    const logs: Record<string, boolean> = {};
    data?.forEach((log) => {
      logs[log.habit_id] = true;
    });
    setHabitLogs(logs);
  };

  const createHabit = async () => {
    if (!user || !newHabit.title.trim()) {
      toast.error('Please enter a habit title');
      return;
    }

    const { error } = await supabase.from('habits').insert({
      user_id: user.id,
      title: newHabit.title,
      frequency: newHabit.frequency,
      streak: 0,
    });

    if (error) {
      toast.error('Failed to create habit');
    } else {
      toast.success('Habit created!');
      setNewHabit({ title: '', frequency: 'daily' });
      setOpen(false);
      loadHabits();
    }
  };

  const toggleHabitLog = async (habitId: string) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const isLogged = habitLogs[habitId];

    if (isLogged) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completed_at', today);

      if (error) {
        toast.error('Failed to remove check-in');
      } else {
        setHabitLogs({ ...habitLogs, [habitId]: false });
      }
    } else {
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_at: today,
      });

      if (error) {
        toast.error('Failed to check in');
      } else {
        toast.success('Great job! ');
        setHabitLogs({ ...habitLogs, [habitId]: true });
      }
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Habits</h1>
          <p className="text-muted-foreground">Build and track your daily habits</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2 text-white">
              <Plus className="h-4 w-4" />
              New Habit
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newHabit.title}
                  onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                  placeholder="Habit title"
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select
                  value={newHabit.frequency}
                  onValueChange={(value) => setNewHabit({ ...newHabit, frequency: value })}
                >
                  <SelectTrigger className="glass-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={createHabit} className="w-full gradient-primary text-white">
                Create Habit
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {habits.length === 0 ? (
          <div className="col-span-full glass-card rounded-2xl p-12 text-center">
            <p className="text-muted-foreground">No habits yet. Create your first habit to get started!</p>
          </div>
        ) : (
          habits.map((habit, index) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card glass-card-hover rounded-2xl p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{habit.title}</h3>
                    <p className="text-xs capitalize text-muted-foreground">{habit.frequency}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{habit.streak} days</p>
                </div>
                <Button
                  onClick={() => toggleHabitLog(habit.id)}
                  variant={habitLogs[habit.id] ? 'default' : 'outline'}
                  size="sm"
                  className={habitLogs[habit.id] ? 'gradient-primary text-white' : ''}
                >
                  {habitLogs[habit.id] ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Done Today
                    </>
                  ) : (
                    'Check In'
                  )}
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}