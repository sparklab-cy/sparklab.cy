# Code Review - Electrofun Website

## Executive Summary

This review covers the database schema, application code, security, performance, and best practices. The codebase is well-structured overall, but there are several critical issues and areas for improvement.

## 🔴 Critical Issues

### 1. Profile Creation Policy Conflict
**Location:** `database/schema.sql` lines 387-393

**Issue:** The profile INSERT policy requires admin role, but the trigger `handle_new_user()` needs to automatically create profiles when users sign up. This will cause new user registrations to fail.

**Fix:**
```sql
-- Remove the admin-only INSERT policy and replace with:
CREATE POLICY "Profiles can be created by trigger" ON profiles
  FOR INSERT WITH CHECK (true); -- Trigger function has SECURITY DEFINER

-- OR better: Only allow insert if it's the user's own profile (handled by trigger)
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
```

### 2. Race Condition in Code Redemption
**Location:** `src/routes/redeem/+page.server.ts` lines 34-80

**Issue:** There's a time window between checking if a code is used and marking it as used. Multiple users could redeem the same code simultaneously.

**Fix:** Use a database transaction or add a unique constraint check:
```typescript
// Use Supabase transaction or add a check constraint
const { data: kitCode, error: codeError } = await supabase
  .from('kit_codes')
  .select('*, kit:kits(*)')
  .eq('code', code.trim())
  .eq('is_used', false) // Add this filter
  .single();

// Then immediately update with a WHERE clause that checks is_used
const { error: updateError } = await supabase
  .from('kit_codes')
  .update({
    is_used: true,
    used_by: user.id,
    used_at: new Date().toISOString()
  })
  .eq('id', kitCode.id)
  .eq('is_used', false); // Critical: Only update if still unused
```

### 3. Null User Handling in Profile Queries
**Location:** `src/routes/+layout.server.ts` line 5-8

**Issue:** If `user` is null, the profile query will fail or return an error.

**Fix:**
```typescript
export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { user } = await locals.safeGetSession();
    
    let profile = null;
    if (user) {
        const { data, error } = await locals.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        profile = data;
        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
        }
    }

    const isAdmin = profile?.role === 'admin';

    return {
        user,
        profile,
        isAdmin,
    }
};
```

### 4. Hardcoded OAuth Redirect URL
**Location:** `src/routes/auth/google/+server.ts` line 10

**Issue:** Hardcoded localhost URL will break in production.

**Fix:**
```typescript
const redirectUrl = import.meta.env.PUBLIC_SITE_URL 
  ? `${import.meta.env.PUBLIC_SITE_URL}/auth/callback`
  : `${event.url.origin}/auth/callback`;

const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: redirectUrl
    }
});
```

### 5. Manual Cookie Setting Conflicts with SSR
**Location:** `src/routes/auth/callback/+server.ts` lines 22-36

**Issue:** Manually setting cookies might conflict with Supabase SSR client's cookie management. The SSR client already handles cookies automatically.

**Fix:** Remove manual cookie setting - the SSR client handles this:
```typescript
// Remove lines 22-36 - Supabase SSR handles cookies automatically
```

## 🟡 Important Issues

### 6. Code Generation Collision Risk
**Location:** `src/routes/admin/kits/+page.server.ts` line 261

**Issue:** The `generateUniqueCode()` function uses `Math.random()` which could generate duplicate codes, especially when generating many codes at once.

**Fix:** Use crypto-safe random generation and check for uniqueness:
```typescript
import { randomBytes } from 'crypto';

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(8);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Better: Generate codes in a loop with uniqueness check
async function generateUniqueCodes(quantity: number, supabase: SupabaseClient): Promise<string[]> {
  const codes: string[] = [];
  const maxAttempts = quantity * 10; // Prevent infinite loop
  let attempts = 0;
  
  while (codes.length < quantity && attempts < maxAttempts) {
    const code = generateUniqueCode();
    // Check if code exists
    const { data } = await supabase
      .from('kit_codes')
      .select('id')
      .eq('code', code)
      .single();
    
    if (!data) {
      codes.push(code);
    }
    attempts++;
  }
  
  if (codes.length < quantity) {
    throw new Error('Failed to generate unique codes');
  }
  
  return codes;
}
```

### 7. Missing Transaction Handling
**Location:** Multiple files (redeem, purchase, etc.)

**Issue:** Multi-step database operations (e.g., mark code as used + grant permission + record purchase) are not atomic. If one step fails, data can be inconsistent.

**Fix:** Use database functions or implement proper error handling with rollback:
```typescript
// Option 1: Use a database function
CREATE OR REPLACE FUNCTION redeem_kit_code(
  p_code TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_kit_code kit_codes%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Lock the code row
  SELECT * INTO v_kit_code
  FROM kit_codes
  WHERE code = p_code
  AND is_used = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or used code');
  END IF;
  
  -- Check expiration
  IF v_kit_code.expires_at IS NOT NULL AND v_kit_code.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code expired');
  END IF;
  
  -- Mark as used
  UPDATE kit_codes
  SET is_used = true, used_by = p_user_id, used_at = NOW()
  WHERE id = v_kit_code.id;
  
  -- Grant permission
  INSERT INTO user_permissions (user_id, kit_id, permission_type)
  VALUES (p_user_id, v_kit_code.kit_id, 'course_access')
  ON CONFLICT DO NOTHING;
  
  -- Record purchase
  INSERT INTO purchases (user_id, kit_id, amount, currency, payment_method, payment_status, kit_code_id, completed_at)
  VALUES (p_user_id, v_kit_code.kit_id, 0, 'USD', 'code_redemption', 'completed', v_kit_code.id, NOW());
  
  RETURN jsonb_build_object('success', true, 'kit_id', v_kit_code.kit_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8. Duplicate Admin Permission Checks
**Location:** Multiple admin route files

**Issue:** Admin permission checking is repeated in every action. This should be abstracted.

**Fix:** Create a helper function:
```typescript
// src/lib/utils/auth.ts
export async function requireAdmin(supabase: SupabaseClient, userId: string | undefined): Promise<{ isAdmin: boolean; profile: any }> {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || profile?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  
  return { isAdmin: true, profile };
}

// Usage:
export const actions: Actions = {
  createKit: async ({ request, locals }) => {
    const { user, supabase } = locals;
    await requireAdmin(supabase, user?.id);
    // ... rest of code
  }
};
```

### 9. Missing Input Validation
**Location:** Multiple action handlers

**Issue:** Form data is used without proper validation (type checking, sanitization, length limits).

**Fix:** Add validation:
```typescript
import { z } from 'zod';

const kitSchema = z.object({
  name: z.string().min(1).max(200),
  theme: z.string().min(1).max(100),
  level: z.number().int().min(1).max(10),
  description: z.string().min(1).max(5000),
  price: z.number().nonnegative(),
  kit_type: z.enum(['normal', 'organization'])
});

export const actions: Actions = {
  createKit: async ({ request, locals }) => {
    // ... admin check
    
    const formData = await request.formData();
    const rawData = {
      name: formData.get('name'),
      theme: formData.get('theme'),
      level: parseInt(formData.get('level') as string),
      description: formData.get('description'),
      price: parseFloat(formData.get('price') as string),
      kit_type: formData.get('kit_type')
    };
    
    const validated = kitSchema.parse(rawData); // Throws if invalid
    // ... use validated data
  }
};
```

### 10. Inconsistent Error Handling
**Location:** Throughout the codebase

**Issue:** Some functions throw errors, others return error objects, and some silently fail.

**Fix:** Standardize error handling:
```typescript
// Create a standard error response type
type ActionResult<T = any> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Use consistently:
export const actions: Actions = {
  createKit: async ({ request, locals }): Promise<ActionResult<{ kitId: string }>> => {
    try {
      // ... validation and logic
      return { success: true, data: { kitId: kit.id } };
    } catch (error) {
      console.error('Failed to create kit:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create kit',
        code: 'KIT_CREATE_FAILED'
      };
    }
  }
};
```

## 🟢 Performance Improvements

### 11. N+1 Query Problem in Profile Page
**Location:** `src/routes/profile/+page.server.ts` lines 44-62

**Issue:** The query joins lessons with courses, but the structure might cause multiple queries.

**Fix:** Optimize the query:
```typescript
// Use a single query with proper joins
const { data: userProgress, error: progressError } = await supabase
  .from('user_lesson_progress')
  .select(`
    *,
    lessons!inner(id, title, course_id, course_type),
    official_courses!user_lesson_progress_course_id_fkey(id, title),
    custom_courses!user_lesson_progress_course_id_fkey(id, title)
  `)
  .eq('user_id', user.id);
```

### 12. Missing Pagination
**Location:** Multiple list queries

**Issue:** No pagination on kits, courses, purchases, etc. Could cause performance issues as data grows.

**Fix:** Add pagination:
```typescript
export const load: PageServerLoad = async ({ url, locals }) => {
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('kits')
    .select('*', { count: 'exact' })
    .order('level', { ascending: true })
    .range(offset, offset + limit - 1);
  
  return {
    kits: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  };
};
```

### 13. Missing Database Indexes
**Location:** `database/schema.sql`

**Issue:** Some frequently queried combinations don't have composite indexes.

**Fix:** Add missing indexes:
```sql
-- Composite index for user_permissions queries
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_kit_type 
  ON user_permissions(user_id, kit_id, permission_type);

-- Index for expired permissions cleanup
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires_at_not_null 
  ON user_permissions(expires_at) 
  WHERE expires_at IS NOT NULL;

-- Index for user progress by course
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_course 
  ON user_lesson_progress(user_id, course_id, course_type);
```

## 🔵 Best Practices & Code Quality

### 14. Type Safety Issues
**Location:** Multiple files

**Issue:** Using `any` types, missing type definitions, loose type assertions.

**Fix:** Improve type safety:
```typescript
// Define proper types
interface KitFormData {
  name: string;
  theme: string;
  level: number;
  description: string;
  price: number;
  kit_type: 'normal' | 'organization';
}

// Use type guards
function isKitFormData(data: unknown): data is KitFormData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'theme' in data &&
    // ... more checks
  );
}
```

### 15. Client-Side Supabase Client Usage
**Location:** `src/lib/supabaseClient.ts`

**Issue:** Using the client-side client in services that run on the server.

**Fix:** Pass the server client from `locals`:
```typescript
// In courseService.ts
export class CourseService {
  constructor(private supabase: SupabaseClient) {}
  
  async getKits(): Promise<Kit[]> {
    const { data, error } = await this.supabase
      .from('kits')
      .select('*')
      .order('level', { ascending: true });
    // ...
  }
}

// In page.server.ts
import { courseService } from '$lib/services/courseService';
const service = new CourseService(locals.supabase);
```

### 16. Email Logging Policy Issue
**Location:** `database/schema.sql` lines 736-742

**Issue:** Email logs can only be created by admins, but the email service (which runs server-side) needs to create logs.

**Fix:** Allow service role or use a database function:
```sql
-- Option 1: Allow inserts from service role (handled by RLS bypass)
-- Option 2: Create a function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_email(
  p_user_id UUID,
  p_template_id UUID,
  p_to_email TEXT,
  p_subject TEXT,
  p_content TEXT,
  p_status TEXT
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
```

### 17. Missing Environment Variable Validation
**Location:** Startup

**Issue:** No validation that required environment variables are set.

**Fix:** Add validation:
```typescript
// src/lib/config.ts
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

if (!PUBLIC_SUPABASE_URL) {
  throw new Error('PUBLIC_SUPABASE_URL environment variable is required');
}

if (!PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('PUBLIC_SUPABASE_ANON_KEY environment variable is required');
}

export const config = {
  supabaseUrl: PUBLIC_SUPABASE_URL,
  supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
};
```

### 18. Analytics Query Issues
**Location:** `src/routes/profile/+page.server.ts` lines 81-89

**Issue:** Analytics calculations are incorrect (totalCourses should count distinct courses, not progress records).

**Fix:**
```typescript
const analytics = {
  totalCourses: new Set(userProgress?.map(p => `${p.course_id}-${p.course_type}`) || []).size,
  completedCourses: new Set(
    userProgress
      ?.filter(p => p.status === 'completed')
      .map(p => `${p.course_id}-${p.course_type}`) || []
  ).size,
  inProgressCourses: new Set(
    userProgress
      ?.filter(p => p.status === 'in_progress')
      .map(p => `${p.course_id}-${p.course_type}`) || []
  ).size,
  totalLessons: userProgress?.length || 0,
  completedLessons: userProgress?.filter(p => p.status === 'completed').length || 0,
  // Calculate average completion time from completed_at timestamps
  averageCompletionTime: calculateAverageCompletionTime(userProgress || []),
  learningStreak: calculateLearningStreak(userProgress || [])
};
```

## 📋 Database Schema Recommendations

### 19. Add Missing Constraints
```sql
-- Add check constraint for positive amounts
ALTER TABLE purchases ADD CONSTRAINT check_positive_amount 
  CHECK (amount >= 0);

ALTER TABLE orders ADD CONSTRAINT check_positive_total 
  CHECK (total_amount >= 0);

-- Add check constraint for order items
ALTER TABLE order_items ADD CONSTRAINT check_positive_quantity 
  CHECK (quantity > 0);

ALTER TABLE order_items ADD CONSTRAINT check_positive_price 
  CHECK (price >= 0);
```

### 20. Add Soft Delete Support (Optional)
Consider adding soft delete for important records:
```sql
ALTER TABLE kits ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE official_courses ADD COLUMN deleted_at TIMESTAMPTZ;
-- Update RLS policies to filter deleted records
```

## 🔐 Security Recommendations

### 21. Rate Limiting
Implement rate limiting for:
- Code redemption
- Login attempts
- Purchase attempts
- Admin actions

### 22. Input Sanitization
Sanitize all user inputs, especially:
- Course descriptions (XSS prevention)
- User-generated content
- File uploads (if any)

### 23. Audit Logging
Consider adding audit logs for:
- Admin actions
- Permission changes
- Purchase modifications
- User data access

## ✅ Positive Aspects

1. **Good use of RLS policies** - Comprehensive row-level security
2. **Proper error handling structure** - Most functions handle errors
3. **Type definitions** - Good TypeScript types for data models
4. **Database triggers** - Automatic workflows (profile creation, permission sync)
5. **Indexes** - Good indexing strategy for common queries
6. **Separation of concerns** - Services are well-separated

## 📝 Summary of Action Items

### Critical (Fix Immediately):
1. Fix profile creation policy
2. Fix race condition in code redemption
3. Fix null user handling
4. Fix hardcoded OAuth URL
5. Remove manual cookie setting

### Important (Fix Soon):
6. Improve code generation uniqueness
7. Add transaction handling
8. Abstract admin checks
9. Add input validation
10. Standardize error handling

### Nice to Have:
11. Optimize queries
12. Add pagination
13. Add missing indexes
14. Improve type safety
15. Fix email logging policy

## 🚀 Next Steps

1. **Immediate:** Fix the 5 critical issues
2. **Short-term:** Address important issues (6-10)
3. **Medium-term:** Implement performance improvements
4. **Long-term:** Add advanced features (rate limiting, audit logging)

