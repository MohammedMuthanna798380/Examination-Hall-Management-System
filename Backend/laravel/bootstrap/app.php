<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // إضافة Sanctum middleware للAPI
        $middleware->api(prepend: [
            EnsureFrontendRequestsAreStateful::class,
        ]);

        // إضافة CORS middleware للجميع
        $middleware->append([
            \App\Http\Middleware\HandleCors::class,
        ]);

        // استثناء API routes من CSRF
        $middleware->validateCsrfTokens(except: [
            'api/*',
            'sanctum/*',
            'login',
            'logout',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
