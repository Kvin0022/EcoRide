<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Dotenv\Dotenv;
use App\Controllers\AuthController; 
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Controllers\RideController;       
use App\Controllers\EmployeeController;
use App\Controllers\AdminController;
use DI\Container;

$app = AppFactory::create();

// CORS simple
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
});
$app->options('/{routes:.+}', fn($req, $res) => $res);

// Body parsing JSON
$app->addBodyParsingMiddleware();

// Ping
$app->get('/', function ($request, $response) {
    $response->getBody()->write('🚀 API EcoRide en ligne !');
    return $response->withHeader('Content-Type','text/plain');
});

// Auth démo
$app->post('/api/login', function ($request, $response) {
    $data = (array)($request->getParsedBody() ?? []);
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    if ($email === 'admin@example.com' && $password === 'motdepasse') {
        $payload = ['token' => bin2hex(random_bytes(16)), 'role' => 'admin'];
        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type','application/json');
    }
    $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
    return $response->withHeader('Content-Type','application/json')->withStatus(401);
});

$app->post('/api/register', function ($request, $response) {
    $response->getBody()->write(json_encode(['message' => 'User created']));
    return $response->withHeader('Content-Type','application/json')->withStatus(201);
});

$app->get('/api/rides', function ($request, $response) {
    $rides = [
        ['id'=>1,'origin'=>'Metz','destination'=>'Luxembourg','date_time'=>'2025-09-01 08:00','seats'=>3,'price'=>7.50],
        ['id'=>2,'origin'=>'Metz','destination'=>'Nancy','date_time'=>'2025-09-01 09:30','seats'=>2,'price'=>5.00],
    ];
    $response->getBody()->write(json_encode($rides));
    return $response->withHeader('Content-Type','application/json');
});

$app->run();
