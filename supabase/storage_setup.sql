-- Create the tour-images storage bucket
INSERT INTO
    storage.buckets (id, name, public)
VALUES
    ('tour-images', 'tour-images', true);

-- Set up storage policies for tour-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload tour images" ON storage.objects FOR
INSERT
    WITH CHECK (
        bucket_id = 'tour-images'
        AND auth.role() = 'authenticated'
    );

-- Allow public access to view images
CREATE POLICY "Public can view tour images" ON storage.objects FOR
SELECT
    USING (bucket_id = 'tour-images');

-- Allow organizers to delete their own tour images
CREATE POLICY "Organizers can delete their own tour images" ON storage.objects FOR DELETE USING (
    bucket_id = 'tour-images'
    AND auth.role() = 'authenticated'
    AND (
        SELECT
            organizer_id
        FROM
            tours
        WHERE
            id :: text = (string_to_array(name, '/')) [1]
    ) = auth.uid()
);

-- Allow organizers to update their own tour images
CREATE POLICY "Organizers can update their own tour images" ON storage.objects FOR
UPDATE
    USING (
        bucket_id = 'tour-images'
        AND auth.role() = 'authenticated'
        AND (
            SELECT
                organizer_id
            FROM
                tours
            WHERE
                id :: text = (string_to_array(name, '/')) [1]
        ) = auth.uid()
    );