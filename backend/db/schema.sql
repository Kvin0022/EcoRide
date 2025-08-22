-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','employee','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rides
CREATE TABLE IF NOT EXISTS rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NULL,
  origin VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  date_time DATETIME NOT NULL,
  seats INT NOT NULL CHECK (seats >= 1),
  price DECIMAL(6,2) NOT NULL,
  CONSTRAINT fk_rides_user FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_rides_origin_dest ON rides(origin, destination);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ride_id INT NOT NULL,
  user_name VARCHAR(120) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_ride FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

CREATE INDEX idx_bookings_ride ON bookings(ride_id);
