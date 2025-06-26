# Supabase Setup for Medical Students Hub

This document provides instructions for setting up Supabase for the Medical Students Hub feature.

## Prerequisites

- Node.js and npm installed
- Docker installed and running
- Supabase CLI installed (will be installed as a dev dependency)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

This will install the Supabase CLI as a dev dependency.

### 2. Initialize Supabase Project

If you haven't already initialized a Supabase project, run:

```bash
npm run supabase:init
```

### 3. Start Supabase Locally

```bash
npm run supabase:start
```

This will start the Supabase stack locally, including PostgreSQL, PostgREST, GoTrue, and other services.

### 4. Run Migrations

To apply all migrations to your local database:

```bash
npm run run:migrations
```

This will reset your local database and apply all migrations in the `supabase/migrations` directory.

## Remote Deployment

### 1. Create a Supabase Project

Go to [Supabase Dashboard](https://app.supabase.com/) and create a new project.

### 2. Link Your Local Project to Remote

```bash
npm run run:migrations:remote <project-ref>
```

Replace `<project-ref>` with your Supabase project reference ID, which you can find in the URL of your Supabase project dashboard.

This will:
1. Link your local project to the remote Supabase project
2. Push all migrations to the remote database
3. Optionally push seed data

### 3. Pull Remote Changes

If you've made changes to the remote database and want to pull them locally:

```bash
npm run supabase:db:pull
```

## Migration Files

The migration files for the CareAI application are located in the `supabase/migrations` directory. They include:

- Health tracking and monitoring tables
- User authentication and profiles
- Medical predictions and appointments
- Social features and chat functionality
- Digital twin and blockchain health records

## Troubleshooting

### Docker Issues

If you encounter issues with Docker, make sure:
- Docker is running
- You have enough disk space
- You have at least 7GB of RAM allocated to Docker

### Migration Issues

If migrations fail:
1. Check the error message
2. Verify that your database schema is correct
3. Try running `npm run supabase:db:reset` to reset your local database
4. If pushing to remote, make sure you have the correct permissions

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
