// frontend/app/src/Components/auth/LoginPage.jsx
import React, { useState, useEffect } from "react";
import "./LoginPage.css";

const LoginPage = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!credentials.username.trim()) {
      newErrors.username = "اسم المستخدم مطلوب";
    } else if (credentials.username.length < 3) {
      newErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    }

    if (!credentials.password) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (credentials.password.length < 4) {
      newErrors.password = "كلمة المرور يجب أن تكون 4 أحرف على الأقل";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // محاولة تسجيل الدخول الحقيقي أولاً
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.status) {
        // تسجيل دخول ناجح من API
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("تم تسجيل الدخول بنجاح:", data);
      } else {
        // فشل تسجيل الدخول من API، استخدام البيانات الوهمية
        console.warn("فشل تسجيل الدخول من API، استخدام البيانات الوهمية");

        // التحقق من البيانات الوهمية
        if (
          credentials.username === "admin" &&
          credentials.password === "1234"
        ) {
          const mockUserData = {
            id: 1,
            username: credentials.username,
            role: "admin",
          };

          // إنشاء token وهمي صالح
          const mockToken = btoa(
            JSON.stringify({
              user_id: 1,
              username: credentials.username,
              role: "admin",
              exp: Date.now() + 24 * 60 * 60 * 1000, // ينتهي خلال 24 ساعة
            })
          );

          localStorage.setItem("token", mockToken);
          localStorage.setItem("user", JSON.stringify(mockUserData));
        } else {
          throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
      }

      // إعطاء تأخير قصير قبل الانتقال
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    } catch (error) {
      console.error("خطأ في تسجيل الدخول:", error);
      setErrors({
        general: error.message || "فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <div className={`login-container ${isVisible ? "visible" : ""}`}>
      <div className="login-card">
        <div className="login-header">
          <h2>نظام إدارة المشرفين والملاحظين</h2>
          <h3>كلية الهندسة - جامعة تعز</h3>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}

          <div className="form-group">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className={errors.username ? "error" : ""}
              placeholder="أدخل اسم المستخدم (admin)"
              autoComplete="username"
              disabled={isLoading}
              maxLength={50}
              dir="ltr"
              style={{ textAlign: "center" }}
            />
            {errors.username && (
              <span className="error-text">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              className={errors.password ? "error" : ""}
              placeholder="أدخل كلمة المرور (1234)"
              autoComplete="current-password"
              disabled={isLoading}
              maxLength={100}
              dir="ltr"
              style={{ textAlign: "center" }}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className={`login-button ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>

          <div
            style={{
              marginTop: "15px",
              fontSize: "0.8rem",
              color: "#666",
              textAlign: "center",
            }}
          >
            للتجربة: اسم المستخدم: <strong>admin</strong> / كلمة المرور:{" "}
            <strong>1234</strong>
          </div>
        </form>

        <div className="footer">
          <p>
            نظام إدارة المشرفين والملاحظين &copy; {new Date().getFullYear()}
          </p>
          <p style={{ fontSize: "0.8rem", marginTop: "5px", opacity: 0.7 }}>
            جميع الحقوق محفوظة - كلية الهندسة، جامعة تعز
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
