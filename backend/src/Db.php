<?php
namespace App;

use PDO;
use PDOException;

class Db {
  private static ?PDO $pdo = null;

  public static function pdo(): PDO {
    if (self::$pdo) return self::$pdo;

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db   = getenv('DB_NAME') ?: 'ecoride';
    $user = getenv('DB_USER') ?: 'ecoride';
    $pass = getenv('DB_PASS') ?: '';

    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $opt = [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];

    try {
      self::$pdo = new PDO($dsn, $user, $pass, $opt);
      return self::$pdo;
    } catch (PDOException $e) {
      // Log/retour explicite (temporaire si APP_DEBUG=1)
      http_response_code(500);
      $debug = getenv('APP_DEBUG');
      echo json_encode([
        'error' => 'Database unavailable',
        'hint'  => $debug ? $e->getMessage() : 'Set APP_DEBUG=1 to see details in logs'
      ]);
      exit;
    }
  }
}
