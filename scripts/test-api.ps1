param(
  [string]$BaseUrl = $env:API_BASE_URL
)

if (-not $BaseUrl -or $BaseUrl.Trim() -eq '') { $BaseUrl = 'http://localhost:8080' }
$ErrorActionPreference = 'Stop'

Write-Host "=== EcoRide smoke-tests (PowerShell) ===" -ForegroundColor Cyan
Write-Host "API_BASE_URL = $BaseUrl"

function Read-ErrorBody {
  param([System.Management.Automation.ErrorRecord]$err)
  try {
    $resp = $err.Exception.Response
    if (-not $resp) { return $null }
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $body = $sr.ReadToEnd()
    $sr.Close()
    return $body
  } catch { return $null }
}

function Must($cond, $msgOk, $msgFail) {
  if ($cond) { Write-Host $msgOk -ForegroundColor Green }
  else { Write-Host $msgFail -ForegroundColor Red; exit 1 }
}

# --- 0) Ping
try {
  $ping = Invoke-RestMethod -Uri "$BaseUrl/" -Method GET
  Write-Host "Ping: $ping"
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Ping failed: $body" -ForegroundColor Red
  exit 1
}

# --- 1) Login
$loginBody = @{ email = 'admin@example.com'; password = 'motdepasse' } | ConvertTo-Json
try {
  $login = Invoke-RestMethod -Uri "$BaseUrl/api/login" -Method POST -ContentType 'application/json' -Body $loginBody
  Must ($login.token) "Login OK -> token: $($login.token)" "Login failed (pas de token)"
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Login failed: $body" -ForegroundColor Red
  exit 1
}

# --- Contexte de test
$nowUtc    = [DateTimeOffset]::UtcNow
$ts        = $nowUtc.ToUnixTimeSeconds()
$dtIso     = (Get-Date).AddMinutes(90).ToString('yyyy-MM-ddTHH:mm')  # ex: 2025-05-22T14:30
$origin    = "Testville-$ts"
$dest      = "Democity-$ts"
$testEmail1 = "test+$ts@ecoride.local"
$testEmail2 = "test+$ts-2@ecoride.local"

# --- 2) Créer un véhicule (2 places)
try {
  $vehBody = @{
    owner_email = "admin@example.com"
    brand       = "Renault"
    model       = "Zoe"
    seats       = 2            # 2 places pour que le trajet soit "full" après 2 résas
    plate       = "TST-$ts"
  } | ConvertTo-Json

  $vehResp = Invoke-RestMethod "$BaseUrl/api/vehicles" -Method POST -ContentType 'application/json' -Body $vehBody
  $vehId   = [int]$vehResp.id
  Must ($vehId -gt 0) "Vehicle created -> id=$vehId" "Vehicle creation failed"
} catch {
  if ($_.Exception.Response) {
    $code    = [int]$_.Exception.Response.StatusCode
    $reader  = New-Object IO.StreamReader ($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd()
    Write-Host "Vehicle creation failed ($code): $errBody" -ForegroundColor Red
  } else {
    Write-Host "Vehicle creation failed: $($_.Exception.Message)" -ForegroundColor Red
  }
  exit 1
}

# --- 3) Créer un trajet lié à ce véhicule (2 places pour tester 'full')
$rideBody = @{
  origin       = $origin
  destination  = $dest
  date_time    = $dtIso                  # l’API normalise vers 'YYYY-MM-DD HH:mm'
  price        = 25
  vehicle_id   = $vehId
} | ConvertTo-Json

try {
  $ride = Invoke-RestMethod -Uri "$BaseUrl/api/rides" -Method POST -ContentType 'application/json' -Body $rideBody
  $rideId = [int]$ride.id
  Must ($rideId -gt 0) "Ride created -> id=$rideId" "Ride creation failed"
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Ride creation failed: $body" -ForegroundColor Red
  exit 1
}

# --- 4) Vérifier qu'on retrouve le trajet dans la recherche
try {
  $rides = Invoke-RestMethod -Uri "$BaseUrl/api/rides?origin=$origin&destination=$dest&sort_by=date&order=ASC" -Method GET
  $count = ($rides | Measure-Object).Count
  Must ($count -ge 1) "Rides found: $count" "No rides found for search"
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Search failed: $body" -ForegroundColor Red
  exit 1
}

# --- 5) Réservation #1 (OK 201)
$book1Body = @{ ride_id = $rideId; name = "Test Bot";  email = $testEmail1 } | ConvertTo-Json
try {
  $b1 = Invoke-RestMethod -Uri "$BaseUrl/api/bookings" -Method POST -ContentType 'application/json' -Body $book1Body
  Write-Host "Booking#1 OK -> id=$($b1.id)" -ForegroundColor Green
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Booking#1 FAILED: $body" -ForegroundColor Red
  exit 1
}

# --- 6) Réservation #1 bis (même email) => 409 Already booked (tolérant)
try {
  $null = Invoke-RestMethod -Uri "$BaseUrl/api/bookings" -Method POST -ContentType 'application/json' -Body $book1Body
  Write-Host "Expected 409 Already booked, got 201" -ForegroundColor Red
  exit 1
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  $body = Read-ErrorBody $_
  if ($code -eq 409) {
    Write-Host "Duplicate booking correctly rejected (HTTP 409). Body: $body" -ForegroundColor Green
  } else {
    Write-Host "Wrong error for duplicate booking -> HTTP $code, body: $body" -ForegroundColor Red
    exit 1
  }
}


# --- 7) Réservation #2 (nouvel email) => 201
$book2Body = @{ ride_id = $rideId; name = "Test Bot 2"; email = $testEmail2 } | ConvertTo-Json
try {
  $b2 = Invoke-RestMethod -Uri "$BaseUrl/api/bookings" -Method POST -ContentType 'application/json' -Body $book2Body
  Write-Host "Booking#2 OK -> id=$($b2.id)" -ForegroundColor Green
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Booking#2 FAILED: $body" -ForegroundColor Red
  exit 1
}

# --- 8) Réservation #3 (trajet plein) => 409 Ride full (tolérant)
$book3Body = @{ ride_id = $rideId; name = "Test Bot 3"; email = "third+$ts@ecoride.local" } | ConvertTo-Json
try {
  $null = Invoke-RestMethod -Uri "$BaseUrl/api/bookings" -Method POST -ContentType 'application/json' -Body $book3Body
  Write-Host "Expected 409 Ride full, got 201" -ForegroundColor Red
  exit 1
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  $body = Read-ErrorBody $_
  if ($code -eq 409) {
    $shown = if ($body) { $body } else { '<empty body>' }
    Write-Host "Full ride correctly rejected (HTTP 409). Body: $shown" -ForegroundColor Green
  } else {
    Write-Host "Wrong error for full ride -> HTTP $code, body: $body" -ForegroundColor Red
    exit 1
  }
}


# --- 9) Vérifier seats = 0
try {
  $r = Invoke-RestMethod -Uri "$BaseUrl/api/rides/$rideId" -Method GET
  Must ($r.seats -eq 0) "Seats after bookings: $($r.seats)" "Seats expected 0, got $($r.seats)"
} catch {
  $body = Read-ErrorBody $_
  Write-Host "Check seats failed: $body" -ForegroundColor Red
  exit 1
}

Write-Host "=== Smoke-tests finished (OK) ===" -ForegroundColor Cyan
