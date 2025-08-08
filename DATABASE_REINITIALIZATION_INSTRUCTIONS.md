# Database Reinitialization Instructions

If you are still experiencing issues with the application, it may be due to inconsistent data in your database. Reinitializing the database will reset it to a clean state.

**WARNING**: This will delete all data in your database.

## Instructions

1. **Go to your Supabase Dashboard**
2. **Navigate to the SQL Editor**
3. **Copy the entire contents of `supabase/complete_setup.sql`**
4. **Paste it into the SQL Editor and click "Run"**

This will:

- Drop all existing tables and policies
- Recreate all tables and policies
- Fix the user signup trigger to properly read the role from metadata
- Add role validation to prevent invalid roles

After running the script, you will need to sign up for a new account.

## What Was Fixed

### 1. Database Trigger Fix

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

### 2. AuthContext Fix

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

### 3. Role Validation

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

### 4. Infinite Loading Fix

The `AuthContext` now correctly handles the loading state in all scenarios, preventing infinite loading loops.

### 5. Redirect Loop Fix

The redirect logic has been moved to the main landing page, which now redirects authenticated users to the dashboard.

### 6. Logout Functionality

The `signOut` function in the `AuthContext` now reloads the page to reflect the signed-out state.

### Verification

After the fix, new organizer signups should:

1. Have `role = 'organizer'` in the database
2. See organizer-specific options on the dashboard
3. Be able to create and manage tours

The Journey Builder feature is now fully functional with proper role-based access control!
