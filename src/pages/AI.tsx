import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { VoiceTaskInput } from '@/components/VoiceTaskInput';

export default function AI() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [nlLoading, setNlLoading] = useState(false);

  const getSuggestions = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: { userId: user.id },
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      toast.success('AI suggestions generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to get suggestions');
    } finally {
      setLoading(false);
    }
  };

  const createTaskFromNL = async () => {
    if (!user || !input.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    setNlLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('nl-task-parser', {
        body: { text: input },
      });

      if (error) throw error;

      if (data.task) {
        // Create the task
        const { error: insertError } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: data.task.title,
          description: data.task.description || null,
          scheduled_on: data.task.scheduledOn || null,
          status: 'pending',
        });

        if (insertError) throw insertError;

        toast.success('Task created from your description!');
        setInput('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse task');
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text">AI Assistant</h1>
        <p className="text-muted-foreground">Let AI help you stay productive</p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold">AI Suggestions</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Get personalized task suggestions based on your activity patterns
          </p>

          <Button
            onClick={getSuggestions}
            disabled={loading}
            className="mb-6 w-full gradient-primary text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </span>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Suggestions
              </>
            )}
          </Button>

          <div className="space-y-3">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-xl p-4"
                >
                  <p className="text-sm">{suggestion}</p>
                </motion.div>
              ))
            ) : (
              <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Click the button above to get AI-powered suggestions
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Natural Language Task Creation</h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Describe your task naturally, and AI will create it for you
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="E.g., 'Call John tomorrow at 3pm' or 'Finish report by Friday'"
                  className="glass-card"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !nlLoading) {
                      createTaskFromNL();
                    }
                  }}
                />
              </div>
              <VoiceTaskInput 
                onTranscript={(text) => setInput(text)}
                onAutoCreate={createTaskFromNL}
              />
            </div>

            <Button
              onClick={createTaskFromNL}
              disabled={nlLoading || !input.trim()}
              className="w-full gradient-primary text-white"
            >
              {nlLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating Task...
                </span>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Create Task
                </>
              )}
            </Button>

            <div className="glass-card rounded-xl p-4">
              <p className="mb-2 text-sm font-medium">Examples:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• "Email client tomorrow at 5PM"</li>
                <li>• "Pay rent on Friday"</li>
                <li>• "Finish assignment next Monday morning"</li>
                <li>• "Team meeting on Tuesday at 2pm"</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}