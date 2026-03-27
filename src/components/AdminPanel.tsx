import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Shield, Trash2, UserCheck, UserX, Mail, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      console.error("Admin access error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleRole = async (user: UserProfile) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Change ${user.displayName}'s role to ${nextRole}?`)) {
      await updateDoc(doc(db, 'users', user.uid), { role: nextRole });
    }
  };

  const deleteUser = async (uid: string) => {
    if (confirm("Delete this user profile? This won't delete their Auth account.")) {
      await deleteDoc(doc(db, 'users', uid));
    }
  };

  if (loading) return <div className="p-12 text-center text-ink/20 font-serif italic text-2xl">Accessing registry...</div>;

  return (
    <div className="space-y-12 pb-12">
      <header>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-[1.5rem] border border-red-100 shadow-lg">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">Governance</h2>
        </div>
        <p className="text-ink/50 mt-2 font-serif italic text-lg">Manage user roles and system-wide access protocols.</p>
      </header>

      <div className="bg-white rounded-[3rem] border border-ink/5 luxury-shadow overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-paper border-b border-ink/5">
                <th className="px-10 py-6 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">Identity</th>
                <th className="px-10 py-6 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">Communication</th>
                <th className="px-10 py-6 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">Privilege</th>
                <th className="px-10 py-6 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">Induction</th>
                <th className="px-10 py-6 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-paper/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        className="w-12 h-12 rounded-full border-2 border-ink/5 group-hover:border-gold transition-colors"
                        alt="Avatar"
                        referrerPolicy="no-referrer"
                      />
                      <span className="font-serif font-bold text-xl text-ink">{user.displayName || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 text-ink/40">
                      <Mail className="w-4 h-4 text-gold" />
                      <span className="text-sm font-serif italic">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border",
                      user.role === 'admin' 
                        ? "bg-red-50 text-red-600 border-red-100 shadow-sm" 
                        : "bg-gold/5 text-gold border-gold/20 shadow-sm"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-3 text-ink/20">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-serif italic">{(user as any).createdAt ? format(new Date((user as any).createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => toggleRole(user)}
                        className="p-3 hover:bg-paper rounded-full text-ink/10 hover:text-ink transition-all"
                        title={user.role === 'admin' ? "Revoke Admin" : "Make Admin"}
                      >
                        {user.role === 'admin' ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
                      </button>
                      <button 
                        onClick={() => deleteUser(user.uid)}
                        className="p-3 hover:bg-red-50 rounded-full text-ink/10 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
