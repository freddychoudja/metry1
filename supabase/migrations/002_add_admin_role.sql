-- Add admin role to profiles table
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Create policy for admin access to system status
CREATE POLICY "Only admins can view system status" ON profiles 
  FOR SELECT USING (auth.uid() = id AND is_admin = true);