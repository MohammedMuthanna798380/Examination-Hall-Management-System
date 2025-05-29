<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class DebugCorsMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // تسجيل تفاصيل الطلب
        Log::info('=== طلب جديد ===', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'origin' => $request->header('Origin'),
            'user_agent' => $request->header('User-Agent'),
            'content_type' => $request->header('Content-Type'),
            'all_headers' => $request->headers->all(),
            'body' => $request->all()
        ]);

        // معالجة طلبات OPTIONS (preflight)
        if ($request->isMethod('OPTIONS')) {
            Log::info('معالجة طلب OPTIONS (preflight)');

            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        try {
            $response = $next($request);

            // إضافة CORS headers للاستجابة
            $response->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigin($request));
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
            $response->headers->set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');

            Log::info('=== استجابة ناجحة ===', [
                'status' => $response->getStatusCode(),
                'headers' => $response->headers->all()
            ]);

            return $response;
        } catch (\Exception $e) {
            Log::error('=== خطأ في المعالجة ===', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            // إرجاع استجابة خطأ مع CORS headers
            $errorResponse = response()->json([
                'status' => false,
                'message' => 'حدث خطأ في الخادم',
                'error' => config('app.debug') ? $e->getMessage() : 'خطأ غير محدد'
            ], 500);

            $errorResponse->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigin($request));
            $errorResponse->headers->set('Access-Control-Allow-Credentials', 'true');

            return $errorResponse;
        }
    }

    /**
     * تحديد الأصل المسموح
     */
    private function getAllowedOrigin($request)
    {
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173'
        ];

        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }

        return 'http://localhost:3000'; // default
    }
}
