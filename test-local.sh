#!/bin/bash
# Script de test local pour vérifier la configuration avant déploiement Railway

echo "🔍 Test de la configuration EcoRide"
echo "=================================="

# Test 1 : Vérifier que index.php existe
echo ""
echo "Test 1 : Vérification de l'existence de index.php"
if [ -f "index.php" ]; then
    echo "✅ index.php trouvé à la racine"
else
    echo "❌ ERREUR : index.php non trouvé à la racine"
    exit 1
fi

# Test 2 : Vérifier que backend/public/index.php existe
echo ""
echo "Test 2 : Vérification de backend/public/index.php"
if [ -f "backend/public/index.php" ]; then
    echo "✅ backend/public/index.php trouvé"
else
    echo "❌ ERREUR : backend/public/index.php non trouvé"
    exit 1
fi

# Test 3 : Vérifier la syntaxe PHP
echo ""
echo "Test 3 : Vérification de la syntaxe PHP de index.php"
if php -l index.php > /dev/null 2>&1; then
    echo "✅ Syntaxe PHP valide pour index.php"
else
    echo "❌ ERREUR de syntaxe dans index.php"
    php -l index.php
    exit 1
fi

# Test 4 : Vérifier que vendor/autoload.php existe
echo ""
echo "Test 4 : Vérification de l'autoloader Composer"
if [ -f "backend/vendor/autoload.php" ]; then
    echo "✅ vendor/autoload.php trouvé"
else
    echo "❌ ERREUR : vendor/autoload.php non trouvé - lancez 'composer install' dans backend/"
    exit 1
fi

# Test 5 : Vérifier les fichiers source nécessaires
echo ""
echo "Test 5 : Vérification des fichiers source"
files_to_check=(
    "backend/src/Db.php"
    "backend/src/Mongo.php"
    "backend/src/ReviewRepositoryMongo.php"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file trouvé"
    else
        echo "❌ ERREUR : $file non trouvé"
        exit 1
    fi
done

# Test 6 : Vérifier le Caddyfile
echo ""
echo "Test 6 : Vérification du Caddyfile"
if [ -f "Caddyfile" ]; then
    echo "✅ Caddyfile trouvé"
    echo "📄 Contenu du Caddyfile :"
    cat Caddyfile
else
    echo "❌ ERREUR : Caddyfile non trouvé"
    exit 1
fi

# Test 7 : Vérifier nixpacks.toml
echo ""
echo "Test 7 : Vérification de nixpacks.toml"
if [ -f "nixpacks.toml" ]; then
    echo "✅ nixpacks.toml trouvé"
    echo "📄 Contenu de nixpacks.toml :"
    cat nixpacks.toml
else
    echo "❌ ERREUR : nixpacks.toml non trouvé"
    exit 1
fi

# Test 8 : Démarrer un serveur PHP local pour test
echo ""
echo "Test 8 : Test du serveur PHP local"
echo "🚀 Démarrage du serveur sur http://localhost:8000"
echo "⚠️  Appuyez sur Ctrl+C pour arrêter le serveur après le test"
echo ""
echo "Testez les URLs suivantes :"
echo "  - http://localhost:8000/ (devrait afficher '🚀 API EcoRide en ligne !')"
echo "  - http://localhost:8000/ping (devrait retourner du JSON)"
echo ""

php -S localhost:8000 index.php
