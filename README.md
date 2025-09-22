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

Page de détail des informations d'un covoiturage avec accès aux avis du conducteur et possibilité de réserver

![détail-covoiturage (3)](https://github.com/user-attachments/assets/51715e61-7dfa-434f-918e-dbb3de949b15)
![détail-covoiturage (4)](https://github.com/user-attachments/assets/59bcaad8-9649-421a-9eee-3a2f7d412580)
![détail-avis (2)](https://github.com/user-attachments/assets/6acfd977-2100-4dae-88f3-56be9dcbd9d4)
![détail-réservation (2)](https://github.com/user-attachments/assets/df5915e0-c113-4583-8743-690676b71108)


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

Page de connexion 

![connexion](https://github.com/user-attachments/assets/3206d184-4f0f-4844-ae9d-e0e157bc767b)


espace employé

Page espace employé avec action sur avis avant publication

![espace-employé](https://github.com/user-attachments/assets/60561b57-b91b-4c48-b7dd-341ce79318da)

espace administrateur

Page administrateur avec possibilité d'ajouter et supprimer employé et graphique statistique

![espace-administrateur](https://github.com/user-attachments/assets/30c061e0-13d2-4d35-a884-da729e40e885)

modal navbar

Page avec modal de la navbar

![modal-navbar-mobile](https://github.com/user-attachments/assets/49a97432-5d35-4d3d-a872-dd81eef6361f)

modal filtres

Page ouverture du modal "filtres"

![modal-filtres](https://github.com/user-attachments/assets/57b5590c-827f-4370-b95e-694e171766d8)




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
│  ├─ public/
│  │  ├─ index.php
│  │  └─ .htaccess
│  ├─ db/
│  │  └─ schema.sql
│  └─ composer.json
├─ docker/
│  └─ php/
│     ├─ Dockerfile
│     └─ vhost.conf
├─ docker-compose.yml
└─ frontend/                    # Front-end statique
   └─ Projet_ecoride/
      ├─ Css/                   # Feuilles de style
      ├─ Html/                  # Pages HTML (+ `_redirects` si utilisé)
      ├─ Js/                    # Scripts JavaScript
      └─ assets/                # Images, icônes
         └─ screenshots/        # Captures d’écran
         └─ charte-graphique-ecoride.pdf
         └─ documentation technique
         └─ gestion_projet
         └─ manuel_d'utilisation

12) Dépannage (FAQ)

vendor/autoload.php introuvable
→ (Re)générez les deps :
docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev
puis docker compose restart php.

Erreur 740 / WSL2
→ Ouvrir PowerShell en admin puis :
dism /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all
dism /online /enable-feature /featurename:VirtualMachinePlatform /all
Redémarrer, puis wsl --set-default-version 2.

Port déjà utilisé (8080/3306)
→ Modifier les ports dans docker-compose.yml (ex. 8082:80).

Netlify (front) ne voit pas l’API
→ En prod, utiliser l’URL publique du back et limiter CORS à ce domaine.

13) Licence

Ce projet est sous licence MIT. Voir LICENSE pour plus de détails.


14) Check-list de validation

 Html/config.js chargé avant Recherche-covoiturage.js / Detail-covoiturage.js

 CORS_ALLOW_ORIGIN pointe vers https://golden-medovik-8f81e4.netlify.app

 docker compose up -d --build exécuté

 Tests manuels depuis Netlify :

 Page Recherche → la liste remonte (onglet Réseau : requêtes vers votre HÔTE API, status 200)

 Page Détail → chargement + réservation OK

 Réservations pleines → 409 bien géré (toast/état UI)


15) Commit suggéré
git add frontend/Projet_ecoride/Html/config.js docker-compose.yml README.md
git commit -m "Prod ready: API_BASE_URL front config + CORS_ALLOW_ORIGIN"
git push

Date : 22 mai 2025

