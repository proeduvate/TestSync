-- Add ai_summary column to tasks table
ALTER TABLE public.tasks
ADD COLUMN ai_summary TEXT;
