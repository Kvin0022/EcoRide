INSERT INTO users(pseudo,email,password_hash,credits,role) VALUES
('alice','alice@test.com','$2y$10$k6r/2V7X0sIUqz0k4jF6gOQnN6QmD8F5q1q9wq0xv7o1rO4m7mCkW',30,'user'),
('bob','bob@test.com','$2y$10$k6r/2V7X0sIUqz0k4jF6gOQnN6QmD8F5q1q9wq0xv7o1rO4m7mCkW',20,'user'),
('admin','admin@test.com','$2y$10$k6r/2V7X0sIUqz0k4jF6gOQnN6QmD8F5q1q9wq0xv7o1rO4m7mCkW',100,'admin');

-- Deux véhicules dont un électrique (pour tester le filtre eco)
INSERT INTO vehicles(owner_email,brand,model,seats,plate,energy) VALUES
('alice@test.com','Renault','Zoé',3,'AA-111-AA','electric'),
('bob@test.com','Peugeot','208',3,'BB-222-BB','petrol');

-- 3 trajets seed (Metz→Lux, Metz→Nancy, Metz→Paris) pour les tests
INSERT INTO vehicles(owner_email, brand, model, seats, plate, energy) VALUES
('alice@test.com','Renault','Zoé',3,'AA-111-AA','electric'),
('bob@test.com','Peugeot','208',3,'BB-222-BB','petrol');

INSERT INTO rides(origin, destination, date_time, seats, price, duration_minutes, driver_rating, vehicle_id) VALUES
('Metz', 'Luxembourg', '2025-09-21 08:30:00', 3, 8,   55, 5, 1),
('Metz', 'Nancy',      '2025-09-21 09:15:00', 3, 6,   50, 4, 2),
('Metz', 'Paris',      '2025-09-22 06:00:00', 4, 30, 190, 5, 1);
