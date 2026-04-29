-- 1) Employer / MoR flag on members and registrations
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS is_mor_staff boolean NOT NULL DEFAULT false;

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS is_mor_staff boolean NOT NULL DEFAULT false;

-- 2) Loan applications
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text NOT NULL UNIQUE,
  member_id uuid NOT NULL,
  registration_id uuid,
  -- request
  requested_amount numeric NOT NULL,
  term_months integer NOT NULL,
  purpose text,
  monthly_income numeric,
  is_mor_staff boolean NOT NULL DEFAULT false,
  -- documents checklist
  doc_marriage_cert boolean NOT NULL DEFAULT false,
  doc_fayda_kebele boolean NOT NULL DEFAULT false,
  doc_member_booklet boolean NOT NULL DEFAULT false,
  doc_vehicle_house_title boolean NOT NULL DEFAULT false,
  doc_insurance boolean NOT NULL DEFAULT false,
  doc_restraint_letter boolean NOT NULL DEFAULT false,
  doc_cheque boolean NOT NULL DEFAULT false,
  -- computed financials
  interest_rate numeric NOT NULL DEFAULT 0,
  monthly_installment numeric NOT NULL DEFAULT 0,
  total_payable numeric NOT NULL DEFAULT 0,
  mandatory_savings numeric NOT NULL DEFAULT 0,         -- 25%
  service_fee numeric NOT NULL DEFAULT 0,               -- 1%
  insurance_fee numeric NOT NULL DEFAULT 0,             -- 1% or 1.5%
  total_upfront_fees numeric NOT NULL DEFAULT 0,        -- 2% or 2.5%
  net_to_member numeric NOT NULL DEFAULT 0,
  late_penalty_rate numeric NOT NULL DEFAULT 0.30,
  -- collateral
  collateral_owner text,
  collateral_plate_or_title text,
  collateral_motor_chassis text,
  collateral_type text,
  collateral_value numeric,
  -- governance
  witness_1 text,
  witness_2 text,
  witness_3 text,
  manager_name text,
  committee_decision_date date,
  start_month date,
  end_month date,
  status text NOT NULL DEFAULT 'draft',
  -- audit
  created_by uuid,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejected_reason text,
  loan_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_apps_member ON public.loan_applications(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_apps_status ON public.loan_applications(status);

-- Application number sequence
CREATE SEQUENCE IF NOT EXISTS public.loan_application_seq START 1;

CREATE OR REPLACE FUNCTION public.set_loan_application_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.application_number IS NULL OR NEW.application_number = '' THEN
    NEW.application_number := 'LA-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.loan_application_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_set_loan_app_number ON public.loan_applications;
CREATE TRIGGER trg_set_loan_app_number
  BEFORE INSERT ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_loan_application_number();

DROP TRIGGER IF EXISTS trg_loan_app_touch ON public.loan_applications;
CREATE TRIGGER trg_loan_app_touch
  BEFORE UPDATE ON public.loan_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.loan_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loan officers manage applications"
  ON public.loan_applications FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer'));

CREATE POLICY "Staff view applications"
  ON public.loan_applications FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR
    has_role(auth.uid(),'loan_officer') OR
    has_role(auth.uid(),'finance_officer') OR
    has_role(auth.uid(),'cashier') OR
    has_role(auth.uid(),'checker')
  );

CREATE POLICY "Admins delete applications"
  ON public.loan_applications FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- 3) Application guarantors
CREATE TABLE IF NOT EXISTS public.loan_application_guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  guarantor_member_id uuid,
  guarantor_name text,
  document_url text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.loan_application_guarantors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loan officers manage app guarantors"
  ON public.loan_application_guarantors FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer'));

CREATE POLICY "Staff view app guarantors"
  ON public.loan_application_guarantors FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin') OR
    has_role(auth.uid(),'loan_officer') OR
    has_role(auth.uid(),'finance_officer') OR
    has_role(auth.uid(),'cashier') OR
    has_role(auth.uid(),'checker')
  );

-- 4) Helper: 6 months membership eligibility (from earliest verified registration payment)
CREATE OR REPLACE FUNCTION public.member_has_6_months(_member_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.member_payments mp
    WHERE mp.member_id = _member_id
      AND mp.verified = true
      AND mp.purpose = 'registration'
      AND mp.paid_at <= (CURRENT_DATE - INTERVAL '6 months')
  );
$$;

-- 5) Helper: rate with MoR flat option
CREATE OR REPLACE FUNCTION public.compute_loan_rate_v2(_term_months integer, _is_mor boolean)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _is_mor THEN (SELECT loan_rate_3y FROM sacco_settings WHERE id = 1) -- 15% flat
    WHEN _term_months <= 36 THEN (SELECT loan_rate_3y FROM sacco_settings WHERE id = 1)
    WHEN _term_months <= 48 THEN (SELECT loan_rate_4y FROM sacco_settings WHERE id = 1)
    ELSE (SELECT loan_rate_5y FROM sacco_settings WHERE id = 1)
  END;
$$;