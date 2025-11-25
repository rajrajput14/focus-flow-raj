import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DailySummaryCard } from '@/components/planner/DailySummaryCard';
import { TimeBlockGrid } from '@/components/planner/TimeBlockGrid';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_on: string | null;
  time_estimate?: number | null;
}

interface TimeBlock {
  hour: number;
  taskTitle?: string;
  taskId?: string;
}

export default function Planner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [quickTaskOpen, setQuickTaskOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  useEffect(() => {
    if (user && date) {
      loadTasksForDate(date);
      loadHabitsForToday();
      generateTimeBlocks();
    }
  }, [user, date, tasks]);

  const loadTasksForDate = async (selectedDate: Date) => {
    if (!user) return;

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_on', start.toISOString())
      .lte('scheduled_on', end.toISOString())
      .order('scheduled_on', { ascending: true });

    if (error) {
      toast.error('Failed to load tasks');
    } else {
      setTasks(data || []);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
    } else {
      if (date) loadTasksForDate(date);
    }
  };

  const loadHabitsForToday = async () => {
    if (!user) return;
    const { data } = await supabase.from('habits').select('*').eq('user_id', user.id);
    setHabits(data || []);
  };

  const generateTimeBlocks = () => {
    const blocks: TimeBlock[] = [];
    tasks.forEach(task => {
      if (task.scheduled_on) {
        const hour = new Date(task.scheduled_on).getHours();
        blocks.push({ hour, taskTitle: task.title, taskId: task.id });
      }
    });
    setTimeBlocks(blocks);
  };

  const createQuickTask = async () => {
    if (!user || !quickTaskTitle.trim() || !date) return;

    const scheduledOn = new Date(date);
    scheduledOn.setHours(9, 0, 0, 0);

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: quickTaskTitle,
      scheduled_on: scheduledOn.toISOString(),
      status: 'pending',
      board_status: 'todo',
    });

    if (error) {
      toast.error('Failed to create task');
    } else {
      toast.success('Task added!');
      setQuickTaskTitle('');
      setQuickTaskOpen(false);
      if (date) loadTasksForDate(date);
    }
  };

  const handleStartPomodoro = (taskId: string) => {
    navigate('/pomodoro');
    toast.success('Starting Pomodoro session');
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPlannedTime = tasks.reduce((sum, t) => sum + (t.time_estimate || 0), 0) / 60;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Daily Planner</h1>
          <p className="text-muted-foreground">Plan and organize your day</p>
        </div>
        <Dialog open={quickTaskOpen} onOpenChange={setQuickTaskOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2 text-white">
              <Plus className="h-4 w-4" />
              Quick Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Add Task for {date?.toLocaleDateString()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Task title"
                className="glass-card"
                onKeyDown={(e) => e.key === 'Enter' && createQuickTask()}
              />
              <Button onClick={createQuickTask} className="w-full gradient-primary text-white">
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <DailySummaryCard
        tasksCount={tasks.length}
        habitsCount={habits.length}
        focusTime={totalPlannedTime}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="mb-4 text-xl font-semibold">Select a Date</h2>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-xl border-none"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Time Blocking</h2>
          </div>
          <TimeBlockGrid
            timeBlocks={timeBlocks}
            onAssignTask={(hour) => {
              setQuickTaskOpen(true);
              toast.info(`Assigning task to ${hour}:00`);
            }}
            onStartPomodoro={handleStartPomodoro}
          />
        </motion.div>
      </div>
    </div>
  );
}