import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export function TaskCard({ task, onToggle, onDelete, className }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  const priorityColors = {
    low: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    medium: 'bg-amber-50 text-amber-600 border-amber-100',
    high: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md",
        isCompleted && "opacity-60 grayscale-[0.5]",
        className
      )}
    >
      <button
        onClick={() => onToggle?.(task.id)}
        className={cn(
          "mt-1 p-0.5 rounded-full transition-colors",
          isCompleted ? "text-brand-500" : "text-slate-300 hover:text-brand-400"
        )}
      >
        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn(
            "font-semibold text-slate-900 truncate",
            isCompleted && "line-through text-slate-400"
          )}>
            {task.title}
          </h3>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            priorityColors[task.priority]
          )}>
            {task.priority}
          </span>
        </div>
        
        {task.description && (
          <p className="text-sm text-slate-500 line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1">
            <Brain className="w-3.5 h-3.5" />
            {task.subject}
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete?.(task.id)}
        className="opacity-0 group-hover:opacity-100 p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// Re-importing Brain from lucide-react as it was missing in the previous import
import { Brain } from 'lucide-react';
