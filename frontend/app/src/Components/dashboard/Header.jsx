import React from "react";

const Header = ({ title, onRefresh }) => {
  const s = {
    // backgroundColor: "#3498db",
    padding: "20px",
    // boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    borderBottom: "2px solid #ccc",
    // display: "fixed",
    // top: "0",
  };
  return (
    <div className="dashboard-header" style={s}>
      <h2>{title}</h2>
      <div className="header-actions">
        <button className="refresh-btn" onClick={onRefresh}>
          تحديث البيانات
        </button>
        <div className="date-display">
          {new Date().toLocaleDateString("ar-EG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
};

export default Header;
