import { Folder, Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface FolderSidebarProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  onAddFolder: (name: string) => void;
}

export function FolderSidebar({ folders, selectedFolder, onSelectFolder, onAddFolder }: FolderSidebarProps) {
  const [newFolderName, setNewFolderName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setShowInput(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Folders</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowInput(!showInput)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {showInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3"
        >
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="glass-card mb-2"
            onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
          />
        </motion.div>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectFolder(null)}
          className={`flex w-full items-center gap-2 rounded-lg p-2 text-sm transition-colors ${
            selectedFolder === null
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span>All Notes</span>
        </button>

        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => onSelectFolder(folder)}
            className={`flex w-full items-center gap-2 rounded-lg p-2 text-sm transition-colors ${
              selectedFolder === folder
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            }`}
          >
            <Folder className="h-4 w-4" />
            <span className="truncate">{folder}</span>
          </button>
        ))}
      </div>
    </div>
  );
}