/*
  # Video Webhook Database Schema

  ## Overview
  This migration creates the complete database structure for receiving and storing video generation webhooks from n8n.

  ## New Tables

  ### 1. `users` (if not exists)
    - `id` (uuid, primary key) - Unique user identifier
    - `email` (text, unique) - User email address
    - `full_name` (text) - User's full name
    - `created_at` (timestamptz) - Account creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `videos`
    - `id` (uuid, primary key) - Internal unique identifier
    - `video_id` (text, unique) - External video ID from n8n (e.g., req_1760001914704)
    - `user_id` (uuid, foreign key → users) - Owner of the video
    - `product_name` (text) - Product being promoted
    - `total_scenes` (integer) - Number of scenes in video
    - `duration` (integer) - Video duration in seconds
    - `status` (text) - Current status: pending_approval, approved, rejected, processing, completed
    - `approve_url` (text) - n8n webhook URL to approve video
    - `reject_form_url` (text) - n8n webhook URL to reject video
    - `final_video_url` (text, nullable) - URL of final rendered video
    - `created_at` (timestamptz) - Video creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `approved_at` (timestamptz, nullable) - Approval timestamp

  ### 3. `scenes`
    - `id` (uuid, primary key) - Unique scene identifier
    - `video_id` (text, foreign key → videos.video_id) - Parent video
    - `scene_number` (integer) - Order in sequence (0-indexed)
    - `scene_type` (text) - Type: problem_identification, product_showcase, call_to_action, etc.
    - `image_url` (text) - URL to generated scene image
    - `processing_time` (integer) - Generation time in seconds
    - `status` (text) - Scene status: success, failed, pending
    - `created_at` (timestamptz) - Scene creation timestamp

  ## Security

  ### Row Level Security (RLS)
  All tables have RLS enabled with the following policies:

  - **Users**: Users can only read/update their own profile
  - **Videos**: Users can only access their own videos
  - **Scenes**: Users can only access scenes from their videos
  - **Webhook access**: Service role can insert/update all tables

  ## Indexes
  - `videos.video_id` - Fast lookup by external ID
  - `videos.user_id` - Fast user video queries
  - `scenes.video_id` - Fast scene lookup by video
  - `users.email` - Fast user lookup by email
*/

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  total_scenes integer NOT NULL DEFAULT 0,
  duration integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending_approval',
  approve_url text NOT NULL,
  reject_form_url text NOT NULL,
  final_video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- Create scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL REFERENCES videos(video_id) ON DELETE CASCADE,
  scene_number integer NOT NULL,
  scene_type text NOT NULL,
  image_url text NOT NULL,
  processing_time integer DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_scenes_video_id ON scenes(video_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage users" ON users;
CREATE POLICY "Service role can manage users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for videos table
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
CREATE POLICY "Users can view own videos"
  ON videos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own videos" ON videos;
CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage videos" ON videos;
CREATE POLICY "Service role can manage videos"
  ON videos FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for scenes table
DROP POLICY IF EXISTS "Users can view scenes from own videos" ON scenes;
CREATE POLICY "Users can view scenes from own videos"
  ON scenes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM videos
      WHERE videos.video_id = scenes.video_id
      AND videos.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage scenes" ON scenes;
CREATE POLICY "Service role can manage scenes"
  ON scenes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
