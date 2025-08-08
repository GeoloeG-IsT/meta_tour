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
