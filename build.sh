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

# Build and tag
docker build -t $REGION-docker.pkg.dev/$(gcloud config get-value project)/$REPO/$IMAGE:latest .

# Push
docker push $REGION-docker.pkg.dev/$(gcloud config get-value project)/$REPO/$IMAGE:latest
