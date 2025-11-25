-- Extend profiles table with personalization fields
ALTER TABLE public.profiles
ADD COLUMN daily_focus_goal INTEGER DEFAULT 120,
ADD COLUMN scroll_limit INTEGER DEFAULT 20,
ADD COLUMN cool_down_time INTEGER DEFAULT 10,
ADD COLUMN blocked_apps TEXT[] DEFAULT '{}',
ADD COLUMN notification_enabled BOOLEAN DEFAULT true,
ADD COLUMN notification_frequency INTEGER DEFAULT 2,
ADD COLUMN theme TEXT DEFAULT 'auto';

-- Create focus_sessions table for analytics
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER,
  session_type TEXT NOT NULL DEFAULT 'deep_work',
  break_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own focus sessions"
ON public.focus_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus sessions"
ON public.focus_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own focus sessions"
ON public.focus_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Create scroll_breaks table for analytics
CREATE TABLE public.scroll_breaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scroll_breaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scroll breaks"
ON public.scroll_breaks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scroll breaks"
ON public.scroll_breaks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_focus_sessions_user_id ON public.focus_sessions(user_id);
CREATE INDEX idx_focus_sessions_created_at ON public.focus_sessions(created_at);
CREATE INDEX idx_scroll_breaks_user_id ON public.scroll_breaks(user_id);
CREATE INDEX idx_scroll_breaks_timestamp ON public.scroll_breaks(timestamp);