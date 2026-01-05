<?php
// Front controller pour Heroku
// Chemins adaptés pour la structure Heroku

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../backend/src/Db.php';

use Slim\Factory\AppFactory;
use App\Db;
use Slim\Exception\HttpNotFoundException;
use Psr\Http\Message\ServerRequestInterface as Request;

$app = AppFactory::create();

/* ------------ Middlewares globaux ------------ */

// Body parsing (JSON, form, etc.)
$app->addBodyParsingMiddleware();

// CORS DEV/PROD
$app->add(function ($req, $handler) {
  $allowedProd = getenv('CORS_ALLOW_ORIGIN') ?: 'https://golden-medovik-8f81e4.netlify.app';
  $origin = $req->getHeaderLine('Origin');
  $isLocal = !$origin || preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origin);

  $res = $handler->handle($req);
  $allowOrigin = $isLocal ? ($origin ?: '*') : $allowedProd;

  return $res
    ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
    ->withHeader('Vary', 'Origin')
    ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});
$app->options('/{routes:.+}', fn($req, $res) => $res);

// Error middleware
$displayErrorDetails = true;
$logErrors = true;
$logErrorDetails = true;
$errorMiddleware = $app->addErrorMiddleware($displayErrorDetails, $logErrors, $logErrorDetails);

// 404 JSON propre
$errorMiddleware->setErrorHandler(HttpNotFoundException::class, function (Request $request, Throwable $e) use ($app) {
  $response = $app->getResponseFactory()->createResponse(404);
  $response->getBody()->write(json_encode([
    'error' => 'Not found',
    'path'  => (string)$request->getUri()->getPath()
  ]));
  return $response->withHeader('Content-Type', 'application/json');
});

/* ------------ Routes utilitaires ------------ */

// Ping racine
$app->get('/', function ($req, $res) {
  $res->getBody()->write('🚀 API EcoRide en ligne !');
  return $res->withHeader('Content-Type','text/plain; charset=utf-8');
});

// Evite le 404 sur /favicon.ico
$app->get('/favicon.ico', fn($req, $res) => $res->withStatus(204));

// GET /ping
$app->get('/ping', function ($req, $res) {
  $res->getBody()->write(json_encode(['status' => 'ok', 'time' => date('c')]));
  return $res->withHeader('Content-Type', 'application/json');
});

/* ====== PING SQL ====== */
$app->get('/api/ping/sql', function ($req, $res) {
  try {
    $pdo = Db::pdo();
    $pdo->query('SELECT 1');
    $res->getBody()->write(json_encode(['sql'=>'ok']));
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['sql'=>'error', 'message'=>$e->getMessage()]));
  }
  return $res->withHeader('Content-Type','application/json');
});

/* ===================== AUTH ===================== */

/* POST /api/register */
$app->post('/api/register', function ($req, $res) {
  $data = (array)($req->getParsedBody() ?? []);
  $pseudo   = trim($data['pseudo'] ?? '');
  $email    = trim($data['email'] ?? '');
  $password = (string)($data['password'] ?? '');

  if ($pseudo === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
    $res->getBody()->write(json_encode(['error'=>'Invalid input']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    if ($st->fetch()) {
      $res->getBody()->write(json_encode(['error'=>'Email already exists']));
      return $res->withHeader('Content-Type','application/json')->withStatus(409);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $st = $pdo->prepare('INSERT INTO users(pseudo, email, password_hash) VALUES(?, ?, ?)');
    $st->execute([$pseudo, $email, $hash]);

    $res->getBody()->write(json_encode(['message'=>'User created']));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* POST /api/login */
$app->post('/api/login', function ($req, $res) {
  $data = (array)($req->getParsedBody() ?? []);
  $email = trim($data['email'] ?? '');
  $password = (string)($data['password'] ?? '');

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('SELECT id, pseudo, email, credits, role, password_hash FROM users WHERE email = ?');
    $st->execute([$email]);
    $user = $st->fetch();

    if ($user && !empty($user['password_hash']) && password_verify($password, $user['password_hash'])) {
      $payload = [
        'id'      => (int)$user['id'],
        'pseudo'  => $user['pseudo'],
        'email'   => $user['email'],
        'credits' => (int)($user['credits'] ?? 0),
        'role'    => $user['role'] ?? 'user',
        'token'   => bin2hex(random_bytes(16))
      ];
      $res->getBody()->write(json_encode($payload));
      return $res->withHeader('Content-Type','application/json');
    }
  } catch (\Throwable $e) {}

  $res->getBody()->write(json_encode(['error'=>'Invalid credentials']));
  return $res->withHeader('Content-Type','application/json')->withStatus(401);
});

/* ===================== VEHICLES ===================== */

$app->get('/api/vehicles', function ($req, $res) {
  $email = strtolower(trim($req->getQueryParams()['email'] ?? ''));
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode([]));
    return $res->withHeader('Content-Type','application/json');
  }
  try {
    $pdo = Db::pdo();
    $st  = $pdo->prepare('SELECT id, brand, model, seats, plate, energy FROM vehicles WHERE owner_email = ? ORDER BY created_at DESC');
    $st->execute([$email]);
    $rows = $st->fetchAll();
    foreach ($rows as &$r) { $r['seats'] = (int)$r['seats']; }
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode([]));
    return $res->withHeader('Content-Type','application/json');
  }
});

$app->post('/api/vehicles', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  $email = strtolower(trim($d['owner_email'] ?? ''));
  $brand = trim($d['brand'] ?? '');
  $model = trim($d['model'] ?? '');
  $seats = (int)($d['seats'] ?? 0);
  $plate = trim($d['plate'] ?? '');

  if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $brand === '' || $model === '' || $seats < 1 || $seats > 7) {
    $res->getBody()->write(json_encode(['error'=>'Invalid input']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }
  try {
    $pdo = Db::pdo();
    $st  = $pdo->prepare('INSERT INTO vehicles(owner_email,brand,model,seats,plate) VALUES(?,?,?,?,?)');
    $st->execute([$email,$brand,$model,$seats,$plate ?: null]);
    $res->getBody()->write(json_encode(['id'=>$pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* ===================== RIDES ===================== */

$app->get('/api/rides', function ($req, $res) {
  $q = $req->getQueryParams();
  $where  = [];
  $params = [];

  if (!empty($q['origin']))      { $where[] = 'r.origin LIKE ?';            $params[] = $q['origin'] . '%'; }
  if (!empty($q['destination'])) { $where[] = 'r.destination LIKE ?';       $params[] = $q['destination'] . '%'; }
  if (!empty($q['date']))        { $where[] = 'DATE(r.date_time) = ?';      $params[] = $q['date']; }

  $sql = 'SELECT r.id, r.origin, r.destination, r.date_time, r.seats, r.price FROM rides r';
  if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
  $sql .= ' ORDER BY r.date_time ASC LIMIT 100';

  try {
    $pdo  = Db::pdo();
    $st   = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

$app->get('/api/rides/{id}', function ($req, $res, $args) {
  $id = (int)($args['id'] ?? 0);
  try {
    $pdo = Db::pdo();
    $st  = $pdo->prepare('SELECT * FROM rides WHERE id = ?');
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) {
      $res->getBody()->write(json_encode(['error'=>'Ride not found']));
      return $res->withHeader('Content-Type','application/json')->withStatus(404);
    }
    $res->getBody()->write(json_encode($row));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

$app->post('/api/rides', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  $origin      = trim($d['origin'] ?? '');
  $destination = trim($d['destination'] ?? '');
  $dateTime    = trim($d['date_time'] ?? '');
  $seats       = (int)($d['seats'] ?? 0);
  $price       = (int)($d['price'] ?? $d['credits'] ?? 0);

  if ($origin === '' || $destination === '' || $dateTime === '' || $seats < 1 || $price < 1) {
    $res->getBody()->write(json_encode(['error'=>'Invalid input']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('INSERT INTO rides (origin, destination, date_time, seats, price) VALUES (?, ?, ?, ?, ?)');
    $st->execute([$origin, $destination, $dateTime, $seats, $price]);
    $res->getBody()->write(json_encode(['id' => $pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* ===================== BOOKINGS ===================== */

$app->post('/api/bookings', function ($req, $res) {
  $d      = (array)($req->getParsedBody() ?? []);
  $rideId = (int)($d['ride_id'] ?? 0);
  $name   = trim($d['name'] ?? '');
  $email  = strtolower(trim($d['email'] ?? ''));

  if ($rideId <= 0 || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode(['error' => 'Invalid input']));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('INSERT INTO bookings(ride_id, user_name, user_email) VALUES(?, ?, ?)');
    $st->execute([$rideId, $name, $email]);
    $res->getBody()->write(json_encode(['message' => 'Booking created', 'id' => $pdo->lastInsertId()]));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error' => 'Database unavailable']));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(500);
  }
});

$app->get('/api/bookings', function ($req, $res) {
  try {
    $pdo = Db::pdo();
    $rows = $pdo->query('SELECT * FROM bookings ORDER BY created_at DESC')->fetchAll();
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

$app->run();
