
REVOKE EXECUTE ON FUNCTION public.compute_loan_rate(int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.compute_disbursement_fee(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.eligible_loan_max(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.accrue_monthly_savings_interest(date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_loan_schedule(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.compute_loan_rate(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.compute_disbursement_fee(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eligible_loan_max(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accrue_monthly_savings_interest(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_loan_schedule(uuid) TO authenticated;
