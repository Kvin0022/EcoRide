<?php

namespace App\Controllers;

use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Message\ResponseInterface as Response;

class AdminController
{
    // GET /admin/stats
    public function dashboard(Request $req, Response $res, $args)
    {
        // Ex: stats journalières
        $stats = [
            'rides_per_day' => [
                '2025-06-10' => 5,
                '2025-06-11' => 8,
            ],
            'credits_earned' => [
                '2025-06-10' => 40,
                '2025-06-11' => 64,
            ],
            'total_credits' => 104
        ];

        $payload = json_encode($stats, JSON_UNESCAPED_UNICODE);
        $res->getBody()->write($payload);

        return $res
            ->withHeader('Content-Type', 'application/json');
    }
}