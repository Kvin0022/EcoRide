<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../../');
$dotenv->safeLoad(); // Utiliser safeLoad() au lieu de load()

// Si `DATABASE_URL` est dans $_ENV mais pas dans getenv(), on l’assigne avec putenv()
if (!getenv('DATABASE_URL') && isset($_ENV['DATABASE_URL'])) {
    putenv("DATABASE_URL=" . $_ENV['DATABASE_URL']);
    $_SERVER['DATABASE_URL'] = $_ENV['DATABASE_URL'];
}

// Récupération de DATABASE_URL avec fallback sur $_ENV
$dsn = getenv('DATABASE_URL') ?: $_ENV['DATABASE_URL'] ?? null;

if (!$dsn) {
    die("❌ DATABASE_URL introuvable. Vérifie ton fichier .env.");
}

// Décomposer l'URL PostgreSQL
$db = parse_url($dsn);

try {
    $pdo = new PDO(
        "pgsql:host=" . $db["host"] . ";port=" . $db["port"] . ";dbname=" . ltrim($db["path"], '/'),
        $db["user"],
        $db["pass"]
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion PostgreSQL réussie !";
} catch (PDOException $e) {
    die("❌ Erreur de connexion PostgreSQL : " . $e->getMessage());
}