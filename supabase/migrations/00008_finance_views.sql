-- Create views for expenses and deposits with member names, respecting RLS
DROP VIEW IF EXISTS public.expense_details;
CREATE VIEW public.expense_details WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.mess_id,
  e.title,
  e.category,
  e.amount,
  e.expense_date,
  e.created_by,
  u.name as spender_name,
  e.created_at,
  e.is_deleted
FROM public.expenses e
JOIN public.users u ON u.id = e.created_by
WHERE e.is_deleted = FALSE
ORDER BY e.expense_date DESC, e.created_at DESC;

DROP VIEW IF EXISTS public.deposit_details;
CREATE VIEW public.deposit_details WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.mess_id,
  d.member_id,
  u.name as depositor_name,
  d.amount,
  d.payment_method,
  d.deposit_date,
  d.created_by,
  d.created_at,
  d.is_deleted
FROM public.deposits d
JOIN public.users u ON u.id = d.member_id
WHERE d.is_deleted = FALSE
ORDER BY d.deposit_date DESC, d.created_at DESC;
