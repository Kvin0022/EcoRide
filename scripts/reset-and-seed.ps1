param(
  [switch]$RecreateDb = $false,

  # Utilisateur applicatif (pour importer schema + seed)
  [string]$DbName = "ecoride",
  [string]$DbUser = "ecoride",
  [string]$DbPass = "ecoride",

  # Utilisateur root (uniquement pour DROP/CREATE)
  [string]$RootUser = "root",
  [string]$RootPass = "root"   # adapte si différent dans ton docker-compose.yml
)

$ErrorActionPreference = 'Stop'

# Toujours exécuter depuis la racine du repo (là où se trouve docker-compose.yml)
$repoRoot = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $repoRoot

function Invoke-Docker {
  param([Parameter(Mandatory=$true)][string[]]$Args)
  Write-Host "> docker $($Args -join ' ')" -ForegroundColor DarkGray
  & docker @Args
  if ($LASTEXITCODE -ne 0) {
    throw "docker $($Args -join ' ') a échoué (exit=$LASTEXITCODE)"
  }
}


function PipeSqlToMysql {
  param(
    [string]$sqlPath,
    [string]$User,
    [string]$Pass,
    [string]$Database
  )
  if (-not (Test-Path $sqlPath)) { throw "Fichier introuvable: $sqlPath" }
  # PS: pipeline direct vers l'exécutable
  Get-Content $sqlPath -Raw | docker compose exec -T db mysql "-u$User" "-p$Pass" $Database
  if ($LASTEXITCODE -ne 0) { throw "mysql a échoué pour $sqlPath (exit=$LASTEXITCODE)" }
}

Write-Host "=== Reset & Seed EcoRide ===" -ForegroundColor Cyan
Write-Host "Working dir: $repoRoot" -ForegroundColor DarkGray
Write-Host "DB: $DbName / User: $DbUser" -ForegroundColor DarkGray

# Option (re)création complète de la base — nécessite root
if ($RecreateDb) {
  Write-Host "Drop & create database '$DbName' (utilisateur root)..." -ForegroundColor Yellow
  Invoke-Docker -Args @(
  "compose","exec","-T","db","mysql",
  "-u$RootUser","-p$RootPass",
  "-e","DROP DATABASE IF EXISTS $DbName; CREATE DATABASE $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)
}

# Import schéma + seed avec l'utilisateur applicatif
Write-Host "Import schema.sql ..." -ForegroundColor Yellow
PipeSqlToMysql -sqlPath "backend/db/schema.sql" -User $DbUser -Pass $DbPass -Database $DbName

Write-Host "Import seed_demo.sql ..." -ForegroundColor Yellow
PipeSqlToMysql -sqlPath "backend/db/seed_demo.sql" -User $DbUser -Pass $DbPass -Database $DbName

Write-Host "OK ✅ Base '$DbName' prête avec données démo." -ForegroundColor Green
