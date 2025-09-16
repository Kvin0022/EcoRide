-- Jeu de données DEMO EcoRide (sécurisé si relancé plusieurs fois)

-- Utilisateurs démo (facultatif, l'API n’en dépend pas pour l’instant)
-- CREATE TABLE users (...) -- si  une table users

-- Véhicules (emails “propriétaires” uniquement informatifs côté API)
INSERT INTO vehicles (brand, model, seats, plate, owner_email)
VALUES
  ('Renault', 'Zoe',       4, 'ECO-ZOE-001', 'natasha@example.com'),
  ('Toyota',  'Prius',     4, 'ECO-PRI-002', 'pierre@example.com'),
  ('Tesla',   'Model 3',   5, 'ECO-TM3-003', 'nadia@example.com'),
  ('Peugeot', '208',       4, 'ECO-208-004', 'benjamin@example.com')
ON DUPLICATE KEY UPDATE
  brand=VALUES(brand), model=VALUES(model), seats=VALUES(seats), owner_email=VALUES(owner_email);

-- On récupère les ids (simplifié : si la table n’a pas d’unicité sur plate, garde tel quel)
-- Sinon ajoute un UNIQUE(plate) et remplace plus bas par SELECT id FROM vehicles WHERE plate='...';

-- Trajets (dates à +1/+2/+3 jours, crédits “cohérents”)
INSERT INTO rides (origin, destination, date_time, seats, price, vehicle_id)
VALUES
  ('Paris',   'Lyon',  DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), '%Y-%m-%d 10:30'), 4, 12, (SELECT id FROM vehicles WHERE plate='ECO-ZOE-001'  LIMIT 1)),
  ('Lille',   'Paris', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 DAY), '%Y-%m-%d 08:15'), 4,  9, (SELECT id FROM vehicles WHERE plate='ECO-PRI-002'  LIMIT 1)),
  ('Nantes',  'Rennes',DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%Y-%m-%d 14:00'), 5, 10, (SELECT id FROM vehicles WHERE plate='ECO-TM3-003'  LIMIT 1)),
  ('Bordeaux','Toulouse',DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY), '%Y-%m-%d 18:45'), 4, 11, (SELECT id FROM vehicles WHERE plate='ECO-208-004'  LIMIT 1))
ON DUPLICATE KEY UPDATE
  origin=VALUES(origin), destination=VALUES(destination), date_time=VALUES(date_time),
  seats=VALUES(seats), price=VALUES(price), vehicle_id=VALUES(vehicle_id);
