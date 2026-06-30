-- Create Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('system', 'alert', 'announcement')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()
);

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- Owners and managers can insert notifications for their mess
CREATE POLICY "Owners and managers can insert notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.mess_members mm 
    WHERE mm.mess_id = notifications.mess_id 
    AND mm.user_id = auth.uid() 
    AND mm.role IN ('owner', 'manager') 
    AND mm.is_deleted = false
  )
);

-- RPC to insert notification for everyone in a mess
CREATE OR REPLACE FUNCTION broadcast_notification(p_mess_id UUID, p_title TEXT, p_message TEXT, p_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check permission (owner/manager)
  SELECT role INTO v_role FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND is_deleted = false;
  IF v_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Only owners and managers can broadcast notifications';
  END IF;

  -- Insert notification for all active members in the mess
  INSERT INTO public.notifications (mess_id, user_id, title, message, type)
  SELECT p_mess_id, user_id, p_title, p_message, p_type
  FROM public.mess_members
  WHERE mess_id = p_mess_id AND is_deleted = false;
END;
$$;
