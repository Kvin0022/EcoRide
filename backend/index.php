<?php
require 'vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();

$app->get('/', function ($request, $response, $args) {
    $response->getBody()->write("🚀 API EcoRide en ligne !");
    return $response;
});

$app->run();