-- DoLoop Database Schema
-- This file contains the complete database schema for DoLoop application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loops table (main container for recurring task cycles)
CREATE TABLE loops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  color VARCHAR DEFAULT 'bee-yellow',
  reset_schedule VARCHAR DEFAULT 'daily' CHECK (reset_schedule IN ('daily', 'weekly', 'monthly', 'custom')),
  reset_day INTEGER, -- Day of week (1-7) for weekly, day of month (1-31) for monthly
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (individual tasks within loops)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loop members table (for sharing loops - future feature)
CREATE TABLE loop_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(loop_id, user_id)
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Loops policies
CREATE POLICY "Users can view own loops" ON loops
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM loop_members 
      WHERE loop_id = loops.id AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can create own loops" ON loops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loops" ON loops
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT user_id FROM loop_members 
      WHERE loop_id = loops.id AND role IN ('owner', 'admin') AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Users can delete own loops" ON loops
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view tasks in accessible loops" ON tasks
  FOR SELECT USING (
    loop_id IN (
      SELECT id FROM loops WHERE 
        user_id = auth.uid() OR 
        id IN (
          SELECT loop_id FROM loop_members 
          WHERE user_id = auth.uid() AND joined_at IS NOT NULL
        )
    )
  );

CREATE POLICY "Users can create tasks in accessible loops" ON tasks
  FOR INSERT WITH CHECK (
    loop_id IN (
      SELECT id FROM loops WHERE 
        user_id = auth.uid() OR 
        id IN (
          SELECT loop_id FROM loop_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND joined_at IS NOT NULL
        )
    )
  );

CREATE POLICY "Users can update tasks in accessible loops" ON tasks
  FOR UPDATE USING (
    loop_id IN (
      SELECT id FROM loops WHERE 
        user_id = auth.uid() OR 
        id IN (
          SELECT loop_id FROM loop_members 
          WHERE user_id = auth.uid() AND joined_at IS NOT NULL
        )
    )
  );

CREATE POLICY "Users can delete tasks in accessible loops" ON tasks
  FOR DELETE USING (
    loop_id IN (
      SELECT id FROM loops WHERE 
        user_id = auth.uid() OR 
        id IN (
          SELECT loop_id FROM loop_members 
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND joined_at IS NOT NULL
        )
    )
  );

-- Loop members policies
CREATE POLICY "Users can view loop members for accessible loops" ON loop_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    loop_id IN (
      SELECT id FROM loops WHERE user_id = auth.uid()
    ) OR
    loop_id IN (
      SELECT loop_id FROM loop_members 
      WHERE user_id = auth.uid() AND joined_at IS NOT NULL
    )
  );

CREATE POLICY "Loop owners can manage members" ON loop_members
  FOR ALL USING (
    loop_id IN (
      SELECT id FROM loops WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX loops_user_id_idx ON loops(user_id);
CREATE INDEX loops_is_active_idx ON loops(is_active);
CREATE INDEX tasks_loop_id_idx ON tasks(loop_id);
CREATE INDEX tasks_is_completed_idx ON tasks(is_completed);
CREATE INDEX loop_members_loop_id_idx ON loop_members(loop_id);
CREATE INDEX loop_members_user_id_idx ON loop_members(user_id);

-- Updated at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loops_updated_at 
  BEFORE UPDATE ON loops 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for development/testing
INSERT INTO profiles (id, email, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'demo@doloop.app', 'Demo User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO loops (id, user_id, name, description, color, reset_schedule) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Morning Routine',
    'Start each day with intention and energy',
    'bee-yellow',
    'daily'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'Weekly Planning',
    'Plan and review progress every week',
    'morning-blue',
    'weekly'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO tasks (loop_id, name, description, is_recurring, order_index) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Drink water', 'Start with a large glass of water', true, 0),
  ('11111111-1111-1111-1111-111111111111', 'Meditation', '10 minutes of mindfulness', true, 1),
  ('11111111-1111-1111-1111-111111111111', 'Exercise', '20 minutes of movement', true, 2),
  ('22222222-2222-2222-2222-222222222222', 'Review last week', 'Check completed goals and tasks', true, 0),
  ('22222222-2222-2222-2222-222222222222', 'Plan next week', 'Set priorities and schedule', true, 1)
ON CONFLICT (id) DO NOTHING;