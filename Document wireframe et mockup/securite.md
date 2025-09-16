# Sécurité EcoRide (bases)

- **Hashage mots de passe** : `password_hash()` (bcrypt) à l’inscription ; `password_verify()` à la connexion.
- **PDO préparé** : toutes les requêtes DB utilisent `prepare/execute` (anti-injection).
- **Validation serveur** :
  - Email : `filter_var($email, FILTER_VALIDATE_EMAIL)`
  - Tailles/champs requis (422 en cas d’erreur)
- **CORS** :
  - Dev : `*` (libre)
  - Prod : autoriser uniquement le domaine Netlify
- **Erreurs** : message générique côté client (`Database unavailable`), pas de stack trace exposée.
- **Tokens** : renvoyés à la connexion, stockés côté client (localStorage) pour la démo.
- **Intégrité DB** :
  - FK `bookings.ride_id → rides.id` (`ON DELETE CASCADE`)
  - Index `idx_rides_origin_dest`, `idx_bookings_ride`
  - (Option) `UNIQUE(ride_id, user_email)` pour empêcher les doublons de réservation.
