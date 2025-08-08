-- Create tour_images table
CREATE TABLE tour_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on tour_images table
ALTER TABLE
    tour_images ENABLE ROW LEVEL SECURITY;

-- Create policies for tour_images
-- Anyone can view images for published tours
CREATE POLICY "Anyone can view images for published tours" ON tour_images FOR
SELECT
    USING (
        tour_id IN (
            SELECT
                id
            FROM
                tours
            WHERE
                status = 'published'
        )
    );

-- Organizers can view images for their own tours
CREATE POLICY "Organizers can view images for their own tours" ON tour_images FOR
SELECT
    USING (
        tour_id IN (
            SELECT
                id
            FROM
                tours
            WHERE
                organizer_id = auth.uid()
        )
    );

-- Organizers can insert images for their own tours
CREATE POLICY "Organizers can insert images for their own tours" ON tour_images FOR
INSERT
    WITH CHECK (
        tour_id IN (
            SELECT
                id
            FROM
                tours
            WHERE
                organizer_id = auth.uid()
        )
    );

-- Organizers can update images for their own tours
CREATE POLICY "Organizers can update images for their own tours" ON tour_images FOR
UPDATE
    USING (
        tour_id IN (
            SELECT
                id
            FROM
                tours
            WHERE
                organizer_id = auth.uid()
        )
    );

-- Organizers can delete images for their own tours
CREATE POLICY "Organizers can delete images for their own tours" ON tour_images FOR DELETE USING (
    tour_id IN (
        SELECT
            id
        FROM
            tours
        WHERE
            organizer_id = auth.uid()
    )
);

-- Create indexes for better performance
CREATE INDEX idx_tour_images_tour_id ON tour_images(tour_id);

CREATE INDEX idx_tour_images_created_at ON tour_images(created_at);