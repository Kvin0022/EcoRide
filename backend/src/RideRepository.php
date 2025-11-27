<?php
namespace EcoRide;

use PDO;

class RideRepository {
    private PDO $pdo;
    public function __construct(PDO $pdo) { $this->pdo = $pdo; }

    public function all(): array {
        $st = $this->pdo->query("SELECT * FROM rides ORDER BY date_time ASC");
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(int $id): ?array {
        $st = $this->pdo->prepare("SELECT * FROM rides WHERE id = ?");
        $st->execute([$id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /** @return int id */
    public function create(array $r): int {
        $sql = "INSERT INTO rides (driver_id, origin, destination, date_time, seats, price)
                VALUES (:driver_id, :origin, :destination, :date_time, :seats, :price)";
        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':driver_id'  => (int)$r['driver_id'],
            ':origin'     => trim($r['origin']),
            ':destination'=> trim($r['destination']),
            ':date_time'  => $r['date_time'], // 'YYYY-MM-DD HH:MM:SS'
            ':seats'      => (int)$r['seats'],
            ':price'      => (float)$r['price'],
        ]);
        return (int)$this->pdo->lastInsertId();
    }

    /** @return int rows affected */
    public function update(int $id, array $r): int {
        $sql = "UPDATE rides
                   SET driver_id=:driver_id, origin=:origin, destination=:destination,
                       date_time=:date_time, seats=:seats, price=:price
                 WHERE id=:id";
        $st = $this->pdo->prepare($sql);
        $st->execute([
            ':driver_id'  => (int)$r['driver_id'],
            ':origin'     => trim($r['origin']),
            ':destination'=> trim($r['destination']),
            ':date_time'  => $r['date_time'],
            ':seats'      => (int)$r['seats'],
            ':price'      => (float)$r['price'],
            ':id'         => $id
        ]);
        return $st->rowCount();
    }

    /** @return int rows affected */
    public function delete(int $id): int {
        $st = $this->pdo->prepare("DELETE FROM rides WHERE id = ?");
        $st->execute([$id]);
        return $st->rowCount();
    }
}
