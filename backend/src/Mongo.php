<?php
namespace EcoRide;

use MongoDB\Client;
use MongoDB\Collection;
use MongoDB\Database;

class Mongo {
    private Client $client;
    private Database $db;

    public function __construct(string $uri, string $dbName) {
        $this->client = new Client($uri);
        $this->db = $this->client->selectDatabase($dbName);
    }

    public function collection(string $name): Collection {
        return $this->db->selectCollection($name);
    }
}
