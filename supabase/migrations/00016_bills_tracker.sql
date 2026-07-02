CREATE TABLE public.bill_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mess_id, name)
);

CREATE TABLE public.member_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.bill_categories(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, member_id, month_year)
);

-- Trigger to create default bill categories when a mess is created
CREATE OR REPLACE FUNCTION trigger_seed_default_bills()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.bill_categories (mess_id, name) VALUES
    (NEW.id, 'Electricity'),
    (NEW.id, 'Gas'),
    (NEW.id, 'WiFi'),
    (NEW.id, 'Water'),
    (NEW.id, 'Maid/Khala'),
    (NEW.id, 'Garbage'),
    (NEW.id, 'Rent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_mess_created_seed_bills ON public.messes;
CREATE TRIGGER on_mess_created_seed_bills
  AFTER INSERT ON public.messes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_default_bills();

-- Seed existing messes
DO $$
DECLARE
  v_mess RECORD;
BEGIN
  FOR v_mess IN SELECT id FROM public.messes LOOP
    INSERT INTO public.bill_categories (mess_id, name) VALUES
      (v_mess.id, 'Electricity'),
      (v_mess.id, 'Gas'),
      (v_mess.id, 'WiFi'),
      (v_mess.id, 'Water'),
      (v_mess.id, 'Maid/Khala'),
      (v_mess.id, 'Garbage'),
      (v_mess.id, 'Rent')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- get_bills_data(p_mess_id, p_month_year)
CREATE OR REPLACE FUNCTION get_bills_data(p_mess_id UUID, p_month_year TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_categories json;
  v_member_bills json;
  v_members json;
BEGIN
  -- Get all categories for this mess
  SELECT json_agg(c) INTO v_categories FROM (
    SELECT id, name FROM public.bill_categories WHERE mess_id = p_mess_id ORDER BY created_at
  ) c;

  -- Get all member bills for this month
  SELECT json_agg(mb) INTO v_member_bills FROM (
    SELECT category_id, member_id, is_paid 
    FROM public.member_bills 
    WHERE mess_id = p_mess_id AND month_year = p_month_year
  ) mb;

  -- Get all members securely
  SELECT json_agg(m) INTO v_members FROM (
    SELECT mm.user_id as id, u.name, u.email 
    FROM public.mess_members mm
    JOIN public.users u ON u.id = mm.user_id
    WHERE mm.mess_id = p_mess_id AND mm.is_deleted = false
  ) m;

  RETURN json_build_object(
    'categories', COALESCE(v_categories, '[]'::json),
    'member_bills', COALESCE(v_member_bills, '[]'::json),
    'members', COALESCE(v_members, '[]'::json)
  );
END;
$$;

-- toggle_member_bill(p_mess_id, p_category_id, p_member_id, p_month_year, p_is_paid)
CREATE OR REPLACE FUNCTION toggle_member_bill(
  p_mess_id UUID, 
  p_category_id UUID, 
  p_member_id UUID, 
  p_month_year TEXT, 
  p_is_paid BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND is_deleted = false) THEN
    RAISE EXCEPTION 'Not a member of this mess';
  END IF;

  INSERT INTO public.member_bills (mess_id, category_id, member_id, month_year, is_paid)
  VALUES (p_mess_id, p_category_id, p_member_id, p_month_year, p_is_paid)
  ON CONFLICT (category_id, member_id, month_year) 
  DO UPDATE SET is_paid = p_is_paid, updated_at = NOW();
END;
$$;

-- add_bill_category(p_mess_id, p_name)
CREATE OR REPLACE FUNCTION add_bill_category(p_mess_id UUID, p_name TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_cat RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = false) THEN
    RAISE EXCEPTION 'Only managers can add categories';
  END IF;

  INSERT INTO public.bill_categories (mess_id, name) VALUES (p_mess_id, p_name)
  RETURNING id, name INTO v_new_cat;

  RETURN json_build_object('id', v_new_cat.id, 'name', v_new_cat.name);
END;
$$;

-- delete_bill_category(p_mess_id, p_category_id)
CREATE OR REPLACE FUNCTION delete_bill_category(p_mess_id UUID, p_category_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.mess_members WHERE mess_id = p_mess_id AND user_id = auth.uid() AND role IN ('owner', 'manager') AND is_deleted = false) THEN
    RAISE EXCEPTION 'Only managers can delete categories';
  END IF;

  DELETE FROM public.bill_categories WHERE id = p_category_id AND mess_id = p_mess_id;
END;
$$;
