import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, RotateCcw, Timer, Brain, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface StudyTimerProps {
  onSessionComplete?: (duration: number) => void;
  className?: string;
}

export function StudyTimer({ onSessionComplete, className }: StudyTimerProps) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mode === 'study') {
        onSessionComplete?.(25); // Assume 25 min session for now
        // Auto switch to break?
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, onSessionComplete]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'study' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / (mode === 'study' ? 25 * 60 : 5 * 60)) * 100;

  return (
    <div className={cn("glass p-8 rounded-3xl flex flex-col items-center gap-6", className)}>
      <div className="flex gap-4 p-1 bg-slate-100 rounded-full">
        <button
          onClick={() => { setMode('study'); setTimeLeft(25 * 60); setIsActive(false); }}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            mode === 'study' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Brain className="w-4 h-4" />
          Study
        </button>
        <button
          onClick={() => { setMode('break'); setTimeLeft(5 * 60); setIsActive(false); }}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
            mode === 'break' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Coffee className="w-4 h-4" />
          Break
        </button>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-100"
          />
          <motion.circle
            cx="128"
            cy="128"
            r="120"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray="754"
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: 754 * (1 - progress / 100) }}
            className="text-brand-500"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold font-mono tracking-tight">{formatTime(timeLeft)}</span>
          <span className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            {mode === 'study' ? 'Focusing' : 'Resting'}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={resetTimer}
          className="p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={toggleTimer}
          className={cn(
            "p-4 rounded-2xl transition-all shadow-lg shadow-brand-500/20",
            isActive ? "bg-slate-900 text-white" : "bg-brand-500 text-white hover:bg-brand-600"
          )}
        >
          {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        <button
          onClick={() => { setIsActive(false); setTimeLeft(0); }}
          className="p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <Square className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
