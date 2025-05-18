<?php

return [
    'paths' => ['*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:3000'], // في بيئة الإنتاج، يجب تحديد المجالات المسموح بها فقط مثل 'http://localhost:3000'
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // مهم جداً لتمكين مشاركة ملفات تعريف الارتباط
];
