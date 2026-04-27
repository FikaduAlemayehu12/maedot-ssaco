-- 1) Extend role enum with module-specific roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'inventory_clerk';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'loan_officer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'savings_officer';
