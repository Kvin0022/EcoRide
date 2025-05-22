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

### b) Vercel

1. Connectez votre repo sur Vercel.
2. Choisissez `frontend/Projet_ecoride/Html` comme root.
3. Déployez sans build command.

---

## 6. Captures d’écran

Voici quelques captures d’écran des vues desktop clés :

Accueil

![index (8)](https://github.com/user-attachments/assets/0b8021fd-3cfc-4fb1-9d71-3a74a211671f)
![index (7)](https://github.com/user-attachments/assets/f80206d2-2aff-4288-a61e-ba6e7edd5c9a)
![index (6)](https://github.com/user-attachments/assets/67d2c7ad-b3fd-475a-9b0a-4323e88b5495)
![index (5)](https://github.com/user-attachments/assets/d2f9d5d2-855a-4ef1-8f35-226e593d8ce4)

Recherche covoiturage

![recherche-covoiturage (9)](https://github.com/user-attachments/assets/4ae0dc50-2838-45ce-bb03-b8c85b1b1f24)
![recherche-covoiturage (3)](https://github.com/user-attachments/assets/d9dd21c3-10d0-4b97-8431-2d2dce294506)

détail covoiturage

![détail-avis (2)](https://github.com/user-attachments/assets/beb71cf2-10ee-4f9c-8419-e5b312c63c52)
![détail-réservation (2)](https://github.com/user-attachments/assets/ca7feda4-0d20-4532-876b-9a5f665d5f0b)
![détail-covoiturage (4)](https://github.com/user-attachments/assets/3f2c03e3-5614-4c3c-b4c7-48eefd9b6cc3)
![détail-covoiturage (3)](https://github.com/user-attachments/assets/8b47925b-d705-49be-ad70-f54832b4f0e1)

Profil

![profil-informations](https://github.com/user-attachments/assets/408f65df-3746-4192-be69-4699ec9f4afc)
![profil-historique](https://github.com/user-attachments/assets/1f3ac7a6-ca16-403c-b8c7-c380aab785a1)
![profil-chauffeur](https://github.com/user-attachments/assets/9bd66dfe-fb23-47b8-866c-657ba88060d5)
![profil-publiez-un-trajet](https://github.com/user-attachments/assets/4bded9f5-dc94-4196-90d6-49f6e94ce7a0)

Profil-mobile

![profil-mobile (2)](https://github.com/user-attachments/assets/9205dfc0-f4f2-4162-9d83-060b727663f2)
![profil-mobile](https://github.com/user-attachments/assets/2ae7b33b-02c2-487d-bb8d-426c4132158b)

Connexion

![connexion](https://github.com/user-attachments/assets/160b822e-657b-4da8-8a6a-0e2102a6a976)

espace employé

![espace-employé](https://github.com/user-attachments/assets/60561b57-b91b-4c48-b7dd-341ce79318da)

espace administrateur

![espace-administrateur](https://github.com/user-attachments/assets/30c061e0-13d2-4d35-a884-da729e40e885)

modal navbar

![modal-navbar-mobile](https://github.com/user-attachments/assets/49a97432-5d35-4d3d-a872-dd81eef6361f)


---

## 7. Charte graphique

La charte graphique est disponible : [Charte graphique A4 (PDF)](docs/charte-graphique.pdf)

Elle documente :
- Palette de couleurs (HEX/RGB + exemples)
- Typographies (police Jua : h1/h2/p/marges)
- Aperçu de boutons et formulaires stylisés

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
   └─ docs/
      └─ screenshots/   # Captures d’écran
      └─ charte-graphique.pdf

9. Licence

Ce projet est sous licence MIT. Voir LICENSE pour plus de détails.

Date : 22 mai 2025

