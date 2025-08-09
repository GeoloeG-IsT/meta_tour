# SoulTrip - Sacred Journey Platform

A community-first, AI-powered, open-source tour platform that serves as the digital infrastructure for transformational travel, including spiritual practices, pilgrimages, retreats, and educational expeditions.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Setup Instructions

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd meta_tour
npm install
```

2. **Configure Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Settings → API
   - Update `.env.local` with your actual credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Set up the database (choose one method):**

   **Option A: Using the setup script (recommended):**

   ```bash
   # Get your access token from https://supabase.com/dashboard/account/tokens
   export SUPABASE_ACCESS_TOKEN=your-access-token-here

   # Run the setup script with your project ref
   ./scripts/setup-supabase.sh your-project-ref
   ```

   **Option B: Manual setup:**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and run the contents of `supabase/migrations/0001_initial_schema.sql`

4. **Configure authentication (Supabase Auth URLs):**
   - In Supabase Dashboard → Authentication → URL Configuration
   - Site URL (set both environments you use, update when you add a custom domain):
     - Local: `http://localhost:3000`
     - Production (Cloud Run): `https://meta-tour-web-<PROJECT_NUMBER>.<REGION>.run.app`
   - Additional Redirect URLs (add all that the app can redirect to):
     - `http://localhost:3000/`
     - `http://localhost:3000/login`
     - `http://localhost:3000/auth/confirm`
     - `https://meta-tour-web-<PROJECT_NUMBER>.<REGION>.run.app/`
     - `https://meta-tour-web-<PROJECT_NUMBER>.<REGION>.run.app/login`
     - `https://meta-tour-web-<PROJECT_NUMBER>.<REGION>.run.app/auth/confirm`
   - Notes:
     - Email/password login is a direct session exchange (no redirects), but email change links, magic links and OAuth use the Redirect URLs.
     - Replace placeholders with your actual Cloud Run service URL (or custom domain) and region.

5. **Start the development server:**

```bash
npm run dev
```

6. **Open [http://localhost:3000](http://localhost:3000)** to see the application

## 📖 Detailed Setup

For detailed setup instructions, troubleshooting, and configuration options, see [SETUP.md](SETUP.md).

## 🏗️ Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── login/          # Login page
│   │   ├── signup/         # Registration page
│   │   └── dashboard/      # Protected dashboard
│   ├── components/         # Reusable React components
│   ├── contexts/          # React contexts (Auth, etc.)
│   └── lib/               # Utilities and configurations
├── supabase/
│   └── migrations/        # Database schema migrations
├── SPECIFICATIONS.md      # Original product requirements
├── TECHNICAL_SPECIFICATIONS.md  # Technical implementation details
└── SETUP.md              # Detailed setup guide
```

## ✨ Features

### Current (MVP)

- ✅ User authentication (Organizer/Participant roles)
- ✅ Protected routes and role-based access
- ✅ User dashboard with profile management
- ✅ Responsive design with Tailwind CSS
- ✅ Supabase integration with Row Level Security

### Coming Soon

- 🔄 Tour creation and management (Organizers)
- 🔄 Tour marketplace and booking (Participants)
- 🔄 Payment integration (Stripe, PayPal)
- 🔄 Community features and messaging
- 🔄 Gamification system
- 🔄 AI-powered tour assistance

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Real-time)
- **Deployment:** Vercel (recommended), Google Cloud Run
- **Payments:** Stripe, PayPal (planned)
- **Email:** Mailgun/SendGrid (planned)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run check:dead   # Detect unused files/exports/deps (knip)
npm run check:exports # Detect unused TS exports (ts-prune)
```

## ☁️ Deploying to Google Cloud Run (Production)

The app can run containerized on Cloud Run behind HTTPS with autoscaling.

### 1) Prerequisites

- A Google Cloud project (with billing enabled)
- gcloud CLI installed and authenticated (`gcloud auth login`)
- Enable required services:

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

### 2) Configure environment

Create `.env.production` locally with production values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
# If using Stripe later:
# STRIPE_SECRET_KEY=sk_live_...
```

Cloud Run uses environment variables set at deploy-time. Keep `.env.production` for local builds only; don’t commit secrets.

Also set build-time variables in your CI/CD (Cloud Build) so Next.js can inline public values at build time.

### 3) Build the container

This repo includes a production `Dockerfile`.

```bash
# Set your region and repo
REGION=europe-west3
REPO=meta-tour-repo
IMAGE=meta-tour

# Create an Artifact Registry repo (once)
gcloud artifacts repositories create $REPO \
  --repository-format=docker \
  --location=$REGION \
  --description="Meta Tour images"

# Configure Docker to use gcloud credential helper
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and tag (pass public envs as build-args so Next.js can inline them)
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
  -t $REGION-docker.pkg.dev/$(gcloud config get-value project)/$REPO/$IMAGE:latest .

# Push
docker push $REGION-docker.pkg.dev/$(gcloud config get-value project)/$REPO/$IMAGE:latest
```

### 4) Deploy to Cloud Run

```bash
PROJECT_ID=$(gcloud config get-value project)
REGION=europe-west3
SERVICE=meta-tour-web
IMAGE_URI=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/$IMAGE:latest

gcloud run deploy $SERVICE \
  --image $IMAGE_URI \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --max-instances 3 \
  --set-env-vars NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Notes:
- Cloud Run provides HTTPS. Custom domains can be mapped in Cloud Run → Custom Domains.
- Increase `--max-instances` for more peak capacity; add `--min-instances` to keep one warm.
- If you add secrets like Stripe keys, prefer Secret Manager and pass via `--set-secrets`.

### 5) Verify

Open the service URL printed by the deploy command. Login and flows should work against your production Supabase project.

### 6) Optional: Cloud Build automation

You can use Cloud Build triggers on your Git repo to build and deploy on push. This repo includes `cloudbuild.yaml` which:

- Builds the Docker image (passing public envs as build-args)
- Pushes to Artifact Registry
- Deploys to Cloud Run with runtime envs

In the Cloud Build trigger, set substitutions for:

- `_NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co`
- `_NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>`

Adjust `_REGION`, `_REPO`, `_IMAGE`, `_SERVICE` as needed.

## 🔐 Authentication Behavior

- Sign-in redirect memory: the login page honors a `redirect` query param (e.g. `/login?redirect=/tours/<id>`). On successful sign-in, users are returned there; otherwise they go to `/`.
- The app automatically appends the current path when clicking “Sign In” from the header.
- Robust sign-out: the app clears the local session and then attempts a server revoke. If sign-out seems stuck in production, check:
  - Network tab for a call to `.../auth/v1/logout`
  - That `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Cloud Run (runtime) and passed at build-time
  - Supabase Auth URL configuration matches your Cloud Run/custom domain URL(s)

## 🧪 Seeding Sample Data

You can seed organizers and tours for demo/testing.

Requirements:

- Service Role key (Supabase Dashboard → Project Settings → API)
- Node 18+

Command:

```bash
SUPABASE_URL=https://<your-ref>.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
node scripts/seed.js
```

What it does:

- Creates 10 confirmed organizer users
- For each organizer, creates 5 published tours
- Tour fields include: country (one of india, costa rica, berlin, ukraine, france), difficulty (easy, moderate, challenging, intense), itinerary, images
- Downloads a representative country image and uploads it to the `tour-images` bucket, inserting a matching `tour_images` row

Important:

- Never expose the Service Role key in client-side code or public repos
- Ensure the `tour-images` storage bucket is public (the app expects public images)


### Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🐛 Troubleshooting

### "Failed to fetch" Error

This usually means Supabase credentials are not configured correctly:

1. Check that `.env.local` contains your actual Supabase URL and key
2. Ensure the URL starts with `https://` and doesn't contain placeholder text
3. Verify your Supabase project is active

The application includes built-in configuration checking that will display helpful error messages on the login/signup pages.

## 📄 License

This project is open source. See the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📞 Support

For setup help or questions, please check:

1. [SETUP.md](SETUP.md) for detailed instructions
2. [TECHNICAL_SPECIFICATIONS.md](TECHNICAL_SPECIFICATIONS.md) for implementation details
3. Create an issue for bugs or feature requests
