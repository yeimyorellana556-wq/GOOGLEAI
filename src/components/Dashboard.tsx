import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Task, FocusSession, DailyBriefing } from '../types';
import { generateDailyBriefing } from '../services/geminiService';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

interface DashboardProps {
  user: User;
  tasks: Task[];
  sessions: FocusSession[];
}

export default function Dashboard({ user, tasks, sessions }: DashboardProps) {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    try {
      const data = await generateDailyBriefing(tasks, user.displayName || 'User');
      setBriefing(data);
    } catch (error) {
      console.error("Failed to fetch briefing:", error);
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    if (tasks.length > 0 && !briefing) {
      fetchBriefing();
    }
  }, [tasks]);

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const daySessions = sessions.filter(s => isSameDay(new Date(s.startTime), date));
    const totalMinutes = daySessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      name: format(date, 'EEE'),
      minutes: totalMinutes,
      date: format(date, 'MMM dd')
    };
  });

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalFocusTime = sessions.reduce((acc, s) => acc + s.duration, 0);
  const focusHours = Math.floor(totalFocusTime / 60);
  const focusMins = totalFocusTime % 60;

  return (
    <div className="space-y-12 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">Welcome back, {user.displayName?.split(' ')[0]}</h2>
          <p className="text-ink/50 mt-1">Here is your productivity orchestration for today.</p>
        </div>
        <div className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.3em] bg-white px-4 py-2 rounded-full border border-ink/5 luxury-shadow">
          {format(new Date(), 'EEEE, MMMM do')}
        </div>
      </header>

      {/* AI Briefing Card - Luxury Editorial Feel */}
      <section className="relative overflow-hidden bg-ink rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-radial-gradient from-white/5 to-transparent opacity-30" />
        <div className="absolute -top-20 -right-20 opacity-[0.03]">
          <Sparkles className="w-96 h-96" />
        </div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 px-4 py-1.5 bg-white/5 rounded-full backdrop-blur-md border border-white/10">
              <Zap className="w-4 h-4 text-gold fill-gold" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">AI Orchestration Briefing</span>
            </div>
            <button 
              onClick={fetchBriefing}
              disabled={loadingBriefing}
              className="p-3 hover:bg-white/10 rounded-full transition-all disabled:opacity-50 active:scale-90 border border-white/5"
            >
              <RefreshCw className={cn("w-5 h-5 text-gold", loadingBriefing && "animate-spin")} />
            </button>
          </div>

          {loadingBriefing ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-12 bg-white/5 rounded-2xl w-3/4"></div>
              <div className="h-4 bg-white/5 rounded-2xl w-1/2"></div>
              <div className="h-32 bg-white/5 rounded-2xl w-full"></div>
            </div>
          ) : briefing ? (
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <h3 className="text-4xl font-serif font-medium leading-tight text-white/90">{briefing.greeting}</h3>
                <div className="space-y-4">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em]">Critical Priorities</p>
                  <ul className="space-y-3">
                    {briefing.topPriorities.map((p, i) => (
                      <li key={i} className="flex items-start gap-4 text-white/80 group">
                        <div className="w-5 h-5 rounded-full border border-gold/30 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-gold/20 transition-colors">
                          <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                        </div>
                        <span className="font-serif italic text-lg">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="space-y-8">
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em] mb-4">Strategic Flow</p>
                  <p className="text-white/90 leading-relaxed italic font-serif text-xl">"{briefing.scheduleSuggestion}"</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/30 italic font-serif">"{briefing.motivationalQuote}"</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-white/20 font-serif italic text-xl">Identify your objectives to receive AI orchestration.</p>
            </div>
          )}
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Objectives Met', value: completedTasks, icon: CheckCircle2, color: 'text-gold' },
          { label: 'Deep Work Duration', value: `${focusHours}h ${focusMins}m`, icon: Clock, color: 'text-gold' },
          { label: 'Efficiency Index', value: '84%', icon: TrendingUp, color: 'text-gold' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-ink/5 luxury-shadow flex items-center gap-6 group hover:border-gold/20 transition-all">
            <div className="w-14 h-14 bg-paper rounded-full flex items-center justify-center border border-ink/5 group-hover:scale-110 transition-transform">
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
            <div>
              <p className="text-[10px] text-ink/30 font-bold uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-serif font-bold mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <section className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-ink/5 luxury-shadow space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-serif font-bold">Focus Trajectory</h3>
            <div className="px-4 py-1.5 bg-paper rounded-full text-[10px] font-bold uppercase tracking-widest text-ink/40 border border-ink/5">
              Last 7 Days
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#1a1a1a', opacity: 0.3, fontWeight: 700 }}
                  dy={15}
                />
                <Tooltip 
                  cursor={{ fill: '#fcfaf7' }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid rgba(26, 26, 26, 0.05)', 
                    boxShadow: '0 20px 40px -10px rgba(26, 26, 26, 0.1)',
                    padding: '16px'
                  }}
                />
                <Bar dataKey="minutes" radius={[10, 10, 10, 10]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#c5a059' : '#1a1a1a'} fillOpacity={index === 6 ? 1 : 0.05} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-ink/5 luxury-shadow space-y-8">
          <h3 className="text-2xl font-serif font-bold">Recent Sessions</h3>
          <div className="space-y-4">
            {sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-5 bg-paper rounded-[1.5rem] border border-ink/5 group hover:border-gold/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-gold shadow-[0_0_8px_rgba(197,160,89,0.5)]" />
                  <div>
                    <p className="text-sm font-bold tracking-tight">{session.duration} min session</p>
                    <p className="text-[10px] text-ink/30 font-bold uppercase tracking-widest mt-0.5">{format(new Date(session.startTime), 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                {session.focusScore && (
                  <div className="px-3 py-1 bg-white rounded-full text-[10px] font-bold border border-ink/5 luxury-shadow text-gold">
                    {session.focusScore}/10
                  </div>
                )}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-20 text-ink/20 font-serif italic">
                <p>No sessions recorded.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
