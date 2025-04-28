<?php
require 'E:/ecoride/backend/vendor/config/database.php';

try {
    $stmt = $pdo->query("SELECT now()");
    $row = $stmt->fetch();
    echo "✅ Connexion réussie ! Heure serveur : " . $row['now'];
} catch (Exception $e) {
    die("❌ Erreur de connexion : " . $e->getMessage());
}
?>