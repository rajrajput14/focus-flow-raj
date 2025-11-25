import { motion } from 'framer-motion';
import { CheckCircle2, Target, Clock } from 'lucide-react';

interface DailySummaryCardProps {
  tasksCount: number;
  habitsCount: number;
  focusTime: number;
}

export function DailySummaryCard({ tasksCount, habitsCount, focusTime }: DailySummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="mb-4 text-lg font-semibold">Today's Summary</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <p className="text-2xl font-bold">{tasksCount}</p>
          <p className="text-xs text-muted-foreground">Tasks</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Target className="h-6 w-6 text-white" />
          </div>
          <p className="text-2xl font-bold">{habitsCount}</p>
          <p className="text-xs text-muted-foreground">Habits</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <p className="text-2xl font-bold">{focusTime}h</p>
          <p className="text-xs text-muted-foreground">Planned</p>
        </div>
      </div>
    </motion.div>
  );
}