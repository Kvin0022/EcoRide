<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../src/Db.php';

use Slim\Factory\AppFactory;
use App\Db;

$app = AppFactory::create();

/* CORS DEV */
$app->add(function ($req, $handler) {
  $res = $handler->handle($req);
  return $res
    ->withHeader('Access-Control-Allow-Origin', '*')
    ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
});
$app->options('/{routes:.+}', fn($req, $res) => $res);

$app->addBodyParsingMiddleware();

/* Ping */
$app->get('/', function ($req, $res) {
  $res->getBody()->write('🚀 API EcoRide en ligne !');
  return $res->withHeader('Content-Type','text/plain');
});

/* -------- AUTH -------- */

/* POST /api/register  {email,password} */
$app->post('/api/register', function ($req, $res) {
  $data = (array)($req->getParsedBody() ?? []);
  $email = trim($data['email'] ?? '');
  $password = (string)($data['password'] ?? '');

  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    $res->getBody()->write(json_encode(['error'=>'Invalid input']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    // email unique ?
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) {
      $res->getBody()->write(json_encode(['error'=>'Email already exists']));
      return $res->withHeader('Content-Type','application/json')->withStatus(409);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $st = $pdo->prepare('INSERT INTO users(email, password_hash) VALUES(?, ?)');
    $st->execute([$email, $hash]);
    $res->getBody()->write(json_encode(['message'=>'User created']));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* POST /api/login  {email,password} */
$app->post('/api/login', function ($req, $res) {
  $data = (array)($req->getParsedBody() ?? []);
  $email = trim($data['email'] ?? '');
  $password = (string)($data['password'] ?? '');

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('SELECT id, password_hash, role FROM users WHERE email = ?');
    $st->execute([$email]);
    $user = $st->fetch();

    if ($user && !empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
      $payload = ['token'=>bin2hex(random_bytes(16)), 'role'=>$user['role'] ?? 'user'];
      $res->getBody()->write(json_encode($payload));
      return $res->withHeader('Content-Type','application/json');
    }
  } catch (\Throwable $e) {
    // si la DB est down, on laisse tomber sur le fallback démo ci-dessous
  }

  // Fallback démo (utile pendant la mise en place de la DB)
  if ($email === 'admin@example.com' && $password === 'motdepasse') {
    $payload = ['token'=>bin2hex(random_bytes(16)), 'role'=>'admin'];
    $res->getBody()->write(json_encode($payload));
    return $res->withHeader('Content-Type','application/json');
  }

  $res->getBody()->write(json_encode(['error'=>'Invalid credentials']));
  return $res->withHeader('Content-Type','application/json')->withStatus(401);
});

/* -------- RIDES -------- */

/* GET /api/rides */
$app->get('/api/rides', function ($req, $res) {
  try {
    $pdo = Db::pdo();
    $rows = $pdo->query('SELECT id, origin, destination, DATE_FORMAT(date_time,"%Y-%m-%d %H:%i") AS date_time, seats, price
                         FROM rides ORDER BY date_time ASC')->fetchAll();
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    // Fallback mock si DB indisponible
    $rides = [
      ['id'=>1,'origin'=>'Metz','destination'=>'Luxembourg','date_time'=>'2025-09-01 08:00','seats'=>3,'price'=>7.50],
      ['id'=>2,'origin'=>'Metz','destination'=>'Nancy','date_time'=>'2025-09-01 09:30','seats'=>2,'price'=>5.00],
    ];
    $res->getBody()->write(json_encode($rides));
    return $res->withHeader('Content-Type','application/json');
  }
});

/* POST /api/rides  {origin,destination,date_time,seats,price} */
$app->post('/api/rides', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  foreach (['origin','destination','date_time','seats','price'] as $k) {
    if (!isset($d[$k])) {
      $res->getBody()->write(json_encode(['error'=>"Missing $k"]));
      return $res->withHeader('Content-Type','application/json')->withStatus(422);
    }
  }
  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('INSERT INTO rides(driver_id, origin, destination, date_time, seats, price)
                         VALUES(NULL, ?, ?, ?, ?, ?)');
    $st->execute([trim($d['origin']), trim($d['destination']), $d['date_time'], (int)$d['seats'], (float)$d['price']]);
    $res->getBody()->write(json_encode(['id'=>$pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* -------- BOOKINGS -------- */

/* POST /api/bookings  {ride_id, name, email} */
$app->post('/api/bookings', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  $rideId = (int)($d['ride_id'] ?? 0);
  $name   = trim($d['name'] ?? '');
  $email  = trim($d['email'] ?? '');

  if ($rideId <= 0 || !$name || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode(['error'=>'Invalid input']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('SELECT id FROM rides WHERE id = ?');
    $st->execute([$rideId]);
    if (!$st->fetch()) {
      $res->getBody()->write(json_encode(['error'=>'Ride not found']));
      return $res->withHeader('Content-Type','application/json')->withStatus(404);
    }
    $st = $pdo->prepare('INSERT INTO bookings(ride_id, user_name, user_email) VALUES(?, ?, ?)');
    $st->execute([$rideId, $name, $email]);
    $res->getBody()->write(json_encode(['message'=>'Booking created', 'id'=>$pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

$app->run();
