import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MobileFloatingActionProps {
  onClick: () => void;
}

export const MobileFloatingAction = ({ onClick }: MobileFloatingActionProps) => {
  return (
    <motion.div
      className="fixed bottom-20 right-4 z-40 md:hidden"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <Button
        onClick={onClick}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
      >
        <motion.div
          whileTap={{ scale: 0.9, rotate: 90 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <Plus className="h-6 w-6" />
        </motion.div>
      </Button>
    </motion.div>
  );
};
