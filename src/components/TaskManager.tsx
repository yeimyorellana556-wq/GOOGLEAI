import { useState } from 'react';
import { User } from 'firebase/auth';
import { Task, TaskStatus } from '../types';
import { analyzeTask } from '../services/geminiService';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Plus, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock, 
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface TaskManagerProps {
  user: User;
  tasks: Task[];
}

export default function TaskManager({ user, tasks }: TaskManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeTask(newTitle, newDesc);
      
      await addDoc(collection(db, 'tasks'), {
        uid: user.uid,
        title: newTitle,
        description: newDesc,
        status: 'todo',
        priority: analysis.priority,
        aiAnalysis: {
          whyPriority: analysis.whyPriority,
          suggestedApproach: analysis.suggestedApproach
        },
        createdAt: new Date().toISOString()
      });

      setNewTitle('');
      setNewDesc('');
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
    await updateDoc(doc(db, 'tasks', task.id), { status: nextStatus });
  };

  const deleteTask = async (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteDoc(doc(db, 'tasks', id));
    }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  const priorityColors = {
    1: 'bg-red-50 text-red-600 border-red-100',
    2: 'bg-gold/10 text-gold border-gold/20',
    3: 'bg-ink/5 text-ink/60 border-ink/10',
    4: 'bg-paper text-ink/30 border-ink/5'
  };

  const priorityLabels = {
    1: 'Critical Path',
    2: 'Strategic',
    3: 'Tactical',
    4: 'Backlog'
  };

  return (
    <div className="space-y-12 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">Orchestration</h2>
          <p className="text-ink/50 mt-1">Manage your focus and strategic priorities.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-full font-bold hover:bg-gold transition-all active:scale-95 shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          New Objective
        </button>
      </header>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {['all', 'todo', 'in-progress', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={cn(
              "px-6 py-2.5 rounded-full text-[10px] font-bold capitalize tracking-[0.2em] transition-all whitespace-nowrap border",
              filter === f 
                ? "bg-ink text-white border-ink shadow-lg" 
                : "bg-white text-ink/30 hover:text-ink border-ink/5 luxury-shadow"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white p-12 rounded-[3rem] border border-ink/5 luxury-shadow space-y-8 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 opacity-[0.03] text-ink">
              <Zap className="w-48 h-48" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <h3 className="text-3xl font-serif font-bold">Define Objective</h3>
              <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-paper rounded-full transition-colors">
                <X className="w-6 h-6 text-ink/20" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-8 relative z-10">
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Objective Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-4xl font-serif font-bold border-none focus:ring-0 placeholder:text-ink/10 bg-transparent"
                  autoFocus
                />
                <textarea 
                  placeholder="Provide context for AI orchestration..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full border-none focus:ring-0 text-ink/60 font-serif italic text-xl resize-none h-32 bg-transparent"
                />
              </div>
              <div className="flex items-center justify-between pt-8 border-t border-ink/5">
                <div className="flex items-center gap-3 px-4 py-2 bg-gold/5 rounded-full border border-gold/10">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[9px] font-bold text-gold uppercase tracking-[0.2em]">AI Analysis Active</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-8 py-4 text-ink/40 font-bold hover:text-ink transition-colors text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    disabled={isAnalyzing || !newTitle.trim()}
                    className="px-10 py-4 bg-ink text-white rounded-full font-bold disabled:opacity-50 flex items-center gap-3 shadow-2xl hover:bg-gold transition-all active:scale-95"
                  >
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-gold fill-gold" />}
                    <span className="text-sm">{isAnalyzing ? 'Orchestrating...' : 'Commit Objective'}</span>
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <motion.div 
            layout
            key={task.id}
            className={cn(
              "bg-white rounded-[2rem] border border-ink/5 luxury-shadow overflow-hidden transition-all group",
              task.status === 'completed' && "opacity-40 grayscale"
            )}
          >
            <div className="p-8 flex items-start gap-6">
              <button 
                onClick={() => toggleStatus(task)}
                className="mt-1 transition-all active:scale-75 relative"
              >
                {task.status === 'completed' ? (
                  <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center shadow-lg">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-ink/10 hover:border-gold transition-colors flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-gold opacity-0 hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </button>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-4">
                  <h4 className={cn("text-2xl font-serif font-bold truncate tracking-tight", task.status === 'completed' && "line-through")}>
                    {task.title}
                  </h4>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border",
                    priorityColors[task.priority]
                  )}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>
                <p className="text-ink/40 font-serif italic line-clamp-1 text-lg">{task.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                  className="p-3 hover:bg-paper rounded-full text-ink/20 hover:text-ink transition-all"
                >
                  {expandedTaskId === task.id ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </button>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="p-3 hover:bg-red-50 rounded-full text-ink/10 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedTaskId === task.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-20 pb-10 space-y-10"
                >
                  <div className="h-px bg-ink/5" />
                  
                  {task.description && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">Contextual Data</p>
                      <p className="text-ink/70 leading-relaxed font-serif text-xl italic">"{task.description}"</p>
                    </div>
                  )}

                  {task.aiAnalysis && (
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="p-8 bg-paper rounded-[2rem] border border-ink/5 space-y-4 luxury-shadow">
                        <div className="flex items-center gap-3 text-gold">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Strategic Rationale</span>
                        </div>
                        <p className="text-lg text-ink/80 leading-relaxed font-serif italic">{task.aiAnalysis.whyPriority}</p>
                      </div>
                      <div className="p-8 bg-ink rounded-[2rem] border border-white/5 space-y-4 shadow-2xl">
                        <div className="flex items-center gap-3 text-gold">
                          <Zap className="w-5 h-5 fill-gold" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Orchestration Strategy</span>
                        </div>
                        <p className="text-lg text-white/90 leading-relaxed font-serif italic">{task.aiAnalysis.suggestedApproach}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-8 text-[10px] text-ink/20 font-bold uppercase tracking-[0.2em]">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Committed {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-32 bg-white rounded-[4rem] border border-ink/5 luxury-shadow">
            <div className="w-20 h-20 bg-paper rounded-full flex items-center justify-center mx-auto mb-8 border border-ink/5">
              <CheckCircle2 className="w-10 h-10 text-ink/5" />
            </div>
            <p className="text-ink/20 font-serif italic text-2xl">All objectives have been orchestrated.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  )
}
