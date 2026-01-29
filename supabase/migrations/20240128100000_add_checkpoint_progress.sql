-- Add checkpoint_progress table (separate from checkpoints for better tracking)

CREATE TABLE IF NOT EXISTS checkpoint_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  checkpoint_name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, checkpoint_name)
);

CREATE INDEX idx_checkpoint_progress_student ON checkpoint_progress(student_id);
CREATE INDEX idx_checkpoint_progress_status ON checkpoint_progress(status);

ALTER TABLE checkpoint_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own checkpoint progress" ON checkpoint_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoint_progress.student_id AND students.user_id = auth.uid())
  );

CREATE POLICY "Students can insert own checkpoint progress" ON checkpoint_progress
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoint_progress.student_id AND students.user_id = auth.uid())
  );

CREATE POLICY "Students can update own checkpoint progress" ON checkpoint_progress
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM students WHERE students.id = checkpoint_progress.student_id AND students.user_id = auth.uid())
  );
