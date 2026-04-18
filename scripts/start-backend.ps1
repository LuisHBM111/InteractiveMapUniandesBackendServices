param(
  [switch]$UseDevAuth,
  [switch]$SkipDbSync,
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
$env:DB_SYNCHRONIZE = if ($SkipDbSync) { "false" } else { "true" }
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
Write-Host "ENABLE_SETUP_ENDPOINTS=$($env:ENABLE_SETUP_ENDPOINTS)" -ForegroundColor DarkGray
Write-Host "Swagger: http://localhost:3000/api" -ForegroundColor Cyan

Set-Location $repoRoot
npm.cmd run start:dev
