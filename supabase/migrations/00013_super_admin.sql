-- Add Super Admin capabilities to the database

-- 1. Add system_role to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS system_role TEXT DEFAULT 'user' 
CHECK (system_role IN ('user', 'super_admin'));

-- 2. Add global controls to messes
ALTER TABLE public.messes 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messes 
ADD COLUMN IF NOT EXISTS mail_service_enabled BOOLEAN DEFAULT TRUE;

-- 3. Create an RPC to easily fetch all messes for the super admin
CREATE OR REPLACE FUNCTION get_all_messes_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  owner_id UUID,
  owner_name TEXT,
  owner_email TEXT,
  created_at TIMESTAMPTZ,
  is_banned BOOLEAN,
  mail_service_enabled BOOLEAN,
  member_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if the calling user is a super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND system_role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.name,
    m.description,
    m.owner_id,
    u.name as owner_name,
    u.email as owner_email,
    m.created_at,
    m.is_banned,
    m.mail_service_enabled,
    (SELECT COUNT(*) FROM public.mess_members mm WHERE mm.mess_id = m.id AND mm.is_deleted = false) as member_count
  FROM public.messes m
  LEFT JOIN public.users u ON m.owner_id = u.id
  WHERE m.is_deleted = false
  ORDER BY m.created_at DESC;
END;
$$;

-- 4. Create an RPC to toggle mess status
CREATE OR REPLACE FUNCTION toggle_mess_status(
  p_mess_id UUID,
  p_field TEXT,
  p_value BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if the calling user is a super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND system_role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  IF p_field = 'is_banned' THEN
    UPDATE public.messes SET is_banned = p_value WHERE id = p_mess_id;
  ELSIF p_field = 'mail_service_enabled' THEN
    UPDATE public.messes SET mail_service_enabled = p_value WHERE id = p_mess_id;
  ELSE
    RAISE EXCEPTION 'Invalid field';
  END IF;
END;
$$;
