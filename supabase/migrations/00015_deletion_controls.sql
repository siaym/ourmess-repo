-- 1. Super Admin: Delete Mess Entirely
CREATE OR REPLACE FUNCTION delete_mess_admin(p_mess_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  DELETE FROM public.deposits WHERE mess_id = p_mess_id;
  DELETE FROM public.expenses WHERE mess_id = p_mess_id;
  DELETE FROM public.meals WHERE mess_id = p_mess_id;
  DELETE FROM public.monthly_reports WHERE mess_id = p_mess_id;
  DELETE FROM public.notifications WHERE mess_id = p_mess_id;
  DELETE FROM public.mess_members WHERE mess_id = p_mess_id;
  DELETE FROM public.messes WHERE id = p_mess_id;
END;
$$;

-- 2. Super Admin: Remove User From Mess (Soft Delete)
CREATE OR REPLACE FUNCTION remove_user_from_mess_admin(p_mess_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  UPDATE public.mess_members 
  SET is_deleted = true, deleted_at = now() 
  WHERE mess_id = p_mess_id AND user_id = p_user_id;
END;
$$;

-- 3. Super Admin: Completely Delete User Account
CREATE OR REPLACE FUNCTION delete_user_admin(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  -- Delete from member_bills (new feature)
  DELETE FROM public.member_bills WHERE member_id = p_user_id;
  
  -- Delete all their financial history so it doesn't violate foreign keys
  DELETE FROM public.meals WHERE member_id = p_user_id;
  DELETE FROM public.deposits WHERE member_id = p_user_id;
  
  -- If they created any expenses or reports, we can't easily delete those without removing the mess expense.
  -- But usually we just delete the user if they are a mistake.
  -- Let's remove them from messes
  DELETE FROM public.mess_members WHERE user_id = p_user_id;
  
  -- Finally, wipe their public profile
  DELETE FROM public.users WHERE id = p_user_id;
END;
$$;

-- 4. Super Admin: Transfer Mess Ownership
CREATE OR REPLACE FUNCTION transfer_mess_ownership(p_mess_id UUID, p_new_owner_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  UPDATE public.messes SET owner_id = p_new_owner_id WHERE id = p_mess_id;
  -- Make sure they are a manager in mess_members
  UPDATE public.mess_members SET role = 'manager' WHERE mess_id = p_mess_id AND user_id = p_new_owner_id;
END;
$$;

-- 5. Mess Owner: Reset Mess Data (Keep Members & Mess, wipe financials)
CREATE OR REPLACE FUNCTION reset_mess_data(p_mess_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller is the owner of the mess
  IF NOT EXISTS (SELECT 1 FROM public.messes WHERE id = p_mess_id AND owner_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only the Mess Owner can reset data';
  END IF;

  DELETE FROM public.deposits WHERE mess_id = p_mess_id;
  DELETE FROM public.expenses WHERE mess_id = p_mess_id;
  DELETE FROM public.meals WHERE mess_id = p_mess_id;
  DELETE FROM public.monthly_reports WHERE mess_id = p_mess_id;
END;
$$;

-- 6. Super Admin: Global Statistics
CREATE OR REPLACE FUNCTION get_global_statistics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_messes INT;
  v_total_users INT;
  v_total_meals DECIMAL;
  v_total_expenses DECIMAL;
  v_month_messes INT;
  v_month_users INT;
  v_month_meals DECIMAL;
  v_month_expenses DECIMAL;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin Only';
  END IF;

  -- All time stats
  SELECT count(*) INTO v_total_messes FROM public.messes;
  SELECT count(*) INTO v_total_users FROM public.users;
  SELECT sum(total_meal) INTO v_total_meals FROM public.meals;
  SELECT sum(amount) INTO v_total_expenses FROM public.expenses;

  -- This month stats
  SELECT count(*) INTO v_month_messes FROM public.messes WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);
  SELECT count(*) INTO v_month_users FROM public.users WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);
  SELECT sum(total_meal) INTO v_month_meals FROM public.meals WHERE date_trunc('month', date) = date_trunc('month', CURRENT_DATE);
  SELECT sum(amount) INTO v_month_expenses FROM public.expenses WHERE date_trunc('month', expense_date) = date_trunc('month', CURRENT_DATE);

  RETURN json_build_object(
    'total_messes', v_total_messes,
    'total_users', v_total_users,
    'total_meals', COALESCE(v_total_meals, 0),
    'total_expenses', COALESCE(v_total_expenses, 0),
    'month_messes', v_month_messes,
    'month_users', v_month_users,
    'month_meals', COALESCE(v_month_meals, 0),
    'month_expenses', COALESCE(v_month_expenses, 0)
  );
END;
$$;
