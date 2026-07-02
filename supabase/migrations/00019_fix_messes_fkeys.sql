-- Fix mess_members
ALTER TABLE public.mess_members DROP CONSTRAINT IF EXISTS mess_members_mess_id_fkey;
ALTER TABLE public.mess_members ADD CONSTRAINT mess_members_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;

-- Fix meals
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_mess_id_fkey;
ALTER TABLE public.meals ADD CONSTRAINT meals_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;

-- Fix expenses
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_mess_id_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;

-- Fix deposits
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_mess_id_fkey;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_deposits_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;
-- Wait, let's just make sure we drop whatever name it might be.
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_mess_id_fkey1;

-- Fix notifications
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_mess_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;

-- Fix monthly_reports
ALTER TABLE public.monthly_reports DROP CONSTRAINT IF EXISTS monthly_reports_mess_id_fkey;
ALTER TABLE public.monthly_reports ADD CONSTRAINT monthly_reports_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;
