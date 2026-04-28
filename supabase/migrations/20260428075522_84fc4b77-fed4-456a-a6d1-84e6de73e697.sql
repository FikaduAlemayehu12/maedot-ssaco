
-- ============ SETTINGS ============
CREATE TABLE IF NOT EXISTS public.sacco_settings (
  id int PRIMARY KEY DEFAULT 1,
  registration_fee numeric NOT NULL DEFAULT 1050,
  share_contribution numeric NOT NULL DEFAULT 500,
  initial_savings numeric NOT NULL DEFAULT 500,
  monthly_min_savings numeric NOT NULL DEFAULT 500,
  savings_annual_rate numeric NOT NULL DEFAULT 0.07,
  savings_tax_rate numeric NOT NULL DEFAULT 0.05,
  loan_rate_3y numeric NOT NULL DEFAULT 0.15,
  loan_rate_4y numeric NOT NULL DEFAULT 0.16,
  loan_rate_5y numeric NOT NULL DEFAULT 0.17,
  disbursement_fee_low numeric NOT NULL DEFAULT 0.02,   -- principal <= threshold
  disbursement_fee_high numeric NOT NULL DEFAULT 0.025, -- principal >  threshold
  disbursement_fee_threshold numeric NOT NULL DEFAULT 300000,
  loan_eligibility_multiplier numeric NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sacco_settings_singleton CHECK (id = 1)
);
INSERT INTO public.sacco_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.sacco_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read sacco settings" ON public.sacco_settings
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
    OR public.has_role(auth.uid(), 'loan_officer') OR public.has_role(auth.uid(), 'savings_officer')
    OR public.has_role(auth.uid(), 'cashier')
  );
CREATE POLICY "Admins update sacco settings" ON public.sacco_settings
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ MEMBER PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.member_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.members(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
  purpose text NOT NULL DEFAULT 'registration', -- registration | monthly_savings | loan_repayment | other
  amount numeric NOT NULL CHECK (amount > 0),
  alloc_registration_fee numeric NOT NULL DEFAULT 0,
  alloc_share_capital numeric NOT NULL DEFAULT 0,
  alloc_initial_savings numeric NOT NULL DEFAULT 0,
  alloc_extra_savings numeric NOT NULL DEFAULT 0,
  bank_name text,
  bank_reference text,
  screenshot_url text,
  paid_at date NOT NULL DEFAULT CURRENT_DATE,
  verified boolean NOT NULL DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS member_payments_member_idx ON public.member_payments(member_id);
CREATE INDEX IF NOT EXISTS member_payments_registration_idx ON public.member_payments(registration_id);
ALTER TABLE public.member_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view payments" ON public.member_payments FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
  OR public.has_role(auth.uid(), 'savings_officer') OR public.has_role(auth.uid(), 'cashier')
  OR public.has_role(auth.uid(), 'checker') OR public.has_role(auth.uid(), 'maker')
);
CREATE POLICY "Staff record payments" ON public.member_payments FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'savings_officer')
  OR public.has_role(auth.uid(), 'cashier') OR public.has_role(auth.uid(), 'maker')
);
CREATE POLICY "Checkers verify payments" ON public.member_payments FOR UPDATE TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'checker') OR public.has_role(auth.uid(), 'finance_officer')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'checker') OR public.has_role(auth.uid(), 'finance_officer')
);
CREATE POLICY "Admins delete payments" ON public.member_payments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ SHARE CAPITAL ============
CREATE TABLE IF NOT EXISTS public.share_capital (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id)
);
ALTER TABLE public.share_capital ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view shares" ON public.share_capital FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
  OR public.has_role(auth.uid(), 'savings_officer') OR public.has_role(auth.uid(), 'cashier') OR public.has_role(auth.uid(), 'loan_officer')
);
CREATE POLICY "Finance manage shares" ON public.share_capital FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'savings_officer')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'savings_officer')
);

CREATE TABLE IF NOT EXISTS public.share_dividends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  fiscal_year int NOT NULL,
  share_balance numeric NOT NULL,
  rate numeric NOT NULL,
  amount numeric NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  posted_by uuid,
  UNIQUE(member_id, fiscal_year)
);
ALTER TABLE public.share_dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view dividends" ON public.share_dividends FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'savings_officer')
);
CREATE POLICY "Finance post dividends" ON public.share_dividends FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
);
CREATE POLICY "Admins delete dividends" ON public.share_dividends FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ SAVINGS INTEREST ACCRUALS ============
CREATE TABLE IF NOT EXISTS public.savings_interest_accruals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.savings_accounts(id) ON DELETE CASCADE,
  period date NOT NULL, -- first day of accrual month
  opening_balance numeric NOT NULL,
  gross_interest numeric NOT NULL,
  tax numeric NOT NULL,
  net_interest numeric NOT NULL,
  closing_balance numeric NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  posted_by uuid,
  UNIQUE(account_id, period)
);
ALTER TABLE public.savings_interest_accruals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view accruals" ON public.savings_interest_accruals FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
  OR public.has_role(auth.uid(), 'savings_officer') OR public.has_role(auth.uid(), 'cashier')
);
CREATE POLICY "Finance insert accruals" ON public.savings_interest_accruals FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
);
CREATE POLICY "Admin delete accruals" ON public.savings_interest_accruals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ LOAN GUARANTORS ============
CREATE TABLE IF NOT EXISTS public.loan_guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('member','salary_letter')),
  guarantor_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  guarantor_name text,
  document_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loan_guarantors_loan_idx ON public.loan_guarantors(loan_id);
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view guarantors" ON public.loan_guarantors FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
  OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'cashier') OR public.has_role(auth.uid(), 'checker')
);
CREATE POLICY "Loan officers manage guarantors" ON public.loan_guarantors FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
);

-- ============ LOAN DISBURSEMENTS ============
CREATE TABLE IF NOT EXISTS public.loan_disbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  principal numeric NOT NULL,
  service_fee numeric NOT NULL DEFAULT 0,
  insurance_fee numeric NOT NULL DEFAULT 0,
  total_fees numeric NOT NULL DEFAULT 0,
  net_to_member numeric NOT NULL,
  disbursed_at timestamptz NOT NULL DEFAULT now(),
  posted_by uuid
);
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view disbursements" ON public.loan_disbursements FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
  OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'cashier')
);
CREATE POLICY "Finance post disbursements" ON public.loan_disbursements FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'loan_officer')
);
CREATE POLICY "Admin delete disbursements" ON public.loan_disbursements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ LOAN SCHEDULE ============
CREATE TABLE IF NOT EXISTS public.loan_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  installment_no int NOT NULL,
  due_date date NOT NULL,
  installment_amount numeric NOT NULL,
  principal_portion numeric NOT NULL,
  interest_portion numeric NOT NULL,
  balance_after numeric NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled | paid | overdue
  paid_at timestamptz,
  UNIQUE(loan_id, installment_no)
);
CREATE INDEX IF NOT EXISTS loan_schedule_loan_idx ON public.loan_schedule(loan_id);
ALTER TABLE public.loan_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view schedule" ON public.loan_schedule FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
  OR public.has_role(auth.uid(), 'finance_officer') OR public.has_role(auth.uid(), 'cashier')
);
CREATE POLICY "Loan officers manage schedule" ON public.loan_schedule FOR ALL TO authenticated USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
) WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'loan_officer')
);

-- ============ STORAGE BUCKET (private) ============
INSERT INTO storage.buckets (id, name, public) VALUES ('member-payments', 'member-payments', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket policies: staff can read/write
CREATE POLICY "Staff read member-payments" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'member-payments' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'finance_officer')
    OR public.has_role(auth.uid(), 'savings_officer') OR public.has_role(auth.uid(), 'cashier')
    OR public.has_role(auth.uid(), 'checker') OR public.has_role(auth.uid(), 'maker') OR public.has_role(auth.uid(), 'loan_officer')
  )
);
CREATE POLICY "Staff upload member-payments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'member-payments' AND (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'savings_officer')
    OR public.has_role(auth.uid(), 'cashier') OR public.has_role(auth.uid(), 'maker') OR public.has_role(auth.uid(), 'loan_officer')
  )
);
CREATE POLICY "Admins delete member-payments" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'member-payments' AND public.has_role(auth.uid(), 'admin')
);

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.compute_loan_rate(_term_months int)
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _term_months <= 36 THEN (SELECT loan_rate_3y FROM sacco_settings WHERE id = 1)
    WHEN _term_months <= 48 THEN (SELECT loan_rate_4y FROM sacco_settings WHERE id = 1)
    ELSE (SELECT loan_rate_5y FROM sacco_settings WHERE id = 1)
  END;
$$;

CREATE OR REPLACE FUNCTION public.compute_disbursement_fee(_principal numeric)
RETURNS TABLE(service_fee numeric, insurance_fee numeric, total_fees numeric, net_to_member numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE s sacco_settings; svc numeric; ins numeric;
BEGIN
  SELECT * INTO s FROM sacco_settings WHERE id = 1;
  IF _principal <= s.disbursement_fee_threshold THEN
    svc := _principal * 0.01;  -- 1% service
    ins := _principal * 0.01;  -- 1% insurance (low band)
  ELSE
    svc := _principal * 0.01;   -- 1% service
    ins := _principal * 0.015;  -- 1.5% insurance (high band)
  END IF;
  service_fee := svc;
  insurance_fee := ins;
  total_fees := svc + ins;
  net_to_member := _principal - (svc + ins);
  RETURN NEXT;
END; $$;

CREATE OR REPLACE FUNCTION public.eligible_loan_max(_member_id uuid)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE total_savings numeric; mult numeric;
BEGIN
  SELECT COALESCE(SUM(balance), 0) INTO total_savings FROM savings_accounts
   WHERE member_id = _member_id AND status = 'active';
  SELECT loan_eligibility_multiplier INTO mult FROM sacco_settings WHERE id = 1;
  RETURN GREATEST(total_savings, 0) * COALESCE(mult, 4);
END; $$;

-- Idempotent monthly accrual: posts (account, period) once.
CREATE OR REPLACE FUNCTION public.accrue_monthly_savings_interest(_period date DEFAULT date_trunc('month', now())::date)
RETURNS TABLE(accounts_processed int, total_net_interest numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s sacco_settings; rec record; monthly_rate numeric;
  gross numeric; tax numeric; net numeric; new_bal numeric;
  cnt int := 0; total numeric := 0;
BEGIN
  SELECT * INTO s FROM sacco_settings WHERE id = 1;
  monthly_rate := s.savings_annual_rate / 12.0;
  FOR rec IN SELECT id, balance FROM savings_accounts WHERE status = 'active' LOOP
    IF EXISTS (SELECT 1 FROM savings_interest_accruals WHERE account_id = rec.id AND period = _period) THEN CONTINUE; END IF;
    gross := round((rec.balance * monthly_rate)::numeric, 4);
    tax := round((gross * s.savings_tax_rate)::numeric, 4);
    net := gross - tax;
    new_bal := rec.balance + net;
    INSERT INTO savings_interest_accruals (account_id, period, opening_balance, gross_interest, tax, net_interest, closing_balance, posted_by)
      VALUES (rec.id, _period, rec.balance, gross, tax, net, new_bal, auth.uid());
    INSERT INTO savings_transactions (account_id, txn_type, amount, running_balance, note, posted_by)
      VALUES (rec.id, 'interest', net, new_bal, 'Monthly interest (net of 5% tax) for ' || to_char(_period,'YYYY-MM'), auth.uid());
    UPDATE savings_accounts SET balance = new_bal, updated_at = now() WHERE id = rec.id;
    cnt := cnt + 1; total := total + net;
  END LOOP;
  accounts_processed := cnt; total_net_interest := total; RETURN NEXT;
END; $$;

-- Build amortization schedule on approval (replaces existing if any).
CREATE OR REPLACE FUNCTION public.generate_loan_schedule(_loan_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  l loans; monthly_rate numeric; n int; i int;
  installment numeric; bal numeric; interest_p numeric; principal_p numeric;
  due date;
BEGIN
  SELECT * INTO l FROM loans WHERE id = _loan_id;
  IF l.id IS NULL THEN RAISE EXCEPTION 'Loan not found'; END IF;
  monthly_rate := l.interest_rate / 12.0;
  n := l.term_months;
  IF monthly_rate = 0 THEN
    installment := round((l.principal / n)::numeric, 2);
  ELSE
    installment := round( (l.principal * monthly_rate / (1 - power(1 + monthly_rate, -n)))::numeric, 2);
  END IF;
  DELETE FROM loan_schedule WHERE loan_id = _loan_id;
  bal := l.principal;
  due := date_trunc('month', COALESCE(l.disbursed_at, now()))::date + interval '1 month' - interval '1 day';
  FOR i IN 1..n LOOP
    interest_p := round((bal * monthly_rate)::numeric, 2);
    principal_p := installment - interest_p;
    IF i = n THEN principal_p := bal; installment := principal_p + interest_p; END IF;
    bal := round((bal - principal_p)::numeric, 2);
    INSERT INTO loan_schedule (loan_id, installment_no, due_date, installment_amount, principal_portion, interest_portion, balance_after)
      VALUES (_loan_id, i, due, installment, principal_p, interest_p, GREATEST(bal,0));
    due := (due + interval '1 month')::date;
  END LOOP;
  RETURN n;
END; $$;
