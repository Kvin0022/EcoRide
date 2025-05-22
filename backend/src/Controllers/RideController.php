<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RideController
{
    public function search(Request $req, Response $res): Response
    {
        // … ta logique de recherche …
        $rides = /* fetch depuis la BDD */;

        $payload = json_encode($rides, JSON_UNESCAPED_UNICODE);
        $res->getBody()->write($payload);

        return $res
            ->withHeader('Content-Type', 'application/json');
    }

    public function book(Request $req, Response $res): Response
    {
        // … ta logique de réservation …
        $rideId = /* nouvel ID réservé */;
        $data   = [
            'status'  => 'booked',
            'ride_id' => $rideId
        ];

        $payload = json_encode($data, JSON_UNESCAPED_UNICODE);
        $res->getBody()->write($payload);

        return $res
            ->withHeader('Content-Type', 'application/json');
    }
}
