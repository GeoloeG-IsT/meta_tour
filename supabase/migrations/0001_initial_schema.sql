-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT auth.uid(),
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policy for users to insert their own data
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create tours table
CREATE TABLE tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    itinerary JSONB,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tours table
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Create policies for tours
CREATE POLICY "Anyone can view published tours" ON tours
    FOR SELECT USING (status = 'published');

CREATE POLICY "Organizers can view their own tours" ON tours
    FOR SELECT USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create tours" ON tours
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own tours" ON tours
    FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own tours" ON tours
    FOR DELETE USING (auth.uid() = organizer_id);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tour_id, participant_id)
);

-- Enable RLS on bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for bookings
CREATE POLICY "Participants can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid() = participant_id);

CREATE POLICY "Organizers can view bookings for their tours" ON bookings
    FOR SELECT USING (
        auth.uid() IN (
            SELECT organizer_id FROM tours WHERE tours.id = bookings.tour_id
        )
    );

CREATE POLICY "Participants can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = participant_id);

CREATE POLICY "Participants can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid() = participant_id);

CREATE POLICY "Organizers can update bookings for their tours" ON bookings
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT organizer_id FROM tours WHERE tours.id = bookings.tour_id
        )
    );

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
    transaction_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Participants can view payments for their bookings" ON payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT participant_id FROM bookings WHERE bookings.id = payments.booking_id
        )
    );

CREATE POLICY "Organizers can view payments for their tour bookings" ON payments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT organizer_id FROM tours 
            JOIN bookings ON tours.id = bookings.tour_id 
            WHERE bookings.id = payments.booking_id
        )
    );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_tours_organizer_id ON tours(organizer_id);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tours_start_date ON tours(start_date);
CREATE INDEX idx_bookings_tour_id ON bookings(tour_id);
CREATE INDEX idx_bookings_participant_id ON bookings(participant_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);