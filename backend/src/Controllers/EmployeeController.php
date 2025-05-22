<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class EmployeeController
{
    public function badTrips(Request $req, Response $res): Response
    {
        // … ta logique pour récupérer les trajets “mal passés” …
        $incidents = /* fetch depuis la BDD */;

        $payload = json_encode($incidents, JSON_UNESCAPED_UNICODE);
        $res->getBody()->write($payload);

        return $res
            ->withHeader('Content-Type', 'application/json');
    }
}
