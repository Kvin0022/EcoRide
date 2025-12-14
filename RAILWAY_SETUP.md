# Configuration Railway pour EcoRide

## Variables d'environnement à configurer sur Railway

Dans votre projet Railway, ajoutez ces variables d'environnement :

### Base de données MySQL (Railway MySQL)
```
DB_HOST=<votre-host-mysql-railway>
DB_NAME=railway
DB_USER=<votre-user-mysql-railway>
DB_PASS=<votre-password-mysql-railway>
```

### MongoDB (Railway MongoDB ou MongoDB Atlas)
```
MONGO_URI=<votre-uri-mongodb>
MONGO_DB=ecoride
```

### CORS (pour votre frontend Netlify)
```
CORS_ALLOW_ORIGIN=https://golden-medovik-8f81e4.netlify.app
```

## Structure du déploiement

Le projet utilise FrankenPHP avec Caddy :
- `Caddyfile` à la racine configure le serveur web
- `nixpacks.toml` configure Nixpacks pour utiliser FrankenPHP
- L'`index.php` à la racine redirige vers `backend/public/index.php`
- Toutes les requêtes sont traitées par PHP

## Initialisation de la base de données

Après le premier déploiement, vous devrez :

1. Importer le schéma SQL dans votre base MySQL Railway :
   - Utilisez le fichier `backend/db/schema.sql` ou `backend/backup_ecoride.sql`

2. Votre MongoDB sera initialisée automatiquement au premier usage

## Test du déploiement

Une fois déployé, testez ces endpoints :
- `GET /` - Devrait retourner "🚀 API EcoRide en ligne !"
- `GET /ping` - Devrait retourner `{"status":"ok","time":"..."}`
- `GET /api/ping/sql` - Teste la connexion MySQL
- `GET /api/ping/mongo` - Teste la connexion MongoDB

## Debugging

Si vous avez une erreur 500, vérifiez :
1. Les variables d'environnement sont bien configurées
2. Les bases de données MySQL et MongoDB sont accessibles
3. Les logs Railway pour voir l'erreur exacte

Si vous avez une erreur 404, vérifiez :
1. Les fichiers `nixpacks.toml` et `Caddyfile` sont bien à la racine
2. Le déploiement a bien été redémarré après les modifications
3. **IMPORTANT** : Supprimez les variables `NIXPACKS_PHP_ROOT_DIR` et `NIXPACKS_PHP_FALLBACK_PATH` des variables d'environnement Railway (elles ne sont plus nécessaires)
