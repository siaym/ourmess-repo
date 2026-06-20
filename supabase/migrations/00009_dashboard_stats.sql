-- Create view for dashboard stats respecting RLS
DROP VIEW IF EXISTS public.dashboard_stats;

CREATE VIEW public.dashboard_stats WITH (security_invoker = true) AS
SELECT 
  m.id as mess_id,
  (SELECT COUNT(*) FROM public.mess_members WHERE mess_id = m.id AND is_deleted = FALSE) as total_members,
  COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE), 0) as total_meals,
  COALESCE((SELECT SUM(amount) FROM public.expenses WHERE mess_id = m.id AND is_deleted = FALSE), 0) as total_expenses,
  CASE 
    WHEN COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE), 0) > 0 
    THEN COALESCE((SELECT SUM(amount) FROM public.expenses WHERE mess_id = m.id AND is_deleted = FALSE), 0) / COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE), 0)
    ELSE 0 
  END as current_meal_rate
FROM public.messes m;
