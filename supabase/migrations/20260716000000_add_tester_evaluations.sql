-- Add rating columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN average_rating NUMERIC(3, 2) DEFAULT 0,
ADD COLUMN total_evaluations INTEGER DEFAULT 0;

-- Create tester_evaluations table
CREATE TABLE IF NOT EXISTS public.tester_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL, -- Assuming there is a tasks table somewhere
    ai_rating INTEGER NOT NULL CHECK (ai_rating >= 1 AND ai_rating <= 5),
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS for tester_evaluations
ALTER TABLE public.tester_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Testers can view their own evaluations"
    ON public.tester_evaluations FOR SELECT
    USING (auth.uid() = tester_id);

CREATE POLICY "Developers and Admins can view all evaluations"
    ON public.tester_evaluations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('developer', 'admin')
        )
    );

-- We don't typically allow inserts/updates from frontend for this table,
-- but the Edge function will use a service role key which bypasses RLS.
