import React, { useState } from "react";
import "./LoginPage.css";

const LoginPage = () => {
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
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!response.ok || !data.status) {
        throw new Error(data.message || "فشل تسجيل الدخول");
      }

      // تخزين رمز المصادقة وبيانات المستخدم
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // if (!response.ok) {
      //   throw new Error('فشل تسجيل الدخول');
      // }

      // const data = await response.json();
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      // window.location.href = '/dashboard';

      console.log("تم تسجيل الدخول بنجاح", credentials);
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
