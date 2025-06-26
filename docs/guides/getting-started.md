# Getting Started with CareAI

This guide will help you set up and run the CareAI application on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher) or **yarn** (v1.22 or higher)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AlphaFrederic94/CareAI-disease.git
cd CareAI-disease
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with your actual Supabase credentials.

### 4. Start the Development Server

Using npm:
```bash
npm run dev
```

Or using yarn:
```bash
yarn dev
```

The application will be available at `http://localhost:5173`.

## Setting Up Supabase

CareAI uses Supabase for backend services. Follow these steps to set up your Supabase project:

### 1. Create a Supabase Account

Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one.

### 2. Create a New Project

- Click on "New Project"
- Enter a name for your project
- Set a secure password for the database
- Choose a region closest to your users
- Click "Create new project"

### 3. Get Your API Keys

- Go to the "Settings" section in the Supabase dashboard
- Click on "API"
- Copy the "URL" and "anon public" key
- Paste these values into your `.env` file

### 4. Set Up Database Tables

CareAI requires several database tables. You can set these up by running the SQL scripts provided in the `database` directory:

```bash
cd database
```

Then, copy and execute each SQL script in the Supabase SQL editor.

## Authentication Setup

CareAI uses Supabase Authentication. To set it up:

1. Go to the "Authentication" section in the Supabase dashboard
2. Enable the authentication providers you want to use (Email, Google, etc.)
3. Configure the redirect URLs for your local environment:
   - `http://localhost:5173/auth/callback`

## Running Tests

To run the test suite:

```bash
npm run test
```

Or using yarn:
```bash
yarn test
```

## Building for Production

To create a production build:

```bash
npm run build
```

Or using yarn:
```bash
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Next Steps

Now that you have CareAI running locally, you can:

1. Create an account and log in
2. Explore the different features
3. Add some sample data to test the analytics
4. Check out the code structure to understand how the application works

For more detailed information about specific components, check out the component documentation in the docs directory.
