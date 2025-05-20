import React, { useState } from "react";
import "./LoginPage.css";

const LoginPage = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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
    }
    if (!credentials.password) {
      newErrors.password = "كلمة المرور مطلوبة";
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

    try {
      // For development/testing, you can use a mock successful login
      // In production, this would be replaced by a real API call

      // Uncomment this for real API usage
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
      // */

      // For testing/development (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock successful login data
      const mockUserData = {
        id: 1,
        username: credentials.username,
        role: "admin",
      };

      localStorage.setItem("token", "mock-jwt-token-for-testing");
      localStorage.setItem("user", JSON.stringify(mockUserData));

      // Call the onLoginSuccess callback from parent component
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      setErrors({
        general: "فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>نظام إدارة المشرفين والملاحظين لقاعات الامتحانات</h2>
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
              className={errors.username ? "error" : ""}
              placeholder="أدخل اسم المستخدم"
              autoComplete="username"
              disabled={isLoading}
            />
            {errors.username && (
              <small className="error-text">{errors.username}</small>
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
              className={errors.password ? "error" : ""}
              placeholder="أدخل كلمة المرور"
              autoComplete="current-password"
              disabled={isLoading}
            />
            {errors.password && (
              <small className="error-text">{errors.password}</small>
            )}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="footer">
          <p>
            نظام إدارة المشرفين والملاحظين &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
