
-- 1) Settings: rename to mandatory + add voluntary
ALTER TABLE public.sacco_settings
  ADD COLUMN IF NOT EXISTS savings_voluntary_rate numeric NOT NULL DEFAULT 0.09;
UPDATE public.sacco_settings SET savings_annual_rate = 0.07, savings_voluntary_rate = 0.09 WHERE id = 1;

-- 2) Savings product type
DO $$ BEGIN
  CREATE TYPE savings_product AS ENUM ('mandatory','voluntary','regular');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- product column already exists as text; keep as text but normalize
UPDATE public.savings_accounts SET product = 'mandatory' WHERE product IS NULL OR product = 'regular';

-- helper
CREATE OR REPLACE FUNCTION public.savings_rate_for(_product text)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN _product = 'voluntary'
    THEN (SELECT savings_voluntary_rate FROM sacco_settings WHERE id = 1)
    ELSE (SELECT savings_annual_rate FROM sacco_settings WHERE id = 1)
  END
$$;

-- 3) Loan rate v2: month-band
CREATE OR REPLACE FUNCTION public.compute_loan_rate_v2(_term_months integer, _is_mor boolean)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _is_mor THEN 0.15
    WHEN _term_months <= 12 THEN 0.15
    WHEN _term_months <= 36 THEN 0.16
    ELSE 0.17
  END;
$$;

-- 4) Loan schedule extras
ALTER TABLE public.loan_schedule
  ADD COLUMN IF NOT EXISTS cumulative_interest numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS penalty numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_payment numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_late integer NOT NULL DEFAULT 0;

-- regenerate function with cumulative interest
CREATE OR REPLACE FUNCTION public.generate_loan_schedule(_loan_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l loans; monthly_rate numeric; n int; i int;
  installment numeric; bal numeric; interest_p numeric; principal_p numeric;
  due date; cum_int numeric := 0;
BEGIN
  SELECT * INTO l FROM loans WHERE id = _loan_id;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Loan not found'; END IF;
  monthly_rate := l.interest_rate / 12.0;
  n := l.term_months;
  IF monthly_rate = 0 THEN
    installment := round((l.principal / n)::numeric, 2);
  ELSE
    installment := round((l.principal * monthly_rate / (1 - power(1 + monthly_rate, -n)))::numeric, 2);
  END IF;
  DELETE FROM loan_schedule WHERE loan_id = _loan_id;
  bal := l.principal;
  due := date_trunc('month', COALESCE(l.disbursed_at, now()))::date + interval '1 month' - interval '1 day';
  FOR i IN 1..n LOOP
    interest_p := round((bal * monthly_rate)::numeric, 2);
    principal_p := installment - interest_p;
    IF i = n THEN principal_p := bal; installment := principal_p + interest_p; END IF;
    bal := round((bal - principal_p)::numeric, 2);
    cum_int := cum_int + interest_p;
    INSERT INTO loan_schedule (loan_id, installment_no, due_date, installment_amount,
      principal_portion, interest_portion, balance_after, cumulative_interest)
      VALUES (_loan_id, i, due, installment, principal_p, interest_p, GREATEST(bal,0), cum_int);
    due := (due + interval '1 month')::date;
  END LOOP;
  RETURN n;
END; $$;

-- 5) Approvals (multi-level)
CREATE TABLE IF NOT EXISTS public.loan_approval_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  level text NOT NULL CHECK (level IN ('loan_officer','manager','admin')),
  decision text NOT NULL CHECK (decision IN ('approved','rejected','returned')),
  comment text,
  signature_data_url text,
  decided_by uuid,
  decided_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_approval_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view approval steps" ON public.loan_approval_steps FOR SELECT TO authenticated USING (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer') OR
  has_role(auth.uid(),'finance_officer') OR has_role(auth.uid(),'checker')
);
CREATE POLICY "Approvers add steps" ON public.loan_approval_steps FOR INSERT TO authenticated WITH CHECK (
  has_role(auth.uid(),'admin') OR has_role(auth.uid(),'loan_officer') OR has_role(auth.uid(),'checker')
);

ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS approval_level text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS member_signature_url text;

-- 6) Audit log
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit" ON public.audit_logs FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated insert audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id OR actor_id IS NULL);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON public.audit_logs(created_at DESC);
