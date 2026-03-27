import { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Task, FocusSession, UserProfile } from '../types';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Zap, 
  Brain, 
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Settings,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FocusTimerProps {
  user: User;
  profile: UserProfile | null;
  tasks: Task[];
}

type TimerMode = 'focus' | 'short-break' | 'long-break';

export default function FocusTimer({ user, profile, tasks }: FocusTimerProps) {
  const focusDuration = profile?.settings?.focusDuration || 10;
  
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempDuration, setTempDuration] = useState(focusDuration);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modes = {
    'focus': { label: 'Deep Work', color: 'bg-black', time: focusDuration * 60, icon: Brain },
    'short-break': { label: 'Short Break', color: 'bg-blue-600', time: 5 * 60, icon: Coffee },
    'long-break': { label: 'Long Break', color: 'bg-indigo-600', time: 15 * 60, icon: Coffee },
  };

  // Update timeLeft when focusDuration changes (from profile sync)
  useEffect(() => {
    if (!isActive && mode === 'focus') {
      setTimeLeft(focusDuration * 60);
    }
  }, [focusDuration, mode, isActive]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleToggle = () => {
    if (!isActive) {
      setSessionStartTime(new Date());
    }
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(modes[mode].time);
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].time);
    setIsActive(false);
  };

  const handleSaveSettings = async () => {
    if (!profile) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'settings.focusDuration': tempDuration
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error("Failed to update settings:", error);
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    
    if (mode === 'focus' && sessionStartTime) {
      const duration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 60000);
      if (duration > 0) {
        await addDoc(collection(db, 'focusSessions'), {
          uid: user.uid,
          taskId: selectedTaskId,
          startTime: sessionStartTime.toISOString(),
          endTime: new Date().toISOString(),
          duration: duration,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Auto-switch to break or focus
    if (mode === 'focus') {
      handleSwitchMode('short-break');
    } else {
      handleSwitchMode('focus');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / modes[mode].time) * 100;
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="space-y-12 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">Deep Work</h2>
          <p className="text-ink/50 mt-1">Eliminate distractions and enter the flow state.</p>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-4 bg-white hover:bg-paper rounded-full border border-ink/5 luxury-shadow transition-all text-ink/40 hover:text-gold"
        >
          <Settings className="w-6 h-6" />
        </button>
      </header>

      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-10 rounded-[2.5rem] border border-ink/5 luxury-shadow space-y-8 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-serif font-bold">Timer Configuration</h3>
              <button 
                onClick={handleSaveSettings}
                className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-full text-sm font-bold shadow-xl active:scale-95 transition-all hover:bg-gold"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </button>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.2em]">Focus Duration (minutes)</label>
              <div className="flex items-center gap-8">
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  value={tempDuration}
                  onChange={(e) => setTempDuration(parseInt(e.target.value))}
                  className="flex-1 accent-gold h-1.5 bg-ink/5 rounded-full appearance-none cursor-pointer"
                />
                <span className="text-4xl font-serif font-bold w-16 text-center text-gold">{tempDuration}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-16 items-start">
        {/* Timer Widget - Luxury Hardware Feel */}
        <div className="bg-ink p-16 rounded-[4rem] shadow-2xl border border-white/5 relative overflow-hidden group">
          {/* Subtle background texture/gradient */}
          <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-50" />
          
          <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
            <motion.div 
              className="h-full bg-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]"
              animate={{ width: `${100 - progress}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          <div className="flex flex-col items-center gap-16 relative z-10">
            <div className="flex gap-3 p-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
              {(Object.keys(modes) as TimerMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => handleSwitchMode(m)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] transition-all",
                    mode === m ? "bg-gold text-white shadow-lg" : "text-white/30 hover:text-white/60"
                  )}
                >
                  {modes[m].label}
                </button>
              ))}
            </div>

            <div className="relative">
              <svg className="w-80 h-80 -rotate-90">
                <circle
                  cx="160"
                  cy="160"
                  r="145"
                  fill="none"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="4"
                  className="translate-x-10 translate-y-10"
                />
                <motion.circle
                  cx="160"
                  cy="160"
                  r="145"
                  fill="none"
                  stroke="#c5a059"
                  strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 145}
                  animate={{ strokeDashoffset: (2 * Math.PI * 145) * (progress / 100) }}
                  transition={{ duration: 1, ease: 'linear' }}
                  strokeLinecap="round"
                  className="translate-x-10 translate-y-10"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[7rem] font-serif font-light text-white tracking-tighter leading-none">
                  {formatTime(timeLeft)}
                </span>
                <div className="flex items-center gap-3 mt-6">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-gold animate-pulse shadow-[0_0_10px_rgba(197,160,89,0.8)]" : "bg-white/20")} />
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em]">
                    {isActive ? 'Flow State Active' : 'System Standby'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-10">
              <button 
                onClick={handleReset}
                className="p-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full border border-white/5 transition-all active:scale-90"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
              <button 
                onClick={handleToggle}
                className={cn(
                  "w-28 h-28 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-2xl relative group/btn",
                  isActive ? "bg-white" : "bg-gold"
                )}
              >
                <div className="absolute inset-0 rounded-full bg-current opacity-20 blur-2xl group-hover/btn:opacity-40 transition-opacity" />
                {isActive ? <Pause className="w-10 h-10 text-ink fill-ink relative z-10" /> : <Play className="w-10 h-10 text-white fill-white ml-1 relative z-10" />}
              </button>
              <button 
                onClick={handleComplete}
                className="p-5 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full border border-white/5 transition-all active:scale-90"
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Task Selection & AI Insights */}
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-ink/5 luxury-shadow space-y-8">
            <h3 className="text-2xl font-serif font-bold">Focus Target</h3>
            <div className="space-y-3">
              {tasks.filter(t => t.status !== 'completed').slice(0, 4).map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={cn(
                    "w-full p-5 rounded-[1.5rem] border text-left flex items-center justify-between transition-all group relative overflow-hidden",
                    selectedTaskId === task.id 
                      ? "bg-ink text-white border-ink shadow-xl" 
                      : "bg-paper border-transparent text-ink/40 hover:border-gold/30 hover:text-ink"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center transition-colors",
                      selectedTaskId === task.id ? "bg-gold/20" : "bg-white"
                    )}>
                      <Zap className={cn("w-5 h-5", selectedTaskId === task.id ? "text-gold fill-gold" : "text-ink/10")} />
                    </div>
                    <span className="font-bold tracking-tight">{task.title}</span>
                  </div>
                  <ChevronRight className={cn("w-5 h-5 transition-transform relative z-10", selectedTaskId === task.id ? "text-gold translate-x-1" : "text-ink/10")} />
                </button>
              ))}
              {tasks.filter(t => t.status !== 'completed').length === 0 && (
                <p className="text-center py-12 text-ink/20 font-serif italic">No active targets identified.</p>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedTask && (
              <motion.div 
                key={selectedTask.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-10 rounded-[3rem] border border-ink/5 luxury-shadow space-y-6 relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 opacity-[0.03] text-ink">
                  <Sparkles className="w-48 h-48" />
                </div>
                <div className="flex items-center gap-3 px-4 py-1.5 bg-gold/10 rounded-full w-fit border border-gold/20">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gold">AI Orchestration</span>
                </div>
                <h4 className="text-3xl font-serif font-bold leading-tight">Strategy for: {selectedTask.title}</h4>
                <p className="text-ink/60 leading-relaxed font-serif italic text-lg">
                  "{selectedTask.aiAnalysis?.suggestedApproach || "Focus on high-leverage activities first. Eliminate secondary inputs and maintain singular focus."}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
