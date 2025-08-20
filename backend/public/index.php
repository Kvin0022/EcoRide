<?php
<<<<<<< HEAD
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;

$app = AppFactory::create();

// CORS basique
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
=======
declare(strict_types=1);

use Dotenv\Dotenv;
use Slim\Factory\AppFactory;
use App\Controllers\AuthController; 
use Illuminate\Database\Capsule\Manager as Capsule;
use App\Controllers\RideController;       
use App\Controllers\EmployeeController;
use App\Controllers\AdminController;
use DI\Container;

use App\Middleware\AuthMiddleware;
use App\Middleware\EmployeeOnly;
use App\Middleware\AdminOnly;
use Firebase\JWT\JWT;

require __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();
$container = new Container();
AppFactory::setContainer($container);
$app = AppFactory::create();

$jwtSecret = 'ecoride57';
$app->add(new AuthMiddleware($jwtSecret));
$authController = new AuthController($JwtSecret);


$capsule = new Capsule;
$capsule->addConnection([
    'driver'    => $_ENV['DB_DRIVER'],
    'host'      => $_ENV['DB_HOST'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8',
    'collation' => 'utf8_unicode_ci',
    'prefix'    => '',
]);
$capsule->setAsGlobal();
$capsule->bootEloquent();

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

$app->get('/', function ($request, $response, $args) {
>>>>>>> 15f8995e5aa94fd923cfc3a98a8df9e524f527dd
    $response->getBody()->write("🚀 API EcoRide en ligne !");
    return $response;
});

<<<<<<< HEAD
// Auth démo
$app->post('/api/login', function ($request, $response) {
    $data = $request->getParsedBody() ?? [];
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
=======
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// 1) routes publiques
$app->post('/auth/register', AuthController::class . ':register');
$app->post('/auth/login', [$authController, 'login']);
$app->post('/auth/login', [$authController, 'login']);

// 2) routes rides (nécessite login)
$app->get('/rides',       App\Controllers\RideController::class . ':search')
    ->add(new AuthMiddleware($jwtSecret));

$app->post('/rides/book', App\Controllers\RideController::class . ':book')
    ->add(new AuthMiddleware($jwtSecret));

// 3) routes employé (login + rôle employee)
$app->get('/employee/incidents', EmployeeController::class . ':badTrips')
    ->add(new EmployeeOnly())
    ->add(new AuthMiddleware($jwtSecret));

// 4) routes admin (login + rôle admin)
$app->get('/admin/stats', AdminController::class . ':dashboard')
    ->add(new AdminOnly())
    ->add(new AuthMiddleware($jwtSecret));

    $app->get('/protected', ProtectedController::class . ':index')
    ->add(new AuthMiddleware($yourJwtSecret));
>>>>>>> 15f8995e5aa94fd923cfc3a98a8df9e524f527dd

$app->run();
