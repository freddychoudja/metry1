-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  destination TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trips" ON trips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trips" ON trips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trips" ON trips FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON trips(start_date);