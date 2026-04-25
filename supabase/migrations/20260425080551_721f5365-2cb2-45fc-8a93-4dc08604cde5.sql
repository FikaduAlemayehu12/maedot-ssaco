DROP POLICY IF EXISTS "Anyone can view brand assets" ON storage.objects;
CREATE POLICY "Public read brand assets scoped" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] IN ('logo','images','public'));