import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Check, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  scheduled_on: string | null;
  recurring_rule: string | null;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    scheduledOn: '',
  });

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load tasks');
    } else {
      setTasks(data || []);
    }
  };

  const createTask = async () => {
    if (!user || !newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTask.title,
      description: newTask.description || null,
      scheduled_on: newTask.scheduledOn || null,
      status: 'pending',
    });

    if (error) {
      toast.error('Failed to create task');
    } else {
      toast.success('Task created!');
      setNewTask({ title: '', description: '', scheduledOn: '' });
      setOpen(false);
      loadTasks();
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
      loadTasks();
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);

    if (error) {
      toast.error('Failed to delete task');
    } else {
      toast.success('Task deleted');
      loadTasks();
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
          <h1 className="text-4xl font-bold gradient-text">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and to-dos</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2 text-white">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description"
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Schedule for</label>
                <Input
                  type="datetime-local"
                  value={newTask.scheduledOn}
                  onChange={(e) => setNewTask({ ...newTask, scheduledOn: e.target.value })}
                  className="glass-card"
                />
              </div>
              <Button onClick={createTask} className="w-full gradient-primary text-white">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 text-center"
          >
            <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
          </motion.div>
        ) : (
          tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card glass-card-hover rounded-2xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-4">
                  <button
                    onClick={() => toggleTask(task.id, task.status)}
                    className={`mt-1 flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all ${
                      task.status === 'done'
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30 hover:border-primary'
                    }`}
                  >
                    {task.status === 'done' && <Check className="h-4 w-4 text-white" />}
                  </button>
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold ${
                        task.status === 'done' ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    )}
                    {task.scheduled_on && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.scheduled_on).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteTask(task.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}