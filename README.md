EcoRide — Frontend & API (Docker)








📌 Livrables inclus

✅ Code source complet (frontend + backend)

✅ Déploiement front (Netlify)

✅ Déploiement back (Railway – PHP 8.2 + MySQL + MongoDB)

✅ Documentation technique (MCD, use cases, séquence, classes)

✅ Manuel utilisateur (PDF)

✅ Charte graphique (PDF)

✅ Trello (gestion de projet)

✅ README avec instructions de déploiement et check-list finale

0) Informations clés

GitHub : EcoRide

Trello : Board Trello

Front (Netlify) : https://golden-medovik-8f81e4.netlify.app

API (Railway) : https://ecoride-production-0838.up.railway.app

Comptes de démonstration

Admin : admin2@example.com / motdepasse

(optionnel) Utilisateur : à créer via /api/register

1) Prérequis

Docker Desktop (WSL2 activé sur Windows)

Git

Navigateur moderne (Chrome, Firefox, Edge, Safari)

(Optionnel) Node.js si vous utilisez des outils front supplémentaires

Accès Railway (ou équivalent) pour MySQL/Mongo + hébergement API

2) Cloner le dépôt
git clone https://github.com/Kvin0022/EcoRide.git
cd EcoRide


Ce dépôt est monolithique (frontend + backend).
Le front est sous frontend/Projet_ecoride.

3) Lancement rapide (API + Front)

Rien à installer localement pour PHP : Composer est exécuté dans Docker.

3.1 Installer les dépendances PHP (via image Composer)

Windows (PowerShell) :

docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev --prefer-dist


macOS / Linux :

docker run --rm -v "$PWD/backend:/app" -w /app composer:2 install --no-dev --prefer-dist


Si vous voyez une erreur liée à ext-pdo_mysql ou ext-mongodb, ré-exécutez la commande avec :
--ignore-platform-req=ext-pdo_mysql --ignore-platform-req=ext-mongodb

3.2 Démarrer la stack
docker compose up -d --build


API : http://localhost:8080
 → doit afficher 🚀 API EcoRide en ligne !

Adminer (MySQL) : http://localhost:8081

Server : db — User/Pass : ecoride / ecoride — DB : ecoride

Mongo Express : http://localhost:8082

Host: mongo — DB: ecoride

3.3 Variables d’environnement (service php)

Dans docker-compose.yml ou via Railway/Render :

DB_HOST=db
DB_NAME=ecoride
DB_USER=ecoride
DB_PASS=ecoride
MONGO_URI=mongodb://mongo:27017
MONGO_DB=ecoride
CORS_ALLOW_ORIGIN=https://golden-medovik-8f81e4.netlify.app

4) Base de données (local/prod)

Les scripts SQL sont dans backend/db/ :

1-schema.sql : création des tables (users, vehicles, rides, bookings) + VIEW rides_with_seats_left

2-seed.sql / seed_demo.sql : jeux de données de démo

4.1 Init automatique (Docker – premier démarrage)

Les .sql sont exécutés automatiquement par MySQL si la base est vide.

Ré-initialiser (⚠️ efface la base) :

docker compose down
docker volume rm ecoride_db_data
docker compose up -d

4.2 Importer sur Railway (prod/démo)
# Remplacez host/port/DB selon Railway
mysql -h crossover.proxy.rlwy.net -P 44040 -u root -p railway < backend/db/1-schema.sql
mysql -h crossover.proxy.rlwy.net -P 44040 -u root -p railway < backend/db/seed.sql

4.3 Reset & Seed (scripts)

Linux/macOS

chmod +x scripts/reset-and-seed.sh
./scripts/reset-and-seed.sh              # reset logique
./scripts/reset-and-seed.sh --recreate-db  # drop/create DB puis import


Windows (PowerShell)

.\scripts\reset-and-seed.ps1

5) Config front (local/prod)

Dans frontend/Projet_ecoride/Html/config.js :

<script>
  window.API_BASE_URL = (
    location.hostname.endsWith('netlify.app')
      ? 'https://ecoride-production-0838.up.railway.app'
      : 'http://localhost:8080'
  );
</script>

6) Fonctionnalités principales

🔑 Authentification (register / login / logout)

🔍 Recherche de covoiturages (filtres : origine, destination, date, sièges, tri, éco)

📅 Détail d’un trajet (conducteur, véhicule, note)

🛒 Réservation avec décrémentation des sièges + erreurs (409 complet / déjà réservé, 404)

👤 Profil utilisateur (infos, véhicules, historique)

👥 Rôles : utilisateur / employé / admin

🖥 Responsive + ♿ Accessibilité (aria-live, focus visible)

7) Backend — Endpoints
7.1 Santé

GET /api/ping/sql → { "sql": "ok" }

GET /api/ping/mongo → { "mongo": "ok" }

7.2 Auth

POST /api/register { pseudo, email, password }

POST /api/login { email, password } → token (mock), role, credits

7.3 Rides (SQL – CRUD)

GET /api/rides (filtres & tri)

GET /api/rides/{id}

POST /api/rides (origin, destination, date_time "YYYY-MM-DD HH:MM", seats, price, duration_minutes?, vehicle_id?)

PUT /api/rides/{id}

DELETE /api/rides/{id}

7.4 Bookings (SQL)

POST /api/bookings (ride_id, name, email) — gère 404/409/422

7.5 Reviews (MongoDB – CRUD)

POST /api/reviews (ride_id:int, rating:1..5, comment, user_email)

GET /api/reviews?ride_id=ID

GET /api/reviews/{id}

PUT /api/reviews/{id}

DELETE /api/reviews/{id}

Choix NoSQL : reviews = schéma flexible (texte, évolutions), volumétrie potentielle, accès direct par ride_id sans jointures.

8) Tests rapides (PowerShell)
# Pings
Invoke-RestMethod http://localhost:8080/api/ping/sql
Invoke-RestMethod http://localhost:8080/api/ping/mongo

# CREATE ride
$ride = @{origin="Metz";destination="Nancy";date_time="2025-12-01 14:00";duration_minutes=60;seats=3;price=8}|ConvertTo-Json
$rideId = (Invoke-RestMethod "http://localhost:8080/api/rides" -Method Post -ContentType "application/json" -Body $ride).id

# READ ride
Invoke-RestMethod "http://localhost:8080/api/rides/$rideId"

# UPDATE ride (204 attendu)
$upd = @{origin="Metz";destination="Strasbourg";date_time="2025-12-01 16:00";duration_minutes=90;seats=2;price=12}|ConvertTo-Json
Invoke-RestMethod "http://localhost:8080/api/rides/$rideId" -Method Put -ContentType "application/json" -Body $upd

# DELETE ride (204 attendu)
Invoke-RestMethod "http://localhost:8080/api/rides/$rideId" -Method Delete

# CREATE review (Mongo)
$rev = @{ride_id=[int]$rideId;rating=5;comment="Top !";user_email="user@example.com"}|ConvertTo-Json
$revId = (Invoke-RestMethod "http://localhost:8080/api/reviews" -Method Post -ContentType "application/json" -Body $rev).id

# LIST / READ / UPDATE / DELETE review
Invoke-RestMethod "http://localhost:8080/api/reviews?ride_id=$rideId"
Invoke-RestMethod "http://localhost:8080/api/reviews/$revId"
$revPatch = @{rating=4;comment="Finalement 4 étoiles"}|ConvertTo-Json
Invoke-RestMethod "http://localhost:8080/api/reviews/$revId" -Method Put -ContentType "application/json" -Body $revPatch
Invoke-RestMethod "http://localhost:8080/api/reviews/$revId" -Method Delete

9) Frontend

Les pages HTML sont dans frontend/Projet_ecoride/Html/.
JS : Js/Connexion.js, Js/Recherche.js, Js/Detail-covoiturage.js, Js/navbar-auth.js.

Tester le front seul :

cd frontend/Projet_ecoride/Html
python -m http.server 8000
# Puis http://localhost:8000

10) Déploiement prod
10.1 Front (Netlify)

Créer netlify.toml à la racine :

[build]
  command = ""
  publish = "frontend/Projet_ecoride/Html"

git add netlify.toml
git commit -m "Ajout config Netlify"
git push origin main


Déployer depuis l’interface Netlify (“New site from Git”).

10.2 API (Railway)

Nouveau projet Railway (service Docker)

Variables d’environnement (section 3.3)

Vérifier GET /ping et GET /api/rides avant de brancher le front

11) Diagrammes (Mermaid)
Use Case
usecaseDiagram
  actor Membre as "Membre"
  actor Employe as "Employé"
  Membre --> (S'inscrire)
  Membre --> (Se connecter)
  Membre --> (Rechercher un covoiturage)
  Membre --> (Réserver un trajet)
  Employe --> (Modérer avis)

Classes
classDiagram
  class User {+id:int; +email:string; +password_hash:string; +role:enum; +created_at:datetime}
  class Ride {+id:int; +driver_id:int; +origin:string; +destination:string; +date_time:datetime; +seats:int; +price:decimal}
  User "1" --> "0..*" Ride : conduit

Séquence — Login
sequenceDiagram
  participant U as Utilisateur
  participant F as Front (Connexion.js)
  participant API as API (Slim)
  U->>F: Submit email/mdp
  F->>API: POST /api/login (JSON)
  API-->>F: 200 {token}
  F-->>U: "Connecté ✅"

12) Checklist de validation ✅

Html/config.js chargé avant Recherche-covoiturage.js / Detail-covoiturage.js

CORS_ALLOW_ORIGIN pointe vers Netlify en prod

docker compose up -d --build OK

Recherche covoiturage → liste OK

Détail + réservation OK (409 complet / déjà réservé)

SQL exploité : CRUD rides (+ bookings), VIEW rides_with_seats_left

NoSQL exploité : CRUD reviews (Mongo)

Santé : /api/ping/sql et /api/ping/mongo OK

13) Sécurité & bonnes pratiques

Hashage : password_hash() / password_verify()

PDO + requêtes préparées

Validation serveur (emails, longueurs, champs)

CORS restreint au domaine Netlify en prod

Pas de stack trace en prod, messages JSON propres

14) Endpoints API (prod)

GET /ping → santé API

POST /api/register → inscription

POST /api/login → login (token mock + role + credits)

GET /api/rides, GET /api/rides/:id

POST /api/bookings (404/409/422 gérés)

CRUD /api/reviews (Mongo)

15) Captures d’écran

(inchangé — tes captures actuelles)

16) Structure du projet
ecoride/
├─ backend/                     # API PHP (Slim) + SQL + Mongo
│  ├─ public/
│  │  ├─ index.php              # Entrée API (routes + ping SQL/Mongo)
│  │  └─ .htaccess              # Réécriture URL (Slim)
│  ├─ src/
│  │  ├─ Db.php                 # Connexion PDO MySQL
│  │  ├─ Mongo.php              # Connexion MongoDB\Client
│  │  └─ ReviewRepositoryMongo.php  # CRUD Mongo (reviews)
│  ├─ db/
│  │  ├─ 1-schema.sql
│  │  ├─ 2-seed.sql
│  │  └─ seed_demo.sql
│  ├─ composer.json / composer.lock
│  └─ vendor/
├─ docker/
│  └─ php/
│     ├─ Dockerfile             # PHP 8.2 + pdo_mysql + mongodb (PECL 1.21.x)
│     └─ docker-start.sh        # ajuste le port si $PORT est défini (Railway)
├─ docker-compose.yml           # php + db + adminer + mongo + mongo-express
└─ frontend/
   └─ Projet_ecoride/
      ├─ Css/ Html/ Js/
      └─ assets/

17) Dépannage (FAQ)
vendor/autoload.php introuvable
docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev --prefer-dist
docker compose restart php

Erreur PowerShell / WSL2

Exécuter PowerShell en admin puis :

dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all
dism /online /enable-feature /featurename:VirtualMachinePlatform /all
wsl --set-default-version 2

Port déjà utilisé (8080/3306)

Modifier les ports dans docker-compose.yml, ex.:

services:
  php:
    ports:
      - "8082:80"

Netlify ne voit pas l’API

En prod, utiliser l’URL publique du back et limiter CORS :

environment:
  CORS_ALLOW_ORIGIN: https://golden-medovik-8f81e4.netlify.app

Mismatch Mongo bsonSerialize

Pin de versions :

Dockerfile : pecl install mongodb-1.21.2 && docker-php-ext-enable mongodb

Composer (dans le conteneur) : composer require mongodb/mongodb:^1.21
Puis docker compose build --no-cache php && docker compose up -d.

18) Licence

MIT — voir LICENSE.

19) Contributeurs

Kévin – Développeur full-stack (frontend + backend + Docker + déploiement)

Date : 27 novembre 2025
