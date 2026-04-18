param(
  [string]$ApiBaseUrl = "http://localhost:3000/api/v1",
  [bool]$ReplaceExisting = $true,
  [bool]$Bidirectional = $true,
  [string]$SetupKey = $env:SETUP_API_KEY
)

$ErrorActionPreference = "Stop"

$headers = @{}
if ($SetupKey) {
  $headers["x-setup-key"] = $SetupKey
}

$body = @{
  replaceExisting = $ReplaceExisting
  bidirectional = $Bidirectional
} | ConvertTo-Json

Write-Host "Seeding campus data via $ApiBaseUrl/setup/campus/seed/default" -ForegroundColor Cyan

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "$ApiBaseUrl/setup/campus/seed/default" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body

$response | ConvertTo-Json -Depth 8
