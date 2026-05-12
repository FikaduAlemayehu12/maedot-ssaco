
CREATE OR REPLACE FUNCTION public.sync_savings_balances()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer := 0;
BEGIN
  WITH last_txn AS (
    SELECT DISTINCT ON (account_id) account_id, running_balance
    FROM savings_transactions
    ORDER BY account_id, posted_at DESC, created_at DESC
  )
  UPDATE savings_accounts s
     SET balance = COALESCE(lt.running_balance, s.balance),
         updated_at = now()
    FROM last_txn lt
   WHERE lt.account_id = s.id
     AND s.balance IS DISTINCT FROM lt.running_balance;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- Run once to sync after the historical migration
SELECT public.sync_savings_balances();
