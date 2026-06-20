# MessFlow Deployment Guide

MessFlow is a production-ready, multi-tenant SaaS application built with React, Vite, Tailwind CSS, and Supabase.

## 1. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `supabase/migrations/00001_initial_schema.sql` file from this repository.
4. Copy its contents and run it in the SQL Editor. This will create all tables, views, RLS policies, and functions.
5. In your Supabase dashboard, go to **Authentication -> Providers** and ensure Email provider is enabled.
6. (Optional) Run `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts` to generate fresh types if you modify the database.

## 2. Environment Variables

Create a `.env` file in the root directory and add your Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Local Development

1. Run `npm install` to install dependencies.
2. Run `npm run dev` to start the Vite development server.

## 4. Vercel Deployment

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and create a new project.
3. Import your GitHub repository.
4. Set the Framework Preset to **Vite**.
5. Add the Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Click **Deploy**. Vercel will automatically build (`npm run build`) and deploy the React application.
