-- Drop the strict foreign key constraint that requires public.users to exist in auth.users
-- This allows us to create "Offline" members who do not have login credentials.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Create an RPC to safely add an offline member
CREATE OR REPLACE FUNCTION add_offline_member(p_mess_id UUID, p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_new_user_id UUID;
  v_dummy_email TEXT;
BEGIN
  -- Check if caller is owner or manager
  SELECT role INTO v_role FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND is_deleted = false;
  IF v_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Only owners and managers can add offline members';
  END IF;

  v_new_user_id := gen_random_uuid();
  v_dummy_email := 'offline_' || v_new_user_id || '@offline.local';

  -- Create dummy user profile
  INSERT INTO public.users (id, name, email) VALUES (v_new_user_id, p_name, v_dummy_email);

  -- Add to mess as a regular member
  INSERT INTO public.mess_members (mess_id, user_id, role) VALUES (p_mess_id, v_new_user_id, 'member');

  RETURN v_new_user_id;
END;
$$;
