# EcoRide — Frontend & API (Docker)

![status](https://img.shields.io/badge/status-ready-brightgreen)
![docker](https://img.shields.io/badge/Docker-ready-blue)
![netlify](https://img.shields.io/badge/Netlify-deployed-success)

> 📌 **Livrables inclus**
> - ✅ Code source complet (frontend + backend)
> - ✅ Déploiement front (Netlify)
> - ✅ Déploiement back (Railway – PHP 8.2 + MySQL)
> - ✅ Documentation technique (MCD, use cases, séquence, classes)
> - ✅ Manuel utilisateur (PDF)
> - ✅ Charte graphique (PDF)
> - ✅ Trello (gestion de projet)
> - ✅ README avec instructions de déploiement et check-list finale

---

## 0) Informations clés

- **GitHub** : [EcoRide](https://github.com/Kvin0022/EcoRide)
- **Trello** : [Board Trello](https://trello.com/invite/b/682f09bccc7341e94578586c/ATTI8d775d61b34a67816b963717bc327d21B268FA60/ecoride-dev)
- **Front (Netlify)** : [https://golden-medovik-8f81e4.netlify.app](https://golden-medovik-8f81e4.netlify.app)
- **API (Railway)** : [https://ecoride-production-0838.up.railway.app](https://ecoride-production-0838.up.railway.app)

### Comptes de démonstration
- **Admin** : `admin2@example.com` / `motdepasse`
- (optionnel) **Utilisateur simple** : à créer via `/api/register`

---

## 1) Prérequis

- Docker Desktop (avec WSL2 activé sur Windows)
- Git
- Navigateur moderne (Chrome, Firefox, Edge, Safari)
- (Optionnel) Node.js si vous utilisez des outils front supplémentaires
- Accès Railway (ou autre provider) pour MySQL + hébergement API

---

## 2) Cloner le dépôt

bash
git clone https://github.com/Kvin0022/EcoRide.git
cd EcoRide

Ce dépôt est monolithique (frontend + backend).
Le front est sous frontend/Projet_ecoride.

3) Lancement rapide (API + Front)

Rien à installer localement pour PHP : on utilise Composer dans Docker.

3.1 Installer les dépendances PHP (via image Composer)

Windows (PowerShell) :

docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev


macOS / Linux :

docker run --rm -v "$PWD/backend:/app" -w /app composer:2 install --no-dev

3.2 Démarrer la stack
docker compose up -d --build


API : http://localhost:8080
 → doit afficher 🚀 API EcoRide en ligne !

Adminer : http://localhost:8081

Server : db

User/Pass : ecoride / ecoride

DB : ecoride

3.3 Variables d’environnement

Dans docker-compose.yml ou via Railway/Render :

Variable	Exemple
DB_HOST	mysql.railway.internal (ou crossover.proxy.rlwy.net)
DB_PORT	3306 / 44040
DB_NAME	railway (ou ecoride)
DB_USER	root
DB_PASS	mot de passe Railway MySQL
CORS_ALLOW_ORIGIN	https://golden-medovik-8f81e4.netlify.app

4) Base de données (prod/démo)

Les fichiers SQL sont dans backend/db/ :

schema.sql : création des tables (users, rides, bookings, vehicles)

seed.sql : jeux de données de démo (trajets, véhicules, etc.)

Importer sur Railway (depuis PowerShell) :

mysql -h crossover.proxy.rlwy.net -P 44040 -u root -p railway < backend/db/schema.sql
mysql -h crossover.proxy.rlwy.net -P 44040 -u root -p railway < backend/db/seed.sql

5) Config front (local/prod)

Dans Html/config.js :

<script>
  window.API_BASE_URL = (
    location.hostname.endsWith('netlify.app')
      ? 'https://ecoride-production-0838.up.railway.app'
      : 'http://localhost:8080'
  );
</script>

6) Fonctionnalités principales

🔑 Authentification (register / login / logout)

🔍 Recherche de covoiturages avec filtres dynamiques (origine, destination, date, sièges, tri, éco)

📅 Détail d’un trajet (infos conducteur, véhicule, note)

🛒 Réservation avec décrémentation des sièges + gestion des erreurs (409 complet, 409 déjà réservé, 404 inexistant)

👤 Profil utilisateur (infos, véhicules, historique)

👥 Gestion rôles : utilisateur / employé / admin

🖥 Responsive design (desktop & mobile)

♿ Accessibilité : aria-live, focus visible, loader et toasts

7) Frontend

Les pages HTML sont dans frontend/Projet_ecoride/Html/.
JS : Js/Connexion.js, Js/Recherche.js, Js/Detail-covoiturage.js, Js/navbar-auth.js.

Pour tester uniquement le front en local :

cd frontend/Projet_ecoride/Html
python -m http.server 8000


Puis ouvrir http://localhost:8000
.

8) Déploiement prod
8.1 Front (Netlify)

Créer netlify.toml à la racine :

[build]
  command = ""
  publish = "frontend/Projet_ecoride/Html"


Puis :

git add netlify.toml
git commit -m "Ajout config Netlify"
git push origin main


Déployer depuis l’interface Netlify (New site from Git).

8.2 API (Railway)

Créer un nouveau projet Railway (service Docker)

Ajouter les variables d’environnement listées plus haut

Vérifier que /ping et /api/rides renvoient bien des données avant de brancher le front.

9) Diagrammes (Mermaid)
9.1 Use Case
usecaseDiagram
  actor Membre as "Membre"
  actor Employe as "Employé"
  Membre --> (S'inscrire)
  Membre --> (Se connecter)
  Membre --> (Rechercher un covoiturage)
  Membre --> (Réserver un trajet)
  Employe --> (Modérer avis)

9.2 Classes
classDiagram
  class User {+id:int; +email:string; +password_hash:string; +role:enum; +created_at:datetime}
  class Ride {+id:int; +driver_id:int; +origin:string; +destination:string; +date_time:datetime; +seats:int; +price:decimal}
  User "1" --> "0..*" Ride : conduit

9.3 Séquence — Login
sequenceDiagram
  participant U as Utilisateur
  participant F as Front (Connexion.js)
  participant API as API (Slim)
  U->>F: Submit email/mdp
  F->>API: POST /api/login (JSON)
  API-->>F: 200 {token}
  F-->>U: "Connecté ✅"

10)Checklist de validation ✅

 Html/config.js chargé avant Recherche-covoiturage.js / Detail-covoiturage.js

 CORS_ALLOW_ORIGIN pointe vers Netlify

 docker compose up -d --build fonctionne

 Recherche covoiturage → liste OK

 Détail + réservation OK

 Réservation refusée quand complet (409)

11) Sécurité & bonnes pratiques

Hashage : password_hash() / password_verify()

PDO + requêtes préparées pour toutes les opérations

Validation côté serveur (emails, longueurs, champs obligatoires)

CORS restreint au domaine Netlify en prod

Pas de stack trace en prod, messages propres en JSON

12) Endpoints API (prod)

GET /ping → santé API

POST /api/register → inscription (pseudo,email,password)

POST /api/login → login (retourne token + rôle + crédits)

GET /api/rides (filtres & tri)

GET /api/rides/:id

POST /api/bookings (gère 404/409/422)

13) Captures d’écran

Voici quelques captures d’écran des vues desktop clés :

Accueil

Page de présentation de l'entreprise

![index (5)](https://github.com/user-attachments/assets/748cb410-c726-4f48-87fa-84c0cd9627a3)
![index (6)](https://github.com/user-attachments/assets/3cb56d42-19e4-4af7-bdb0-db62f67a9320)
![index (7)](https://github.com/user-attachments/assets/6f19e098-5ccf-41c0-8f30-e5e2bdc8c710)
![index (8)](https://github.com/user-attachments/assets/5cc8bebb-22d2-445b-be07-d69ed75bb1df)


Recherche covoiturage

Page pour la recherche de covoiturage avec application de filtres

<img width="879" height="101" alt="Image" src="https://github.com/user-attachments/assets/05f31b8d-cbab-4a3e-a2bb-d0f91f2ccc95" />
<img width="2539" height="521" alt="Image" src="https://github.com/user-attachments/assets/56c34e00-683b-4359-8450-bbdf0b1c47d4" />


détail covoiturage

Page de détail des informations d'un covoiturage avec accès aux avis du conducteur et possibilité de réserver (recherche avec filtres)

<img width="1029" height="1040" alt="Capture d'écran 2025-09-22 204551" src="https://github.com/user-attachments/assets/94a6ff4f-6b97-4cfe-9887-2c3de48d22e4" />
<img width="595" height="344" alt="Capture d'écran 2025-09-22 204540" src="https://github.com/user-attachments/assets/1b59f232-aa7a-43e0-bf19-c75b230a849a" />
<img width="975" height="1070" alt="Capture d'écran 2025-09-22 204502" src="https://github.com/user-attachments/assets/8bb52691-23b1-4048-a70c-a27865be3239" />
<img width="2544" height="335" alt="Capture d'écran 2025-09-22 204355" src="https://github.com/user-attachments/assets/9a7d47b7-6d9c-4c98-a970-b322345905aa" />
<img width="309" height="966" alt="Capture d'écran 2025-09-22 204341" src="https://github.com/user-attachments/assets/baa9fa0e-72ca-4099-8bb1-f9d963a263e3" />
<img width="2539" height="521" alt="Capture d'écran 2025-09-22 204319" src="https://github.com/user-attachments/assets/35937f96-319e-4faf-873c-252b67cc7c21" />
<img width="842" height="220" alt="Capture d'écran 2025-09-22 204639" src="https://github.com/user-attachments/assets/ff95e885-ee9d-4c1f-ada7-e60801c1ef9a" />


Profil

Page du profil utilisateur avec 4 onglets

![profil-informations](https://github.com/user-attachments/assets/8989f0d5-1282-45bc-9bd9-82f3c652b770)
![profil-chauffeur](https://github.com/user-attachments/assets/43f777e7-1e48-46fd-abc7-ba32569a94de)
![profil-publiez-un-trajet](https://github.com/user-attachments/assets/1bace7fa-3e16-4cf5-a6bc-ec72f9e9f34d)
![profil-historique](https://github.com/user-attachments/assets/1e163719-c861-415c-befa-c1739a801b6b)

Profil-mobile

Page profil version mobile

![profil-mobile](https://github.com/user-attachments/assets/3ebeb5df-2576-466f-9c14-1b8d8a2bc551)
![profil-mobile (2)](https://github.com/user-attachments/assets/89ba3b87-94cd-4eb0-a57f-d0abc259e6ac)

Connexion

Page de connexion (connexion réussie, navbar avec possibilité de se déconnecter)

<img width="680" height="675" alt="Capture d'écran 2025-09-22 203342" src="https://github.com/user-attachments/assets/68258bc8-8200-48c7-94d0-d4b93dec1ec3" />
<img width="2332" height="1190" alt="Capture d'écran 2025-09-22 203221" src="https://github.com/user-attachments/assets/f22e3337-6631-4048-8b77-d2c927ad5bcd" />
<img width="879" height="101" alt="Capture d'écran 2025-09-22 204301" src="https://github.com/user-attachments/assets/fc7955bf-9c47-4043-a011-432203c00913" />
<img width="919" height="555" alt="Capture d'écran 2025-09-22 204201" src="https://github.com/user-attachments/assets/345d2e78-a60e-4483-a130-292c1d8842f6" />


espace employé

Page espace employé avec action sur avis avant publication

![espace-employé](https://github.com/user-attachments/assets/60561b57-b91b-4c48-b7dd-341ce79318da)

espace administrateur

Page administrateur avec possibilité d'ajouter et supprimer employé et graphique statistique

![espace-administrateur](https://github.com/user-attachments/assets/30c061e0-13d2-4d35-a884-da729e40e885)

modal navbar

Page avec modal de la navbar

![modal-navbar-mobile](https://github.com/user-attachments/assets/49a97432-5d35-4d3d-a872-dd81eef6361f)

Réservation complet

<img width="2535" height="131" alt="Capture d'écran 2025-09-22 204733" src="https://github.com/user-attachments/assets/a81a8fcf-151b-443e-9a1b-1eae1c02982d" />
<img width="1082" height="197" alt="Capture d'écran 2025-09-22 205340" src="https://github.com/user-attachments/assets/f2343354-26ac-45ee-b2cb-daa2d43f53a9" />

booking coté API

<img width="1113" height="226" alt="Capture d'écran 2025-09-22 205251" src="https://github.com/user-attachments/assets/5624b378-a776-44eb-afb9-cd576f52cf74" />

réservation déjà éffectué

<img width="1112" height="198" alt="Capture d'écran 2025-09-22 205320" src="https://github.com/user-attachments/assets/8c42c601-1f98-4216-9cd0-381bd8fb5493" />

Ping et API/rides

<img width="741" height="447" alt="Capture d'écran 2025-09-22 205434" src="https://github.com/user-attachments/assets/caffe1b1-a8aa-42a5-89a5-a67e18d181f3" />

Création d'un login

<img width="1097" height="222" alt="Capture d'écran 2025-09-22 205513" src="https://github.com/user-attachments/assets/5f20a786-311b-4e0a-9d27-125ed7082743" />

---

10) Charte graphique


La charte graphique est disponible :

[Charte graphique ecoride.pdf](https://github.com/user-attachments/files/20399217/Charte.graphique.ecoride.pdf)


Elle documente :
- Palette de couleurs (HEX/RGB + exemples)
- Typographies (police Jua : h1/h2/p/marges)
- Aperçu de boutons et formulaires stylisés
- Cartes
- Footer et liens
- Liens mockups Framer et wireframe Balsamiq

---

11) Structure du projet

ecoride/
├─ backend/                     # API PHP (Slim) + SQL
│  ├─ public/                   # Fichiers exposés publiquement
│  │  ├─ index.php              # Point d'entrée principal de l'API
│  │  ├─ ping.php               # Endpoint de test de disponibilité
│  │  └─ .htaccess              # Réécriture des URL (Slim)
│  ├─ db/                       # Scripts SQL
│  │  ├─ 1-schema.sql           # Création de la base
│  │  ├─ 2-seed.sql             # Données initiales
│  │  └─ seed_demo.sql          # Données de démonstration (tests)
│  ├─ composer.json             # Dépendances PHP
│  └─ composer.lock
├─ docker/
│  └─ php/
│     ├─ Dockerfile             # Image PHP + Apache
│     └─ vhost.conf             # Configuration Apache
├─ docker-compose.yml           # Définition de la stack (API + DB)
└─ frontend/                    # Front-end statique
   └─ Projet_ecoride/
      ├─ Css/                   # Feuilles de style
      ├─ Html/                  # Pages HTML (+ config.js)
      ├─ Js/                    # Scripts JavaScript (Connexion, Recherche, etc.)
      └─ assets/                # Images, icônes et ressources
         ├─ screenshots/        # Captures d’écran pour la doc
         ├─ charte-graphique-ecoride.pdf
         ├─ documentation technique
         ├─ gestion_projet      # Export Trello / Gantt / etc.
         └─ manuel_d'utilisation

 13) Dépannage (FAQ)

### vendor/autoload.php introuvable
(Re)générez les dépendances PHP :
`bash
docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev
docker compose restart php
Erreur 740 / WSL2
Ouvrir PowerShell en mode administrateur et exécuter :

bash
Copier le code
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all
dism /online /enable-feature /featurename:VirtualMachinePlatform /all
Puis redémarrer et activer WSL2 par défaut :

bash
Copier le code
wsl --set-default-version 2
Port déjà utilisé (8080/3306)
Modifier les ports dans docker-compose.yml, par exemple :

yaml
Copier le code
services:
  php:
    ports:
      - "8082:80"
Netlify (front) ne voit pas l’API
En production, utiliser l’URL publique du back et limiter CORS à ce domaine :

yaml
Copier le code
environment:
  CORS_ALLOW_ORIGIN: https://golden-medovik-8f81e4.netlify.app

14) Licence

Ce projet est sous licence MIT. Voir LICENSE pour plus de détails.


Date : 22 Septembre 2025

