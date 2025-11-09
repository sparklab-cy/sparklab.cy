# Electrofun Database Schema

This directory contains the Supabase database schema for the Electrofun website.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Set them in your environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the Schema

#### Option A: Using Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `schema.sql`
4. Paste and execute the SQL

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

#### Option C: Using psql

```bash
# Get your database connection string from Supabase dashboard
# Settings > Database > Connection string (use the Transaction pooler)

psql "your-connection-string" -f schema.sql
```

### 3. Verify the Schema

After running the schema, verify that all tables were created:

```sql
-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## Schema Overview

### Core Tables

- **profiles** - User profile information (extends Supabase auth.users)
- **kits** - Physical kits/products available for purchase
- **official_courses** - Official courses created by the platform
- **custom_courses** - User-created courses
- **lessons** - Lessons within courses (both official and custom)
- **kit_codes** - QR codes and access codes for kit redemption

### User Data Tables

- **user_permissions** - User permissions for kits (course access, custom course creation)
- **user_kits** - Junction table tracking user kit access
- **user_lesson_progress** - User progress tracking for lessons

### Commerce Tables

- **purchases** - Purchase records for kits
- **orders** - Order records from checkout process
- **order_items** - Items within orders

### System Tables

- **email_templates** - Email templates for notifications
- **email_logs** - Logs of sent emails

## Key Features

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only view/modify their own data
- Admins have full access
- Public data (kits, published courses) is viewable by everyone

### Automatic Triggers

1. **Profile Creation** - Automatically creates a profile when a user signs up
2. **User Kits Sync** - Automatically adds to `user_kits` when permissions are granted
3. **Access Granting** - Automatically grants course access when a purchase is completed
4. **Data Validation** - Validates course_id and course_type relationships

### Indexes

All tables have appropriate indexes for optimal query performance:
- Foreign key indexes
- Frequently queried columns (user_id, kit_id, status, etc.)
- Composite indexes for common query patterns

## Testing the Schema

### Create a Test User

```sql
-- This will be handled automatically by Supabase Auth
-- But you can verify the profile was created:
SELECT * FROM profiles WHERE id = 'user-uuid';
```

### Create a Test Kit (as Admin)

```sql
-- First, set a user as admin
UPDATE profiles SET role = 'admin' WHERE id = 'your-user-id';

-- Then create a kit
INSERT INTO kits (name, theme, level, description, price, kit_type)
VALUES ('Test Kit', 'Test Theme', 1, 'A test kit', 99.99, 'normal');
```

### Grant Kit Access

```sql
-- Grant access to a user
INSERT INTO user_permissions (user_id, kit_id, permission_type)
VALUES ('user-id', 'kit-id', 'course_access');
```

## Common Queries

### Get User's Kits

```sql
SELECT k.* 
FROM kits k
JOIN user_permissions up ON up.kit_id = k.id
WHERE up.user_id = 'user-id'
  AND up.permission_type = 'course_access'
  AND (up.expires_at IS NULL OR up.expires_at > NOW());
```

### Get User's Progress

```sql
SELECT 
  ulp.*,
  l.title as lesson_title,
  l.course_id,
  l.course_type
FROM user_lesson_progress ulp
JOIN lessons l ON l.id = ulp.lesson_id
WHERE ulp.user_id = 'user-id'
ORDER BY ulp.updated_at DESC;
```

### Get Published Courses for a Kit

```sql
-- Official courses
SELECT * FROM official_courses
WHERE kit_id = 'kit-id' AND is_published = true;

-- Custom courses
SELECT * FROM custom_courses
WHERE kit_id = 'kit-id' 
  AND is_published = true 
  AND is_public = true;
```

## Troubleshooting

### Error: "permission denied for table"

Make sure RLS policies are set up correctly. You may need to temporarily disable RLS to test:

```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Test your queries
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Error: "relation does not exist"

Make sure you've run the entire schema.sql file. Some tables depend on others being created first.

### Error: "trigger function does not exist"

Make sure all functions are created before the triggers that use them. The schema.sql file is ordered correctly.

## Next Steps

1. Set up environment variables in your application
2. Test authentication flow
3. Create initial admin user
4. Seed initial data (kits, courses, etc.)
5. Test purchase and redemption flows

## Notes

- The schema uses UUIDs for all primary keys
- Timestamps use TIMESTAMPTZ (timezone-aware)
- JSONB is used for flexible data structures (images, features, specifications)
- All tables have `created_at` and `updated_at` timestamps
- Automatic triggers update `updated_at` timestamps

