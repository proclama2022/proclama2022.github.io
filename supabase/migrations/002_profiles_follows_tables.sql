-- Migration 002: RLS Policies and Triggers
-- Enables Row Level Security on all tables and creates access policies
-- Creates auto-profile creation trigger and timestamp update triggers

-- ============================================================================
-- Enable Row Level Security on all tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE watering_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Profiles Table RLS Policies
-- ============================================================================

-- Policy: Authenticated users can read all profiles (public profile viewing)
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: No direct inserts (handled by trigger)
-- Note: We don't create an INSERT policy since profile creation is handled by trigger

-- ============================================================================
-- Follows Table RLS Policies
-- ============================================================================

-- Policy: Users can view follows where they are follower or following
CREATE POLICY "Users can view own follows"
  ON follows
  FOR SELECT
  TO authenticated
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Policy: Users can create follows where they are the follower
CREATE POLICY "Users can create follows"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can delete follows where they are the follower
CREATE POLICY "Users can delete own follows"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- ============================================================================
-- Plants Table RLS Policies
-- ============================================================================

-- Policy: Users have full CRUD access to their own plants
CREATE POLICY "Users can view own plants"
  ON plants
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants"
  ON plants
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants"
  ON plants
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants"
  ON plants
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Watering History Table RLS Policies
-- ============================================================================

-- Policy: Users have full CRUD access to their own watering history
CREATE POLICY "Users can view own watering history"
  ON watering_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watering history"
  ON watering_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watering history"
  ON watering_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watering history"
  ON watering_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    -- Extract username from email (part before @)
    split_part(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Call handle_new_user() when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Trigger Function: Update updated_at timestamp on profile changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update profiles.updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update plants.updated_at
DROP TRIGGER IF EXISTS update_plants_updated_at ON plants;

CREATE TRIGGER update_plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions for Profile Stats
-- ============================================================================

-- Function: Get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE following_id = user_id;
$$ LANGUAGE sql STABLE;

-- Function: Get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE follower_id = user_id;
$$ LANGUAGE sql STABLE;

-- Function: Get plants identified count for a user
CREATE OR REPLACE FUNCTION get_plants_count(user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)
  FROM plants
  WHERE user_id = user_id;
$$ LANGUAGE sql STABLE;
