CREATE OR REPLACE VIEW public.recent_bills_view AS
SELECT 
  mb.id,
  mb.mess_id,
  mb.updated_at,
  u.name as member_name,
  c.name as category_name
FROM public.member_bills mb
JOIN public.users u ON u.id = mb.member_id
JOIN public.bill_categories c ON c.id = mb.category_id
WHERE mb.is_paid = true;

GRANT SELECT ON public.recent_bills_view TO authenticated;
GRANT SELECT ON public.recent_bills_view TO anon;
