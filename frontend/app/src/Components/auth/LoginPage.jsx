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

  // Animation entrance effect
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({
      ...credentials,
      [name]: value,
    });

    // Clear error when user types
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
    setErrors({}); // Clear any previous errors

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Real API call (uncomment when backend is ready)
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok || !data.status) {
        throw new Error(data.message || "فشل تسجيل الدخول");
      }

      // Store token and user data
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Mock successful login for demo
      const mockUserData = {
        id: 1,
        username: credentials.username,
        role: "admin",
      };

      localStorage.setItem("token", "mock-jwt-token-for-testing");
      localStorage.setItem("user", JSON.stringify(mockUserData));

      // Success feedback
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 500);
    } catch (error) {
      setErrors({
        general:
          error.message ||
          "فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.",
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
              placeholder="أدخل اسم المستخدم"
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
              placeholder="أدخل كلمة المرور"
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
