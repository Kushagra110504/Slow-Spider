-- ==============================================================================
-- ProjectVault / SlowSpider - Production Hardened PostgreSQL Schema (Supabase)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Profile Table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: Prevent Client-Side Privilege Escalation on User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Always default new user accounts to 'user' role
  IF NEW.role IS NULL OR NEW.role = 'admin' THEN
    -- Check if any admin exists in the database
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
      -- First user in the database becomes the initial administrator
      NEW.role := 'admin';
    ELSE
      NEW.role := 'user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sanitize_user_role ON public.users;
CREATE TRIGGER trigger_sanitize_user_role
BEFORE INSERT ON public.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'at_risk', 'overdue', 'completed', 'frozen', 'trashed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE NOT NULL,
  team_category TEXT NOT NULL DEFAULT 'Product team',
  tags TEXT[] DEFAULT '{}',
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trashed_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Project Members Table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('critical', 'warning', 'info', 'normal')),
  due_date DATE NOT NULL,
  estimate TEXT,
  assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Milestones Table
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('done', 'upcoming', 'overdue')),
  due_date DATE NOT NULL,
  trashed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Inbox Items (Floating Space)
CREATE TABLE IF NOT EXISTS public.inbox_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('TASK', 'PROJECT', 'IDEA', 'NOTE')),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'converted', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Attachments Table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'doc', 'sheet')),
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'critical', 'success')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Team Invitations Table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  inviter_name TEXT NOT NULL,
  inviter_avatar TEXT,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. User Connections Table (Mutual Network System)
CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);

-- Automatic Project Progress Calculation Trigger from Milestones
CREATE OR REPLACE FUNCTION update_project_milestone_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_count INT;
  done_count INT;
  calc_progress INT;
  target_project_id UUID;
BEGIN
  target_project_id := COALESCE(NEW.project_id, OLD.project_id);
  
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'done')
  INTO total_count, done_count
  FROM public.milestones
  WHERE project_id = target_project_id AND trashed_at IS NULL;

  IF total_count > 0 THEN
    calc_progress := ROUND((done_count::DECIMAL / total_count::DECIMAL) * 100);
    UPDATE public.projects 
    SET progress = calc_progress, updated_at = NOW() 
    WHERE id = target_project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_progress ON public.milestones;
CREATE TRIGGER trigger_update_project_progress
AFTER INSERT OR UPDATE OR DELETE ON public.milestones
FOR EACH ROW EXECUTE FUNCTION update_project_milestone_progress();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - STRICT TENANT ISOLATION POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Helper security function: Check project co-membership or ownership
CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.projects WHERE id = p_id AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Users Table RLS
CREATE POLICY "Authenticated users can view profile directory"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- 2. Projects Table RLS
CREATE POLICY "Projects accessible by owner or members"
  ON public.projects FOR SELECT
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners and admins can update project"
  ON public.projects FOR UPDATE
  USING (
    owner_id = auth.uid() OR
    id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

CREATE POLICY "Project owners can delete project"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- 3. Project Members Table RLS
CREATE POLICY "Members viewable by project co-members"
  ON public.project_members FOR SELECT
  USING (public.can_access_project(project_id));

CREATE POLICY "Project owners can manage members"
  ON public.project_members FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- 4. Tasks Table RLS
CREATE POLICY "Tasks viewable by project members"
  ON public.tasks FOR SELECT
  USING (public.can_access_project(project_id));

CREATE POLICY "Tasks manageable by project members"
  ON public.tasks FOR ALL
  USING (public.can_access_project(project_id));

-- 5. Milestones Table RLS
CREATE POLICY "Milestones viewable by project members"
  ON public.milestones FOR SELECT
  USING (public.can_access_project(project_id));

CREATE POLICY "Milestones manageable by project members"
  ON public.milestones FOR ALL
  USING (public.can_access_project(project_id));

-- 6. Inbox Items Table RLS (Strict User Isolation)
CREATE POLICY "Inbox items strictly scoped to owner"
  ON public.inbox_items FOR ALL
  USING (auth.uid() = user_id);

-- 7. Attachments Table RLS
CREATE POLICY "Attachments accessible by project members"
  ON public.attachments FOR ALL
  USING (public.can_access_project(project_id));

-- 8. Notifications Table RLS (Strict User Isolation)
CREATE POLICY "Notifications strictly scoped to recipient"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- 9. Activity Logs Table RLS
CREATE POLICY "Activity logs viewable by project members"
  ON public.activity_logs FOR SELECT
  USING (public.can_access_project(project_id));

CREATE POLICY "Authenticated users can record activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.can_access_project(project_id));

-- 10. Team Invitations Table RLS
CREATE POLICY "Team invitations viewable by invitee or project owner"
  ON public.team_invitations FOR SELECT
  USING (
    invitee_email = (SELECT email FROM public.users WHERE id = auth.uid()) OR
    inviter_id = auth.uid() OR
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

CREATE POLICY "Project owners can issue invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- 11. User Connections Table RLS (Mutual Network Isolation)
CREATE POLICY "Connections accessible by participants"
  ON public.user_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests"
  ON public.user_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Participants can update connection status"
  ON public.user_connections FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Participants can delete connections"
  ON public.user_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
