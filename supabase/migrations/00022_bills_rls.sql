-- Enable RLS on bill_categories and member_bills
ALTER TABLE public.bill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_bills ENABLE ROW LEVEL SECURITY;

-- Policies for bill_categories
CREATE POLICY "Members can view bill categories of their mess" ON public.bill_categories FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.mess_members mm 
    WHERE mm.mess_id = public.bill_categories.mess_id 
    AND mm.user_id = auth.uid() 
    AND mm.is_deleted = false
  )
);

CREATE POLICY "Managers and owners can manage bill categories" ON public.bill_categories FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.mess_members mm 
    WHERE mm.mess_id = public.bill_categories.mess_id 
    AND mm.user_id = auth.uid() 
    AND mm.role IN ('owner', 'manager') 
    AND mm.is_deleted = false
  )
);

-- Policies for member_bills
CREATE POLICY "Members can view member bills of their mess" ON public.member_bills FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.mess_members mm 
    WHERE mm.mess_id = public.member_bills.mess_id 
    AND mm.user_id = auth.uid() 
    AND mm.is_deleted = false
  )
);

CREATE POLICY "Managers and owners can manage member bills" ON public.member_bills FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.mess_members mm 
    WHERE mm.mess_id = public.member_bills.mess_id 
    AND mm.user_id = auth.uid() 
    AND mm.role IN ('owner', 'manager') 
    AND mm.is_deleted = false
  )
);
