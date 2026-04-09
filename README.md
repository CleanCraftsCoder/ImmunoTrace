
# ImmunoTrace

A healthcare dashboard and prescription tracking app built with React, Vite, Supabase, and AI-powered OCR.

## Running the code

1. Run `npm install` to install dependencies.
2. Create a `.env` file with your Supabase keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3003
```

3. Open `supabase_setup.sql` and run it in the Supabase SQL Editor to create the required tables and policies.
4. In Supabase Storage, create a public bucket named `prescription-images`.
5. Start the app with `npm run dev`.

## Supabase setup notes

- The app expects `users`, `prescriptions`, and `schedule` tables in the `public` schema.
- If a REST call returns `404 Not Found`, the most common cause is that the table has not been created yet.
- Use `supabase_setup.sql` to create the tables before signing in or uploading prescriptions.
  