-- Create view for meals with member names, respecting RLS
DROP VIEW IF EXISTS public.meal_details;

CREATE VIEW public.meal_details WITH (security_invoker = true) AS
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
WHERE m.is_deleted = FALSE;
