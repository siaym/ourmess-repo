-- Fix infinite recursion by using the SECURITY DEFINER function get_user_role()

DROP POLICY IF EXISTS "Members can view members of their mess" ON public.mess_members;
CREATE POLICY "Members can view members of their mess" ON public.mess_members FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Users can view messes they belong to" ON public.messes;
CREATE POLICY "Users can view messes they belong to" ON public.messes FOR SELECT USING (
  get_user_role(id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Members can view meals of their mess" ON public.meals;
CREATE POLICY "Members can view meals of their mess" ON public.meals FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Members can view expenses of their mess" ON public.expenses;
CREATE POLICY "Members can view expenses of their mess" ON public.expenses FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Members can view deposits of their mess" ON public.deposits;
CREATE POLICY "Members can view deposits of their mess" ON public.deposits FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Members can view monthly reports of their mess" ON public.monthly_reports;
CREATE POLICY "Members can view monthly reports of their mess" ON public.monthly_reports FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "Members can view activity logs of their mess" ON public.activity_logs;
CREATE POLICY "Members can view activity logs of their mess" ON public.activity_logs FOR SELECT USING (
  get_user_role(mess_id, auth.uid()) IS NOT NULL
);
