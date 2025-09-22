<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../src/Db.php';


use Slim\Factory\AppFactory;
use App\Db;
use Slim\Exception\HttpNotFoundException;
use Psr\Http\Message\ServerRequestInterface as Request;

$app = AppFactory::create();

/* ------------ Middlewares globaux ------------ */

// public/index.php (near the top, after app creation)
$app->get('/__health/db', function($req, $res){
  try {
    $pdo = \App\Db::pdo();
    $ok = $pdo->query('SELECT 1')->fetchColumn();
    return $res->withJson(['db' => $ok ? 'ok' : 'fail']);
  } catch (\Throwable $e) {
    return $res->withJson(['db'=>'fail','msg'=>$e->getMessage()], 500);
  }
});

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
    ->withHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
});
$app->options('/{routes:.+}', fn($req, $res) => $res);

// Error middleware (affiche les détails en dev)
$displayErrorDetails = true;  // passe à false en prod
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
  return $res->withHeader('Content-Type','text/plain');
});

// Evite le 404 sur /favicon.ico
$app->get('/favicon.ico', fn($req, $res) => $res->withStatus(204));

/* ===================== AUTH ===================== */

/* POST /api/register  {pseudo,email,password} */
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

/* POST /api/login  {email,password} */
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
  } catch (\Throwable $e) {
    // pas de fallback silencieux ici : on renvoie 401 comme prévu
  }

  $res->getBody()->write(json_encode(['error'=>'Invalid credentials']));
  return $res->withHeader('Content-Type','application/json')->withStatus(401);
});

/* POST /api/password/forgot  {email}  -> 200 (mock) */
$app->post('/api/password/forgot', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  $email = trim($d['email'] ?? '');

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode(['error'=>'Invalid email']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
  } catch (\Throwable $e) {}

  $res->getBody()->write(json_encode(['message'=>'Si un compte existe, un email a été envoyé']));
  return $res->withHeader('Content-Type','application/json');
});

/* ===================== VEHICLES ===================== */

/* GET /api/vehicles?email=... */
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

/* POST /api/vehicles  {owner_email,brand,model,seats,plate?} */
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

/* GET /api/rides  (filtres + tri + seats_left + écolo) */
$app->get('/api/rides', function ($req, $res) {
  $q = $req->getQueryParams();
  $where  = [];
  $params = [];

  if (!empty($q['origin']))      { $where[] = 'r.origin LIKE ?';            $params[] = $q['origin'] . '%'; }
  if (!empty($q['destination'])) { $where[] = 'r.destination LIKE ?';       $params[] = $q['destination'] . '%'; }
  if (!empty($q['date']))        { $where[] = 'DATE(r.date_time) = ?';      $params[] = $q['date']; }
  if (!empty($q['date_from']))   { $where[] = 'r.date_time >= ?';           $params[] = str_replace('T',' ',$q['date_from']); }
  if (!empty($q['seats_min']))   { $where[] = 'r.seats >= ?';               $params[] = (int)$q['seats_min']; }
  if (!empty($q['credits_max'])) { $where[] = 'r.price <= ?';               $params[] = (int)$q['credits_max']; }
  if (!empty($q['duration_max'])){ $where[] = 'r.duration_minutes <= ?';    $params[] = (int)$q['duration_max']; }
  if (!empty($q['rating_min']))  { $where[] = 'r.driver_rating >= ?';       $params[] = (int)$q['rating_min']; }
  if (isset($q['eco']))          { $where[] = "v.energy = 'electric'"; }

  $sortByMap = [
    'date'     => 'r.date_time',
    'price'    => 'r.price',
    'credits'  => 'r.price',
    'seats'    => 'r.seats',
    'duration' => 'r.duration_minutes',
  ];
  $col    = $sortByMap[strtolower($q['sort_by'] ?? 'date')] ?? 'r.date_time';
  $order  = strtoupper($q['order'] ?? 'ASC'); $order = ($order === 'DESC') ? 'DESC' : 'ASC';
  $limit  = isset($q['limit']) ? max(1, min(200, (int)$q['limit'])) : 200;

  $sql = 'SELECT
            r.id, r.origin, r.destination,
            DATE_FORMAT(r.date_time, "%Y-%m-%d %H:%i") AS date_time,
            r.duration_minutes, r.driver_rating,
            r.seats, r.price, r.vehicle_id,
            v.brand AS vehicle_brand, v.model AS vehicle_model, v.plate AS vehicle_plate, v.energy,
            (r.seats - (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.id)) AS seats_left
          FROM rides r
          LEFT JOIN vehicles v ON v.id = r.vehicle_id';
  if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
  $sql .= " ORDER BY $col $order LIMIT $limit";

  try {
    $pdo  = Db::pdo();
    $st   = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    foreach ($rows as &$r) {
      $r['credits']   = (int)$r['price'];
      $r['seats']     = (int)$r['seats'];
      $r['seats_left']= (int)$r['seats_left'];
    }
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* GET /api/rides/{id} */
$app->get('/api/rides/{id}', function ($req, $res, $args) {
  $id = (int)($args['id'] ?? 0);
  if ($id <= 0) {
    $res->getBody()->write(json_encode(['error'=>'Invalid id']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  $sql = 'SELECT
            r.id, r.origin, r.destination,
            DATE_FORMAT(r.date_time, "%Y-%m-%d %H:%i") AS date_time,
            r.duration_minutes, r.driver_rating,
            r.seats, r.price AS credits, r.vehicle_id,
            v.brand AS vehicle_brand, v.model AS vehicle_model, v.plate AS vehicle_plate, v.energy,
            (r.seats - (SELECT COUNT(*) FROM bookings b WHERE b.ride_id = r.id)) AS seats_left
          FROM rides r
          LEFT JOIN vehicles v ON v.id = r.vehicle_id
          WHERE r.id = ?
          LIMIT 1';

  try {
    $pdo = Db::pdo();
    $st  = $pdo->prepare($sql);
    $st->execute([$id]);
    $row = $st->fetch();

    if (!$row) {
      $res->getBody()->write(json_encode(['error'=>'Ride not found']));
      return $res->withHeader('Content-Type','application/json')->withStatus(404);
    }

    $row['seats']      = (int)$row['seats'];
    $row['credits']    = (int)$row['credits'];
    $row['seats_left'] = (int)$row['seats_left'];

    $res->getBody()->write(json_encode($row));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* POST /api/rides */
$app->post('/api/rides', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);

  $origin      = trim($d['origin']       ?? '');
  $destination = trim($d['destination']  ?? '');
  $dateTimeRaw = trim($d['date_time']    ?? '');
  $duration    = isset($d['duration_minutes']) ? max(0, (int)$d['duration_minutes']) : 0;
  $vehicleId   = isset($d['vehicle_id']) ? (int)$d['vehicle_id'] : 0;

  $price = isset($d['price']) ? (int)$d['price'] : (isset($d['credits']) ? (int)$d['credits'] : 0);

  $dateTime = str_replace('T', ' ', $dateTimeRaw);
  $dtOk = \DateTime::createFromFormat('Y-m-d H:i', substr($dateTime, 0, 16)) !== false;

  $seats = (int)($d['seats'] ?? 0);

  $err = null;
  if ($origin === '' || $destination === '' || $dateTime === '')                 $err = 'Missing fields';
  elseif (!$dtOk)                                                                 $err = 'Invalid date_time format (use YYYY-MM-DD HH:MM)';
  elseif ($price < 1 || $price > 1000)                                           $err = 'Invalid credits (1..1000)';
  elseif (mb_strlen($origin) > 120 || mb_strlen($destination) > 120)              $err = 'Text too long (max 120)';
  if ($err) {
    $res->getBody()->write(json_encode(['error'=>$err]));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();

    if ($vehicleId > 0) {
      $stV = $pdo->prepare('SELECT seats FROM vehicles WHERE id = ?');
      $stV->execute([$vehicleId]);
      $veh = $stV->fetch();
      if (!$veh) {
        $res->getBody()->write(json_encode(['error'=>'Invalid vehicle']));
        return $res->withHeader('Content-Type','application/json')->withStatus(422);
      }
      $seats = (int)$veh['seats'];
    }

    if ($vehicleId === 0 && ($seats < 1 || $seats > 7)) {
      $res->getBody()->write(json_encode(['error'=>'Invalid seats (1..7)']));
      return $res->withHeader('Content-Type','application/json')->withStatus(422);
    }

    $st = $pdo->prepare(
      'INSERT INTO rides (origin, destination, date_time, duration_minutes, driver_rating, seats, price, vehicle_id)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
    );
    $st->execute([$origin, $destination, $dateTime, $duration, $seats, $price, $vehicleId ?: null]);

    $res->getBody()->write(json_encode(['id' => $pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);

  } catch (\Throwable $e) {
    error_log('CREATE RIDE ERROR: '.$e->getMessage());
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

/* ===================== BOOKINGS ===================== */

/* POST /api/bookings {ride_id, name, email} */
$app->post('/api/bookings', function ($req, $res) {
  $d      = (array)($req->getParsedBody() ?? []);
  $rideId = (int)($d['ride_id'] ?? 0);
  $name   = trim($d['name']  ?? '');
  $email  = strtolower(trim($d['email'] ?? ''));

  if ($rideId <= 0 || $name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode(['error' => 'Invalid input']));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $pdo->beginTransaction();

    // Verrou et contrôle des places
    $st = $pdo->prepare('SELECT seats FROM rides WHERE id = ? FOR UPDATE');
    $st->execute([$rideId]);
    $row = $st->fetch();

    if (!$row) {
      $pdo->rollBack();
      $res->getBody()->write(json_encode(['error' => 'Ride not found']));
      return $res->withHeader('Content-Type', 'application/json')->withStatus(404);
    }

    if ((int)$row['seats'] < 1) {
      $pdo->rollBack();
      $res->getBody()->write(json_encode(['error' => 'Ride full']));
      return $res->withHeader('Content-Type', 'application/json')->withStatus(409);
    }

    // Insertion réservation (protégée par UNIQUE(ride_id, user_email))
    try {
      $st = $pdo->prepare('INSERT INTO bookings(ride_id, user_name, user_email) VALUES(?, ?, ?)');
      $st->execute([$rideId, $name, $email]);
    } catch (\PDOException $e) {
      if ($e->getCode() === '23000') {
        $pdo->rollBack();
        $res->getBody()->write(json_encode(['error' => 'Already booked']));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(409);
      }
      throw $e;
    }

    // ID de la réservation
    $bookingId = (int)$pdo->lastInsertId();
    if ($bookingId === 0) {
      $st = $pdo->prepare('SELECT id FROM bookings WHERE ride_id = ? AND user_email = ? ORDER BY id DESC LIMIT 1');
      $st->execute([$rideId, $email]);
      $bookingId = (int)($st->fetchColumn() ?: 0);
    }

    // Décrément des places (jamais sous 0)
    $st = $pdo->prepare('UPDATE rides SET seats = seats - 1 WHERE id = ? AND seats > 0');
    $st->execute([$rideId]);

    if ($st->rowCount() === 0) {
      $pdo->rollBack();
      $res->getBody()->write(json_encode(['error' => 'Ride full']));
      return $res->withHeader('Content-Type', 'application/json')->withStatus(409);
    }

    // Places restantes
    $st = $pdo->prepare('SELECT seats FROM rides WHERE id = ?');
    $st->execute([$rideId]);
    $seatsLeft = (int)$st->fetchColumn();

    $pdo->commit();

    $res->getBody()->write(json_encode([
      'message'     => 'Booking created',
      'id'          => $bookingId,
      'ride_id'     => $rideId,
      'user_email'  => $email,
      'seats_left'  => $seatsLeft
    ]));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(201);

  } catch (\Throwable $e) {
    try { if (isset($pdo) && $pdo->inTransaction()) { $pdo->rollBack(); } } catch (\Throwable $ignore) {}
    $res->getBody()->write(json_encode(['error' => 'Database unavailable']));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(500);
  }
});

/* GET /api/bookings?ride_id=1 */
$app->get('/api/bookings', function ($req, $res) {
  try {
    $pdo = Db::pdo();
    $rideId = (int)($req->getQueryParams()['ride_id'] ?? 0);

    if ($rideId > 0) {
      $st = $pdo->prepare('SELECT id, ride_id, user_name, user_email, created_at
                           FROM bookings WHERE ride_id = ? ORDER BY created_at DESC');
      $st->execute([$rideId]);
      $rows = $st->fetchAll();
    } else {
      $rows = $pdo->query('SELECT id, ride_id, user_name, user_email, created_at
                           FROM bookings ORDER BY created_at DESC')->fetchAll();
    }
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});

$app->run();
