-- Add unique constraint to prevent duplicate locations per user
ALTER TABLE saved_locations 
ADD CONSTRAINT unique_user_location 
UNIQUE (user_id, latitude, longitude);

-- Create index for better performance
CREATE INDEX idx_saved_locations_user_coords 
ON saved_locations (user_id, latitude, longitude);