-- Analytics events table for tracking user visits and game sessions
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  event_type text NOT NULL,  -- 'page_visit', 'game_start', 'game_over'
  event_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for efficient dashboard queries
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts" ON analytics_events
  FOR INSERT TO anon WITH CHECK (true);

-- Allow anonymous reads (for dashboard)
CREATE POLICY "Allow anonymous reads" ON analytics_events
  FOR SELECT TO anon USING (true);
