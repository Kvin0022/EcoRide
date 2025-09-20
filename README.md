EcoRide — Frontend & API (Docker)
0) Informations clés

Lien GitHub : https://github.com/Kvin0022/EcoRide

Trello (gestion de projet) : https://trello.com/invite/b/682f09bccc7341e94578586c/ATTI8d775d61b34a67816b963717bc327d21B268FA60/ecoride-dev

Déploiement Front : https://golden-medovik-8f81e4.netlify.app/

Identifiants démo : admin@example.com / motdepasse

1) Prérequis

Docker Desktop (avec WSL2 activé sur Windows)

Git

Navigateur moderne (Chrome, Firefox, Edge, Safari)

(Optionnel) Node.js si vous utilisez des outils front supplémentaires

2) Cloner le dépôt
git clone https://github.com/Kvin0022/EcoRide.git
cd EcoRide


Ce dépôt est monolithique (frontend + backend). Le front est sous frontend/Projet_ecoride.

3) Lancement rapide (API + Front) — en 3 commandes

Rien à installer localement pour PHP, on utilise Composer dans Docker.

3.1 Installer les dépendances PHP (via image Composer)

Windows (PowerShell)

docker run --rm -v "${PWD}/backend:/app" -w /app composer:2 install --no-dev


macOS / Linux

docker run --rm -v "$PWD/backend:/app" -w /app composer:2 install --no-dev

3.2 Démarrer la stack
docker compose up -d

Lancer en local (Docker)

```bash
docker compose up -d --build
# API accessible: http://localhost:8080
# Ping:            http://localhost:8080/


API : http://localhost:8080
 → doit afficher 🚀 API EcoRide en ligne !

Adminer : http://localhost:8081

Server : db

User/Pass : ecoride / ecoride

DB : ecoride

3.3 Tester les endpoints

PowerShell (recommandé)

# Login (retourne un token)
Invoke-RestMethod "http://localhost:8080/api/login" -Method Post -ContentType "application/json" -Body '{"email":"admin@example.com","password":"motdepasse"}'

# Register (démo 201)
Invoke-RestMethod "http://localhost:8080/api/register" -Method Post -ContentType "application/json" -Body '{"email":"john@doe.com","password":"secret"}'

# Rides (liste mock)
Invoke-RestMethod "http://localhost:8080/api/rides" -Method Get

3.4 Config front (local/prod)

Le front lit `window.API_BASE_URL`. Fichier `Html/config.js` :

```html
<script>
  window.API_BASE_URL = (
    location.hostname.endsWith('netlify.app')
      ? 'https://TON-HOTE-API'
      : 'http://localhost:8080'
  );
</script>

Côté API, définissez CORS_ALLOW_ORIGIN sur le domaine Netlify dans votre docker-compose.yml (ou variables d’env.) :

environment:
  CORS_ALLOW_ORIGIN: https://golden-medovik-8f81e4.netlify.app

4) Endpoints exposés (démo)

GET / → ping ("🚀 API EcoRide en ligne !")

POST /api/login → { email, password } → { token, role }

POST /api/register → 201 (mock)

GET /api/rides → liste de trajets (mock)

5) Frontend (HTML/CSS/JS)

Pages : frontend/Projet_ecoride/Html/

Connexion : Js/Connexion.js intercepte le formulaire et appelle POST /api/login en fetch (mise à jour du DOM sans rechargement).

Recherche covoiturage : Js/Recherche.js appelle GET /api/rides et injecte la liste dynamiquement.

Lancer juste le front en local (serveur statique)
cd frontend/Projet_ecoride/Html
python -m http.server 8000
# puis ouvrez http://localhost:8000


L’API est attendue par défaut sur http://localhost:8080.
Vous pouvez définir window.API_BASE_URL si besoin.

6) Déploiement
6.1 Front (Netlify)

Créez netlify.toml à la racine :

[build]
  command = ""
  publish = "frontend/Projet_ecoride/Html"

[context.production.environment]
  GIT_SUBMODULE_STRATEGY = "none"


Puis :

git add netlify.toml
git commit -m "Ajout config Netlify"
git push origin main


Sur Netlify : New site from Git → Kvin0022/EcoRide@main.

6.2 Back (API)

Options possibles : Railway / Render / Fly.io (gratuit/low-cost) ou VPS Docker.
Exposez le service PHP sur un port public et mettez l’URL dans votre front (API_BASE_URL).
Documentez CORS (autorisez uniquement votre domaine Netlify en production).

7) Diagrammes (Mermaid)
7.1 Use Case
usecaseDiagram
  actor Membre as "Membre"
  actor Employe as "Employé"
  Membre --> (S'inscrire)
  Membre --> (Se connecter)
  Membre --> (Rechercher un covoiturage)
  Membre --> (Réserver un trajet)
  Employe --> (Modérer avis)

7.2 Classes
classDiagram
  class User {+id:int; +email:string; +password_hash:string; +role:enum; +created_at:datetime}
  class Ride {+id:int; +driver_id:int; +origin:string; +destination:string; +date_time:datetime; +seats:int; +price:decimal}
  User "1" --> "0..*" Ride : conduit

7.3 Séquence — Login
sequenceDiagram
  participant U as Utilisateur
  participant F as Front (Connexion.js)
  participant API as API (Slim)
  U->>F: Submit email/mdp
  F->>API: POST /api/login (JSON)
  API-->>F: 200 {token}
  F-->>U: "Connecté ✅" (mise à jour DOM)

8) Sécurité (bases mises en place / à documenter)

Hash mots de passe : password_hash() / password_verify() (à brancher quand la BDD sera branchée).

Requêtes SQL : PDO + requêtes préparées.

CORS : ouvert en dev, limité au domaine Netlify en prod.

Validation serveur : ex. filter_var($email, FILTER_VALIDATE_EMAIL), longueurs, champs requis.

Token : stocké côté front (localStorage) pour la démo.


9) Captures d’écran

Voici quelques captures d’écran des vues desktop clés :

Accueil

Page de présentation de l'entreprise

![index (5)](https://github.com/user-attachments/assets/748cb410-c726-4f48-87fa-84c0cd9627a3)
![index (6)](https://github.com/user-attachments/assets/3cb56d42-19e4-4af7-bdb0-db62f67a9320)
![index (7)](https://github.com/user-attachments/assets/6f19e098-5ccf-41c0-8f30-e5e2bdc8c710)
![index (8)](https://github.com/user-attachments/assets/5cc8bebb-22d2-445b-be07-d69ed75bb1df)


Recherche covoiturage

Page pour la recherche de covoiturage avec application de filtres

![recherche-covoiturage (9)](https://github.com/user-attachments/assets/b201d866-4eba-49f8-9887-9433857026e0)
![recherche-covoiturage (3)](https://github.com/user-attachments/assets/dbd8416d-4e28-44bd-bd5a-c2c7c2bc1329)

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

