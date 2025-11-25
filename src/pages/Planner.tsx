import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduled_on: string | null;
}

export default function Planner() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user && date) {
      loadTasksForDate(date);
    }
  }, [user, date]);

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

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text">Daily Planner</h1>
        <p className="text-muted-foreground">Plan and organize your day</p>
      </motion.div>

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
            <h2 className="text-xl font-semibold">
              {date?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No tasks scheduled for this day
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="glass-card glass-card-hover rounded-xl p-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleTask(task.id, task.status)}
                      className={`mt-1 flex h-5 w-5 items-center justify-center rounded-lg border-2 transition-all ${
                        task.status === 'done'
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                    >
                      {task.status === 'done' && <Check className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-medium ${
                            task.status === 'done' ? 'text-muted-foreground line-through' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.scheduled_on && (
                          <span className="text-sm text-muted-foreground">
                            {formatTime(task.scheduled_on)}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}