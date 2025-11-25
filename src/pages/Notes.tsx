import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileText, Pin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FolderSidebar } from '@/components/notes/FolderSidebar';
import { ChecklistNote } from '@/components/notes/ChecklistNote';

interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: string;
  folder?: string | null;
  is_pinned?: boolean;
  note_type?: string;
  checklist_items?: any;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    folder: null as string | null,
    noteType: 'text',
    checklistItems: [] as any[],
  });

  useEffect(() => {
    if (user) {
      loadNotes();
      loadFolders();
    }
  }, [user]);

  const loadFolders = async () => {
    if (!user) return;
    const { data } = await supabase.from('notes').select('folder').eq('user_id', user.id);
    const uniqueFolders = [...new Set(data?.map(n => n.folder).filter(Boolean) as string[])];
    setFolders(uniqueFolders);
  };

  const loadNotes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load notes');
    } else {
      setNotes(data || []);
    }
  };

  const createNote = async () => {
    if (!user || !newNote.title.trim()) {
      toast.error('Please enter a note title');
      return;
    }

    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: newNote.title,
      content: newNote.noteType === 'text' ? newNote.content : null,
      folder: newNote.folder,
      note_type: newNote.noteType,
      checklist_items: newNote.noteType === 'checklist' ? newNote.checklistItems : null,
    });

    if (error) {
      toast.error('Failed to create note');
    } else {
      toast.success('Note created!');
      setNewNote({ title: '', content: '', folder: null, noteType: 'text', checklistItems: [] });
      setOpen(false);
      loadNotes();
      loadFolders();
    }
  };

  const togglePin = async (noteId: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from('notes')
      .update({ is_pinned: !currentPinned })
      .eq('id', noteId);

    if (!error) {
      loadNotes();
      toast.success(currentPinned ? 'Note unpinned' : 'Note pinned');
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);

    if (error) {
      toast.error('Failed to delete note');
    } else {
      toast.success('Note deleted');
      loadNotes();
    }
  };

  const filteredNotes = selectedFolder
    ? notes.filter(n => n.folder === selectedFolder)
    : notes;

  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const regularNotes = filteredNotes.filter(n => !n.is_pinned);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold gradient-text">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary gap-2 text-white">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Note title"
                  className="glass-card"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Folder (optional)</label>
                <Select value={newNote.folder || 'none'} onValueChange={(val) => setNewNote({ ...newNote, folder: val === 'none' ? null : val })}>
                  <SelectTrigger className="glass-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Folder</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder} value={folder}>{folder}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Type</label>
                <Select value={newNote.noteType} onValueChange={(val) => setNewNote({ ...newNote, noteType: val })}>
                  <SelectTrigger className="glass-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="checklist">Checklist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newNote.noteType === 'text' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="Write your note..."
                    className="glass-card min-h-[200px]"
                  />
                </div>
              ) : (
                <ChecklistNote
                  items={newNote.checklistItems}
                  onChange={(items) => setNewNote({ ...newNote, checklistItems: items })}
                />
              )}
              <Button onClick={createNote} className="w-full gradient-primary text-white">
                Create Note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-4">
        <FolderSidebar
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onAddFolder={(name) => {
            setFolders([...folders, name]);
            toast.success('Folder created');
          }}
        />

        <div className="lg:col-span-3 space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">PINNED</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pinnedNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card glass-card-hover rounded-2xl p-6 border-2 border-primary/20"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{note.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePin(note.id, note.is_pinned || false)}
                        >
                          <Pin className="h-4 w-4 fill-primary text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="line-clamp-4 text-sm text-muted-foreground">{note.content}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          <div>
            {pinnedNotes.length > 0 && (
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">ALL NOTES</h3>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regularNotes.length === 0 && pinnedNotes.length === 0 ? (
                <div className="col-span-full glass-card rounded-2xl p-12 text-center">
                  <p className="text-muted-foreground">No notes yet. Create your first note to get started!</p>
                </div>
              ) : (
                regularNotes.map((note, index) => (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card glass-card-hover rounded-2xl p-6"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-2">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{note.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {new Date(note.created_at).toLocaleDateString()}
                          </p>
                          {note.folder && (
                            <p className="text-xs text-primary">📁 {note.folder}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePin(note.id, note.is_pinned || false)}
                        >
                          <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteNote(note.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {note.content && (
                      <p className="line-clamp-4 text-sm text-muted-foreground">{note.content}</p>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}