import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Mail, Lock, User as UserIcon, LogIn, UserPlus, HelpCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthProps {
  onSuccess?: () => void;
}

type AuthMode = 'login' | 'register' | 'reset';

export default function Auth({ onSuccess }: AuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName });
        
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setMessage('Password reset email sent! Check your inbox.');
      }
      
      if (mode !== 'reset' && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] luxury-shadow border border-ink/5 space-y-10 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 opacity-[0.03] text-ink">
        <Zap className="w-64 h-64" />
      </div>

      <div className="text-center space-y-4 relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-ink rounded-[2rem] flex items-center justify-center shadow-2xl rotate-6 border-4 border-gold/20">
            <Zap className="w-10 h-10 text-gold fill-gold" />
          </div>
        </div>
        <h1 className="text-4xl font-serif font-bold tracking-tight text-ink">
          {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Join the Elite' : 'Restore Access'}
        </h1>
        <p className="text-ink/40 font-serif italic text-lg">
          {mode === 'login' ? 'Enter your credentials to resume your flow.' : 
           mode === 'register' ? 'Begin your journey towards peak performance.' : 
           'Enter your email to receive a restoration link.'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-6 relative z-10">
        <AnimatePresence mode="wait">
          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em] ml-4">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/10" />
                <input 
                  type="text" 
                  required
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-paper border-none rounded-full focus:ring-1 focus:ring-gold transition-all font-serif italic text-lg"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em] ml-4">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/10" />
            <input 
              type="email" 
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-paper border-none rounded-full focus:ring-1 focus:ring-gold transition-all font-serif italic text-lg"
            />
          </div>
        </div>

        {mode !== 'reset' && (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em] ml-4">Password</label>
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/10" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-paper border-none rounded-full focus:ring-1 focus:ring-gold transition-all font-serif italic text-lg"
              />
            </div>
          </div>
        )}

        {error && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-xs text-red-500 font-bold text-center bg-red-50 py-3 rounded-full border border-red-100"
          >
            {error}
          </motion.p>
        )}

        {message && (
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-xs text-green-600 font-bold text-center bg-green-50 py-3 rounded-full border border-green-100"
          >
            {message}
          </motion.p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-ink text-white rounded-full font-bold flex items-center justify-center gap-3 hover:bg-gold transition-all active:scale-95 shadow-2xl disabled:opacity-50 group"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            mode === 'login' ? <LogIn className="w-5 h-5 text-gold" /> : 
            mode === 'register' ? <UserPlus className="w-5 h-5 text-gold" /> : 
            <Mail className="w-5 h-5 text-gold" />
          )}
          <span className="text-sm uppercase tracking-[0.2em]">
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
          </span>
        </button>
      </form>

      {mode === 'login' && (
        <div className="space-y-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-ink/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-ink/20 font-bold tracking-[0.3em]">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-5 bg-white border border-ink/5 text-ink rounded-full font-bold flex items-center justify-center gap-4 hover:bg-paper transition-all active:scale-95 luxury-shadow disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-sm uppercase tracking-[0.2em]">Google</span>
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 pt-6 relative z-10">
        {mode === 'login' ? (
          <>
            <button onClick={() => setMode('register')} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors">
              New to FocusFlow? <span className="text-gold underline underline-offset-4">Join the Club</span>
            </button>
            <button onClick={() => setMode('reset')} className="text-[10px] font-bold text-ink/20 hover:text-ink transition-colors flex items-center gap-2 uppercase tracking-[0.2em]">
              <HelpCircle className="w-3 h-3" />
              Forgot your credentials?
            </button>
          </>
        ) : (
          <button onClick={() => setMode('login')} className="text-sm font-bold text-ink/40 hover:text-ink transition-colors flex items-center gap-3">
            <ArrowLeft className="w-4 h-4 text-gold" />
            Back to Sign In
          </button>
        )}
      </div>
    </div>
  );
}
