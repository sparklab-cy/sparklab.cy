# RLS Policy Fix for Email Service

## Issue
The email service was failing with RLS (Row Level Security) policy violations when trying to:
1. Get email templates (`PGRST116` - no rows found)
2. Create email templates (`42501` - RLS policy violation)

## Root Cause
The email service was using direct table inserts/selects which were blocked by RLS policies that only allow admins to manage email templates. The service runs server-side and needs to create/read templates automatically.

## Solution

### 1. Created Database Functions with SECURITY DEFINER
Added three PostgreSQL functions that bypass RLS:

- **`create_email_template()`** - Creates or updates email templates
- **`get_email_template()`** - Retrieves email templates by name
- **`log_email()`** - Logs email sends

These functions use `SECURITY DEFINER` which allows them to bypass RLS policies.

### 2. Updated Email Service
- Modified `EmailService` class to accept a Supabase client in the constructor
- Updated all methods to use database functions via `rpc()` instead of direct table operations
- Updated service instantiation in server routes to pass the server-side Supabase client

### 3. Files Modified

**Database Schema (`database/schema.sql`):**
- Added `create_email_template()` function
- Added `get_email_template()` function  
- Added `log_email()` function

**Email Service (`src/lib/services/emailService.ts`):**
- Changed to accept Supabase client in constructor
- Updated `getEmailTemplate()` to use `get_email_template()` function
- Updated `createDefaultPurchaseTemplate()` to use `create_email_template()` function
- Updated `createDefaultCodeRedemptionTemplate()` to use `create_email_template()` function
- Updated `logEmail()` to use `log_email()` function

**Server Routes:**
- `src/routes/shop/+page.server.ts` - Updated to pass server Supabase client
- `src/routes/redeem/+page.server.ts` - Updated to pass server Supabase client
- `src/routes/admin/kits/+page.server.ts` - Removed unused import

## Next Steps

1. **Run the updated schema** in your Supabase database:
   ```sql
   -- Execute the new functions from database/schema.sql
   ```

2. **Test the email service**:
   - Try redeeming a code
   - Try purchasing a kit
   - Verify templates are created automatically

3. **Verify in Supabase Dashboard**:
   - Check that email templates are being created
   - Check that email logs are being written

## Notes

- The functions use `ON CONFLICT` for template creation, so they'll update existing templates if they already exist
- All functions return the created/retrieved data for proper error handling
- The service now properly uses the server-side Supabase client which has better permissions

