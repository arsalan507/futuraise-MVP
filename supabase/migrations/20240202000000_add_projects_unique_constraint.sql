-- Add unique constraint on projects.student_id
-- Each student can only have one active project in the MVP

ALTER TABLE projects
ADD CONSTRAINT projects_student_id_unique UNIQUE (student_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_student_id ON projects(student_id);
