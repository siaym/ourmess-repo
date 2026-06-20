DROP VIEW IF EXISTS public.member_balances;

CREATE OR REPLACE VIEW public.member_balances AS
SELECT 
  mm.mess_id,
  mm.user_id as member_id,
  u.name,
  mm.role,
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
JOIN public.users u ON u.id = mm.user_id
LEFT JOIN public.deposits d ON mm.mess_id = d.mess_id AND mm.user_id = d.member_id AND d.is_deleted = FALSE
LEFT JOIN public.meals m ON mm.mess_id = m.mess_id AND mm.user_id = m.member_id AND m.is_deleted = FALSE
WHERE mm.is_deleted = FALSE
GROUP BY mm.mess_id, mm.user_id, u.name, mm.role;
