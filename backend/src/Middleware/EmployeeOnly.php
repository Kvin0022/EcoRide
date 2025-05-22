<?php
namespace App\Middleware;

use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;

class EmployeeOnly implements \Psr\Http\Server\MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $user = $request->getAttribute('user', []);
        if (!isset($user['role']) || $user['role'] !== 'employee') {
            $res = new Response(403);
            $res->getBody()->write(json_encode(['error' => 'Forbidden: employees only']));
            return $res->withHeader('Content-Type', 'application/json');
        }
        return $handler->handle($request);
    }
}
