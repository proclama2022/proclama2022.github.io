-- Migration 001: Initial Database Schema for Plantid v2.0 Community
-- Creates core tables: profiles, follows, plants, watering_history
--
-- This migration establishes the foundation for community features:
-- - User profiles with display names, bios, and avatars
-- - Social follow relationships between users
-- - Plant collection sync from local storage
-- - Watering history timeline
--
-- RLS policies and triggers are added in migration 002

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Profiles Table
-- ============================================================================
-- Extends auth.users with profile information
-- One-to-one relationship with auth.users (id references auth.users.id)

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(display_name) <= 50),
  bio TEXT CHECK (char_length(bio) <= 500),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for profile lookup by display name (useful for search)
CREATE INDEX IF NOT EXISTS profiles_display_name_idx ON profiles(display_name);

-- ============================================================================
-- Follows Table
-- ============================================================================
-- Tracks follow relationships between users
-- Composite primary key prevents duplicate follows

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),

  -- Prevent users from following themselves
  CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
);

-- Index for fetching user's followers (people following this user)
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

-- Index for fetching user's following (people this user follows)
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);

-- ============================================================================
-- Plants Table
-- ============================================================================
-- Synced plant collections from local AsyncStorage
-- RLS ensures users can only access their own plants

CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  species TEXT NOT NULL,
  common_name TEXT,
  scientific_name TEXT,
  nickname TEXT,
  location TEXT,
  photo_urls TEXT[] DEFAULT '{}',
  added_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  purchase_date TEXT,
  purchase_price TEXT,
  purchase_origin TEXT,
  gift_from TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user's plants (most common query pattern)
CREATE INDEX IF NOT EXISTS plants_user_id_idx ON plants(user_id);

-- Index for plant species (useful for community features)
CREATE INDEX IF NOT EXISTS plants_species_idx ON plants(species);

-- ============================================================================
-- Watering History Table
-- ============================================================================
-- Tracks watering events for each plant
-- RLS ensures users can only access their own watering history

CREATE TABLE IF NOT EXISTS watering_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  watered_date TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching plant's watering history (ordered by date)
CREATE INDEX IF NOT EXISTS watering_history_plant_id_idx ON watering_history(plant_id, watered_date DESC);

-- Index for user's watering history across all plants
CREATE INDEX IF NOT EXISTS watering_history_user_id_idx ON watering_history(user_id, watered_date DESC);

-- ============================================================================
-- Comments
-- ============================================================================
-- Tables are created without RLS policies for now.
-- Row Level Security policies are added in migration 002.
-- Triggers for auto-creating profiles and updating timestamps are in migration 002.
