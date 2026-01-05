<?php
namespace App;

use PDO;

class Db {
  private static ?PDO $pdo = null;

  public static function pdo(): PDO {
    if (self::$pdo) return self::$pdo;

    // Support Heroku JawsDB URL format
    $jawsdbUrl = getenv('JAWSDB_URL');

    if ($jawsdbUrl) {
      // Parse mysql://user:pass@host:port/database
      $dbparts = parse_url($jawsdbUrl);
      $host = $dbparts['host'];
      $db   = ltrim($dbparts['path'], '/');
      $user = $dbparts['user'];
      $pass = $dbparts['pass'];
      $port = $dbparts['port'] ?? 3306;
      $dsn  = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    } else {
      // Fallback pour dev local
      $host = getenv('DB_HOST') ?: 'db';
      $db   = getenv('DB_NAME') ?: 'ecoride';
      $user = getenv('DB_USER') ?: 'ecoride';
      $pass = getenv('DB_PASS') ?: 'ecoride';
      $dsn  = "mysql:host={$host};dbname={$db};charset=utf8mb4";
    }

    $opt = [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    self::$pdo = new PDO($dsn, $user, $pass, $opt);
    return self::$pdo;
  }
}


