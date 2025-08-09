-- Add bio field to users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create avatars storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for avatars bucket
-- Allow public read
CREATE POLICY "Public can view avatars" ON storage.objects
FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to avatars bucket
CREATE POLICY "Authenticated can upload avatars" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND auth.role() = 'authenticated'
);

-- Allow users to update/delete only their own files under path `${auth.uid()}/...`
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (string_to_array(name, '/'))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' AND auth.role() = 'authenticated' AND (string_to_array(name, '/'))[1] = auth.uid()::text
);