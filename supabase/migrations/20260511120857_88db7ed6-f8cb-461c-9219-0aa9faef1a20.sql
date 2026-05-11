
-- 1. savings_cycles ledger
CREATE TABLE IF NOT EXISTS public.savings_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  member_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  product text NOT NULL,
  rate numeric NOT NULL,
  opening_balance numeric NOT NULL DEFAULT 0,
  gross_interest numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  net_interest numeric NOT NULL DEFAULT 0,
  closing_balance numeric NOT NULL DEFAULT 0,
  monthly_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  posted_by uuid,
  posted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, period_start, period_end)
);

ALTER TABLE public.savings_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view cycles" ON public.savings_cycles FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_officer')
      OR has_role(auth.uid(),'savings_officer') OR has_role(auth.uid(),'cashier'));

CREATE POLICY "Finance post cycles" ON public.savings_cycles FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'finance_officer'));

CREATE POLICY "Admin delete cycles" ON public.savings_cycles FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'));

-- 2. Ethiopian 6-month cycle for a given gregorian date
-- Cycle A: Jul 8 .. Jan 7  (ሐምሌ–ታህሳስ)
-- Cycle B: Jan 8 .. Jul 7  (ጥር–ሰኔ)
CREATE OR REPLACE FUNCTION public.eth_cycle_window(_d date)
RETURNS TABLE(period_start date, period_end date, label text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE y int := extract(year from _d)::int;
BEGIN
  IF _d >= make_date(y,7,8) AND _d <= make_date(y+1,1,7) THEN
    period_start := make_date(y,7,8); period_end := make_date(y+1,1,7);
    label := 'ሐምሌ '||(y-7)::text||' – ታህሳስ '||(y-7)::text;
  ELSIF _d >= make_date(y,1,8) AND _d <= make_date(y,7,7) THEN
    period_start := make_date(y,1,8); period_end := make_date(y,7,7);
    label := 'ጥር – ሰኔ';
  ELSE
    period_start := make_date(y-1,7,8); period_end := make_date(y,1,7);
    label := 'ሐምሌ – ታህሳስ';
  END IF;
  RETURN NEXT;
END $$;

-- 3. Accrue one cycle for a single account: monthly simple interest on month-end balance
CREATE OR REPLACE FUNCTION public.accrue_account_cycle(_account_id uuid, _period_start date, _period_end date)
RETURNS public.savings_cycles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  acc public.savings_accounts;
  rate numeric;
  m_start date; m_end date;
  bal numeric; gross numeric := 0; tax_amt numeric; net_amt numeric;
  monthly_rate numeric;
  open_bal numeric;
  breakdown jsonb := '[]'::jsonb;
  monthly_int numeric;
  cycle_row public.savings_cycles;
  s sacco_settings;
BEGIN
  SELECT * INTO acc FROM savings_accounts WHERE id = _account_id;
  IF acc.id IS NULL THEN RAISE EXCEPTION 'Account not found'; END IF;
  IF EXISTS (SELECT 1 FROM savings_cycles WHERE account_id = _account_id AND period_start = _period_start AND period_end = _period_end) THEN
    RAISE EXCEPTION 'Cycle already posted for this account';
  END IF;
  SELECT * INTO s FROM sacco_settings WHERE id = 1;
  rate := savings_rate_for(acc.product);
  monthly_rate := rate / 12.0;

  -- Opening balance = balance as of period_start (sum of running_balance up to start, or 0)
  SELECT COALESCE((SELECT running_balance FROM savings_transactions
     WHERE account_id = _account_id AND posted_at < _period_start
     ORDER BY posted_at DESC LIMIT 1), 0) INTO open_bal;

  m_start := _period_start;
  WHILE m_start <= _period_end LOOP
    m_end := LEAST((m_start + interval '1 month' - interval '1 day')::date, _period_end);
    SELECT COALESCE((SELECT running_balance FROM savings_transactions
       WHERE account_id = _account_id AND posted_at <= (m_end + interval '1 day' - interval '1 second')
       AND txn_type <> 'interest'
       ORDER BY posted_at DESC LIMIT 1), open_bal) INTO bal;
    monthly_int := round((bal * monthly_rate)::numeric, 4);
    gross := gross + monthly_int;
    breakdown := breakdown || jsonb_build_object(
      'month_start', m_start, 'month_end', m_end,
      'balance', bal, 'monthly_interest', monthly_int);
    m_start := (m_start + interval '1 month')::date;
  END LOOP;

  tax_amt := round((gross * s.savings_tax_rate)::numeric, 4);
  net_amt := round((gross - tax_amt)::numeric, 4);

  -- Post savings_transaction crediting net interest at period_end
  INSERT INTO savings_transactions(account_id, txn_type, amount, running_balance, note, posted_at, posted_by)
  VALUES (_account_id, 'interest', net_amt, acc.balance + net_amt,
    'Cycle interest '||to_char(_period_start,'YYYY-MM-DD')||' → '||to_char(_period_end,'YYYY-MM-DD')||
      ' (gross '||gross::text||', tax '||tax_amt::text||')',
    (_period_end::timestamptz + interval '23 hours'), auth.uid());
  UPDATE savings_accounts SET balance = balance + net_amt, updated_at = now() WHERE id = _account_id;

  INSERT INTO savings_cycles(account_id, member_id, period_start, period_end, product, rate,
     opening_balance, gross_interest, tax, net_interest, closing_balance, monthly_breakdown, posted_by)
  VALUES (_account_id, acc.member_id, _period_start, _period_end, acc.product, rate,
     open_bal, gross, tax_amt, net_amt, acc.balance + net_amt, breakdown, auth.uid())
  RETURNING * INTO cycle_row;

  RETURN cycle_row;
END $$;

-- 4. Run for all active accounts in one call
CREATE OR REPLACE FUNCTION public.run_savings_cycle(_period_start date, _period_end date)
RETURNS TABLE(processed int, total_net numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; cnt int := 0; total numeric := 0; cyc public.savings_cycles;
BEGIN
  FOR r IN SELECT id FROM savings_accounts WHERE status='active' LOOP
    IF EXISTS (SELECT 1 FROM savings_cycles WHERE account_id = r.id AND period_start = _period_start AND period_end = _period_end) THEN
      CONTINUE;
    END IF;
    cyc := accrue_account_cycle(r.id, _period_start, _period_end);
    cnt := cnt + 1; total := total + cyc.net_interest;
  END LOOP;
  processed := cnt; total_net := total; RETURN NEXT;
END $$;

-- 5. Helper view for member ledger (running balance + monthly interest accruals)
CREATE OR REPLACE VIEW public.member_savings_ledger AS
SELECT
  m.id as member_id, m.member_number, m.full_name,
  sa.id as account_id, sa.account_number, sa.product, sa.balance,
  st.id as txn_id, st.txn_type, st.amount, st.running_balance, st.note, st.posted_at
FROM members m
JOIN savings_accounts sa ON sa.member_id = m.id
LEFT JOIN savings_transactions st ON st.account_id = sa.id;
