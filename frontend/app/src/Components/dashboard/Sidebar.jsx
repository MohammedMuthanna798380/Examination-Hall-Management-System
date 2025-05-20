import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ userName, onLogout, activePage }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-sidebar">
      <div className="sidebar-header">
        <h2>نظام إدارة المشرفين والملاحظين</h2>
        <p>كلية الهندسة - جامعة تعز</p>
      </div>
      <div className="sidebar-user">
        <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
        <p>مرحباً، {userName}</p>
      </div>
      <ul className="sidebar-menu">
        <li
          className={activePage === "dashboard" ? "active" : ""}
          onClick={() => handleNavigation("/dashboard")}
        >
          <span className="menu-icon">📊</span>
          لوحة التحكم
        </li>
        <li
          className={activePage === "users" ? "active" : ""}
          onClick={() => handleNavigation("/users")}
        >
          <span className="menu-icon">👥</span>
          إدارة المشرفين والملاحظين
        </li>
        <li
          className={activePage === "halls" ? "active" : ""}
          onClick={() => handleNavigation("/halls")}
        >
          <span className="menu-icon">🏢</span>
          إدارة القاعات
        </li>
        <li className={activePage === "exams" ? "active" : ""}>
          <span className="menu-icon">📋</span>
          جدول الامتحانات
        </li>
        <li className={activePage === "assignments" ? "active" : ""}>
          <span className="menu-icon">📝</span>
          التوزيع اليومي
        </li>
        <li className={activePage === "absences" ? "active" : ""}>
          <span className="menu-icon">⚠️</span>
          إدارة الغياب والاستبدال
        </li>
        <li className={activePage === "reports" ? "active" : ""}>
          <span className="menu-icon">📈</span>
          التقارير والإحصائيات
        </li>
        <li className={activePage === "settings" ? "active" : ""}>
          <span className="menu-icon">⚙️</span>
          الإعدادات
        </li>
        <li className="logout" onClick={onLogout}>
          <span className="menu-icon">🚪</span>
          تسجيل الخروج
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
