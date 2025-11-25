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
import { TagFilter } from '@/components/tasks/TagFilter';
import { RecurringRuleSelector } from '@/components/tasks/RecurringRuleSelector';
import { FileAttachmentUpload } from '@/components/tasks/FileAttachmentUpload';
import { DraggableKanban } from '@/components/tasks/DraggableKanban';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  scheduled_on: string | null;
  recurring_rule: string | null;
  priority: string;
  tags: string[];
  category: string | null;
  time_estimate: number | null;
  board_status: string;
  completed_at: string | null;
  attachments?: string[];
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  display_order: number;
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Record<string, Subtask[]>>({});
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    scheduledOn: '',
    priority: 'medium',
    category: '',
    timeEstimate: 0,
    tags: [] as string[],
    recurringRule: null as string | null,
    attachments: [] as string[],
  });
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      loadTasks();
      loadAllTags();
    }
  }, [user]);

  const loadAllTags = async () => {
    if (!user) return;
    const { data } = await supabase.from('tasks').select('tags').eq('user_id', user.id);
    const tags = new Set<string>();
    data?.forEach(task => task.tags?.forEach((tag: string) => tags.add(tag)));
    setAllTags(Array.from(tags));
  };

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
      // Load subtasks for each task
      data?.forEach(task => loadSubtasks(task.id));
    }
  };

  const loadSubtasks = async (taskId: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('display_order');

    if (!error && data) {
      setSubtasks(prev => ({ ...prev, [taskId]: data }));
    }
  };

  const createTask = async () => {
    if (!user || !newTask.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    const { data, error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: newTask.title,
      description: newTask.description || null,
      scheduled_on: newTask.scheduledOn || null,
      status: 'pending',
      priority: newTask.priority,
      category: newTask.category || null,
      time_estimate: newTask.timeEstimate || null,
      tags: newTask.tags,
      board_status: 'todo',
      recurring_rule: newTask.recurringRule,
      attachments: newTask.attachments,
    }).select();

    if (error) {
      toast.error('Failed to create task');
    } else {
      toast.success('Task created! +10 XP');
      await awardXP(10, 'task');
      setNewTask({ title: '', description: '', scheduledOn: '', priority: 'medium', category: '', timeEstimate: 0, tags: [], recurringRule: null, attachments: [] });
      setOpen(false);
      loadTasks();
      loadAllTags();
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

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    const completedAt = newStatus === 'done' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('tasks')
      .update({ 
        status: newStatus,
        completed_at: completedAt,
      })
      .eq('id', taskId);

    if (error) {
      toast.error('Failed to update task');
    } else {
      if (newStatus === 'done') {
        toast.success('Task completed! +20 XP');
        await awardXP(20, 'task');
      }
      loadTasks();
    }
  };

  const addSubtask = async (taskId: string) => {
    if (!user || !newSubtaskTitle.trim()) return;

    const { error } = await supabase.from('subtasks').insert({
      task_id: taskId,
      user_id: user.id,
      title: newSubtaskTitle,
      completed: false,
    });

    if (error) {
      toast.error('Failed to add subtask');
    } else {
      setNewSubtaskTitle('');
      loadSubtasks(taskId);
    }
  };

  const toggleSubtask = async (subtaskId: string, taskId: string, completed: boolean) => {
    const { error } = await supabase
      .from('subtasks')
      .update({ completed: !completed })
      .eq('id', subtaskId);

    if (!error) {
      loadSubtasks(taskId);
    }
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ board_status: newStatus })
      .eq('id', taskId);

    if (!error) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-green-500 border-green-500';
      default: return 'text-muted-foreground border-border';
    }
  };

  const renderKanbanView = () => {
    return (
      <DraggableKanban
        tasks={tasks}
        onMoveTask={moveTask}
        getPriorityColor={getPriorityColor}
      />
    );
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

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            onClick={() => setViewMode('kanban')}
          >
            Kanban
          </Button>
          
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full p-2 rounded-lg glass-card"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Estimate (min)</label>
                  <Input
                    type="number"
                    value={newTask.timeEstimate}
                    onChange={(e) => setNewTask({ ...newTask, timeEstimate: parseInt(e.target.value) || 0 })}
                    className="glass-card"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  placeholder="Work, Personal, Study, etc."
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <TagFilter
                  tags={allTags}
                  selectedTags={newTask.tags}
                  onTagsChange={(tags) => setNewTask({ ...newTask, tags })}
                  onAddTag={(tag) => {
                    setAllTags([...allTags, tag]);
                    setNewTask({ ...newTask, tags: [...newTask.tags, tag] });
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Recurring</label>
                <RecurringRuleSelector
                  value={newTask.recurringRule}
                  onChange={(rule) => setNewTask({ ...newTask, recurringRule: rule })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Attachments</label>
                <FileAttachmentUpload
                  attachments={newTask.attachments}
                  onAttachmentsChange={(attachments) => setNewTask({ ...newTask, attachments })}
                />
              </div>
              <Button onClick={createTask} className="w-full gradient-primary text-white">
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </motion.div>

      {viewMode === 'kanban' ? (
        renderKanbanView()
      ) : (
        <div className="space-y-4">
          {selectedTagFilter.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-sm font-medium mb-2">Filter by Tags</h3>
              <TagFilter
                tags={allTags}
                selectedTags={selectedTagFilter}
                onTagsChange={setSelectedTagFilter}
                onAddTag={() => {}}
              />
            </div>
          )}

          <div className="grid gap-4">
            {tasks
              .filter(task => 
                selectedTagFilter.length === 0 || 
                task.tags?.some(tag => selectedTagFilter.includes(tag))
              )
              .length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card rounded-2xl p-12 text-center"
            >
              <p className="text-muted-foreground">No tasks yet. Create your first task to get started!</p>
            </motion.div>
            ) : (
              tasks
                .filter(task => 
                  selectedTagFilter.length === 0 || 
                  task.tags?.some(tag => selectedTagFilter.includes(tag))
                )
                .map((task, index) => (
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-lg font-semibold ${
                            task.status === 'done' ? 'text-muted-foreground line-through' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.category && (
                          <span className="text-xs px-2 py-1 rounded bg-muted">{task.category}</span>
                        )}
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                      )}
                      {task.scheduled_on && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.scheduled_on).toLocaleString()}
                        </div>
                      )}
                      {task.time_estimate && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Estimated: {task.time_estimate} min
                        </div>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {task.recurring_rule && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          🔄 {task.recurring_rule.replace('_', ' ')}
                        </div>
                      )}
                      
                      {/* Subtasks Section */}
                      {expandedTask === task.id && (
                        <div className="mt-4 space-y-2">
                          <h4 className="text-sm font-semibold">Subtasks</h4>
                          {subtasks[task.id]?.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2">
                              <button
                                onClick={() => toggleSubtask(subtask.id, task.id, subtask.completed)}
                                className={`flex h-4 w-4 items-center justify-center rounded border-2 ${
                                  subtask.completed ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                }`}
                              >
                                {subtask.completed && <Check className="h-3 w-3 text-white" />}
                              </button>
                              <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add subtask"
                              value={newSubtaskTitle}
                              onChange={(e) => setNewSubtaskTitle(e.target.value)}
                              className="glass-card text-sm"
                            />
                            <Button size="sm" onClick={() => addSubtask(task.id)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        className="mt-2"
                      >
                        {expandedTask === task.id ? 'Hide' : 'Show'} Subtasks
                      </Button>
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
        )}
      </div>
    );
  }