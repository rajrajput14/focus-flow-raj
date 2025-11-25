-- Notes enhancements for folders, pinning, checklists, and media
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder text;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_type text DEFAULT 'text';
ALTER TABLE notes ADD COLUMN IF NOT EXISTS checklist_items jsonb;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS media_attachments text[];

-- Habit logs enhancement for daily check-in notes
ALTER TABLE habit_logs ADD COLUMN IF NOT EXISTS note text;

-- Create storage bucket for task and note attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for attachments bucket
CREATE POLICY "Users can view their own attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder);
CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_user ON habit_logs(habit_id, user_id);