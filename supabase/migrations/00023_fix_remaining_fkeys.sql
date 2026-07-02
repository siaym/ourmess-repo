-- 1. Fix activity_logs foreign keys to prevent deletion crashes
ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_mess_id_fkey;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_mess_id_fkey FOREIGN KEY (mess_id) REFERENCES public.messes(id) ON DELETE CASCADE;

ALTER TABLE public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;
ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 2. Fix monthly_reports and monthly_report_members that had a typo in previous fix
ALTER TABLE public.monthly_reports DROP CONSTRAINT IF EXISTS monthly_reports_closed_by_fkey;
ALTER TABLE public.monthly_reports DROP CONSTRAINT IF EXISTS monthly_reports_created_by_fkey;
ALTER TABLE public.monthly_reports ADD CONSTRAINT monthly_reports_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.monthly_report_members DROP CONSTRAINT IF EXISTS monthly_report_members_member_id_fkey;
ALTER TABLE public.monthly_report_members DROP CONSTRAINT IF EXISTS monthly_report_members_user_id_fkey;
ALTER TABLE public.monthly_report_members ADD CONSTRAINT monthly_report_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.users(id) ON DELETE CASCADE;
