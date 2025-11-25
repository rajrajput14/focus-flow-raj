import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface Habit {
  id: string;
  title: string;
  frequency: string;
  streak: number;
  icon: string;
  color: string;
  category: string;
  notes: string | null;
}

const HABIT_ICONS = ['🎯', '💪', '📚', '🏃', '🧘', '🍎', '💼', '🎨', '🎵', '✍️'];
const HABIT_COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
const HABIT_CATEGORIES = ['Health', 'Study', 'Career', 'Fitness', 'Personal Growth', 'Mindfulness', 'Creative'];

export default function Habits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [open, setOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    title: '',
    frequency: 'daily',
    icon: '🎯',
    color: '#8B5CF6',
    category: 'Personal Growth',
    notes: '',
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
      icon: newHabit.icon,
      color: newHabit.color,
      category: newHabit.category,
      notes: newHabit.notes || null,
      streak: 0,
    });

    if (error) {
      toast.error('Failed to create habit');
    } else {
      toast.success('Habit created! +15 XP');
      await awardXP(15, 'habit');
      setNewHabit({ title: '', frequency: 'daily', icon: '🎯', color: '#8B5CF6', category: 'Personal Growth', notes: '' });
      setOpen(false);
      loadHabits();
    }
  };

  const awardXP = async (xp: number, type: 'task' | 'habit') => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_xp')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const newTotalXP = existing.total_xp + xp;
      const newLevel = Math.floor(newTotalXP / 100) + 1;
      await supabase
        .from('user_xp')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          tasks_completed: type === 'task' ? existing.tasks_completed + 1 : existing.tasks_completed,
          habits_completed: type === 'habit' ? existing.habits_completed + 1 : existing.habits_completed,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    } else {
      await supabase.from('user_xp').insert({
        user_id: user.id,
        total_xp: xp,
        level: 1,
        tasks_completed: type === 'task' ? 1 : 0,
        habits_completed: type === 'habit' ? 1 : 0,
      });
    }
  };

  const toggleHabitLog = async (habitId: string, habitStreak: number) => {
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
        // Decrease streak
        await supabase
          .from('habits')
          .update({ streak: Math.max(0, habitStreak - 1) })
          .eq('id', habitId);
        loadHabits();
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
        toast.success('Great job! +10 XP');
        await awardXP(10, 'habit');
        setHabitLogs({ ...habitLogs, [habitId]: true });
        // Increase streak
        await supabase
          .from('habits')
          .update({ streak: habitStreak + 1 })
          .eq('id', habitId);
        loadHabits();
        
        // Check for badge achievements
        await checkBadges(habitStreak + 1);
      }
    }
  };

  const checkBadges = async (streak: number) => {
    if (!user) return;

    const badgesToAward = [];
    if (streak >= 7 && streak < 8) badgesToAward.push('7_day_streak');
    if (streak >= 30 && streak < 31) badgesToAward.push('30_day_streak');

    for (const badge of badgesToAward) {
      const { error } = await supabase
        .from('user_badges')
        .insert({ user_id: user.id, badge_type: badge })
        .select();

      if (!error) {
        toast.success(`🎉 Badge earned: ${badge.replace('_', ' ')}!`);
      }
    }
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);

    if (error) {
      toast.error('Failed to delete habit');
    } else {
      toast.success('Habit deleted');
      loadHabits();
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
          <DialogContent className="glass-card max-h-[90vh] overflow-y-auto">
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
                <label className="text-sm font-medium">Icon</label>
                <div className="grid grid-cols-5 gap-2">
                  {HABIT_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                        newHabit.icon === icon ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="grid grid-cols-7 gap-2">
                  {HABIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewHabit({ ...newHabit, color })}
                      className={`h-10 rounded-lg border-2 transition-all ${
                        newHabit.color === color ? 'border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newHabit.category}
                  onValueChange={(value) => setNewHabit({ ...newHabit, category: value })}
                >
                  <SelectTrigger className="glass-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HABIT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={newHabit.notes}
                  onChange={(e) => setNewHabit({ ...newHabit, notes: e.target.value })}
                  placeholder="Add notes about this habit..."
                  className="glass-card"
                />
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
                  <div
                    className="rounded-xl p-3 text-2xl"
                    style={{ backgroundColor: habit.color }}
                  >
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{habit.title}</h3>
                    <p className="text-xs text-muted-foreground">{habit.category}</p>
                    <p className="text-xs capitalize text-muted-foreground">{habit.frequency}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteHabit(habit.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {habit.notes && (
                <p className="text-sm text-muted-foreground mb-3">{habit.notes}</p>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Streak</p>
                  <p className="text-2xl font-bold">{habit.streak} 🔥</p>
                </div>
                <Button
                  onClick={() => toggleHabitLog(habit.id, habit.streak)}
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
