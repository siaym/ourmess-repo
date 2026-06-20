-- Create Mess RPC
CREATE OR REPLACE FUNCTION public.create_mess(p_name TEXT, p_description TEXT)
RETURNS UUID AS $$
DECLARE
  v_mess_id UUID;
  v_invite_code TEXT;
BEGIN
  -- Generate a random 6-character uppercase invite code
  v_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  
  -- Ensure it's unique (basic while loop)
  WHILE EXISTS (SELECT 1 FROM public.messes WHERE invite_code = v_invite_code) LOOP
    v_invite_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  END LOOP;

  -- 1. Insert the new mess
  INSERT INTO public.messes (name, description, owner_id, invite_code)
  VALUES (p_name, p_description, auth.uid(), v_invite_code)
  RETURNING id INTO v_mess_id;

  -- 2. Insert the owner into mess_members
  INSERT INTO public.mess_members (mess_id, user_id, role)
  VALUES (v_mess_id, auth.uid(), 'owner');

  RETURN v_mess_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Join Mess RPC
CREATE OR REPLACE FUNCTION public.join_mess(p_invite_code TEXT)
RETURNS UUID AS $$
DECLARE
  v_mess_id UUID;
BEGIN
  -- 1. Find the mess by invite code
  SELECT id INTO v_mess_id
  FROM public.messes
  WHERE invite_code = UPPER(p_invite_code) AND is_deleted = false;

  IF v_mess_id IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code or mess does not exist.';
  END IF;

  -- 2. Check if user is already a member
  IF EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_deleted = false) THEN
    RAISE EXCEPTION 'You are already a member of this mess.';
  END IF;

  -- 3. Insert the user into mess_members as a member
  INSERT INTO public.mess_members (mess_id, user_id, role)
  VALUES (v_mess_id, auth.uid(), 'member');

  RETURN v_mess_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
