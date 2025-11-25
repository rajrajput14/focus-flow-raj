import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string | null;
  board_status: string;
  scheduled_on: string | null;
  time_estimate: number | null;
}

interface DraggableKanbanProps {
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: string) => void;
  getPriorityColor: (priority: string) => string;
}

function SortableTask({ task, getPriorityColor }: { task: Task; getPriorityColor: (priority: string) => string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      className="glass-card rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold">{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className={`px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {task.category && (
          <span className="px-2 py-1 rounded bg-muted">{task.category}</span>
        )}
        {task.scheduled_on && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(task.scheduled_on).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function DraggableKanban({ tasks, onMoveTask, getPriorityColor }: DraggableKanbanProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns = useMemo(() => [
    { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.board_status === 'todo') },
    { id: 'in_progress', title: 'In Progress', tasks: tasks.filter(t => t.board_status === 'in_progress') },
    { id: 'done', title: 'Done', tasks: tasks.filter(t => t.board_status === 'done') },
  ], [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // Check if dropped on a column
    if (['todo', 'in_progress', 'done'].includes(newStatus)) {
      onMoveTask(taskId, newStatus);
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-lg">{column.title}</h3>
              <span className="text-sm bg-primary/20 px-3 py-1 rounded-full">
                {column.tasks.length}
              </span>
            </div>
            
            <SortableContext items={column.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3 flex-1 min-h-[200px] p-2 rounded-xl bg-muted/20" id={column.id}>
                {column.tasks.map((task) => (
                  <SortableTask key={task.id} task={task} getPriorityColor={getPriorityColor} />
                ))}
                {column.tasks.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    Drop tasks here
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}