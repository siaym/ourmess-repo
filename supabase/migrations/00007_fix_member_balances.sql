DROP VIEW IF EXISTS public.member_balances;

CREATE VIEW public.member_balances WITH (security_invoker = true) AS
WITH mess_totals AS (
  SELECT 
    m.id as mess_id,
    COALESCE((SELECT SUM(amount) FROM public.expenses WHERE mess_id = m.id AND is_deleted = FALSE), 0) as total_expenses,
    COALESCE((SELECT SUM(total_meal) FROM public.meals WHERE mess_id = m.id AND is_deleted = FALSE), 0) as total_meals
  FROM public.messes m
)
SELECT 
  mm.mess_id,
  mm.user_id as member_id,
  u.name,
  mm.role,
  COALESCE(SUM(d.amount), 0) as total_deposits,
  COALESCE(SUM(ml.total_meal), 0) as total_meals,
  CASE 
    WHEN mt.total_meals > 0 THEN mt.total_expenses / mt.total_meals 
    ELSE 0 
  END as current_meal_rate,
  COALESCE(SUM(d.amount), 0) - (
    COALESCE(SUM(ml.total_meal), 0) * 
    CASE 
      WHEN mt.total_meals > 0 THEN mt.total_expenses / mt.total_meals 
      ELSE 0 
    END
  ) as balance
FROM public.mess_members mm
JOIN public.users u ON u.id = mm.user_id
JOIN mess_totals mt ON mt.mess_id = mm.mess_id
LEFT JOIN public.deposits d ON mm.mess_id = d.mess_id AND mm.user_id = d.member_id AND d.is_deleted = FALSE
LEFT JOIN public.meals ml ON mm.mess_id = ml.mess_id AND mm.user_id = ml.member_id AND ml.is_deleted = FALSE
WHERE mm.is_deleted = FALSE
GROUP BY mm.mess_id, mm.user_id, u.name, mm.role, mt.total_meals, mt.total_expenses;
