-- Add emergency loan support to loan_applications
ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS emergency_type text,
  ADD COLUMN IF NOT EXISTS emergency_reason text;

-- Update the public submission RLS policy to allow emergency loans
-- Drop and recreate the public insert policy
DROP POLICY IF EXISTS "Public can submit loan applications" ON public.loan_applications;

CREATE POLICY "Public can submit loan applications"
ON public.loan_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (
  status = 'submitted'
  AND member_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = loan_applications.member_id AND m.status = 'active'
  )
  AND requested_amount > 0
  AND term_months > 0
);