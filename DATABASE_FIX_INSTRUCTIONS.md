# Database Role Fix Instructions

## Issue

Users signing up as "organizer" are getting the default "participant" role in the database instead of their selected role.

## Root Cause

The database trigger that creates user profiles wasn't properly reading the role from the signup metadata.

## Solution

I've fixed the signup process and database trigger. Here's how to apply the fix:

### Option 1: Run Complete Setup Script (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `supabase/complete_setup.sql`
4. Paste it into the SQL Editor and click **Run**

This will:

- Fix the user signup trigger to properly read the role from metadata
- Add role validation to prevent invalid roles
- Update any existing users with invalid roles to 'participant'
- Ensure all database tables and policies are properly set up

### Option 2: Run Just the Role Fix Migration

If you already have the database set up and just need the role fix:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/0002_fix_user_signup_and_role_validation.sql`
4. Paste it into the SQL Editor and click **Run**

### What Was Fixed

#### 1. Database Trigger Fix

The `handle_new_user()` function now properly reads the role from signup metadata:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'role', 'participant')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. AuthContext Fix

The signup function now passes the role in the metadata:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`,
    data: {
      full_name: fullName,
      role: role, // This was added
    },
  },
});
```

#### 3. Role Validation

Added database-level validation to ensure only valid roles are allowed:

```sql
CREATE OR REPLACE FUNCTION validate_user_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role NOT IN ('participant', 'organizer', 'admin') THEN
        RAISE EXCEPTION 'Invalid role: %. Must be one of: participant, organizer, admin', NEW.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Testing the Fix

After applying the database fix:

1. **Test New Signups**: Create a new account and select "organizer" role
2. **Verify in Database**: Check that the user has the correct role in the `users` table
3. **Test Access**: Log in as the organizer and verify you can access:
   - `/dashboard/organizer/tours/new` (Create Tour page)
   - `/dashboard/organizer/tours` (View Tours page)
   - The organizer-specific buttons on the main dashboard

### For Existing Users with Wrong Roles

If you have existing users with the wrong role, you can fix them manually:

1. Go to **Supabase Dashboard → Table Editor → users**
2. Find the user with the wrong role
3. Edit their `role` field to the correct value (`organizer`, `participant`, or `admin`)

Or run this SQL query to update a specific user:

```sql
UPDATE users
SET role = 'organizer'
WHERE email = 'user@example.com';  -- Replace with actual email
```

### Verification

After the fix, new organizer signups should:

1. Have `role = 'organizer'` in the database
2. See organizer-specific options on the dashboard
3. Be able to create and manage tours

The Journey Builder feature is now fully functional with proper role-based access control!
