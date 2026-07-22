# Google OAuth Integration Plan & Guide

This document contains everything needed to implement Google Sign-In for the ProEduvate Software Test Platform.

---

## Part 1: Configuration Guide (Action Required)

To enable Google Sign-In, you must configure credentials in both the **Google Cloud Console** and the **Supabase Dashboard**.

### Step 1: Google Cloud Console Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create a New Project** (or select an existing one).
3.  Navigate to **APIs & Services > OAuth consent screen**.
    - Select **External** and fill in required app info.
4.  Navigate to **APIs & Services > Credentials**.
    - Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
    - **Application type**: Web application.
    - **Authorized redirect URIs**: Add your Supabase Callback URL (found in Supabase Dashboard > Authentication > Providers > Google).
5.  **Save** and copy the **Client ID** and **Client Secret**.

### Step 2: Supabase Dashboard Setup
1.  Go to your [Supabase Project Dashboard](https://supabase.com/dashboard).
2.  Navigate to **Authentication > Providers**.
3.  Find **Google** in the list and enable it.
4.  Paste your **Google Client ID** and **Google Client Secret**.
5.  **Save** the settings.

---

## Part 2: Implementation Plan

### 1. AuthContext Update
- Add `loginWithGoogle(role)` function to use `signInWithOAuth`.
- Pass the user's selected role as metadata.

### 2. UI Updates
- **Login.jsx & Signup.jsx**: Add "Continue with Google" buttons using `FcGoogle` icons.
- **auth.css**: Add styling for social buttons and an "OR" separator.

### 3. Redirect Handler
- **AuthCallback.jsx**: A new component to handle the redirect from Google, verify the session, and route the user to the correct dashboard.

---

## Part 3: Database Trigger (Action Required)

Run this snippet in your **Supabase SQL Editor** to ensure Google users are correctly registered in your `profiles` table:

```sql
-- Trigger to create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Google User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'tester'), -- Defaults to tester if not provided
    'pending' -- All new registrations start as pending
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Verification Plan
1. **Login Flow**: Verify "Continue with Google" redirects correctly.
2. **Signup Flow**: Verify user is created with selected role and "pending" status.
3. **Redirection**: Ensure the app handles the callback and lands on the dashboard.
