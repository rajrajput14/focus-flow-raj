import { motion } from 'framer-motion';
import { TrendingUp, Award } from 'lucide-react';

interface ProductivityScoreProps {
  score: number;
  taskCompletion: number;
  habitConsistency: number;
  focusRegularity: number;
}

export function ProductivityScore({
  score,
  taskCompletion,
  habitConsistency,
  focusRegularity
}: ProductivityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-blue-500 to-cyan-600';
    if (score >= 40) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Productivity Score</h2>
        <Award className="h-5 w-5 text-primary" />
      </div>

      <div className="mb-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${getScoreColor(score)}`}
        >
          <span className="text-4xl font-bold text-white">{score}</span>
        </motion.div>
        <p className="text-sm text-muted-foreground">Out of 100</p>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Task Completion</span>
            <span className="font-medium">{taskCompletion}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskCompletion}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Habit Consistency</span>
            <span className="font-medium">{habitConsistency}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${habitConsistency}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span>Focus Regularity</span>
            <span className="font-medium">{focusRegularity}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${focusRegularity}%` }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}