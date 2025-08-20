CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','employee','admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rides (
  id INT AUTO_INCREMENT PRIMARY KEY,
  driver_id INT NOT NULL,
  origin VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  date_time DATETIME NOT NULL,
  seats INT NOT NULL CHECK (seats >= 1),
  price DECIMAL(6,2) NOT NULL,
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

CREATE INDEX idx_rides_origin_dest ON rides(origin, destination);
