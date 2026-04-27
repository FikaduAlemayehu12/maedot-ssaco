-- Helper: updated_at trigger reuses existing public.touch_updated_at()

-- =========================================================
-- MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  gender text,
  date_of_birth date,
  region text,
  address text,
  status text NOT NULL DEFAULT 'active',
  registration_id uuid REFERENCES public.registrations(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view members"
  ON public.members FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
    OR public.has_role(auth.uid(),'loan_officer')
    OR public.has_role(auth.uid(),'cashier')
    OR public.has_role(auth.uid(),'checker')
    OR public.has_role(auth.uid(),'maker')
  );
CREATE POLICY "Staff can insert members"
  ON public.members FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
    OR public.has_role(auth.uid(),'maker')
  );
CREATE POLICY "Staff can update members"
  ON public.members FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
  );
CREATE POLICY "Admins delete members"
  ON public.members FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_members_touch
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================
-- SAVINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.savings_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  account_number text NOT NULL UNIQUE,
  product text NOT NULL DEFAULT 'regular',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view savings accounts"
  ON public.savings_accounts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
    OR public.has_role(auth.uid(),'cashier')
    OR public.has_role(auth.uid(),'finance_officer')
  );
CREATE POLICY "Staff manage savings accounts"
  ON public.savings_accounts FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
  );

CREATE TRIGGER trg_savings_accounts_touch
BEFORE UPDATE ON public.savings_accounts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.savings_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.savings_accounts(id) ON DELETE CASCADE,
  txn_type text NOT NULL CHECK (txn_type IN ('deposit','withdrawal','interest','fee','adjustment')),
  amount numeric(14,2) NOT NULL,
  running_balance numeric(14,2),
  reference text,
  note text,
  posted_by uuid,
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.savings_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_savings_txn_account ON public.savings_transactions(account_id, posted_at DESC);

CREATE POLICY "Staff view savings txns"
  ON public.savings_transactions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
    OR public.has_role(auth.uid(),'cashier')
    OR public.has_role(auth.uid(),'finance_officer')
  );
CREATE POLICY "Staff post savings txns"
  ON public.savings_transactions FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'savings_officer')
    OR public.has_role(auth.uid(),'cashier')
  );
CREATE POLICY "Admins update/delete savings txns"
  ON public.savings_transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete savings txns"
  ON public.savings_transactions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- LOANS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_number text NOT NULL UNIQUE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  principal numeric(14,2) NOT NULL,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  term_months int NOT NULL,
  purpose text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','active','closed','rejected','defaulted')),
  disbursed_at timestamptz,
  closed_at timestamptz,
  outstanding_balance numeric(14,2) NOT NULL DEFAULT 0,
  approved_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff view loans"
  ON public.loans FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
    OR public.has_role(auth.uid(),'finance_officer')
    OR public.has_role(auth.uid(),'cashier')
  );
CREATE POLICY "Loan officers manage loans"
  ON public.loans FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
  );
CREATE POLICY "Loan officers update loans"
  ON public.loans FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
  );
CREATE POLICY "Admins delete loans"
  ON public.loans FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_loans_touch
BEFORE UPDATE ON public.loans
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  due_date date,
  paid_at timestamptz,
  amount numeric(14,2) NOT NULL,
  principal_portion numeric(14,2) NOT NULL DEFAULT 0,
  interest_portion numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','paid','partial','late','waived')),
  reference text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_repayments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON public.loan_repayments(loan_id, due_date);

CREATE POLICY "Staff view loan repayments"
  ON public.loan_repayments FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
    OR public.has_role(auth.uid(),'finance_officer')
    OR public.has_role(auth.uid(),'cashier')
  );
CREATE POLICY "Staff post loan repayments"
  ON public.loan_repayments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'loan_officer')
    OR public.has_role(auth.uid(),'cashier')
  );
CREATE POLICY "Admins update/delete loan repayments"
  ON public.loan_repayments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete loan repayments"
  ON public.loan_repayments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- FINANCE / GENERAL LEDGER
-- =========================================================
CREATE TABLE IF NOT EXISTS public.gl_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gl_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance view gl accounts"
  ON public.gl_accounts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'finance_officer')
  );
CREATE POLICY "Finance manage gl accounts"
  ON public.gl_accounts FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'finance_officer')
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'finance_officer')
  );

CREATE TRIGGER trg_gl_accounts_touch
BEFORE UPDATE ON public.gl_accounts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.gl_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  account_id uuid NOT NULL REFERENCES public.gl_accounts(id) ON DELETE RESTRICT,
  debit numeric(14,2) NOT NULL DEFAULT 0,
  credit numeric(14,2) NOT NULL DEFAULT 0,
  description text,
  reference text,
  posted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit >= 0 AND credit >= 0),
  CHECK (NOT (debit = 0 AND credit = 0))
);
ALTER TABLE public.gl_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_gl_entries_date ON public.gl_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_gl_entries_account ON public.gl_entries(account_id, entry_date DESC);

CREATE POLICY "Finance view gl entries"
  ON public.gl_entries FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'finance_officer')
  );
CREATE POLICY "Finance post gl entries"
  ON public.gl_entries FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'finance_officer')
  );
CREATE POLICY "Admins update/delete gl entries"
  ON public.gl_entries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete gl entries"
  ON public.gl_entries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
