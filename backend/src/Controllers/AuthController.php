<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\User;
use Firebase\JWT\JWT;

class AuthController
{
    protected string $secret;

    public function __construct(string $jwtSecret)
    {
        $this->secret = $jwtSecret;
    }

    public function login(Request $request, Response $response): Response
    {
        // 1. Récupère le JSON body
        $data     = $request->getParsedBody();
        $email    = $data['email']    ?? '';
        $password = $data['password'] ?? '';

        // 2. Charge l’utilisateur en base
        $user = User::where('email', $email)->first();
        if (!$user || !password_verify($password, $user->password_hash)) {
            $payload = ['error' => 'Unauthorized'];
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        // 3. Génère le JWT
        $now = time();
        $exp = $now + 3600; // 1h
        $token = JWT::encode([
            'iat'  => $now,
            'exp'  => $exp,
            'sub'  => $user->id,
            'role' => $user->role
        ], $this->secret, 'HS256');

        // 4. Rentre la réponse
        $payload = ['token' => $token];
        $response->getBody()->write(json_encode($payload, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
