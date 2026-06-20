-- Create Monthly Reports tables
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES public.messes(id) ON DELETE CASCADE,
  month_name TEXT NOT NULL,
  total_expenses NUMERIC(10,2) NOT NULL,
  total_meals NUMERIC(10,2) NOT NULL,
  meal_rate NUMERIC(10,2) NOT NULL,
  closed_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.monthly_report_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.monthly_reports(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.users(id),
  total_deposits NUMERIC(10,2) NOT NULL,
  total_meals NUMERIC(10,2) NOT NULL,
  balance NUMERIC(10,2) NOT NULL
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_report_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view monthly reports" ON public.monthly_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = monthly_reports.mess_id AND user_id = auth.uid() AND is_deleted = false)
);

CREATE POLICY "Members can view report members" ON public.monthly_report_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.monthly_reports mr JOIN public.mess_members mm ON mr.mess_id = mm.mess_id WHERE mr.id = monthly_report_members.report_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);

-- Add is_archived to existing tables
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.deposits ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Allow negative deposits for Due carryover
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_amount_check;

-- Update Views to exclude archived data
CREATE OR REPLACE VIEW public.member_balances WITH (security_invoker = true) AS
SELECT 
  mm.mess_id,
  mm.user_id as member_id,
  u.name,
  u.email,
  mm.role,
  COALESCE(SUM(d.amount), 0) as total_deposits,
  COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = mm.mess_id AND member_id = mm.user_id AND is_deleted = FALSE AND is_archived = FALSE), 0) as total_meals,
  COALESCE(
    (SELECT 
      CASE 
        WHEN COALESCE(SUM(total_meal), 0) > 0 
        THEN (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE mess_id = mm.mess_id AND is_deleted = FALSE AND is_archived = FALSE) / SUM(total_meal)
        ELSE 0 
      END
     FROM public.meals WHERE mess_id = mm.mess_id AND is_deleted = FALSE AND is_archived = FALSE), 0
  ) as current_meal_rate,
  COALESCE(SUM(d.amount), 0) - (
    COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = mm.mess_id AND member_id = mm.user_id AND is_deleted = FALSE AND is_archived = FALSE), 0) * 
    COALESCE(
      (SELECT 
        CASE 
          WHEN COALESCE(SUM(total_meal), 0) > 0 
          THEN (SELECT COALESCE(SUM(amount), 0) FROM public.expenses WHERE mess_id = mm.mess_id AND is_deleted = FALSE AND is_archived = FALSE) / SUM(total_meal)
          ELSE 0 
        END
       FROM public.meals WHERE mess_id = mm.mess_id AND is_deleted = FALSE AND is_archived = FALSE), 0
    )
  ) as balance
FROM public.mess_members mm
JOIN public.users u ON u.id = mm.user_id
LEFT JOIN public.deposits d ON d.mess_id = mm.mess_id AND d.member_id = mm.user_id AND d.is_deleted = FALSE AND d.is_archived = FALSE
WHERE mm.is_deleted = FALSE
GROUP BY mm.mess_id, mm.user_id, u.name, u.email, mm.role;

CREATE OR REPLACE VIEW public.dashboard_stats WITH (security_invoker = true) AS
SELECT 
  m.id as mess_id,
  (SELECT COUNT(*) FROM public.mess_members WHERE mess_id = m.id AND is_deleted = FALSE) as total_members,
  COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE AND is_archived = FALSE), 0) as total_meals,
  COALESCE((SELECT SUM(amount) FROM public.expenses WHERE mess_id = m.id AND is_deleted = FALSE AND is_archived = FALSE), 0) as total_expenses,
  CASE 
    WHEN COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE AND is_archived = FALSE), 0) > 0 
    THEN COALESCE((SELECT SUM(amount) FROM public.expenses WHERE mess_id = m.id AND is_deleted = FALSE AND is_archived = FALSE), 0) / COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE AND is_archived = FALSE), 0)
    ELSE 0 
  END as current_meal_rate
FROM public.messes m;

CREATE OR REPLACE VIEW public.meal_details WITH (security_invoker = true) AS
SELECT 
  m.id,
  m.mess_id,
  m.member_id,
  u.name as member_name,
  m.date,
  m.breakfast,
  m.lunch,
  m.dinner,
  m.total_meal,
  m.created_by,
  m.created_at,
  m.is_deleted
FROM public.meals m
JOIN public.users u ON u.id = m.member_id
WHERE m.is_archived = FALSE;

CREATE OR REPLACE VIEW public.expense_details WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.mess_id,
  e.title,
  e.category,
  e.amount,
  e.expense_date,
  e.created_by,
  u.name as spender_name,
  e.created_at,
  e.is_deleted
FROM public.expenses e
JOIN public.users u ON u.id = e.created_by
WHERE e.is_archived = FALSE;

CREATE OR REPLACE VIEW public.deposit_details WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.mess_id,
  d.member_id,
  u.name as depositor_name,
  d.amount,
  d.payment_method,
  d.deposit_date,
  d.created_by,
  d.created_at,
  d.is_deleted
FROM public.deposits d
JOIN public.users u ON u.id = d.member_id
WHERE d.is_archived = FALSE;


-- RPC to close month
CREATE OR REPLACE FUNCTION close_month(p_mess_id UUID, p_month_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_report_id UUID;
  v_total_expenses NUMERIC;
  v_total_meals NUMERIC;
  v_meal_rate NUMERIC;
  v_member RECORD;
BEGIN
  -- Check permission
  SELECT role INTO v_role FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND is_deleted = false;
  IF v_role NOT IN ('owner', 'manager') THEN
    RAISE EXCEPTION 'Only owners and managers can close a month';
  END IF;

  -- Get stats from dashboard_stats
  SELECT total_expenses, total_meals, current_meal_rate 
  INTO v_total_expenses, v_total_meals, v_meal_rate
  FROM public.dashboard_stats WHERE mess_id = p_mess_id;

  -- Insert report
  INSERT INTO public.monthly_reports (mess_id, month_name, total_expenses, total_meals, meal_rate, closed_by)
  VALUES (p_mess_id, p_month_name, v_total_expenses, v_total_meals, v_meal_rate, auth.uid())
  RETURNING id INTO v_report_id;

  -- 1. Save all member balances to the report members table
  FOR v_member IN SELECT * FROM public.member_balances WHERE mess_id = p_mess_id LOOP
    INSERT INTO public.monthly_report_members (report_id, member_id, total_deposits, total_meals, balance)
    VALUES (v_report_id, v_member.member_id, v_member.total_deposits, v_member.total_meals, v_member.balance);
  END LOOP;

  -- 2. Archive old records
  UPDATE public.meals SET is_archived = true WHERE mess_id = p_mess_id AND is_archived = false;
  UPDATE public.expenses SET is_archived = true WHERE mess_id = p_mess_id AND is_archived = false;
  UPDATE public.deposits SET is_archived = true WHERE mess_id = p_mess_id AND is_archived = false;

  -- 3. Insert carryover deposits for balances that aren't zero
  INSERT INTO public.deposits (mess_id, member_id, amount, payment_method, deposit_date, created_by, is_archived)
  SELECT 
    p_mess_id, 
    member_id, 
    balance, 
    'Cash', 
    CURRENT_DATE, 
    auth.uid(), 
    false
  FROM public.monthly_report_members 
  WHERE report_id = v_report_id AND balance != 0;

  RETURN v_report_id;
END;
$$;
