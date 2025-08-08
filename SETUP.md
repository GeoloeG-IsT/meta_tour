# SoulTrip Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created (this may take a few minutes)

### 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configure Environment Variables

1. Open the `.env.local` file in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

### 4. Set Up the Database Schema

You have two options to set up the database:

#### Option A: Using Supabase CLI (Recommended)

1. **Get your access token:**
   - Go to [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - Click "Generate new token"
   - Copy the token

2. **Run the migration:**

   ```bash
   # Set your access token (replace with your actual token)
   export SUPABASE_ACCESS_TOKEN=your-access-token-here

   # Link to your project (replace with your project ref)
   npx supabase link --project-ref your-project-ref

   # Push the migration to your database
   npx supabase db push
   ```

#### Option B: Using Supabase Dashboard (Manual)

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/migrations/0001_initial_schema.sql`
3. Paste it into the SQL Editor and click "Run"
4. This will create all the necessary tables and security policies

### 5. Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Under **Site URL**, add your development URL: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/dashboard`
4. **Disable "Confirm email"** for easier development (optional but recommended):
   - Go to **Authentication** → **Providers** → **Email**.
   - Toggle off the **"Confirm email"** option.
   - This allows you to sign up and log in immediately without verifying your email.
   - **Remember to re-enable this for production.**

## Running the Application

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Testing Authentication

1. Go to the signup page: [http://localhost:3000/signup](http://localhost:3000/signup)
2. Create a new account with either "Participant" or "Organizer" role
3. Check your email for confirmation (if enabled)
4. Login at: [http://localhost:3000/login](http://localhost:3000/login)
5. Access your dashboard: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Troubleshooting

### "Failed to fetch" Error

- Check that your Supabase URL and anon key are correctly set in `.env.local`
- Ensure the URL starts with `https://` and doesn't contain placeholder text
- Verify your Supabase project is active and not paused

### Database Errors

- Make sure you've run the migration SQL in your Supabase SQL Editor
- Check that Row Level Security is enabled on all tables
- Verify the database schema matches the migration file

### Authentication Issues

- Confirm your Site URL and Redirect URLs are set correctly in Supabase Auth settings
- Check browser console for detailed error messages
- Ensure email confirmation is disabled for development (or check your email)

## Next Steps

Once authentication is working, you can proceed to implement:

1. Tour creation and management (for Organizers)
2. Tour browsing and booking (for Participants)
3. Payment integration
4. Community features
