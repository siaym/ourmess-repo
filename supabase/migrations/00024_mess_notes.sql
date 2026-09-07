-- Create mess_notes table
CREATE TABLE public.mess_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  author_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'yellow',
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mess_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view notes in their mess"
ON public.mess_notes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mess_members 
    WHERE mess_id = mess_notes.mess_id 
    AND user_id = auth.uid() 
    AND is_deleted = FALSE
  )
);

CREATE POLICY "Users can create notes in their mess"
ON public.mess_notes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mess_members 
    WHERE mess_id = mess_notes.mess_id 
    AND user_id = auth.uid() 
    AND is_deleted = FALSE
  )
  AND author_id = auth.uid()
);

CREATE POLICY "Users can edit their own notes"
ON public.mess_notes FOR UPDATE
USING (
  author_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.mess_members 
    WHERE mess_id = mess_notes.mess_id 
    AND user_id = auth.uid() 
    AND is_deleted = FALSE
  )
);

CREATE POLICY "Users can delete notes"
ON public.mess_notes FOR DELETE
USING (
  author_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.mess_members 
    WHERE mess_id = mess_notes.mess_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'manager') 
    AND is_deleted = FALSE
  )
);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE mess_notes;
