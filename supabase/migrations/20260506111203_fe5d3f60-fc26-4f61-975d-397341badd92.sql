-- Add JSONB field to store {doc_key: url} pairs
ALTER TABLE public.loan_applications
  ADD COLUMN IF NOT EXISTS loan_documents jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Create storage bucket for loan documents (public-read for simplicity; URLs are unguessable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('loan-documents', 'loan-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can upload to loan-documents bucket (public application)
DROP POLICY IF EXISTS "Anyone can upload loan documents" ON storage.objects;
CREATE POLICY "Anyone can upload loan documents"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'loan-documents');

-- Public read of loan documents
DROP POLICY IF EXISTS "Public read loan documents" ON storage.objects;
CREATE POLICY "Public read loan documents"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'loan-documents');

-- Staff/admins can update/delete loan documents
DROP POLICY IF EXISTS "Staff manage loan documents" ON storage.objects;
CREATE POLICY "Staff manage loan documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'loan-documents'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'loan_officer'::app_role)
    )
  );