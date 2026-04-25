-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'checker', 'maker');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

-- Registrations
CREATE SEQUENCE public.maedot_customer_seq START 1;
CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.account_type AS ENUM ('saving', 'cheque', 'mobile_wallet');

CREATE TABLE public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number TEXT UNIQUE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  nationality TEXT NOT NULL,
  region TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  tin_number TEXT,
  monthly_income NUMERIC(14,2),
  annual_income NUMERIC(14,2),
  occupation TEXT,
  account_type account_type NOT NULL,
  heir_full_name TEXT,
  heir_phone TEXT,
  heir_relationship TEXT,
  photo_url TEXT,
  id_document_url TEXT,
  status registration_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  marital_status TEXT,
  education TEXT,
  mothers_name TEXT,
  signature_data_url TEXT,
  heir2_full_name TEXT,
  heir2_phone TEXT,
  heir2_relationship TEXT,
  witness_1 TEXT,
  witness_2 TEXT,
  witness_3 TEXT,
  branch TEXT,
  live_photo_url TEXT,
  optional_photo_url TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_referral ON public.registrations(referral_code);
CREATE INDEX idx_registrations_status ON public.registrations(status);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_registration_numbers()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE next_n bigint;
BEGIN
  next_n := nextval('public.maedot_customer_seq');
  NEW.customer_number := 'MAE-' || lpad(next_n::text, 6, '0');
  NEW.account_number := '1000' || lpad(next_n::text, 8, '0');
  NEW.status := 'pending';
  NEW.reviewed_by := NULL;
  NEW.reviewed_at := NULL;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_set_registration_numbers BEFORE INSERT ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_registration_numbers();

CREATE TRIGGER trg_registrations_updated_at BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Anyone can register" ON public.registrations FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 200
    AND length(trim(phone)) BETWEEN 5 AND 30
    AND length(trim(email)) BETWEEN 5 AND 255
    AND email LIKE '%_@_%.__%'
    AND length(trim(id_number)) BETWEEN 3 AND 50
  );

CREATE POLICY "Staff view registrations" ON public.registrations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'checker') OR public.has_role(auth.uid(), 'maker'));

CREATE POLICY "Staff update registrations" ON public.registrations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'checker'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'checker'));

CREATE POLICY "Admins delete registrations" ON public.registrations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Bootstrap admin
CREATE OR REPLACE FUNCTION public.bootstrap_maedot_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'abrham@maedot.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_bootstrap AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.bootstrap_maedot_admin();

-- site_settings
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  phone TEXT NOT NULL DEFAULT '0903373727',
  motto_en TEXT NOT NULL DEFAULT 'Transforming Together',
  motto_am TEXT NOT NULL DEFAULT 'በጋራ እንሻገር',
  org_name_en TEXT NOT NULL DEFAULT 'Maedot Saving and Credit Cooperative Society',
  org_name_am TEXT NOT NULL DEFAULT 'ማዕዶት የገንዘብ ቁጠባና ብድር መሰረታዊ የህብረት ሥራ ማህበር',
  address TEXT,
  email TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins update settings" ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- staff_profiles
CREATE SEQUENCE public.maedot_staff_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql SET search_path TO 'public'
AS $$
DECLARE next_n bigint;
BEGIN
  next_n := nextval('public.maedot_staff_seq');
  RETURN 'MAE-' || lpad(next_n::text, 7, '0');
END; $$;

CREATE TABLE public.staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff see own profile" ON public.staff_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage staff" ON public.staff_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can verify referral code" ON public.staff_profiles FOR SELECT TO anon USING (active = true);

CREATE TRIGGER trg_staff_profiles_updated_at BEFORE UPDATE ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.set_staff_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END; $$;

ALTER TABLE public.staff_profiles ALTER COLUMN referral_code DROP NOT NULL;
CREATE TRIGGER trg_staff_referral_code BEFORE INSERT ON public.staff_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_staff_referral_code();

-- submit_registration RPC
CREATE OR REPLACE FUNCTION public.submit_registration(payload jsonb)
RETURNS TABLE(customer_number text, account_number text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO public.registrations (
    full_name, gender, date_of_birth, nationality, region, phone, email,
    marital_status, education, mothers_name,
    id_type, id_number, tin_number,
    monthly_income, annual_income, occupation,
    account_type, branch,
    heir_full_name, heir_phone, heir_relationship,
    heir2_full_name, heir2_phone, heir2_relationship,
    witness_1, witness_2, witness_3,
    referral_code,
    live_photo_url, optional_photo_url, id_front_url, id_back_url,
    signature_data_url,
    customer_number, account_number
  ) VALUES (
    payload->>'full_name', payload->>'gender', (payload->>'date_of_birth')::date,
    payload->>'nationality', payload->>'region', payload->>'phone', payload->>'email',
    payload->>'marital_status', payload->>'education', payload->>'mothers_name',
    payload->>'id_type', payload->>'id_number', payload->>'tin_number',
    NULLIF(payload->>'monthly_income','')::numeric,
    NULLIF(payload->>'annual_income','')::numeric,
    payload->>'occupation',
    (payload->>'account_type')::account_type,
    payload->>'branch',
    payload->>'heir_full_name', payload->>'heir_phone', payload->>'heir_relationship',
    payload->>'heir2_full_name', payload->>'heir2_phone', payload->>'heir2_relationship',
    payload->>'witness_1', payload->>'witness_2', payload->>'witness_3',
    payload->>'referral_code',
    payload->>'live_photo_url', payload->>'optional_photo_url',
    payload->>'id_front_url', payload->>'id_back_url',
    payload->>'signature_data_url',
    'PENDING', 'PENDING'
  )
  RETURNING id INTO new_id;

  RETURN QUERY SELECT r.customer_number, r.account_number
    FROM public.registrations r WHERE r.id = new_id;
END; $$;

GRANT EXECUTE ON FUNCTION public.submit_registration(jsonb) TO anon, authenticated;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('member-ids', 'member-ids', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload member photos" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'member-photos');
CREATE POLICY "Anyone can upload member ids" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'member-ids');
CREATE POLICY "Staff can read member photos" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-photos' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'checker') OR public.has_role(auth.uid(),'maker')));
CREATE POLICY "Staff can read member ids" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'member-ids' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'checker') OR public.has_role(auth.uid(),'maker')));
CREATE POLICY "Anyone can view brand assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-assets');
CREATE POLICY "Admins can upload brand assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update brand assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete brand assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'brand-assets' AND public.has_role(auth.uid(),'admin'));