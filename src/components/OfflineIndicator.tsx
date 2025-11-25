import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMobileFeatures } from '@/hooks/useMobileFeatures';

export const OfflineIndicator = () => {
  const { isOnline } = useMobileFeatures();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium"
        >
          <WifiOff className="h-4 w-4" />
          <span>You're offline. Changes will sync when you're back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
