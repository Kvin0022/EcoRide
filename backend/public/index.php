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

/* POST /api/password/forgot  {email}  -> 200 (mock) */
$app->post('/api/password/forgot', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);
  $email = trim($d['email'] ?? '');

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $res->getBody()->write(json_encode(['error'=>'Invalid email']));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  // Optionnel : vérifier l'existence du compte sans rien révéler
  try {
    $pdo = \App\Db::pdo();
    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $st->execute([$email]);
    // ne pas révéler si l'email existe (bonne pratique)
  } catch (\Throwable $e) {
    // si la DB est down on renvoie quand même le même message
  }

  // Mock : on "enverrait" un lien par email ici
  $res->getBody()->write(json_encode(['message'=>'Si un compte existe, un email a été envoyé']));
  return $res->withHeader('Content-Type','application/json');
});


/* -------- RIDES -------- */

/* GET /api/rides */
$app->get('/api/rides', function ($req, $res) {
  $q = $req->getQueryParams();

  $where  = [];
  $params = [];

  if (!empty($q['origin'])) {
    $where[]  = 'origin LIKE ?';
    $params[] = $q['origin'] . '%';
  }
  if (!empty($q['destination'])) {
    $where[]  = 'destination LIKE ?';
    $params[] = $q['destination'] . '%';
  }
  if (!empty($q['date_from'])) {
    // attendu: "YYYY-MM-DD" ou "YYYY-MM-DD HH:MM"
    $where[]  = 'date_time >= ?';
    $params[] = $q['date_from'];
  }
  if (!empty($q['seats_min'])) {
    $where[]  = 'seats >= ?';
    $params[] = (int)$q['seats_min'];
  }
  if (!empty($q['credits_max'])) {
    // price = crédits par trajet (chez toi on affiche déjà "crédits")
    $where[]  = 'price <= ?';
    $params[] = (int)$q['credits_max'];
  }

  $sql = 'SELECT id, origin, destination,
                 DATE_FORMAT(date_time, "%Y-%m-%d %H:%i") AS date_time,
                 seats, price
          FROM rides';
  if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
  }
  $sql .= ' ORDER BY date_time ASC LIMIT 200';

  try {
    $pdo  = \App\Db::pdo();
    $st   = $pdo->prepare($sql);
    $st->execute($params);
    $rows = $st->fetchAll();
    // alias "credits" pour l’affichage
    foreach ($rows as &$r) { $r['credits'] = (int)$r['price']; }
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    // fallback (optionnel)
    $rides = [
      ['id'=>1,'origin'=>'Metz','destination'=>'Luxembourg','date_time'=>'2025-09-01 08:00','seats'=>3,'price'=>8],
      ['id'=>2,'origin'=>'Metz','destination'=>'Nancy','date_time'=>'2025-09-01 09:30','seats'=>2,'price'=>5],
    ];
    $res->getBody()->write(json_encode($rides));
    return $res->withHeader('Content-Type','application/json');
  }
});



/* POST /api/rides  {origin,destination,date_time,seats,price} */
$app->post('/api/rides', function ($req, $res) {
  $d = (array)($req->getParsedBody() ?? []);

  /* --- validation champs obligatoires --- */
  foreach (['origin','destination','date_time','seats'] as $k) {
    if (!isset($d[$k]) || $d[$k] === '') {
      $res->getBody()->write(json_encode(['error'=>"Missing $k"]));
      return $res->withHeader('Content-Type','application/json')->withStatus(422);
    }
  }
  // on accepte soit price (€), soit credits
  $price = isset($d['price']) ? (float)$d['price']
          : (isset($d['credits']) ? (float)$d['credits'] : null);

  if ($price === null) {
    $res->getBody()->write(json_encode(['error'=>"Missing price/credits"]));
    return $res->withHeader('Content-Type','application/json')->withStatus(422);
  }

  try {
    $pdo = Db::pdo();
    $st = $pdo->prepare(
      'INSERT INTO rides (driver_id, origin, destination, date_time, seats, price)
       VALUES (NULL, ?, ?, ?, ?, ?)'
    );
    $st->execute([
      trim($d['origin']),
      trim($d['destination']),
      $d['date_time'],
      (int)$d['seats'],
      $price            // ← stocké dans la colonne price, interprété comme crédits
    ]);
    $res->getBody()->write(json_encode(['id'=>$pdo->lastInsertId()]));
    return $res->withHeader('Content-Type','application/json')->withStatus(201);
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});


/* -------- BOOKINGS -------- */

/* POST /api/bookings  {ride_id, name, email}  (décrémente seats en transaction) */
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
    $pdo = \App\Db::pdo();
    $pdo->beginTransaction();

    // 1) Verrouille la ligne du trajet
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

    // 2) Insertion de la réservation (protégée par l'unique (ride_id, user_email))
    try {
      $st = $pdo->prepare('INSERT INTO bookings(ride_id, user_name, user_email) VALUES(?, ?, ?)');
      $st->execute([$rideId, $name, $email]);
    } catch (\PDOException $e) {
      // Doublon sur l'unique (ride_id, user_email)
      if ($e->getCode() === '23000') {
        $pdo->rollBack();
        $res->getBody()->write(json_encode(['error' => 'Already booked']));
        return $res->withHeader('Content-Type', 'application/json')->withStatus(409);
      }
      throw $e; // autres erreurs SQL -> catch global (500)
    }

    // 3) Décrément atomique : ne descend JAMAIS sous 0
    $st = $pdo->prepare('UPDATE rides SET seats = seats - 1 WHERE id = ? AND seats > 0');
    $st->execute([$rideId]);

    if ($st->rowCount() === 0) {
      // Personne n'a été mis à jour -> plus de place entre-temps
      $pdo->rollBack();
      $res->getBody()->write(json_encode(['error' => 'Ride full']));
      return $res->withHeader('Content-Type', 'application/json')->withStatus(409);
    }

    // 4) OK
    $pdo->commit();
    $res->getBody()->write(json_encode(['message' => 'Booking created', 'id' => $pdo->lastInsertId()]));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(201);

  } catch (\Throwable $e) {
    // Catch global PROPRE
    try { if (isset($pdo) && $pdo->inTransaction()) { $pdo->rollBack(); } } catch (\Throwable $ignore) {}
    // (optionnel) log interne :
    // error_log('BOOKING ERROR: '.$e->getMessage());
    $res->getBody()->write(json_encode(['error' => 'Database unavailable']));
    return $res->withHeader('Content-Type', 'application/json')->withStatus(500);
  }
});



// GET /api/bookings?ride_id=1  (ou sans param => tout)
$app->get('/api/bookings', function ($req, $res) {
  try {
    $pdo = Db::pdo();
    $rideId = (int)($req->getQueryParams()['ride_id'] ?? 0);

    if ($rideId > 0) {
      $st = $pdo->prepare('SELECT id, ride_id, user_name, user_email, booked_at
                           FROM bookings WHERE ride_id = ? ORDER BY booked_at DESC');
      $st->execute([$rideId]);
      $rows = $st->fetchAll();
    } else {
      $rows = $pdo->query('SELECT id, ride_id, user_name, user_email, booked_at
                           FROM bookings ORDER BY booked_at DESC')->fetchAll();
    }
    $res->getBody()->write(json_encode($rows));
    return $res->withHeader('Content-Type','application/json');
  } catch (\Throwable $e) {
    $res->getBody()->write(json_encode(['error'=>'Database unavailable']));
    return $res->withHeader('Content-Type','application/json')->withStatus(500);
  }
});


$app->run();
