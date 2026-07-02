-- Fix meals foreign keys
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_created_by_fkey;
ALTER TABLE public.meals ADD CONSTRAINT meals_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_deleted_by_fkey;
ALTER TABLE public.meals ADD CONSTRAINT meals_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_member_id_fkey;
ALTER TABLE public.meals ADD CONSTRAINT meals_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix expenses foreign keys
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_deleted_by_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix deposits foreign keys
ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_created_by_fkey;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_deleted_by_fkey;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.deposits DROP CONSTRAINT IF EXISTS deposits_member_id_fkey;
ALTER TABLE public.deposits ADD CONSTRAINT deposits_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix messes foreign keys
ALTER TABLE public.messes DROP CONSTRAINT IF EXISTS messes_deleted_by_fkey;
ALTER TABLE public.messes ADD CONSTRAINT messes_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.messes DROP CONSTRAINT IF EXISTS messes_owner_id_fkey;
-- If owner is deleted, the mess should probably be deleted too (cascade)
ALTER TABLE public.messes ADD CONSTRAINT messes_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix mess_members foreign keys
ALTER TABLE public.mess_members DROP CONSTRAINT IF EXISTS mess_members_deleted_by_fkey;
ALTER TABLE public.mess_members ADD CONSTRAINT mess_members_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.mess_members DROP CONSTRAINT IF EXISTS mess_members_user_id_fkey;
ALTER TABLE public.mess_members ADD CONSTRAINT mess_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix monthly_reports foreign keys
ALTER TABLE public.monthly_reports DROP CONSTRAINT IF EXISTS monthly_reports_created_by_fkey;
ALTER TABLE public.monthly_reports ADD CONSTRAINT monthly_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- Fix monthly_report_members foreign keys
ALTER TABLE public.monthly_report_members DROP CONSTRAINT IF EXISTS monthly_report_members_user_id_fkey;
ALTER TABLE public.monthly_report_members ADD CONSTRAINT monthly_report_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Fix notifications foreign keys
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
