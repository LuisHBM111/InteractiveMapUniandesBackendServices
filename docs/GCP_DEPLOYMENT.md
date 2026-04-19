# GCP deployment guide

This backend is prepared to run on:

- Cloud Run for the API
- Cloud Run Jobs for database migrations and campus seed
- Cloud SQL for PostgreSQL
- Secret Manager for database credentials
- Firebase Auth + Firebase Storage through Application Default Credentials

## 1. Enable required APIs

```bash
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  iam.googleapis.com
```

## 2. Create Artifact Registry

```bash
gcloud artifacts repositories create interactive-map-uniandes \
  --repository-format=docker \
  --location=us-central1
```

## 3. Create Cloud SQL resources

Create a PostgreSQL instance, then create:

- database: `InteractiveMapUniandes`
- application user

Keep the instance connection name. It looks like:

```text
PROJECT_ID:REGION:INSTANCE_NAME
```

## 4. Create secrets

Store the database username and password in Secret Manager.

Suggested names:

- `interactive-map-db-username`
- `interactive-map-db-password`

## 5. Create a runtime service account

Suggested name:

```text
interactive-map-backend-runtime@PROJECT_ID.iam.gserviceaccount.com
```

Grant it at least:

- `roles/cloudsql.client`
- `roles/secretmanager.secretAccessor`
- `roles/storage.objectAdmin`

If you later expand Firebase admin features, you can add more Firebase-specific roles, but for the current backend this is the main minimum.

## 6. Deploy service and jobs

From the repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloud-run.ps1 `
  -ProjectId YOUR_PROJECT_ID `
  -Region YOUR_REGION `
  -ArtifactRepository interactive-map-uniandes `
  -CloudSqlInstanceConnectionName YOUR_PROJECT_ID:YOUR_REGION:YOUR_INSTANCE `
  -ServiceAccountEmail interactive-map-backend-runtime@YOUR_PROJECT_ID.iam.gserviceaccount.com `
  -ExecuteSeedJob
```

What this does:

- builds and pushes the container image
- deploys the Cloud Run API service
- deploys and runs a migration job
- deploys a campus seed job
- optionally executes the campus seed job

## 7. Runtime configuration

The service and jobs use these environment variables:

- `INSTANCE_CONNECTION_NAME`
- `DB_NAME`
- `DB_PORT=5432`
- `DB_SYNCHRONIZE=false`
- `ENABLE_SETUP_ENDPOINTS=false`
- `FIREBASE_DEV_AUTH=false`
- `FIREBASE_STORAGE_BUCKET`

`DB_USERNAME` and `DB_PASSWORD` are injected from Secret Manager.

`PORT` is not configured manually. Cloud Run injects it automatically.

## 8. Smoke test after deploy

1. Open the deployed service URL
2. Check `/healthz`
3. Authenticate with Firebase and call `/api/v1/me`
4. Run `GET /api/v1/me/schedules/current/classes`

## Notes

- The runtime image includes `src/utils`, so the bundled `.ics` sample and Excel setup files are available inside Cloud Run Jobs.
- Campus setup does not need to stay exposed as public HTTP endpoints in production.
- Migrations are intended to run through the dedicated Cloud Run Job, not from service startup.
