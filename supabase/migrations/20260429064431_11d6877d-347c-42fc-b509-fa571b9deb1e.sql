-- Public lookup: returns member id only when (member_number) matches AND (phone or DOB) matches
CREATE OR REPLACE FUNCTION public.lookup_member_for_loan(
  _member_number text,
  _phone text DEFAULT NULL,
  _dob date DEFAULT NULL
)
RETURNS TABLE(member_id uuid, full_name text, is_mor_staff boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.full_name, m.is_mor_staff
  FROM public.members m
  WHERE m.member_number = _member_number
    AND m.status = 'active'
    AND (
      (_phone IS NOT NULL AND m.phone = _phone) OR
      (_dob IS NOT NULL AND m.date_of_birth = _dob)
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_member_for_loan(text, text, date) TO anon, authenticated;

-- Allow public (anon + authenticated) to submit a loan application,
-- but only with status='submitted' and a valid existing member_id.
CREATE POLICY "Public can submit loan applications"
ON public.loan_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'submitted'
  AND member_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.members m WHERE m.id = member_id AND m.status = 'active')
  AND requested_amount > 0
  AND term_months > 0
);
