-- Schéma EcoRide (MySQL 8+ / MariaDB 10.4+)
-- Tables: vehicles -> rides -> bookings

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS vehicles;

CREATE TABLE vehicles (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  owner_email  VARCHAR(190) NOT NULL,
  brand        VARCHAR(100) NOT NULL,
  model        VARCHAR(100) DEFAULT NULL,
  seats        TINYINT NOT NULL,
  plate        VARCHAR(20) DEFAULT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vehicles_owner (owner_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rides (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  origin            VARCHAR(100) NOT NULL,
  destination       VARCHAR(100) NOT NULL,
  date_time         DATETIME NOT NULL,
  seats             TINYINT NOT NULL,
  price             INT NOT NULL,              -- on stocke les “crédits” ici
  duration_minutes  INT DEFAULT NULL,
  driver_rating     TINYINT DEFAULT NULL,
  vehicle_id        INT DEFAULT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rides_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_rides_origin_dest_date (origin, destination, date_time),
  INDEX idx_rides_price (price),
  INDEX idx_rides_vehicle (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  ride_id     INT NOT NULL,
  user_name   VARCHAR(100) NOT NULL,
  user_email  VARCHAR(190) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_booking (ride_id, user_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* === 1) Comptes + crédits pour login / réservations ====================== */
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pseudo VARCHAR(100) NOT NULL,
  email  VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  credits INT NOT NULL DEFAULT 20,
  role ENUM('user','employee','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/* === 2) Flag écolo pour les filtres (US4) ================================ */

ALTER TABLE vehicles
  ADD COLUMN energy ENUM('electric','hybrid','diesel','petrol') NULL;

UPDATE vehicles
  SET energy = 'petrol'
  WHERE energy IS NULL;

ALTER TABLE vehicles
  MODIFY COLUMN energy ENUM('electric','hybrid','diesel','petrol') NOT NULL DEFAULT 'petrol';


/* (optionnel mais pratique) visibilité rapide sur les places restantes */
DROP VIEW IF EXISTS rides_with_seats_left;
CREATE VIEW rides_with_seats_left AS
SELECT
  r.*,
  COALESCE(r.seats - COUNT(b.id), r.seats) AS seats_left
FROM rides r
LEFT JOIN bookings b ON b.ride_id = r.id
GROUP BY r.id;