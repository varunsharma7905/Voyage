# Voyage setup: Supabase + GitHub + Cloudflare Pages

About 15 minutes, one time.

## 1. Create the database
1. Go to supabase.com and sign in with GitHub. Click **New project**.
2. Name it `voyage`, set a database password (save it somewhere), and choose the **Mumbai (ap-south-1)** region. Wait for it to finish.

## 2. Create the tables
1. Open **SQL Editor → New query**.
2. Paste the whole of `supabase/schema.sql` and click **Run**. It should say "Success".

## 3. Turn off public sign-ups and create your login
1. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". (Only people you add can log in.)
2. **Authentication → Users → Add user → Create new user**: enter your email and a password, and tick **Auto Confirm User**.

## 4. Import your current progress (one time)
1. Open `supabase/seed.sql`, change `you@example.com` on the line marked `CHANGE THIS` to the email from step 3.
2. Paste the whole file into a new SQL Editor query and **Run**.
   It loads your 4 subjects, 63 chapters (with the ones already done), 10 vocab words and your dates.
   It is a snapshot of your Google Sheet from 18 Nov. Do not run it twice (it refuses if you already have data).

## 5. Connect the app
1. **Project Settings → API**: copy the **Project URL** and the **anon public** key.
2. Paste them into `config.js`:
   ```js
   window.KVS_CONFIG = { SUPABASE_URL: "https://xxxx.supabase.co", SUPABASE_ANON_KEY: "eyJ..." };
   ```
   Both are safe in a public repo. Every table is locked to its owner by row-level security.

## 6. Publish
Replace the files in your GitHub repo with these, commit and push. Cloudflare Pages redeploys on its own in about a minute. Open the site and sign in with the email and password from step 3.

## Adding Kiran later
Authentication → Users → Add user (auto-confirm). He signs in with his own email and gets a separate, empty space. Nobody else can see your data.

## Good to know
- Supabase free projects pause after about a week of no use. Opening the Supabase dashboard and clicking **Restore** wakes it, and nothing is lost.
- The Google Sheet is no longer used by the app. Its Statistics block will not update any more.
- Leave `config.js` values empty to run the app in demo mode with sample data.
