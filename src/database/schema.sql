-- ============================================================
-- Street Food Review System — Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'store', 'admin')),
  profile_photo TEXT,
  profile_photo_public_id TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: stores
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  cover_image TEXT,
  cover_image_public_id TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  is_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: store_gallery
CREATE TABLE IF NOT EXISTS store_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: foods
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Table: review_images
CREATE TABLE IF NOT EXISTS review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: review_replies
CREATE TABLE IF NOT EXISTS review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: store_suggestions
CREATE TABLE IF NOT EXISTS store_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: store_claims
CREATE TABLE IF NOT EXISTS store_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  claimed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, claimed_by)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_foods_store_id ON foods(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_store_id ON reviews(store_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_review_images_review_id ON review_images(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_store_gallery_store_id ON store_gallery(store_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON store_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_claims_status ON store_claims(status);
