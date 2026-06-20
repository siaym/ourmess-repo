-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSES TABLE
CREATE TABLE public.messes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id)
);

-- MESS MEMBERS TABLE
CREATE TABLE public.mess_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id),
  UNIQUE(mess_id, user_id)
);

-- MEALS TABLE
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  member_id UUID REFERENCES public.users(id) NOT NULL,
  date DATE NOT NULL,
  breakfast NUMERIC(4,2) DEFAULT 0,
  lunch NUMERIC(4,2) DEFAULT 0,
  dinner NUMERIC(4,2) DEFAULT 0,
  total_meal NUMERIC(4,2) GENERATED ALWAYS AS (breakfast + lunch + dinner) STORED,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id),
  UNIQUE(mess_id, member_id, date)
);

-- EXPENSES TABLE
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Market', 'Utility', 'Maintenance', 'Internet', 'Other')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  receipt_url TEXT,
  expense_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id)
);

-- DEPOSITS TABLE
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  member_id UUID REFERENCES public.users(id) NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'bKash', 'Nagad', 'Bank')),
  deposit_date DATE NOT NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id)
);

-- MONTHLY REPORTS TABLE
CREATE TABLE public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  total_meals NUMERIC(10,2) DEFAULT 0,
  total_expenses NUMERIC(10,2) DEFAULT 0,
  meal_rate NUMERIC(10,2) DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  UNIQUE(mess_id, month, year)
);

-- ACTIVITY LOGS TABLE
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS TABLE
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE FUNCTION TO GET USER ROLE IN A MESS
CREATE OR REPLACE FUNCTION get_user_role(p_mess_id UUID, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.mess_members
  WHERE mess_id = p_mess_id AND user_id = p_user_id AND is_deleted = FALSE;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Users
CREATE POLICY "Users can read all users (for members list)" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Messes
CREATE POLICY "Users can view messes they belong to" ON public.messes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = id AND user_id = auth.uid() AND is_deleted = false)
);
CREATE POLICY "Authenticated users can create messes" ON public.messes FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Only owners can update messes" ON public.messes FOR UPDATE USING (auth.uid() = owner_id);

-- 3. Mess Members
CREATE POLICY "Members can view members of their mess" ON public.mess_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "Owners and managers can manage members" ON public.mess_members FOR ALL USING (
  get_user_role(mess_id, auth.uid()) IN ('owner', 'manager')
);

-- 4. Meals
CREATE POLICY "Members can view meals of their mess" ON public.meals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "Managers and owners can manage meals" ON public.meals FOR ALL USING (
  get_user_role(mess_id, auth.uid()) IN ('owner', 'manager')
);

-- 5. Expenses
CREATE POLICY "Members can view expenses of their mess" ON public.expenses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "Managers and owners can manage expenses" ON public.expenses FOR ALL USING (
  get_user_role(mess_id, auth.uid()) IN ('owner', 'manager')
);

-- 6. Deposits
CREATE POLICY "Members can view deposits of their mess" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "Managers and owners can manage deposits" ON public.deposits FOR ALL USING (
  get_user_role(mess_id, auth.uid()) IN ('owner', 'manager')
);

-- 7. Monthly Reports
CREATE POLICY "Members can view monthly reports of their mess" ON public.monthly_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "Only owners can manage reports" ON public.monthly_reports FOR ALL USING (
  get_user_role(mess_id, auth.uid()) = 'owner'
);

-- 8. Activity Logs
CREATE POLICY "Members can view activity logs of their mess" ON public.activity_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mess_members mm WHERE mm.mess_id = mess_id AND mm.user_id = auth.uid() AND mm.is_deleted = false)
);
CREATE POLICY "System can insert activity logs" ON public.activity_logs FOR INSERT WITH CHECK (true);

-- 9. Notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (
  user_id = auth.uid()
);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- Create a view for member balances
CREATE OR REPLACE VIEW public.member_balances AS
SELECT 
  mm.mess_id,
  mm.user_id as member_id,
  COALESCE(SUM(d.amount), 0) as total_deposits,
  COALESCE(SUM(m.total_meal), 0) as total_meals,
  (
    SELECT CASE WHEN SUM(total_meal) > 0 THEN SUM(amount) / SUM(total_meal) ELSE 0 END
    FROM public.expenses e, public.meals m2
    WHERE e.mess_id = mm.mess_id AND m2.mess_id = mm.mess_id AND e.is_deleted = FALSE AND m2.is_deleted = FALSE
  ) as current_meal_rate,
  COALESCE(SUM(d.amount), 0) - (COALESCE(SUM(m.total_meal), 0) * (
    SELECT CASE WHEN SUM(total_meal) > 0 THEN SUM(amount) / SUM(total_meal) ELSE 0 END
    FROM public.expenses e, public.meals m2
    WHERE e.mess_id = mm.mess_id AND m2.mess_id = mm.mess_id AND e.is_deleted = FALSE AND m2.is_deleted = FALSE
  )) as balance
FROM public.mess_members mm
LEFT JOIN public.deposits d ON mm.mess_id = d.mess_id AND mm.user_id = d.member_id AND d.is_deleted = FALSE
LEFT JOIN public.meals m ON mm.mess_id = m.mess_id AND mm.user_id = m.member_id AND m.is_deleted = FALSE
WHERE mm.is_deleted = FALSE
GROUP BY mm.mess_id, mm.user_id;
