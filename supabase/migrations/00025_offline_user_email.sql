-- 1. Add pending_email column to public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pending_email TEXT;

-- 2. Update add_offline_member to accept an optional email
CREATE OR REPLACE FUNCTION add_offline_member(p_mess_id UUID, p_name TEXT, p_email TEXT DEFAULT NULL)
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
  -- If p_email is provided, we store it in pending_email so the handle_new_user trigger can find it later
  INSERT INTO public.users (id, name, email, pending_email) 
  VALUES (v_new_user_id, p_name, v_dummy_email, p_email);

  -- Add to mess as a regular member
  INSERT INTO public.mess_members (mess_id, user_id, role) VALUES (p_mess_id, v_new_user_id, 'member');

  RETURN v_new_user_id;
END;
$$;

-- 3. Update handle_new_user trigger to merge offline profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_offline_user_id UUID;
BEGIN
  -- Look for an existing offline user that was pre-registered with this email
  SELECT id INTO v_offline_user_id
  FROM public.users
  WHERE pending_email = new.email
  LIMIT 1;

  IF v_offline_user_id IS NOT NULL THEN
    -- Insert the new user
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Merge data: Update all related records to point to the new user ID
    UPDATE public.mess_members SET user_id = new.id WHERE user_id = v_offline_user_id;
    UPDATE public.meals SET member_id = new.id WHERE member_id = v_offline_user_id;
    UPDATE public.meals SET created_by = new.id WHERE created_by = v_offline_user_id;
    UPDATE public.meals SET deleted_by = new.id WHERE deleted_by = v_offline_user_id;
    
    UPDATE public.deposits SET member_id = new.id WHERE member_id = v_offline_user_id;
    UPDATE public.deposits SET created_by = new.id WHERE created_by = v_offline_user_id;
    UPDATE public.deposits SET deleted_by = new.id WHERE deleted_by = v_offline_user_id;
    
    UPDATE public.expenses SET created_by = new.id WHERE created_by = v_offline_user_id;
    UPDATE public.expenses SET deleted_by = new.id WHERE deleted_by = v_offline_user_id;

    UPDATE public.activity_logs SET user_id = new.id WHERE user_id = v_offline_user_id;
    UPDATE public.notifications SET user_id = new.id WHERE user_id = v_offline_user_id;
    
    UPDATE public.messes SET owner_id = new.id WHERE owner_id = v_offline_user_id;
    UPDATE public.messes SET deleted_by = new.id WHERE deleted_by = v_offline_user_id;
    
    UPDATE public.member_bills SET member_id = new.id WHERE member_id = v_offline_user_id;

    -- Now that all child dependencies are moved, delete the dummy offline user
    DELETE FROM public.users WHERE id = v_offline_user_id;

  ELSE
    -- Normal sign up
    INSERT INTO public.users (id, email, name, avatar_url)
    VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
      new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
