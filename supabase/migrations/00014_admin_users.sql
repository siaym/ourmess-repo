-- Create RPC to fetch detailed user info for a specific mess (Super Admin Only)

CREATE OR REPLACE FUNCTION get_mess_members_admin(p_mess_id UUID)
RETURNS TABLE (
  member_id UUID,
  user_name TEXT,
  user_email TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ,
  is_deleted BOOLEAN
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
    mm.user_id as member_id,
    u.name as user_name,
    u.email as user_email,
    mm.role,
    mm.joined_at,
    mm.is_deleted
  FROM public.mess_members mm
  LEFT JOIN public.users u ON mm.user_id = u.id
  WHERE mm.mess_id = p_mess_id;
END;
$$;
