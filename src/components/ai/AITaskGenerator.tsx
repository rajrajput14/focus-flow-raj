import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AITaskGenerator() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);

  const generateTasks = async () => {
    if (!user || !project.trim()) {
      toast.error('Please describe your project');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-task-generator', {
        body: { project },
      });

      if (error) throw error;

      setTasks(data.tasks || []);
      toast.success('Tasks generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate tasks');
    } finally {
      setLoading(false);
    }
  };

  const createAllTasks = async () => {
    if (!user) return;

    try {
      const tasksToCreate = tasks.map(task => ({
        user_id: user.id,
        title: task.title,
        description: task.description || null,
        priority: task.priority || 'medium',
        status: 'pending',
        board_status: 'todo',
      }));

      const { error } = await supabase.from('tasks').insert(tasksToCreate);

      if (error) throw error;

      toast.success(`${tasks.length} tasks created!`);
      setTasks([]);
      setProject('');
    } catch (error: any) {
      toast.error('Failed to create tasks');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
          <ListTodo className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold">AI Task Generator</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Describe a project and AI will break it down into actionable tasks
      </p>

      <div className="space-y-4">
        <Textarea
          value={project}
          onChange={(e) => setProject(e.target.value)}
          placeholder="Describe your project... E.g., 'Build a personal website' or 'Plan a vacation to Japan'"
          className="glass-card min-h-[100px]"
        />

        <Button
          onClick={generateTasks}
          disabled={loading || !project.trim()}
          className="w-full gradient-primary text-white"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Generating Tasks...
            </span>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Task Breakdown
            </>
          )}
        </Button>
      </div>

      {tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Generated Tasks</h3>
            <Button size="sm" onClick={createAllTasks} className="gradient-primary text-white">
              Create All
            </Button>
          </div>
          {tasks.map((task, i) => (
            <div key={i} className="glass-card rounded-lg p-4">
              <div className="mb-1 flex items-center justify-between">
                <h4 className="font-medium">{task.title}</h4>
                <span className={`text-xs px-2 py-1 rounded border ${
                  task.priority === 'high' ? 'border-red-500 text-red-500' :
                  task.priority === 'low' ? 'border-green-500 text-green-500' :
                  'border-yellow-500 text-yellow-500'
                }`}>
                  {task.priority}
                </span>
              </div>
              {task.description && (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}