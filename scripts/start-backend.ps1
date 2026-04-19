param(
  [switch]$UseDevAuth,
  [switch]$UseDbSync,
  [switch]$SkipMigrations,
  [switch]$DisableSetupEndpoints,
  [string]$ServiceAccountPath = "$PSScriptRoot\..\secrets\interactivemapuniandes-firebase-adminsdk-fbsvc-ec21fcc479.json",
  [string]$StorageBucket = "interactivemapuniandes.firebasestorage.app",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbUsername = "postgres",
  [string]$DbPassword = "123",
  [string]$DbName = "InteractiveMapUniandes"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
$resolvedServiceAccountPath = $null

if (-not $UseDevAuth) {
  if (-not (Test-Path -LiteralPath $ServiceAccountPath)) {
    throw "No se encontró la credencial de Firebase Admin en: $ServiceAccountPath"
  }

  $resolvedServiceAccountPath = (Resolve-Path -LiteralPath $ServiceAccountPath).Path
}

$env:DB_HOST = $DbHost
$env:DB_PORT = "$DbPort"
$env:DB_USERNAME = $DbUsername
$env:DB_PASSWORD = $DbPassword
$env:DB_NAME = $DbName
$env:DB_SYNCHRONIZE = if ($UseDbSync) { "true" } else { "false" }
$env:ENABLE_SETUP_ENDPOINTS = if ($DisableSetupEndpoints) { "false" } else { "true" }
$env:FIREBASE_STORAGE_BUCKET = $StorageBucket
$env:FIREBASE_DEV_AUTH = if ($UseDevAuth) { "true" } else { "false" }

if ($UseDevAuth) {
  Remove-Item Env:FIREBASE_SERVICE_ACCOUNT_PATH -ErrorAction SilentlyContinue
  Write-Host "Iniciando backend con FIREBASE_DEV_AUTH=true" -ForegroundColor Yellow
  Write-Host "Token de prueba para Swagger: dev:demo-user|demo@uniandes.edu.co|Demo Uniandes" -ForegroundColor Cyan
} else {
  $env:FIREBASE_SERVICE_ACCOUNT_PATH = $resolvedServiceAccountPath
  Write-Host "Iniciando backend con Firebase Admin real" -ForegroundColor Green
  Write-Host "Service account: $resolvedServiceAccountPath" -ForegroundColor DarkGray
}

Write-Host "DB: $DbHost`:$DbPort / $DbName" -ForegroundColor DarkGray
Write-Host "Storage bucket: $StorageBucket" -ForegroundColor DarkGray
Write-Host "DB_SYNCHRONIZE=$($env:DB_SYNCHRONIZE)" -ForegroundColor DarkGray
Write-Host "RUN_MIGRATIONS=$([bool](-not $UseDbSync -and -not $SkipMigrations))" -ForegroundColor DarkGray
Write-Host "ENABLE_SETUP_ENDPOINTS=$($env:ENABLE_SETUP_ENDPOINTS)" -ForegroundColor DarkGray
Write-Host "Swagger: http://localhost:3000/api" -ForegroundColor Cyan

Set-Location $repoRoot

if (-not $UseDbSync -and -not $SkipMigrations) {
  $migrationStateJson = @'
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  const existingSchemaResult = await client.query(
    `
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
    `,
    [['users', 'schedules', 'places', 'route_nodes', 'edges']],
  );

  const migrationsTableResult = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'typeorm_migrations'
    ) AS exists
  `);

  await client.end();

  console.log(
    JSON.stringify({
      hasExistingSchema: existingSchemaResult.rows[0].count > 0,
      hasMigrationsTable: migrationsTableResult.rows[0].exists,
    }),
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@ | node -

  if ($LASTEXITCODE -ne 0) {
    throw "No se pudo revisar el estado de migraciones de la base de datos."
  }

  $migrationState = $migrationStateJson | ConvertFrom-Json

  if ($migrationState.hasExistingSchema -and -not $migrationState.hasMigrationsTable) {
    Write-Host "La base ya tiene tablas de la app, pero aun no tiene historial de migraciones." -ForegroundColor Yellow
    Write-Host "Ejecuta una sola vez .\\scripts\\baseline-initial-migration.ps1 para marcar la migracion inicial como aplicada." -ForegroundColor Yellow
    Write-Host "Saltando migration:run en este arranque para no romper la base actual." -ForegroundColor Yellow
  } else {
    Write-Host "Ejecutando migraciones..." -ForegroundColor Cyan
    npm.cmd run migration:run
  }
}

npm.cmd run start:dev
