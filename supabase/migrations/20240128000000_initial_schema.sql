-- FuturAIse MVP Database Schema
-- Claude-Powered AI Problem Solver Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & PROFILES
-- =====================================================

-- Parents table (extends auth.users)
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table (extends auth.users)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade INTEGER CHECK (grade BETWEEN 6 AND 12),
  parent_id UUID REFERENCES parents(id),
  current_checkpoint TEXT DEFAULT 'welcome',
  target_person TEXT,
  problem_statement TEXT,
  problem_description TEXT,
  solution_type TEXT,
  primary_tool TEXT,
  tools_used TEXT[],
  build_progress TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cohorts (groups of students starting together)
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONVERSATION & AI INTERACTION
-- =====================================================

-- AI Conversations (Chat history with Claude)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  checkpoint TEXT NOT NULL, -- Which stage of journey
  messages JSONB NOT NULL DEFAULT '[]', -- Array of {role, content, timestamp}
  context JSONB DEFAULT '{}', -- Current context (problem, solution type, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_conversations_student ON conversations(student_id);
CREATE INDEX idx_conversations_checkpoint ON conversations(checkpoint);

-- =====================================================
-- PROGRESS TRACKING
-- =====================================================

-- Checkpoints (Journey milestones)
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL, -- e.g., 'problem_identified', 'solution_built'
  week INTEGER NOT NULL CHECK (week BETWEEN 1 AND 3),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  data JSONB DEFAULT '{}', -- Checkpoint-specific data
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, checkpoint_name)
);

CREATE INDEX idx_checkpoints_student ON checkpoints(student_id);
CREATE INDEX idx_checkpoints_status ON checkpoints(status);

-- =====================================================
-- PROJECTS (Student Solutions)
-- =====================================================

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,

  -- Problem Definition
  title TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  target_person TEXT NOT NULL, -- parent, friend, sibling, self, teacher
  problem_description TEXT,
  problem_frequency TEXT, -- daily, weekly, etc.
  frustration_level INTEGER CHECK (frustration_level BETWEEN 1 AND 5),

  -- Solution Design
  solution_type TEXT, -- chatbot, automation, generator, analyzer, assistant
  tools_used TEXT[], -- Array of tools: ['ChatGPT', 'Zapier']
  build_plan TEXT,

  -- Build Status
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'building', 'testing', 'deployed', 'completed')),
  deployed_url TEXT,
  demo_video_url TEXT,

  -- Impact Tracking
  usage_count INTEGER DEFAULT 0,
  impact_story TEXT,
  user_testimonial TEXT,

  -- Portfolio
  portfolio_published BOOLEAN DEFAULT FALSE,
  portfolio_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_student ON projects(student_id);
CREATE INDEX idx_projects_status ON projects(status);

-- =====================================================
-- BEHAVIORAL TRACKING
-- =====================================================

-- Events (Student actions)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- login, chat_message, checkpoint_completed, etc.
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_student ON events(student_id);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_created ON events(created_at);

-- Sessions (Login sessions for activity tracking)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0
);

CREATE INDEX idx_sessions_student ON sessions(student_id);

-- =====================================================
-- INTERVENTIONS (Human Help)
-- =====================================================

-- Interventions (When student needs help)
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- stuck, frustrated, confused, etc.
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  notes TEXT,
  assigned_to UUID REFERENCES auth.users(id), -- Teacher/admin who will help
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interventions_student ON interventions(student_id);
CREATE INDEX idx_interventions_status ON interventions(status);
CREATE INDEX idx_interventions_severity ON interventions(severity);

-- =====================================================
-- PAYMENTS & ENROLLMENT
-- =====================================================

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id),
  product_type TEXT DEFAULT 'low_ticket' CHECK (product_type IN ('low_ticket', 'high_ticket')),
  amount INTEGER NOT NULL, -- in paise (₹499 = 49900)
  currency TEXT DEFAULT 'INR',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider TEXT DEFAULT 'razorpay',
  payment_id TEXT, -- Razorpay payment ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);

-- =====================================================
-- COMMUNICATIONS
-- =====================================================

-- Messages Sent (Email, WhatsApp tracking)
CREATE TABLE messages_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('student', 'parent')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'in_app')),
  message_type TEXT NOT NULL, -- welcome, nudge, celebration, report, etc.
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_recipient ON messages_sent(recipient_id);
CREATE INDEX idx_messages_type ON messages_sent(message_type);
CREATE INDEX idx_messages_channel ON messages_sent(channel);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_sent ENABLE ROW LEVEL SECURITY;

-- Students can read their own data
CREATE POLICY "Students can view own data" ON students
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can update own data" ON students
  FOR UPDATE USING (auth.uid() = user_id);

-- Parents can view their children's data
CREATE POLICY "Parents can view their children" ON students
  FOR SELECT USING (
    auth.uid() IN (SELECT parent_id FROM students WHERE id = students.id)
  );

-- Students can manage their conversations
CREATE POLICY "Students can manage own conversations" ON conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = conversations.student_id AND students.user_id = auth.uid())
  );

-- Students can manage their checkpoints
CREATE POLICY "Students can view own checkpoints" ON checkpoints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoints.student_id AND students.user_id = auth.uid())
  );

CREATE POLICY "Students can insert own checkpoints" ON checkpoints
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoints.student_id AND students.user_id = auth.uid())
  );

CREATE POLICY "Students can update own checkpoints" ON checkpoints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoints.student_id AND students.user_id = auth.uid())
  );

-- Students can manage their projects
CREATE POLICY "Students can manage own projects" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = projects.student_id AND students.user_id = auth.uid())
  );

-- Students can create events
CREATE POLICY "Students can create own events" ON events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = events.student_id AND students.user_id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checkpoints_updated_at BEFORE UPDATE ON checkpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to track session end and calculate duration
CREATE OR REPLACE FUNCTION end_session(session_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE sessions
  SET ended_at = NOW(),
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
  WHERE id = session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA (Checkpoint definitions)
-- =====================================================

-- Create a table for checkpoint definitions
CREATE TABLE checkpoint_definitions (
  checkpoint_name TEXT PRIMARY KEY,
  week INTEGER NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  validation_criteria JSONB DEFAULT '{}',
  claude_prompt_key TEXT NOT NULL -- Reference to prompt template
);

-- Insert checkpoint definitions
INSERT INTO checkpoint_definitions (checkpoint_name, week, order_index, title, description, claude_prompt_key) VALUES
  ('welcome', 1, 1, 'Welcome!', 'Introduction and onboarding', 'welcome'),
  ('target_identified', 1, 2, 'Target Person Identified', 'Student chooses who to help', 'target_selection'),
  ('problem_discovered', 1, 3, 'Problem Discovered', 'Student identifies the real problem', 'problem_discovery'),
  ('problem_validated', 1, 4, 'Problem Validated', 'Problem is confirmed as AI-solvable', 'problem_validation'),
  ('solution_designed', 2, 5, 'Solution Designed', 'Solution type and tools chosen', 'solution_design'),
  ('building_started', 2, 6, 'Building Started', 'Student begins building', 'build_guidance'),
  ('prototype_working', 2, 7, 'Working Prototype', 'Solution is functional', 'build_testing'),
  ('deployed', 3, 8, 'Deployed to User', 'Solution given to target person', 'deployment'),
  ('feedback_collected', 3, 9, 'Feedback Collected', 'User has tested and provided feedback', 'feedback_collection'),
  ('portfolio_created', 3, 10, 'Portfolio Created', 'Project documented and showcased', 'portfolio_creation'),
  ('completed', 3, 11, 'Journey Completed!', 'All checkpoints done', 'completion');

-- =====================================================
-- VIEWS (For easier querying)
-- =====================================================

-- View: Student Progress Summary
CREATE VIEW student_progress_summary AS
SELECT
  s.id,
  s.name,
  s.current_checkpoint,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed') as completed_checkpoints,
  COUNT(DISTINCT c.id) as total_checkpoints,
  ROUND(
    (COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'completed')::NUMERIC /
     NULLIF(COUNT(DISTINCT c.id), 0)) * 100,
    2
  ) as percent_complete,
  p.status as project_status,
  p.title as project_title,
  MAX(e.created_at) as last_active
FROM students s
LEFT JOIN checkpoints c ON s.id = c.student_id
LEFT JOIN projects p ON s.id = p.student_id
LEFT JOIN events e ON s.id = e.student_id
GROUP BY s.id, s.name, s.current_checkpoint, p.status, p.title;

-- View: Daily Active Users
CREATE VIEW daily_active_users AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT student_id) as active_students
FROM events
WHERE event_type IN ('login', 'chat_message', 'checkpoint_completed')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE students IS 'Students enrolled in FuturAIse';
COMMENT ON TABLE projects IS 'AI solutions built by students';
COMMENT ON TABLE conversations IS 'Chat history between students and Claude';
COMMENT ON TABLE checkpoints IS 'Student progress through the journey';
COMMENT ON TABLE interventions IS 'Students who need human help';
COMMENT ON COLUMN projects.solution_type IS 'Type: chatbot, automation, generator, analyzer, assistant';
COMMENT ON COLUMN checkpoints.checkpoint_name IS 'Corresponds to checkpoint_definitions';
