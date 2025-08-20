<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;        // Slim fournit une implémentation PSR-7

class AuthMiddleware implements \Psr\Http\Server\MiddlewareInterface
{
    private string $secret;

    public function __construct(string $jwtSecret)
    {
        $this->secret = $jwtSecret;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');
        if (!preg_match('/^Bearer\s+(.*)$/', $authHeader, $matches)) {
            return $this->unauthorized();
        }
        $token = $matches[1];

        try {
            $payload = \Firebase\JWT\JWT::decode($token, $this->secret, ['HS256']);
        } catch (\Exception $e) {
            return $this->unauthorized();
        }

        // On place les infos utilisateur pour la suite
        $user = [
            'id'   => $payload->sub,
            'role' => $payload->role
        ];
        $request = $request->withAttribute('user', $user);

        // Passe au handler suivant
        return $handler->handle($request);
    }

    private function unauthorized(): ResponseInterface
    {
        $response = new Response(401);
        $response->getBody()->write(json_encode([
            'error' => 'Unauthorized'
        ]));
        return $response
            ->withHeader('Content-Type', 'application/json');
    }
}
