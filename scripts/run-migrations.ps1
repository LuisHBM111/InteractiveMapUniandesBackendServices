param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbUsername = "postgres",
  [string]$DbPassword = "123",
  [string]$DbName = "InteractiveMapUniandes"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path

$env:DB_HOST = $DbHost
$env:DB_PORT = "$DbPort"
$env:DB_USERNAME = $DbUsername
$env:DB_PASSWORD = $DbPassword
$env:DB_NAME = $DbName
$env:DB_SYNCHRONIZE = "false"

Write-Host "Running migrations for $DbHost`:$DbPort / $DbName" -ForegroundColor Cyan

Set-Location $repoRoot
npm.cmd run migration:run
