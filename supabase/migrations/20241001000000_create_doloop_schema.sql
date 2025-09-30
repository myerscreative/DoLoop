-- Enable RLS (Row Level Security) on all tables
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Create custom types
CREATE TYPE public.loop_reset_rule AS ENUM ('daily', 'weekly', 'monthly', 'custom');
CREATE TYPE public.task_type AS ENUM ('recurring', 'one_time');
CREATE TYPE public.task_status AS ENUM ('pending', 'completed');
CREATE TYPE public.loop_member_role AS ENUM ('owner', 'editor', 'viewer');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create loops table
CREATE TABLE IF NOT EXISTS public.loops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#FFC107',
  reset_rule public.loop_reset_rule DEFAULT 'weekly',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loop_id UUID REFERENCES public.loops(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  type public.task_type DEFAULT 'recurring',
  assigned_user_id UUID REFERENCES public.profiles(id),
  status public.task_status DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create loop_members table for shared loops
CREATE TABLE IF NOT EXISTS public.loop_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loop_id UUID REFERENCES public.loops(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role public.loop_member_role DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(loop_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loop_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Loops policies
CREATE POLICY "Users can view loops they own or are members of" ON public.loops
  FOR SELECT USING (
    auth.uid() = owner OR 
    EXISTS (
      SELECT 1 FROM public.loop_members 
      WHERE loop_id = loops.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create loops" ON public.loops
  FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update loops they own" ON public.loops
  FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete loops they own" ON public.loops
  FOR DELETE USING (auth.uid() = owner);

-- Tasks policies
CREATE POLICY "Users can view tasks in loops they have access to" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND (
        owner = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.loop_members 
          WHERE loop_id = loops.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create tasks in loops they have access to" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND (
        owner = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.loop_members 
          WHERE loop_id = loops.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can update tasks in loops they have access to" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND (
        owner = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.loop_members 
          WHERE loop_id = loops.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "Users can delete tasks in loops they have access to" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND (
        owner = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.loop_members 
          WHERE loop_id = loops.id AND user_id = auth.uid() AND role IN ('owner', 'editor')
        )
      )
    )
  );

-- Loop members policies
CREATE POLICY "Users can view members of loops they have access to" ON public.loop_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND (
        owner = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.loop_members lm
          WHERE lm.loop_id = loops.id AND lm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Loop owners can manage members" ON public.loop_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.loops 
      WHERE id = loop_id AND owner = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loops_owner ON public.loops(owner);
CREATE INDEX IF NOT EXISTS idx_tasks_loop_id ON public.tasks(loop_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON public.tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_loop_members_loop_id ON public.loop_members(loop_id);
CREATE INDEX IF NOT EXISTS idx_loop_members_user_id ON public.loop_members(user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();