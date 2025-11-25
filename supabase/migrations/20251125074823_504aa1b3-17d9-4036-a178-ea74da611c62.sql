-- Extend habits table with new columns
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🎯';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#8B5CF6';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Personal Growth';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS notes TEXT;

-- Extend tasks table with new columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_estimate INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS board_status TEXT DEFAULT 'todo';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subtasks"
ON subtasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subtasks"
ON subtasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subtasks"
ON subtasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subtasks"
ON subtasks FOR DELETE
USING (auth.uid() = user_id);

-- Create reminders table (unified for habits and tasks)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL, -- 'habit' or 'task'
  entity_id UUID NOT NULL,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[], -- [0-6] for Sunday-Saturday
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
ON reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON reminders FOR DELETE
USING (auth.uid() = user_id);

-- Create user_xp table for gamification
CREATE TABLE IF NOT EXISTS user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  tasks_completed INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own xp"
ON user_xp FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp"
ON user_xp FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own xp"
ON user_xp FOR UPDATE
USING (auth.uid() = user_id);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  badge_type TEXT NOT NULL, -- '7_day_streak', '30_day_streak', '100_completions'
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, badge_type)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
ON user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_user_id ON subtasks(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_entity ON reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_status ON tasks(board_status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);