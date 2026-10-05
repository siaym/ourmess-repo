-- RPC to fetch all users for Super Admin email sending
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  is_manager BOOLEAN
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
    u.id, 
    u.name, 
    u.email,
    EXISTS (
      SELECT 1 FROM public.messes m WHERE m.owner_id = u.id
      UNION
      SELECT 1 FROM public.mess_members mm WHERE mm.user_id = u.id AND (mm.role = 'manager' OR mm.role = 'admin')
    ) as is_manager
  FROM public.users u
  WHERE u.email IS NOT NULL AND u.email != ''
  ORDER BY u.name ASC;
END;
$$;
