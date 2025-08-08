-- Ensure the enum type is created first
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE public.availability_status AS ENUM ('available', 'sold_out');
  END IF;
END $$;

-- Alter the table to add the column with the correct type
ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS availability_status public.availability_status 
  NOT NULL DEFAULT 'available'::public.availability_status;

-- Make sure all references use the enum type explicitly
UPDATE public.tours t
SET availability_status = 
  CASE 
    WHEN (
      SELECT COUNT(1) FROM public.bookings b
      WHERE b.tour_id = t.id AND b.status <> 'cancelled'
    ) >= t.max_participants 
    THEN 'sold_out'::public.availability_status
    ELSE 'available'::public.availability_status
  END;

-- Modify functions to explicitly cast to the enum type
CREATE OR REPLACE FUNCTION public.recompute_tour_availability_status(p_tour_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
  v_max INTEGER;
BEGIN
  SELECT COUNT(1) INTO v_count 
  FROM public.bookings b 
  WHERE b.tour_id = p_tour_id AND b.status <> 'cancelled';
  
  SELECT max_participants INTO v_max 
  FROM public.tours t 
  WHERE t.id = p_tour_id;

  UPDATE public.tours t
  SET availability_status = 
    CASE 
      WHEN COALESCE(v_count, 0) >= COALESCE(v_max, 0) 
      THEN 'sold_out'::public.availability_status 
      ELSE 'available'::public.availability_status 
    END
  WHERE t.id = p_tour_id;
END;
$$;