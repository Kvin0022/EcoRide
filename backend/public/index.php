<?php
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
    $response->getBody()->write("🚀 API EcoRide en ligne !");
    return $response;
});

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

$app->run();
