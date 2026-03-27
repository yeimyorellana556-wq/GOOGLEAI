import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  getDocFromServer,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Task, FocusSession, Note } from './types';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Timer, 
  StickyNote, 
  LogOut, 
  Zap,
  Menu,
  X,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import FocusTimer from './components/FocusTimer';
import Notes from './components/Notes';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'timer' | 'notes' | 'admin'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch profile
        const profileDoc = await getDoc(doc(db, 'users', user.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        } else {
          // Create profile if it doesn't exist (e.g. legacy users)
            const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || undefined,
            role: 'user',
            settings: {
              dailyBriefingTime: '08:00',
              focusGoal: 120,
              focusDuration: 10
            }
          };
          await setDoc(doc(db, 'users', user.uid), { ...newProfile, createdAt: new Date().toISOString() });
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync profile changes (e.g. role updates)
  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        // Ensure settings exist for legacy profiles
        if (!data.settings) {
          data.settings = { dailyBriefingTime: '08:00', focusGoal: 120, focusDuration: 10 };
        } else if (data.settings.focusDuration === undefined) {
          data.settings.focusDuration = 10;
        }
        setProfile(data);
      }
    });
    return () => unsubProfile();
  }, [user]);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qTasks = query(collection(db, 'tasks'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => console.error("Firestore Error (Tasks):", error));

    const qSessions = query(collection(db, 'focusSessions'), where('uid', '==', user.uid), orderBy('startTime', 'desc'));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FocusSession)));
    }, (error) => console.error("Firestore Error (Sessions):", error));

    const qNotes = query(collection(db, 'notes'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    }, (error) => console.error("Firestore Error (Notes):", error));

    return () => {
      unsubTasks();
      unsubSessions();
      unsubNotes();
    };
  }, [user]);

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-paper">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-6"
        >
          <Zap className="w-12 h-12 text-gold fill-gold/20" />
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-gold/60">FocusFlow AI</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-paper p-6">
        <Auth />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'tasks', label: 'Orchestration', icon: CheckSquare },
    { id: 'timer', label: 'Deep Work', icon: Timer },
    { id: 'notes', label: 'Context', icon: StickyNote },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Control', icon: Shield });
  }

  return (
    <div className="h-screen w-full bg-paper flex overflow-hidden font-sans text-ink selection:bg-gold/20 selection:text-ink">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full border border-ink/5 shadow-sm lg:hidden transition-all active:scale-90"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className={cn(
          "h-full bg-white border-r border-ink/5 flex flex-col z-40 overflow-hidden relative",
          !isSidebarOpen && "lg:w-0"
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(197,160,89,0.03),transparent_50%)]" />
        
        <div className="p-12 flex items-center gap-5 relative z-10">
          <div className="w-12 h-12 bg-ink rounded-[1.25rem] flex items-center justify-center shadow-2xl rotate-3 border border-gold/20">
            <Zap className="w-6 h-6 text-gold fill-gold" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold tracking-tight leading-none">FocusFlow</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-gold mt-1">Orchestrator</span>
          </div>
        </div>

        <nav className="flex-1 px-8 space-y-2 relative z-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-5 px-6 py-4 rounded-[1.5rem] transition-all group relative",
                activeTab === item.id 
                  ? "text-ink" 
                  : "text-ink/30 hover:text-ink"
              )}
            >
              {activeTab === item.id && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-paper luxury-shadow rounded-[1.5rem] border border-ink/5"
                  transition={{ type: 'spring', bounce: 0.1, duration: 0.8 }}
                />
              )}
              <item.icon className={cn("w-5 h-5 relative z-10 transition-colors", activeTab === item.id ? "text-gold" : "text-ink/10 group-hover:text-ink/30")} />
              <span className="text-sm font-bold relative z-10 tracking-tight uppercase tracking-[0.1em]">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-10 border-t border-ink/5 space-y-8 relative z-10">
          <div className="flex items-center gap-5 px-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gold/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <img 
                src={profile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                alt="Avatar" 
                className="w-14 h-14 rounded-full border-2 border-white shadow-xl relative z-10"
                referrerPolicy="no-referrer"
              />
              {profile?.role === 'admin' && (
                <div className="absolute -bottom-1 -right-1 bg-ink text-gold p-1.5 rounded-full border-2 border-white shadow-lg z-20">
                  <Shield className="w-3 h-3" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-serif font-bold truncate tracking-tight text-ink">{profile?.displayName || user.displayName}</p>
              <p className="text-[9px] text-gold truncate uppercase font-bold tracking-[0.3em] mt-0.5">{profile?.role || 'Member'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-ink/40 hover:text-red-500 hover:bg-red-50/50 rounded-full transition-all font-bold text-[10px] uppercase tracking-[0.2em] border border-ink/5 hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            Terminate Session
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto relative p-6 lg:p-12">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <Dashboard user={user} tasks={tasks} sessions={sessions} />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div 
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <TaskManager user={user} tasks={tasks} />
            </motion.div>
          )}
          {activeTab === 'timer' && (
            <motion.div 
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <FocusTimer user={user} profile={profile} tasks={tasks} />
            </motion.div>
          )}
          {activeTab === 'notes' && (
            <motion.div 
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <Notes user={user} tasks={tasks} notes={notes} />
            </motion.div>
          )}
          {activeTab === 'admin' && profile?.role === 'admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto"
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
