-- Complete database setup for NASA Weather Explorer
-- Run this in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_locations table
CREATE TABLE IF NOT EXISTS saved_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create weather_cache table for NASA data
CREATE TABLE IF NOT EXISTS weather_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  avg_temperature DECIMAL(5, 2),
  avg_humidity DECIMAL(5, 2),
  avg_rainfall DECIMAL(8, 2),
  avg_wind_speed DECIMAL(5, 2),
  extreme_heat_probability DECIMAL(5, 2),
  heavy_rain_probability DECIMAL(5, 2),
  data_source TEXT DEFAULT 'NASA_POWER',
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(latitude, longitude, month, day)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can update own locations" ON saved_locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON saved_locations;
DROP POLICY IF EXISTS "Weather cache is readable by all authenticated users" ON weather_cache;
DROP POLICY IF EXISTS "Weather cache is writable by service role" ON weather_cache;
DROP POLICY IF EXISTS "Only admins can view system status" ON profiles;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own locations" ON saved_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON saved_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON saved_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON saved_locations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Weather cache is readable by all authenticated users" ON weather_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "Weather cache is writable by service role" ON weather_cache FOR ALL TO service_role USING (true);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();