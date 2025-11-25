import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeBlock {
  hour: number;
  taskTitle?: string;
  taskId?: string;
}

interface TimeBlockGridProps {
  timeBlocks: TimeBlock[];
  onAssignTask: (hour: number) => void;
  onStartPomodoro: (taskId: string) => void;
}

export function TimeBlockGrid({ timeBlocks, onAssignTask, onStartPomodoro }: TimeBlockGridProps) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6); // 6 AM to 10 PM

  return (
    <div className="space-y-2">
      {hours.map((hour) => {
        const block = timeBlocks.find(b => b.hour === hour);
        return (
          <motion.div
            key={hour}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: hour * 0.02 }}
            className="flex items-center gap-3 glass-card rounded-xl p-3"
          >
            <div className="w-20 text-sm font-medium text-muted-foreground">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1">
              {block?.taskTitle ? (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{block.taskTitle}</span>
                  {block.taskId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onStartPomodoro(block.taskId!)}
                    >
                      Start Focus
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                  onClick={() => onAssignTask(hour)}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add task
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}