import React, { useState, useMemo } from 'react';
import {
  Pin,
  PinOff,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  FileText,
  Search,
  ExternalLink,
  CloudUpload,
  Check,
  Copy,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { KeepNote, KeepChecklistItem } from '../types';
import { googleSignIn, logout } from '../lib/firebase';
import { googleTasksService } from '../services/googleTasksService';
import { User } from 'firebase/auth';

interface KeepNotesViewProps {
  notes: KeepNote[];
  onSaveNote: (note: KeepNote) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateNote: (note: KeepNote) => void;
  user: User | null;
  accessToken: string | null;
  onLoginSuccess: (user: User, token: string) => void;
  onLogoutSuccess: () => void;
}

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; header: string }> = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-950', header: 'bg-amber-100/70' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-950', header: 'bg-emerald-100/70' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-950', header: 'bg-blue-100/70' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-950', header: 'bg-purple-100/70' },
  rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-950', header: 'bg-rose-100/70' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-950', header: 'bg-orange-100/70' },
  default: { bg: 'bg-white', border: 'border-neutral-200', text: 'text-neutral-900', header: 'bg-neutral-50' },
};

export const KeepNotesView: React.FC<KeepNotesViewProps> = ({
  notes,
  onSaveNote,
  onDeleteNote,
  onUpdateNote,
  user,
  accessToken,
  onLoginSuccess,
  onLogoutSuccess,
}) => {
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'inventory' | 'orders' | 'supplier' | 'general'>('all');

  // New Note Composer State
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'note' | 'checklist'>('checklist');
  const [newColor, setNewColor] = useState<KeepNote['color']>('amber');
  const [newCategory, setNewCategory] = useState<KeepNote['category']>('inventory');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; completed: boolean }[]>([
    { text: 'স্টক কাউন্ট ও প্যাকিং টেপ চেক', completed: false },
  ]);

  // UI status
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [deleteConfirmNote, setDeleteConfirmNote] = useState<KeepNote | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Google Sign In handler
  const handleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const res = await googleSignIn();
      if (res) {
        onLoginSuccess(res.user, res.accessToken);
        showStatus('Google অ্যাকাউন্টে সফলভাবে সাইন ইন হয়েছে!', 'success');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      showStatus(err.message || 'সাইন ইন করতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Google Sign Out handler
  const handleSignOut = async () => {
    try {
      await logout();
      onLogoutSuccess();
      showStatus('সাইন আউট করা হয়েছে', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  // Add checklist item in creator
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklistItems([...checklistItems, { text: newChecklistText.trim(), completed: false }]);
    setNewChecklistText('');
  };

  // Save new note
  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim() && checklistItems.length === 0) return;

    const noteObj: KeepNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || 'শিরোনামহীন নোট',
      content: newType === 'note' ? newContent : '',
      type: newType,
      items:
        newType === 'checklist'
          ? checklistItems.map((item, index) => ({
              id: `item-${Date.now()}-${index}`,
              text: item.text,
              completed: item.completed,
            }))
          : undefined,
      color: newColor,
      isPinned: false,
      category: newCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveNote(noteObj);
    setNewTitle('');
    setNewContent('');
    setChecklistItems([{ text: '', completed: false }]);
    setIsExpanded(false);
    showStatus('নোট সংরক্ষণ করা হয়েছে!', 'success');
  };

  // Toggle checklist item within existing note
  const handleToggleExistingItem = (note: KeepNote, itemId: string) => {
    if (!note.items) return;
    const updatedItems = note.items.map((it) =>
      it.id === itemId ? { ...it, completed: !it.completed } : it
    );
    onUpdateNote({
      ...note,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    });
  };

  // Toggle Pin
  const handleTogglePin = (note: KeepNote) => {
    onUpdateNote({
      ...note,
      isPinned: !note.isPinned,
      updatedAt: new Date().toISOString(),
    });
  };

  // Copy to clipboard & suggest opening Keep
  const handleCopyNoteForKeep = (note: KeepNote) => {
    let text = `${note.title}\n\n`;
    if (note.type === 'checklist' && note.items) {
      text += note.items.map((i) => `[${i.completed ? 'x' : ' '}] ${i.text}`).join('\n');
    } else {
      text += note.content;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(note.id);
    setTimeout(() => setCopiedId(null), 2500);
    showStatus('নোট ক্লিপবোর্ডে কপি করা হয়েছে! Keep এ পেস্ট করতে পারেন।', 'info');
  };

  // Sync to Google Tasks
  const handleSyncToGoogleTasks = async (note: KeepNote) => {
    if (!accessToken) {
      showStatus('গুগল টাস্কে সিঙ্ক করতে প্রথমে Google দিয়ে সাইন ইন করুন', 'error');
      return;
    }

    setSyncingId(note.id);
    try {
      let bodyNotes = '';
      if (note.type === 'checklist' && note.items) {
        bodyNotes = note.items.map((i) => `[${i.completed ? '✓' : ' '}] ${i.text}`).join('\n');
      } else {
        bodyNotes = note.content;
      }

      const created = await googleTasksService.createTask(accessToken, {
        title: note.title,
        notes: `${bodyNotes}\n\n(PackageCraft Keep Manager)`,
      });

      onUpdateNote({
        ...note,
        googleTaskId: created.id,
        updatedAt: new Date().toISOString(),
      });
      showStatus('Google Workspace Tasks এ সফলভাবে সিঙ্ক হয়েছে!', 'success');
    } catch (err: any) {
      console.error(err);
      showStatus(`সিঙ্ক ব্যর্থ: ${err.message}`, 'error');
    } finally {
      setSyncingId(null);
    }
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.items && n.items.some((it) => it.text.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesCategory = categoryFilter === 'all' || n.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [notes, searchQuery, categoryFilter]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Google Workspace integration info */}
      <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border border-neutral-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
                  Google Keep & Tasks নোটবোর্ড
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full uppercase">
                  Keep Sync
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                ইনভেন্টরি রিস্টক, অর্ডার প্যাকিং লিস্ট এবং সাপ্লায়ার নোটস গুছিয়ে রাখুন। Google Workspace একাউন্টে ১-ক্লিকে টাস্ক সিঙ্ক ও Keep এ সরাসরি ওপেন করুন।
              </p>
            </div>
          </div>

          {/* Google Auth Status / Button */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-neutral-200 shadow-xs">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'User'} className="w-7 h-7 rounded-full border border-neutral-200" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="text-left text-xs">
                  <div className="font-semibold text-neutral-900 truncate max-w-[140px]">{user.displayName || user.email}</div>
                  <div className="text-[10px] text-emerald-600 font-medium">Google Connected</div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={isAuthLoading}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {/* Official Google SVG icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isAuthLoading ? 'সংযোগ হচ্ছে...' : 'Sign in with Google'}</span>
              </button>
            )}

            {/* Quick Link to Google Keep Web */}
            <a
              href="https://keep.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Keep খুলুন</span>
            </a>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className="flex items-center justify-between p-3 rounded-xl text-xs font-semibold bg-neutral-900 text-white shadow-md animate-in fade-in">
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-neutral-400 hover:text-white ml-2 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Note Creator Card (Keep Style) */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-neutral-300 rounded-2xl shadow-sm overflow-hidden transition-all">
          {!isExpanded ? (
            <div
              onClick={() => setIsExpanded(true)}
              className="p-3.5 flex items-center justify-between text-neutral-400 hover:text-neutral-600 cursor-pointer text-sm font-medium"
            >
              <span>নতুন ইনভেন্টরি বা অর্ডার নোট লিখুন...</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewType('checklist');
                    setIsExpanded(true);
                  }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500"
                  title="চেকলিস্ট তৈরি করুন"
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setNewType('note');
                    setIsExpanded(true);
                  }}
                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500"
                  title="সাধারণ নোট"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateNote} className="p-4 space-y-3.5">
              <input
                type="text"
                placeholder="নোটের শিরোনাম (Title)..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-sm font-bold text-neutral-900 focus:outline-none placeholder:text-neutral-400"
                autoFocus
              />

              {/* Mode switch */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setNewType('checklist')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    newType === 'checklist' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>চেকলিস্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('note')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    newType === 'note' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>সাধারণ নোট</span>
                </button>
              </div>

              {newType === 'note' ? (
                <textarea
                  placeholder="নোটের বিবরণ লিখুন..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full text-xs text-neutral-800 focus:outline-none resize-none placeholder:text-neutral-400"
                />
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    {checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <Square className="w-4 h-4 text-neutral-400 shrink-0" />
                        <span className="text-neutral-700 flex-1">{item.text}</span>
                        <button
                          type="button"
                          onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                          className="text-neutral-400 hover:text-rose-500 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-100">
                    <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="নতুন আইটেম যোগ করুন (Enter চাপুন)..."
                      value={newChecklistText}
                      onChange={(e) => setNewChecklistText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="w-full text-xs text-neutral-800 focus:outline-none placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="text-xs px-2 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 font-medium shrink-0"
                    >
                      যোগ করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Color & Category Picker */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-3">
                  {/* Color dots */}
                  <div className="flex items-center gap-1.5">
                    {(['amber', 'emerald', 'blue', 'purple', 'rose', 'orange', 'default'] as KeepNote['color'][]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          c === 'amber'
                            ? 'bg-amber-200 border-amber-400'
                            : c === 'emerald'
                            ? 'bg-emerald-200 border-emerald-400'
                            : c === 'blue'
                            ? 'bg-blue-200 border-blue-400'
                            : c === 'purple'
                            ? 'bg-purple-200 border-purple-400'
                            : c === 'rose'
                            ? 'bg-rose-200 border-rose-400'
                            : c === 'orange'
                            ? 'bg-orange-200 border-orange-400'
                            : 'bg-white border-neutral-300'
                        } ${newColor === c ? 'ring-2 ring-neutral-900 scale-110' : ''}`}
                      />
                    ))}
                  </div>

                  {/* Category select */}
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="text-xs px-2 py-1 bg-neutral-100 rounded-lg border border-neutral-200 text-neutral-700 focus:outline-none"
                  >
                    <option value="inventory">ইনভেন্টরি (Inventory)</option>
                    <option value="orders">অর্ডার ও ডেলিভারি (Orders)</option>
                    <option value="supplier">সাপ্লায়ার (Supplier)</option>
                    <option value="general">সাধারণ (General)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 rounded-lg cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs cursor-pointer"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'inventory', 'orders', 'supplier', 'general'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {cat === 'all'
                ? 'সব নোট'
                : cat === 'inventory'
                ? 'ইনভেন্টরি'
                : cat === 'orders'
                ? 'অর্ডার ও ডেলিভারি'
                : cat === 'supplier'
                ? 'সাপ্লায়ার'
                : 'সাধারণ'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="নোট অনুসন্ধান করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
      </div>

      {/* Pinned Section */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <Pin className="w-3.5 h-3.5 text-amber-600" />
            <span>পিন করা নোটস ({pinnedNotes.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedNotes.map((note) => renderNoteCard(note))}
          </div>
        </div>
      )}

      {/* Other Notes Section */}
      <div className="space-y-3">
        {pinnedNotes.length > 0 && (
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            অন্যান্য নোটস ({otherNotes.length})
          </div>
        )}

        {otherNotes.length === 0 && pinnedNotes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <CheckSquare className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">কোন নোট পাওয়া যায়নি</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              নতুন ইনভেন্টরি রিস্টক লিস্ট, ডেলিভারি চেকলিস্ট বা ক্লায়েন্ট নোট তৈরি করতে ওপরের ইনপুট বক্সে লিখুন।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNotes.map((note) => renderNoteCard(note))}
          </div>
        )}
      </div>

      {/* MANDATORY Destructive Operation Confirmation Modal */}
      {deleteConfirmNote && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">নোট ডিলিট নিশ্চিত করুন</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  আপনি কি নিশ্চিত যে আপনি "<strong>{deleteConfirmNote.title}</strong>" নোটটি স্থায়ীভাবে মুছে ফেলতে চান? এই অ্যাকশনটি পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmNote(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(deleteConfirmNote.id);
                  setDeleteConfirmNote(null);
                  showStatus('নোট মুছে ফেলা হয়েছে', 'info');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                স্থায়ীভাবে ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for each note card
  function renderNoteCard(note: KeepNote) {
    const colorStyle = COLOR_CLASSES[note.color] || COLOR_CLASSES.default;

    return (
      <div
        key={note.id}
        className={`flex flex-col justify-between rounded-2xl border ${colorStyle.border} ${colorStyle.bg} p-4 shadow-xs hover:shadow-md transition-all group`}
      >
        <div className="space-y-3">
          {/* Card Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-white/70 px-2 py-0.5 rounded-md border border-black/5">
                {note.category === 'inventory'
                  ? 'ইনভেন্টরি'
                  : note.category === 'orders'
                  ? 'অর্ডার'
                  : note.category === 'supplier'
                  ? 'সাপ্লায়ার'
                  : 'সাধারণ'}
              </span>
              <h3 className={`font-bold text-sm ${colorStyle.text} mt-1.5 truncate`}>
                {note.title}
              </h3>
            </div>
            <button
              onClick={() => handleTogglePin(note)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                note.isPinned
                  ? 'text-amber-600 bg-amber-100/80 hover:bg-amber-200'
                  : 'text-neutral-400 hover:text-neutral-700 hover:bg-black/5'
              }`}
              title={note.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
            >
              {note.isPinned ? <Pin className="w-4 h-4 fill-amber-600" /> : <Pin className="w-4 h-4" />}
            </button>
          </div>

          {/* Card Body */}
          {note.type === 'checklist' && note.items && note.items.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {note.items.map((it) => (
                <div
                  key={it.id}
                  onClick={() => handleToggleExistingItem(note, it.id)}
                  className="flex items-start gap-2 text-xs cursor-pointer select-none group/item py-0.5"
                >
                  {it.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5 group-hover/item:text-neutral-600" />
                  )}
                  <span
                    className={`leading-tight ${
                      it.completed ? 'line-through text-neutral-400' : 'text-neutral-800'
                    }`}
                  >
                    {it.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed line-clamp-6">
              {note.content || 'কোন বিবরণ নেই'}
            </p>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 mt-3 border-t border-black/5 flex items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1">
            {/* Copy for Keep button */}
            <button
              onClick={() => handleCopyNoteForKeep(note)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-black/5 transition-colors cursor-pointer"
              title="ক্লিপবোর্ডে কপি করুন (Google Keep পেস্টের জন্য)"
            >
              {copiedId === note.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Sync to Google Tasks */}
            <button
              onClick={() => handleSyncToGoogleTasks(note)}
              disabled={syncingId === note.id}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                note.googleTaskId
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-white/80 text-neutral-700 hover:bg-white border border-black/10'
              }`}
              title="Google Tasks এ সিঙ্ক করুন"
            >
              {syncingId === note.id ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <CloudUpload className="w-3 h-3 text-blue-600" />
              )}
              <span>{note.googleTaskId ? 'Synced' : 'Sync Tasks'}</span>
            </button>
          </div>

          {/* Delete Button (opens confirmation modal) */}
          <button
            onClick={() => setDeleteConfirmNote(note)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="নোট মুছুন"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
};
