// frontend/app/src/Components/debug/TestAPI.jsx

import React, { useState } from "react";

const TestAPI = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState(
    localStorage.getItem("token") || ""
  );

  const addResult = (test, result) => {
    setResults((prev) => [
      ...prev,
      { test, result, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const runTest = async (testName, url, options = {}) => {
    console.log(`🧪 تشغيل اختبار: ${testName}`);
    console.log(`📍 URL: ${url}`);
    console.log(`⚙️ Options:`, options);

    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // إضافة token إذا كان متوفراً
      if (authToken && options.includeAuth) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      console.log(`📊 حالة الاستجابة: ${response.status}`);
      console.log(
        `📋 Headers:`,
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log(`📥 البيانات:`, data);

      addResult(testName, {
        success: response.ok,
        status: response.status,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      });
    } catch (error) {
      console.error(`❌ خطأ في ${testName}:`, error);
      addResult(testName, {
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  };

  const runBasicTests = async () => {
    setLoading(true);
    setResults([]);

    const API_BASE = "http://localhost:8000/api";

    // اختبار 1: معلومات التشخيص الأساسية
    await runTest("1. معلومات التشخيص الأساسية", `${API_BASE}/debug-info`);

    // اختبار 2: POST بسيط
    await runTest("2. POST بسيط", `${API_BASE}/test-simple-post`, {
      method: "POST",
      body: JSON.stringify({ test: "simple post test" }),
    });

    // اختبار 3: إنشاء مستخدم بـ Query Builder
    await runTest(
      "3. إنشاء مستخدم بـ Query Builder",
      `${API_BASE}/test-user-creation`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "اختبار من React",
          specialization: "اختبار",
          phone: "111111111",
          whatsapp: "111111111",
          type: "observer",
          rank: "external_employee",
        }),
      }
    );

    // اختبار 4: إنشاء مستخدم بـ Eloquent
    await runTest(
      "4. إنشاء مستخدم بـ Eloquent",
      `${API_BASE}/test-eloquent-user`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "اختبار Eloquent من React",
          specialization: "اختبار",
          phone: "222222222",
          whatsapp: "222222222",
          type: "supervisor",
          rank: "college_employee",
        }),
      }
    );

    // اختبار 5: المسار غير المحمي للمستخدمين
    await runTest(
      "5. المسار غير المحمي للمستخدمين",
      `${API_BASE}/test-users-unprotected`,
      {
        method: "POST",
        body: JSON.stringify({
          name: "اختبار المسار غير المحمي",
          specialization: "اختبار",
          phone: "333333333",
          whatsapp: "333333333",
          type: "observer",
          rank: "external_employee",
        }),
      }
    );

    setLoading(false);
  };

  const runAuthTests = async () => {
    setLoading(true);
    setResults([]);

    const API_BASE = "http://localhost:8000/api";

    // اختبار تسجيل الدخول
    await runTest("6. تسجيل الدخول", `${API_BASE}/login`, {
      method: "POST",
      body: JSON.stringify({
        username: "admin",
        password: "admin123",
      }),
    });

    // اختبار المسار المحمي بدون token
    await runTest("7. المسار المحمي بدون token", `${API_BASE}/users`, {
      method: "POST",
      body: JSON.stringify({
        name: "اختبار بدون token",
        specialization: "اختبار",
        phone: "444444444",
        whatsapp: "444444444",
        type: "observer",
        rank: "external_employee",
      }),
    });

    // اختبار المسار المحمي مع token
    if (authToken) {
      await runTest("8. المسار المحمي مع token", `${API_BASE}/users`, {
        method: "POST",
        includeAuth: true,
        body: JSON.stringify({
          name: "اختبار مع token",
          specialization: "اختبار",
          phone: "555555555",
          whatsapp: "555555555",
          type: "observer",
          rank: "external_employee",
        }),
      });
    }

    setLoading(false);
  };

  const loginWithTestCredentials = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: "admin",
          password: "admin123",
        }),
      });

      const data = await response.json();

      if (response.ok && data.status && data.access_token) {
        setAuthToken(data.access_token);
        localStorage.setItem("token", data.access_token);
        alert("✅ تم تسجيل الدخول بنجاح!");
      } else {
        alert("❌ فشل تسجيل الدخول: " + (data.message || "خطأ غير محدد"));
      }
    } catch (error) {
      alert("❌ خطأ في تسجيل الدخول: " + error.message);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          marginBottom: "20px",
        }}
      >
        <h1
          style={{
            color: "#2c3e50",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          🧪 اختبار API - تشخيص المشاكل
        </h1>

        {/* حالة المصادقة */}
        <div
          style={{
            padding: "15px",
            backgroundColor: authToken ? "#d5f4e6" : "#fdeaea",
            borderRadius: "8px",
            border: `2px solid ${authToken ? "#27ae60" : "#e74c3c"}`,
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>
            {authToken ? "✅ مُصادق عليه" : "❌ غير مُصادق"}
          </h3>
          {authToken ? (
            <p style={{ margin: 0, fontSize: "12px", wordBreak: "break-all" }}>
              Token: {authToken.substring(0, 50)}...
            </p>
          ) : (
            <button
              onClick={loginWithTestCredentials}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e67e22",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              تسجيل دخول تجريبي
            </button>
          )}
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          <button
            onClick={runBasicTests}
            disabled={loading}
            style={{
              padding: "15px 30px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: loading ? "#95a5a6" : "#3498db",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "🔄 جاري..." : "🚀 اختبارات أساسية"}
          </button>

          <button
            onClick={runAuthTests}
            disabled={loading}
            style={{
              padding: "15px 30px",
              fontSize: "16px",
              fontWeight: "bold",
              backgroundColor: loading ? "#95a5a6" : "#9b59b6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
          >
            {loading ? "🔄 جاري..." : "🔐 اختبارات المصادقة"}
          </button>
        </div>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#e8f4fd",
            borderRadius: "8px",
            border: "1px solid #3498db",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", color: "#2980b9" }}>
            📋 تعليمات:
          </h3>
          <ol style={{ margin: 0, paddingLeft: "20px" }}>
            <li>ابدأ بـ "اختبارات أساسية" لتشخيص قاعدة البيانات والCORS</li>
            <li>استخدم "اختبارات المصادقة" لاختبار المسارات المحمية</li>
            <li>افتح Developer Tools (F12) → Console</li>
            <li>
              في Laravel terminal: <code>tail -f storage/logs/laravel.log</code>
            </li>
          </ol>
        </div>
      </div>

      {results.length > 0 && (
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2 style={{ color: "#2c3e50", marginBottom: "20px" }}>
            📊 نتائج الاختبارات:
          </h2>

          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  margin: "15px 0",
                  padding: "20px",
                  border: "2px solid",
                  borderColor: result.result.success ? "#27ae60" : "#e74c3c",
                  borderRadius: "8px",
                  backgroundColor: result.result.success
                    ? "#d5f4e6"
                    : "#fdeaea",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    color: result.result.success ? "#27ae60" : "#e74c3c",
                  }}
                >
                  {result.test} - {result.timestamp}
                </h4>

                {result.result.success ? (
                  <div>
                    <p
                      style={{
                        margin: "5px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      ✅ <span style={{ color: "#27ae60" }}>نجح</span> - الحالة:{" "}
                      {result.result.status}
                    </p>
                    <details style={{ marginTop: "10px" }}>
                      <summary
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                      >
                        عرض البيانات المُستلمة
                      </summary>
                      <pre
                        style={{
                          fontSize: "12px",
                          overflow: "auto",
                          backgroundColor: "#f8f9fa",
                          padding: "10px",
                          borderRadius: "4px",
                          marginTop: "10px",
                          border: "1px solid #dee2e6",
                        }}
                      >
                        {JSON.stringify(result.result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ) : (
                  <div>
                    <p
                      style={{
                        margin: "5px 0",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    >
                      ❌ <span style={{ color: "#e74c3c" }}>فشل</span>
                    </p>
                    <p>
                      <strong>الخطأ:</strong> {result.result.error}
                    </p>
                    {result.result.status && (
                      <p>
                        <strong>الحالة:</strong> {result.result.status}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
