import { useState, useEffect, useRef } from 'react';
import { StickyNote, X, Trash2, Edit2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

type NoteColor = 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple';

interface Note {
  id: string;
  mess_id: string;
  author_id: string;
  content: string;
  color: NoteColor;
  month: number;
  year: number;
  created_at: string;
  author?: {
    name: string;
  };
}

const colorMap: Record<NoteColor, { border: string; bg: string; marker: string }> = {
  yellow: { border: 'border-l-yellow-500', bg: 'bg-yellow-500/10', marker: 'bg-yellow-500' },
  blue: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', marker: 'bg-blue-500' },
  green: { border: 'border-l-green-500', bg: 'bg-green-500/10', marker: 'bg-green-500' },
  pink: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', marker: 'bg-pink-500' },
  orange: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', marker: 'bg-orange-500' },
  purple: { border: 'border-l-purple-500', bg: 'bg-purple-500/10', marker: 'bg-purple-500' },
};

export function MessNotepadWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, currentMess } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Composer
  const [isComposing, setIsComposing] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<NoteColor>('yellow');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  useEffect(() => {
    if (isOpen && currentMess) {
      fetchNotes();
      
      const subscription = supabase
        .channel('public:mess_notes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'mess_notes',
          filter: `mess_id=eq.${currentMess.id}`
        }, () => {
          fetchNotes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [isOpen, currentMess, month, year]);

  const fetchNotes = async () => {
    if (!currentMess) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('mess_notes')
      .select(`
        *,
        author:users!mess_notes_author_id_fkey ( name )
      `)
      .eq('mess_id', currentMess.id)
      .eq('month', month)
      .eq('year', year)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching notes:", error);
    }

    if (!error && data) {
      setNotes(data as Note[]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setLoading(false);
  };

  const handleSaveNote = async () => {
    if (!newContent.trim() || !currentMess || !user) return;
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('mess_notes')
      .insert({
        mess_id: currentMess.id,
        author_id: user.id,
        content: newContent.trim(),
        color: selectedColor,
        month: month,
        year: year
      });
      
    if (error) {
      console.error("Error saving note:", error);
    }
      
    setIsSubmitting(false);
    if (!error) {
      setNewContent('');
      setIsComposing(false);
      fetchNotes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await supabase
      .from('mess_notes')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: user?.id })
      .eq('id', id);
    fetchNotes();
  };

  const isCurrentMonth = 
    month === new Date().getMonth() + 1 && 
    year === new Date().getFullYear();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="mb-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden w-[350px] md:w-[400px] h-[550px] flex flex-col transition-all duration-300 ease-in-out font-mono">
          
          {/* HEADER */}
          <div className="flex items-center justify-between p-4 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm tracking-widest uppercase">OurMess Notes</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* MONTH NAVIGATION */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/50">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentDate(new Date(year, month - 2))}
              className="h-6 w-6"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentDate(new Date(year, month))}
              disabled={isCurrentMonth}
              className="h-6 w-6 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* NOTES AREA */}
          <div className="flex-1 overflow-y-auto p-4 bg-background space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full opacity-50">
                <span className="text-sm">Loading notes...</span>
              </div>
            ) : notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                <StickyNote className="w-8 h-8 mb-4 stroke-1" />
                <p className="text-sm">Nothing on the board yet.</p>
                {isCurrentMonth && (
                  <p className="text-xs mt-1">Leave a note for the mess.</p>
                )}
              </div>
            ) : (
              notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`relative p-3 border-l-[3px] ${colorMap[note.color].border} ${colorMap[note.color].bg} rounded-r-md group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`}
                  style={{
                    backgroundImage: 'linear-gradient(transparent 95%, rgba(255,255,255,0.05) 100%)',
                    backgroundSize: '100% 1.2rem'
                  }}
                >
                  <div className="flex items-start gap-2 mb-3">
                    <div className={`mt-1.5 w-2 h-2 rounded-sm ${colorMap[note.color].marker} shrink-0 opacity-80`} />
                    <p className="text-[13px] font-sans whitespace-pre-wrap flex-1 leading-relaxed text-foreground/90">{note.content}</p>
                  </div>
                  
                  <div className="flex justify-between items-end pl-4">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      <span className="font-bold text-foreground/70">{note.author?.name || 'Unknown'}</span>
                      {' · '}
                      {format(new Date(note.created_at), 'MMM d · h:mm a')}
                    </div>
                    
                    {/* Actions */}
                    {(user?.id === note.author_id) && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/50 backdrop-blur-sm p-0.5 rounded">
                        <button onClick={() => handleDelete(note.id)} className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* COMPOSER */}
          {isCurrentMonth && (
            <div className="border-t border-border p-4 bg-card shadow-[0_-10px_20px_rgba(0,0,0,0.1)] z-10 relative">
              {!isComposing ? (
                <Button 
                  onClick={() => setIsComposing(true)}
                  variant="outline" 
                  className="w-full justify-start text-muted-foreground font-mono uppercase tracking-widest text-xs h-12 border-dashed bg-transparent hover:bg-muted/50 transition-all hover:border-primary/50 hover:text-foreground"
                >
                  + Write a note...
                </Button>
              ) : (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="relative">
                    <div className={`absolute top-0 left-0 w-1 h-full rounded-l-md ${colorMap[selectedColor].marker}`} />
                    <textarea
                      autoFocus
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Type your note here..."
                      className={`w-full min-h-[90px] bg-background border border-border rounded-md pl-4 pr-3 py-3 text-[13px] font-sans resize-none focus:outline-none focus:ring-1 focus:ring-primary ${colorMap[selectedColor].bg}`}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 p-1 bg-background rounded-full border border-border">
                      {(Object.keys(colorMap) as NoteColor[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${selectedColor === color ? 'border-foreground scale-110' : 'border-transparent hover:scale-110'} ${colorMap[color].marker}`}
                          aria-label={`Select ${color} color`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsComposing(false)} className="h-8 px-3 text-xs uppercase tracking-wider">Cancel</Button>
                      <Button size="sm" onClick={handleSaveNote} disabled={!newContent.trim() || isSubmitting} className="h-8 px-4 text-xs uppercase tracking-wider">
                        {isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
      >
        <StickyNote className="h-6 w-6 text-primary-foreground" />
      </Button>
    </div>
  );
}
