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

$baselineResult = @'
const { Client } = require('pg');

(async () => {
  const migrationTimestamp = 1776584951143;
  const migrationName = 'InitialSchema1776584951143';
  const applicationTables = ['users', 'schedules', 'places', 'route_nodes', 'edges'];

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
    [applicationTables],
  );

  if (existingSchemaResult.rows[0].count < applicationTables.length) {
    throw new Error(
      'La base no tiene el esquema base completo. Usa run-migrations.ps1 sobre una base vacia en vez de baseline.',
    );
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS "typeorm_migrations" (
      "id" SERIAL NOT NULL,
      "timestamp" bigint NOT NULL,
      "name" character varying NOT NULL,
      CONSTRAINT "PK_bb2f075707dd300ba86d0208923" PRIMARY KEY ("id")
    )
  `);

  const existingMigrationResult = await client.query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM "typeorm_migrations"
        WHERE "timestamp" = $1
          AND "name" = $2
      ) AS exists
    `,
    [migrationTimestamp, migrationName],
  );

  if (!existingMigrationResult.rows[0].exists) {
    await client.query(
      `
        INSERT INTO "typeorm_migrations"("timestamp", "name")
        VALUES ($1, $2)
      `,
      [migrationTimestamp, migrationName],
    );
  }

  await client.end();

  console.log(
    JSON.stringify({
      baselineApplied: !existingMigrationResult.rows[0].exists,
      migrationName,
      migrationTimestamp,
    }),
  );
})().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
'@ | node -

if ($LASTEXITCODE -ne 0) {
  throw "No se pudo registrar la migracion inicial en la base."
}

$baselineSummary = $baselineResult | ConvertFrom-Json

Set-Location $repoRoot

if ($baselineSummary.baselineApplied) {
  Write-Host "Baseline aplicado para $($baselineSummary.migrationName)." -ForegroundColor Green
} else {
  Write-Host "La migracion inicial ya estaba registrada." -ForegroundColor Yellow
}
