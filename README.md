EcoRide Frontend

0. Informations clés

Lien GitHub : https://github.com/Kvin0022/EcoRide

Lien outil gestion de projet : https://trello.com/invite/b/682f09bccc7341e94578586c/ATTI8d775d61b34a67816b963717bc327d21B268FA60/ecoride-dev

Lien déploiement : https://golden-medovik-8f81e4.netlify.app/

Identifiant administrateur : admin@example.com / motdepasse

1. Prérequis

Node.js (optionnel pour outils de développement)

Git

Navigateur moderne (Chrome, Firefox, Edge, Safari)

2. Cloner le dépôt

git clone https://github.com/Kvin0022/EcoRide.git
cd EcoRide

Ce dépôt est monolithique (frontend + backend). La partie front se trouve dans frontend/Projet_ecoride.

3. Installation des dépendances

Si vous utilisez un bundler (npm, Webpack, etc.) :

npm install

Pour un usage pur HTML/CSS/JS, aucune dépendance n'est requise.

4. Lancer en local

Ouvrez directement frontend/Projet_ecoride/Html/index.html dans votre navigateur, ou :

cd frontend/Projet_ecoride/Html
python -m http.server 8000
# puis ouvrez http://localhost:8000

5. Déploiement (Netlify / Vercel)

a) Netlify

À la racine, créez netlify.toml :

[build]
  command = ""
  publish = "frontend/Projet_ecoride/Html"

[context.production.environment]
  GIT_SUBMODULE_STRATEGY = "none"

Poussez :



git add netlify.toml
git commit -m "Ajout config Netlify"
git push origin main

3. Sur Netlify, « New site from Git » → sélectionnez `Kvin0022/EcoRide@main`.


## 6. Captures d’écran

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

## 7. Charte graphique


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

## 8. Structure du projet

```text
ecoride/
├─ backend/                # API PHP, dépendances
└─ frontend/               # Front-end statique
  └─ Projet_ecoride/
   ├─ Css/              # Feuilles de style
   ├─ Html/             # Pages HTML et `_redirects` si utilisé
   ├─ Js/               # Scripts JavaScript
   ├─ assets/           # Images, icônes
      └─ screenshots/   # Captures d’écran
      └─ charte-graphique-ecoride.pdf
      └─ documentation technique
      └─ gestion_projet
      └─  manuel_d'utilisation
└─ Document wireframe et mockup/
└─ netlify
└─ README


9. Licence

Ce projet est sous licence MIT. Voir LICENSE pour plus de détails.

Date : 22 mai 2025

