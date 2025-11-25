import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function AIWeeklyReview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<any>(null);

  const generateReview = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-weekly-review', {
        body: { userId: user.id },
      });

      if (error) throw error;

      setReview(data);
      toast.success('Weekly review generated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold">AI Weekly Review</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Get AI-powered insights on your week's performance with personalized recommendations
      </p>

      <Button
        onClick={generateReview}
        disabled={loading}
        className="mb-6 w-full gradient-primary text-white"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyzing Week...
          </span>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Weekly Review
          </>
        )}
      </Button>

      {review && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {review.achievements && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="mb-2 text-sm font-semibold text-green-600">What You Did Well</h3>
              <p className="text-sm">{review.achievements}</p>
            </div>
          )}

          {review.struggles && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="mb-2 text-sm font-semibold text-yellow-600">Areas for Improvement</h3>
              <p className="text-sm">{review.struggles}</p>
            </div>
          )}

          {review.recommendations && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-600">Recommendations</h3>
              <ul className="space-y-1 text-sm">
                {review.recommendations.map((rec: string, i: number) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}