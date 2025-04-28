<?php
require 'vendor/autoload.php';

$mongoClient = new MongoDB\Client("mongodb://localhost:27017");
$database = $mongoClient->ecoride;
$collection = $database->avis;

echo "✅ Connexion MongoDB réussie !";
?>