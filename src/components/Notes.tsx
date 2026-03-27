import { useState } from 'react';
import { User } from 'firebase/auth';
import { Task, Note } from '../types';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Plus, 
  Trash2, 
  StickyNote, 
  Search, 
  Link as LinkIcon,
  ChevronRight,
  Maximize2,
  X,
  Edit3,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

interface NotesProps {
  user: User;
  tasks: Task[];
  notes: Note[];
}

export default function Notes({ user, tasks, notes }: NotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTaskId, setNewTaskId] = useState<string | null>(null);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    await addDoc(collection(db, 'notes'), {
      uid: user.uid,
      title: newTitle,
      content: newContent,
      taskId: newTaskId,
      createdAt: new Date().toISOString()
    });

    setNewTitle('');
    setNewContent('');
    setNewTaskId(null);
    setIsAdding(false);
  };

  const deleteNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, 'notes', id));
      if (selectedNoteId === id) setSelectedNoteId(null);
    }
  };

  const selectedNote = notes.find(n => n.id === selectedNoteId);
  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-12 pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-serif font-bold tracking-tight">Manuscripts</h2>
          <p className="text-ink/50 mt-1">Capture your thoughts and link them to strategic objectives.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-8 py-4 bg-ink text-white rounded-full font-bold hover:bg-gold transition-all active:scale-95 shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          New Entry
        </button>
      </header>

      <div className="flex-1 grid lg:grid-cols-3 gap-12 overflow-hidden">
        {/* Notes List */}
        <div className="lg:col-span-1 flex flex-col space-y-6 overflow-hidden">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/20" />
            <input 
              type="text" 
              placeholder="Search manuscripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-ink/5 rounded-full focus:ring-1 focus:ring-gold focus:border-transparent transition-all luxury-shadow text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-hide">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedNoteId(note.id);
                  setIsAdding(false);
                  setIsEditing(false);
                }}
                className={cn(
                  "w-full p-8 rounded-[2.5rem] border text-left transition-all group relative overflow-hidden",
                  selectedNoteId === note.id 
                    ? "bg-ink text-white border-ink shadow-2xl" 
                    : "bg-white border-ink/5 text-ink/60 hover:border-gold luxury-shadow"
                )}
              >
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-xl truncate pr-4">{note.title}</h4>
                    <span className="text-[9px] opacity-40 uppercase tracking-[0.2em] font-bold">
                      {format(new Date(note.createdAt), 'MMM d')}
                    </span>
                  </div>
                  <p className={cn(
                    "text-lg font-serif italic line-clamp-2",
                    selectedNoteId === note.id ? "text-white/60" : "text-ink/40"
                  )}>
                    {note.content}
                  </p>
                  {note.taskId && (
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-gold">
                      <LinkIcon className="w-3 h-3" />
                      Linked Objective
                    </div>
                  )}
                </div>
              </button>
            ))}
            {filteredNotes.length === 0 && (
              <div className="text-center py-32 bg-white rounded-[3rem] border border-ink/5 luxury-shadow">
                <StickyNote className="w-12 h-12 text-ink/5 mx-auto mb-6" />
                <p className="text-ink/20 font-serif italic text-xl">No manuscripts found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Note Editor / Viewer */}
        <div className="lg:col-span-2 bg-white rounded-[4rem] border border-ink/5 luxury-shadow overflow-hidden flex flex-col relative">
          <AnimatePresence mode="wait">
            {isAdding ? (
              <motion.form 
                key="adding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleAddNote}
                className="h-full flex flex-col p-16 space-y-10"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-serif font-bold">Draft Entry</h3>
                  <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-paper rounded-full transition-colors">
                    <X className="w-6 h-6 text-ink/20" />
                  </button>
                </div>
                <input 
                  type="text" 
                  placeholder="Manuscript Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-5xl font-serif font-bold border-none focus:ring-0 placeholder:text-ink/10 bg-transparent"
                  autoFocus
                />
                <div className="flex items-center gap-4">
                  <LinkIcon className="w-5 h-5 text-gold" />
                  <select 
                    value={newTaskId || ''} 
                    onChange={(e) => setNewTaskId(e.target.value || null)}
                    className="bg-paper border-none rounded-full text-[10px] font-bold uppercase tracking-[0.2em] px-6 py-3 focus:ring-1 focus:ring-gold"
                  >
                    <option value="">Link to Objective (Optional)</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                </div>
                <textarea 
                  placeholder="Begin your manuscript... (Markdown supported)"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="flex-1 text-2xl font-serif italic border-none focus:ring-0 text-ink/70 resize-none leading-relaxed bg-transparent"
                />
                <div className="flex justify-end gap-6 pt-8 border-t border-ink/5">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-8 py-4 text-ink/40 font-bold hover:text-ink transition-colors text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    disabled={!newTitle.trim() || !newContent.trim()}
                    className="px-12 py-4 bg-ink text-white rounded-full font-bold shadow-2xl hover:bg-gold transition-all active:scale-95"
                  >
                    Commit Entry
                  </button>
                </div>
              </motion.form>
            ) : selectedNote ? (
              <motion.div 
                key={selectedNote.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col p-16 space-y-12 overflow-y-auto scrollbar-hide"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[10px] font-bold text-ink/20 uppercase tracking-[0.3em]">
                    <StickyNote className="w-4 h-4" />
                    Committed {format(new Date(selectedNote.createdAt), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => deleteNote(selectedNote.id)}
                      className="p-3 hover:bg-red-50 text-ink/10 hover:text-red-500 rounded-full transition-all"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                    <button className="p-3 hover:bg-paper text-ink/10 hover:text-ink rounded-full transition-all">
                      <Edit3 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <h3 className="text-6xl font-serif font-bold tracking-tight leading-tight">{selectedNote.title}</h3>
                
                {selectedNote.taskId && (
                  <div className="flex items-center gap-4 p-6 bg-paper rounded-[2rem] border border-ink/5 w-fit luxury-shadow">
                    <LinkIcon className="w-5 h-5 text-gold" />
                    <span className="text-[10px] font-bold text-ink/40 uppercase tracking-[0.2em]">
                      Linked to Objective: <span className="text-ink">{tasks.find(t => t.id === selectedNote.taskId)?.title || 'Deleted Task'}</span>
                    </span>
                  </div>
                )}

                <div className="flex-1 prose prose-slate max-w-none prose-headings:font-serif prose-p:font-serif prose-p:italic prose-p:text-2xl prose-p:text-ink/70">
                  <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-ink/10 space-y-8">
                <div className="w-32 h-32 bg-paper rounded-[3rem] flex items-center justify-center border border-ink/5 luxury-shadow">
                  <StickyNote className="w-16 h-16" />
                </div>
                <p className="font-serif italic text-2xl">Select a manuscript to read or draft a new one.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
