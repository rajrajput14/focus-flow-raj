import { Check, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface ChecklistNoteProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}

export function ChecklistNote({ items, onChange }: ChecklistNoteProps) {
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    if (newItemText.trim()) {
      onChange([
        ...items,
        { id: Date.now().toString(), text: newItemText.trim(), completed: false }
      ]);
      setNewItemText('');
    }
  };

  const toggleItem = (id: string) => {
    onChange(
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add checklist item"
          className="glass-card"
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <Button onClick={addItem} size="icon" className="gradient-primary text-white">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 glass-card rounded-lg p-3"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                item.completed
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              }`}
            >
              {item.completed && <Check className="h-3 w-3 text-white" />}
            </button>
            <span
              className={`flex-1 text-sm ${
                item.completed ? 'text-muted-foreground line-through' : ''
              }`}
            >
              {item.text}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeItem(item.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}