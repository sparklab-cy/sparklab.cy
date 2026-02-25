-- Electrofun Website - Supabase Database Schema
-- This schema defines all tables, relationships, and constraints for the Electrofun platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- PROFILES TABLE
-- Extended user profile information (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- KITS TABLE
-- Physical kits/products that users can purchase
-- ============================================================================
CREATE TABLE IF NOT EXISTS kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  description TEXT NOT NULL,
  qr_code TEXT,
  access_code TEXT,
  kit_type TEXT NOT NULL DEFAULT 'normal' CHECK (kit_type IN ('normal', 'organization')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  premium_upgrade_price DECIMAL(10, 2),
  image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- OFFICIAL COURSES TABLE
-- Official courses created by the platform
-- ============================================================================
CREATE TABLE IF NOT EXISTS official_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
  estimated_duration INTEGER, -- in minutes
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CUSTOM COURSES TABLE
-- User-created courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estimated_duration INTEGER, -- in minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- LESSONS TABLE
-- Lessons for both official and custom courses
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL,
  course_type TEXT NOT NULL CHECK (course_type IN ('official', 'custom')),
  title TEXT NOT NULL,
  content TEXT,
  svelte_component TEXT,
  component_props JSONB DEFAULT '{}'::jsonb,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'video', 'interactive', 'quiz', 'code', 'svelte')),
  order_index INTEGER NOT NULL DEFAULT 0,
  estimated_duration INTEGER, -- in minutes
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Note: Course ID validation is handled by application logic and triggers
  -- since PostgreSQL doesn't support subqueries in CHECK constraints
);

-- ============================================================================
-- KIT CODES TABLE
-- QR codes and access codes for kit redemption
-- ============================================================================
CREATE TABLE IF NOT EXISTS kit_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL CHECK (code_type IN ('qr', 'access_code')),
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ============================================================================
-- USER PERMISSIONS TABLE
-- Tracks user permissions for kits (course access, custom course creation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('course_access', 'custom_course_creation')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, kit_id, permission_type)
);

-- ============================================================================
-- USER KITS TABLE (Junction Table)
-- Alternative way to track user kit access (used in profile page)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, kit_id)
);

-- ============================================================================
-- PURCHASES TABLE
-- Records of kit purchases
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'code_redemption', 'admin_grant')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  kit_code_id UUID REFERENCES kit_codes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- ORDERS TABLE
-- Order records for checkout process
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  billing_address JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ORDER ITEMS TABLE
-- Items within an order
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  kit_id UUID REFERENCES kits(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('kit', 'course', 'upgrade')),
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- USER LESSON PROGRESS TABLE
-- Tracks user progress through lessons
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  course_type TEXT NOT NULL CHECK (course_type IN ('official', 'custom')),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- Email templates for various notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- array of variable names
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EMAIL LOGS TABLE
-- Logs of sent emails
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for better query performance
-- ============================================================================

-- Kits indexes
CREATE INDEX IF NOT EXISTS idx_kits_theme ON kits(theme);
CREATE INDEX IF NOT EXISTS idx_kits_level ON kits(level);
CREATE INDEX IF NOT EXISTS idx_kits_kit_type ON kits(kit_type);

-- Official courses indexes
CREATE INDEX IF NOT EXISTS idx_official_courses_kit_id ON official_courses(kit_id);
CREATE INDEX IF NOT EXISTS idx_official_courses_is_published ON official_courses(is_published);
CREATE INDEX IF NOT EXISTS idx_official_courses_level ON official_courses(level);

-- Custom courses indexes
CREATE INDEX IF NOT EXISTS idx_custom_courses_creator_id ON custom_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_custom_courses_kit_id ON custom_courses(kit_id);
CREATE INDEX IF NOT EXISTS idx_custom_courses_is_public ON custom_courses(is_public);
CREATE INDEX IF NOT EXISTS idx_custom_courses_is_published ON custom_courses(is_published);

-- Lessons indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_type ON lessons(course_type);
CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON lessons(course_id, course_type, order_index);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);

-- Kit codes indexes
CREATE INDEX IF NOT EXISTS idx_kit_codes_code ON kit_codes(code);
CREATE INDEX IF NOT EXISTS idx_kit_codes_kit_id ON kit_codes(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_codes_is_used ON kit_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_kit_codes_used_by ON kit_codes(used_by);

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_kit_id ON user_permissions(kit_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_type ON user_permissions(permission_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at ON user_permissions(expires_at);

-- User kits indexes
CREATE INDEX IF NOT EXISTS idx_user_kits_user_id ON user_kits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_kits_kit_id ON user_kits(kit_id);

-- Purchases indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_kit_id ON purchases(kit_id);
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_payment_intent_id ON purchases(stripe_payment_intent_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_kit_id ON order_items(kit_id);

-- User lesson progress indexes
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON user_lesson_progress(course_id, course_type);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_status ON user_lesson_progress(status);

-- Email logs indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_id ON email_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- ============================================================================
-- TRIGGERS for updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kits_updated_at BEFORE UPDATE ON kits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_official_courses_updated_at BEFORE UPDATE ON official_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_courses_updated_at BEFORE UPDATE ON custom_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are created automatically by trigger on user signup
-- The trigger function has SECURITY DEFINER so it can insert regardless of RLS
-- Allow inserts for the trigger (it uses SECURITY DEFINER)
CREATE POLICY "Profiles can be created by trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- KITS POLICIES
-- ============================================================================

-- Anyone can view published kits
CREATE POLICY "Kits are viewable by everyone" ON kits
  FOR SELECT USING (true);

-- Only admins can modify kits
CREATE POLICY "Only admins can insert kits" ON kits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update kits" ON kits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete kits" ON kits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- OFFICIAL COURSES POLICIES
-- ============================================================================

-- Anyone can view published official courses
CREATE POLICY "Published official courses are viewable by everyone" ON official_courses
  FOR SELECT USING (is_published = true OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can modify official courses
CREATE POLICY "Only admins can modify official courses" ON official_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- CUSTOM COURSES POLICIES
-- ============================================================================

-- Anyone can view published public custom courses, or their own courses
CREATE POLICY "Custom courses are viewable based on privacy" ON custom_courses
  FOR SELECT USING (
    (is_published = true AND is_public = true) OR
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create custom courses if they have permission
CREATE POLICY "Users can create custom courses with permission" ON custom_courses
  FOR INSERT WITH CHECK (
    creator_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_id = auth.uid()
      AND kit_id = custom_courses.kit_id
      AND permission_type = 'custom_course_creation'
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Users can update their own courses, admins can update any
CREATE POLICY "Users can update their own custom courses" ON custom_courses
  FOR UPDATE USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete their own courses, admins can delete any
CREATE POLICY "Users can delete their own custom courses" ON custom_courses
  FOR DELETE USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- LESSONS POLICIES
-- ============================================================================

-- Users can view lessons if they have access to the course
CREATE POLICY "Lessons are viewable with course access" ON lessons
  FOR SELECT USING (
    -- If official course, check if user has kit access
    (course_type = 'official' AND EXISTS (
      SELECT 1 FROM official_courses oc
      JOIN user_permissions up ON up.kit_id = oc.kit_id
      WHERE oc.id = lessons.course_id
      AND up.user_id = auth.uid()
      AND up.permission_type = 'course_access'
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
    )) OR
    -- If custom course, check if it's public and published, or user is creator
    (course_type = 'custom' AND EXISTS (
      SELECT 1 FROM custom_courses cc
      WHERE cc.id = lessons.course_id
      AND ((cc.is_published = true AND cc.is_public = true) OR cc.creator_id = auth.uid())
    )) OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins and course creators can modify lessons
CREATE POLICY "Only admins and creators can modify lessons" ON lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    (course_type = 'custom' AND EXISTS (
      SELECT 1 FROM custom_courses
      WHERE id = lessons.course_id AND creator_id = auth.uid()
    ))
  );

-- ============================================================================
-- KIT CODES POLICIES
-- ============================================================================

-- Only admins can view all kit codes
CREATE POLICY "Only admins can view kit codes" ON kit_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    used_by = auth.uid() -- Users can see codes they've used
  );

-- Only admins can modify kit codes
CREATE POLICY "Only admins can modify kit codes" ON kit_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- USER PERMISSIONS POLICIES
-- ============================================================================

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions" ON user_permissions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can modify permissions
CREATE POLICY "Only admins can modify permissions" ON user_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- USER KITS POLICIES
-- ============================================================================

-- Users can view their own kit access
CREATE POLICY "Users can view their own kits" ON user_kits
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can insert user kits (via triggers or admin actions)
CREATE POLICY "Admins can modify user kits" ON user_kits
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- PURCHASES POLICIES
-- ============================================================================

-- Users can view their own purchases
CREATE POLICY "Users can view their own purchases" ON purchases
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- System can create purchases (via payment processing)
CREATE POLICY "System can create purchases" ON purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can update purchases
CREATE POLICY "Only admins can update purchases" ON purchases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ORDERS POLICIES
-- ============================================================================

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create their own orders
CREATE POLICY "Users can create their own orders" ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own orders, admins can update any
CREATE POLICY "Users can update their own orders" ON orders
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- ORDER ITEMS POLICIES
-- ============================================================================

-- Users can view items in their own orders
CREATE POLICY "Users can view their own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create items for their own orders
CREATE POLICY "Users can create items for their own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- USER LESSON PROGRESS POLICIES
-- ============================================================================

-- Users can view their own progress
CREATE POLICY "Users can view their own progress" ON user_lesson_progress
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create and update their own progress
CREATE POLICY "Users can manage their own progress" ON user_lesson_progress
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- EMAIL TEMPLATES POLICIES
-- ============================================================================

-- Only admins can view and modify email templates
-- But allow service role to read templates (for email service)
CREATE POLICY "Only admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow service role to read templates (needed for email service)
-- This is handled by the service role key which bypasses RLS
-- But we also need a function for reading templates

-- ============================================================================
-- EMAIL LOGS POLICIES
-- ============================================================================

-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system/admins can create email logs
CREATE POLICY "Only admins can create email logs" ON email_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTION to create email template (bypasses RLS for service operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION create_email_template(
  p_name TEXT,
  p_subject TEXT,
  p_html_content TEXT,
  p_text_content TEXT,
  p_variables JSONB DEFAULT '[]'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
BEGIN
  INSERT INTO email_templates (name, subject, html_content, text_content, variables)
  VALUES (p_name, p_subject, p_html_content, p_text_content, p_variables)
  ON CONFLICT (name) DO UPDATE SET
    subject = EXCLUDED.subject,
    html_content = EXCLUDED.html_content,
    text_content = EXCLUDED.text_content,
    variables = EXCLUDED.variables,
    updated_at = NOW()
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION to get email template (bypasses RLS for service operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_email_template(p_name TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  subject TEXT,
  html_content TEXT,
  text_content TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id,
    et.name,
    et.subject,
    et.html_content,
    et.text_content,
    et.variables,
    et.created_at,
    et.updated_at
  FROM email_templates et
  WHERE et.name = p_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION to log email (bypasses RLS for service operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION log_email(
  p_user_id UUID,
  p_template_id UUID,
  p_to_email TEXT,
  p_subject TEXT,
  p_content TEXT,
  p_status TEXT DEFAULT 'pending'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO email_logs (user_id, template_id, to_email, subject, content, status)
  VALUES (p_user_id, p_template_id, p_to_email, p_subject, p_content, p_status)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION to automatically create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    'student',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION to sync user_permissions with user_kits
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_kits_on_permission()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user gets course_access permission, add to user_kits
  IF NEW.permission_type = 'course_access' THEN
    INSERT INTO user_kits (user_id, kit_id)
    VALUES (NEW.user_id, NEW.kit_id)
    ON CONFLICT (user_id, kit_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_kits_trigger
  AFTER INSERT ON user_permissions
  FOR EACH ROW
  WHEN (NEW.permission_type = 'course_access')
  EXECUTE FUNCTION sync_user_kits_on_permission();

-- ============================================================================
-- FUNCTION to validate lesson course_id based on course_type
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_lesson_course_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that course_id exists in the appropriate table based on course_type
  IF NEW.course_type = 'official' THEN
    IF NOT EXISTS (SELECT 1 FROM official_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'course_id % does not exist in official_courses', NEW.course_id;
    END IF;
  ELSIF NEW.course_type = 'custom' THEN
    IF NOT EXISTS (SELECT 1 FROM custom_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'course_id % does not exist in custom_courses', NEW.course_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid course_type: %', NEW.course_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_lesson_course_id_trigger
  BEFORE INSERT OR UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION validate_lesson_course_id();

-- ============================================================================
-- FUNCTION to validate user_lesson_progress course_id based on course_type
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_progress_course_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that course_id exists in the appropriate table based on course_type
  IF NEW.course_type = 'official' THEN
    IF NOT EXISTS (SELECT 1 FROM official_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'course_id % does not exist in official_courses', NEW.course_id;
    END IF;
  ELSIF NEW.course_type = 'custom' THEN
    IF NOT EXISTS (SELECT 1 FROM custom_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'course_id % does not exist in custom_courses', NEW.course_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid course_type: %', NEW.course_type;
  END IF;
  
  -- Also validate that the lesson belongs to this course
  IF NOT EXISTS (
    SELECT 1 FROM lessons 
    WHERE id = NEW.lesson_id 
    AND course_id = NEW.course_id 
    AND course_type = NEW.course_type
  ) THEN
    RAISE EXCEPTION 'lesson_id % does not belong to course_id % of type %', NEW.lesson_id, NEW.course_id, NEW.course_type;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_progress_course_id_trigger
  BEFORE INSERT OR UPDATE ON user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION validate_progress_course_id();

-- ============================================================================
-- FUNCTION to grant course access after successful purchase
-- ============================================================================

CREATE OR REPLACE FUNCTION grant_access_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- When a purchase is completed, grant course access
  IF NEW.payment_status = 'completed' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'completed') THEN
    INSERT INTO user_permissions (user_id, kit_id, permission_type)
    VALUES (NEW.user_id, NEW.kit_id, 'course_access')
    ON CONFLICT (user_id, kit_id, permission_type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grant_access_on_purchase_trigger
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION grant_access_on_purchase();

-- ============================================================================
-- INITIAL DATA (Optional - Seed data)
-- ============================================================================

-- Insert default email templates (optional)
-- These will be created by the application if needed, but we can seed them here

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE kits IS 'Physical kits/products available for purchase';
COMMENT ON TABLE official_courses IS 'Official courses created by the platform';
COMMENT ON TABLE custom_courses IS 'User-created courses';
COMMENT ON TABLE lessons IS 'Lessons within courses (both official and custom)';
COMMENT ON TABLE kit_codes IS 'QR codes and access codes for kit redemption';
COMMENT ON TABLE user_permissions IS 'User permissions for kits (course access, custom course creation)';
COMMENT ON TABLE user_kits IS 'Junction table tracking user kit access';
COMMENT ON TABLE purchases IS 'Purchase records for kits';
COMMENT ON TABLE orders IS 'Order records from checkout process';
COMMENT ON TABLE order_items IS 'Items within orders';
COMMENT ON TABLE user_lesson_progress IS 'User progress tracking for lessons';
COMMENT ON TABLE email_templates IS 'Email templates for notifications';
COMMENT ON TABLE email_logs IS 'Logs of sent emails';

