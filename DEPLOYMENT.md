# CivicConnect Frontend Deployment

This app is deployment-ready for Google Cloud Run as either a Docker build or a Node buildpack deployment.

## Recommended: Cloud Run With Dockerfile

From the parent folder:

```powershell
cd C:\Users\samar\OneDrive\Desktop\Ayush
gcloud run deploy civicconnect-frontend --source . --region YOUR_REGION --allow-unauthenticated
```

Or from the frontend folder:

```powershell
cd C:\Users\samar\OneDrive\Desktop\Ayush\CivicsConnect_frontend
gcloud run deploy civicconnect-frontend --source . --region YOUR_REGION --allow-unauthenticated
```

Both locations include a Dockerfile. The container builds the Vite app with Node 22 and serves the generated `dist` folder with Nginx on port `8080`.

## Required Environment Variables

Set these on the Cloud Run service as needed:

```text
VITE_API_URL=https://YOUR_BACKEND_URL
VITE_AUTH_DISABLED=false
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
```

Vite reads these at build time, so redeploy after changing them.

## Local Verification

```powershell
cd C:\Users\samar\OneDrive\Desktop\Ayush\CivicsConnect_frontend
npm install
npm run build
npm start
```

The local production server listens on `http://localhost:8080` by default.
