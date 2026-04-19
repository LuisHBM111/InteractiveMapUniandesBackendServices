param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,
  [Parameter(Mandatory = $true)]
  [string]$Region,
  [Parameter(Mandatory = $true)]
  [string]$ArtifactRepository,
  [Parameter(Mandatory = $true)]
  [string]$CloudSqlInstanceConnectionName,
  [Parameter(Mandatory = $true)]
  [string]$ServiceAccountEmail,
  [string]$ServiceName = "interactive-map-uniandes-backend",
  [string]$ImageName = "backend",
  [string]$ImageTag = "latest",
  [string]$DbName = "InteractiveMapUniandes",
  [string]$DbUsernameSecretName = "interactive-map-db-username",
  [string]$DbPasswordSecretName = "interactive-map-db-password",
  [string]$DbSecretVersion = "1",
  [string]$StorageBucket = "interactivemapuniandes.firebasestorage.app",
  [switch]$ExecuteSeedJob
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$imageUrl = "$Region-docker.pkg.dev/$ProjectId/$ArtifactRepository/$ImageName`:$ImageTag"
$migrationJobName = "$ServiceName-db-migrate"
$seedJobName = "$ServiceName-campus-seed"

$baseEnvVars = @(
  "DB_NAME=$DbName",
  "DB_PORT=5432",
  "DB_SYNCHRONIZE=false",
  "ENABLE_SETUP_ENDPOINTS=false",
  "FIREBASE_DEV_AUTH=false",
  "FIREBASE_STORAGE_BUCKET=$StorageBucket",
  "INSTANCE_CONNECTION_NAME=$CloudSqlInstanceConnectionName"
)

$baseSecrets = @(
  "DB_USERNAME=${DbUsernameSecretName}:${DbSecretVersion}",
  "DB_PASSWORD=${DbPasswordSecretName}:${DbSecretVersion}"
)

Write-Host "Building container image: $imageUrl" -ForegroundColor Cyan
Set-Location $repoRoot
gcloud builds submit --project $ProjectId --tag $imageUrl .

Write-Host "Deploying Cloud Run service: $ServiceName" -ForegroundColor Cyan
gcloud run deploy $ServiceName `
  --project $ProjectId `
  --region $Region `
  --image $imageUrl `
  --service-account $ServiceAccountEmail `
  --add-cloudsql-instances $CloudSqlInstanceConnectionName `
  --set-env-vars ($baseEnvVars -join ',') `
  --update-secrets ($baseSecrets -join ',') `
  --allow-unauthenticated `
  --quiet

Write-Host "Deploying migration job: $migrationJobName" -ForegroundColor Cyan
gcloud run jobs deploy $migrationJobName `
  --project $ProjectId `
  --region $Region `
  --image $imageUrl `
  --service-account $ServiceAccountEmail `
  --set-cloudsql-instances $CloudSqlInstanceConnectionName `
  --set-env-vars ($baseEnvVars -join ',') `
  --set-secrets ($baseSecrets -join ',') `
  --command node `
  --args dist/database/run-migrations.js `
  --tasks 1 `
  --max-retries 0 `
  --task-timeout 900 `
  --execute-now `
  --wait `
  --quiet

$seedEnvVars = @(
  $baseEnvVars
  "SEED_REPLACE_EXISTING=true",
  "SEED_BIDIRECTIONAL=true"
)

Write-Host "Deploying campus seed job: $seedJobName" -ForegroundColor Cyan
gcloud run jobs deploy $seedJobName `
  --project $ProjectId `
  --region $Region `
  --image $imageUrl `
  --service-account $ServiceAccountEmail `
  --set-cloudsql-instances $CloudSqlInstanceConnectionName `
  --set-env-vars ($seedEnvVars -join ',') `
  --set-secrets ($baseSecrets -join ',') `
  --command node `
  --args dist/setup/run-default-campus-seed.js `
  --tasks 1 `
  --max-retries 0 `
  --task-timeout 1800 `
  --quiet

if ($ExecuteSeedJob) {
  Write-Host "Executing campus seed job: $seedJobName" -ForegroundColor Cyan
  gcloud run jobs execute $seedJobName `
    --project $ProjectId `
    --region $Region `
    --wait `
    --quiet
}

Write-Host "Cloud Run deploy flow completed." -ForegroundColor Green
Write-Host "Image: $imageUrl" -ForegroundColor DarkGray
Write-Host "Service: $ServiceName" -ForegroundColor DarkGray
Write-Host "Migration job: $migrationJobName" -ForegroundColor DarkGray
Write-Host "Campus seed job: $seedJobName" -ForegroundColor DarkGray
