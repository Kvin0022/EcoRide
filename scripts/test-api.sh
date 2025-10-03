#!/usr/bin/env bash
set -euo pipefail

# === EcoRide smoke-tests (Bash) ===
BASE_URL="${API_BASE_URL:-http://localhost:8080}"

echo "=== EcoRide smoke-tests (Bash) ==="
echo "API_BASE_URL = $BASE_URL"

# Fonction pour afficher OK/Fail
must() {
  local cond="$1"
  local ok="$2"
  local fail="$3"
  if eval "$cond"; then
    echo -e "\033[32m$ok\033[0m"
  else
    echo -e "\033[31m$fail\033[0m"
    exit 1
  fi
}

# --- 0) Ping
if ! pingResp=$(curl -s "$BASE_URL/"); then
  echo "Ping failed"
  exit 1
fi
echo "Ping: $pingResp"

# --- 1) Login
login=$(curl -s -X POST "$BASE_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"motdepasse"}')

token=$(echo "$login" | jq -r '.token // empty')
must "[[ -n \"$token\" ]]" "Login OK -> token: $token" "Login failed (pas de token)"

# Contexte
ts=$(date +%s)
dtIso=$(date -d "+90 minutes" +"%Y-%m-%dT%H:%M")
origin="Testville-$ts"
dest="Democity-$ts"
testEmail1="test+$ts@ecoride.local"
testEmail2="test+$ts-2@ecoride.local"

# --- 2) Créer un véhicule
vehResp=$(curl -s -X POST "$BASE_URL/api/vehicles" \
  -H "Content-Type: application/json" \
  -d "{\"owner_email\":\"admin@example.com\",\"brand\":\"Renault\",\"model\":\"Zoe\",\"seats\":2,\"plate\":\"TST-$ts\"}")

vehId=$(echo "$vehResp" | jq -r '.id // 0')
must "[[ $vehId -gt 0 ]]" "Vehicle created -> id=$vehId" "Vehicle creation failed"

# --- 3) Créer un trajet
rideResp=$(curl -s -X POST "$BASE_URL/api/rides" \
  -H "Content-Type: application/json" \
  -d "{\"origin\":\"$origin\",\"destination\":\"$dest\",\"date_time\":\"$dtIso\",\"price\":25,\"vehicle_id\":$vehId}")

rideId=$(echo "$rideResp" | jq -r '.id // 0')
must "[[ $rideId -gt 0 ]]" "Ride created -> id=$rideId" "Ride creation failed"

# --- 4) Vérifier qu'on retrouve le trajet
rides=$(curl -s "$BASE_URL/api/rides?origin=$origin&destination=$dest&sort_by=date&order=ASC")
count=$(echo "$rides" | jq 'length')
must "[[ $count -ge 1 ]]" "Rides found: $count" "No rides found"

# --- 5) Réservation #1
book1=$(curl -s -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"ride_id\":$rideId,\"name\":\"Test Bot\",\"email\":\"$testEmail1\"}")
id1=$(echo "$book1" | jq -r '.id // empty')
must "[[ -n \"$id1\" ]]" "Booking#1 OK -> id=$id1" "Booking#1 FAILED"

# --- 6) Réservation #1 bis (déjà réservé)
status=$(curl -s -o /tmp/resp.txt -w "%{http_code}" -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"ride_id\":$rideId,\"name\":\"Test Bot\",\"email\":\"$testEmail1\"}")
if [[ "$status" == "409" ]]; then
  echo -e "\033[32mDuplicate booking correctly rejected (HTTP 409)\033[0m"
else
  echo -e "\033[31mWrong error for duplicate booking -> HTTP $status\033[0m"
  cat /tmp/resp.txt
  exit 1
fi

# --- 7) Réservation #2
book2=$(curl -s -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"ride_id\":$rideId,\"name\":\"Test Bot 2\",\"email\":\"$testEmail2\"}")
id2=$(echo "$book2" | jq -r '.id // empty')
must "[[ -n \"$id2\" ]]" "Booking#2 OK -> id=$id2" "Booking#2 FAILED"

# --- 8) Réservation #3 (trajet plein)
status=$(curl -s -o /tmp/resp2.txt -w "%{http_code}" -X POST "$BASE_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -d "{\"ride_id\":$rideId,\"name\":\"Test Bot 3\",\"email\":\"third+$ts@ecoride.local\"}")
if [[ "$status" == "409" ]]; then
  echo -e "\033[32mFull ride correctly rejected (HTTP 409)\033[0m"
else
  echo -e "\033[31mWrong error for full ride -> HTTP $status\033[0m"
  cat /tmp/resp2.txt
  exit 1
fi

# --- 9) Vérifier seats = 0
ride=$(curl -s "$BASE_URL/api/rides/$rideId")
seats=$(echo "$ride" | jq -r '.seats')
must "[[ $seats -eq 0 ]]" "Seats after bookings: $seats" "Seats expected 0, got $seats"

echo "=== Smoke-tests finished (OK) ==="
