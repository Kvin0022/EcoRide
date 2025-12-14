# Analyse approfondie du problème de déploiement Railway

## Problème rencontré
Erreur 404 persistante malgré plusieurs tentatives de configuration.

## Cause racine identifiée

### Analyse des logs
Les logs montrent systématiquement :
```
no index file in directory index_filenames: ["index.html","index.txt"]
```

**Conclusion** : Caddy (via FrankenPHP) ne reconnaît pas `index.php` comme fichier d'index par défaut.

### Pourquoi `php_server` seul ne suffit pas
La directive `php_server` de FrankenPHP :
- Active le traitement PHP
- Mais ne configure PAS automatiquement les fichiers d'index
- Caddy continue de chercher index.html et index.txt par défaut

## Solution implémentée

### Caddyfile version finale (avec try_files)
```
:8080 {
    root * /app

    # Force le routing : essaie le chemin, puis {chemin}/index.php, sinon /index.php
    try_files {path} {path}/index.php /index.php

    # Active le serveur PHP
    php_server
}
```

**Explication** :
- `try_files {path}` : cherche d'abord le fichier exact demandé
- `{path}/index.php` : si c'est un dossier, cherche index.php dedans
- `/index.php` : fallback final vers le front controller à la racine

## Solution alternative si try_files ne fonctionne pas

### Option A : Utiliser rewrite au lieu de try_files
```
:8080 {
    root * /app

    @notFound {
        not file
    }
    rewrite @notFound /index.php

    php_server
    file_server
}
```

### Option B : Configuration explicite avec handle
```
:8080 {
    root * /app

    handle / {
        rewrite * /index.php
        php_server
    }

    handle {
        php_server
        file_server
    }
}
```

### Option C : Abandonner Caddyfile, utiliser le serveur PHP natif
Modifier `nixpacks.toml` :
```toml
[start]
cmd = "php -S 0.0.0.0:8080 -t /app index.php"
```

Cette option utilise le serveur PHP intégré qui gère automatiquement le front controller.

## Fichiers critiques modifiés
- `Caddyfile` : Configuration avec try_files
- `nixpacks.toml` : Commande de démarrage FrankenPHP
- `index.php` : Front controller qui délègue à backend/public/index.php

## Étapes de débogage futures

Si l'erreur persiste après le dernier changement :

1. **Vérifier que index.php existe à /app**
   ```bash
   ls -la /app/index.php
   ```

2. **Tester l'exécution PHP directement**
   ```bash
   php /app/index.php
   ```

3. **Vérifier les permissions**
   ```bash
   ls -la /app/
   ```

4. **Logs détaillés Caddy**
   Ajouter au Caddyfile :
   ```
   {
       debug
   }
   ```

## Recommandation finale

Si try_files ne fonctionne toujours pas, je recommande **Option C** (serveur PHP natif) car :
- Plus simple, moins de couches
- Pas de configuration Caddy complexe
- Le serveur PHP sait nativement gérer un front controller
- Moins de choses qui peuvent mal tourner
