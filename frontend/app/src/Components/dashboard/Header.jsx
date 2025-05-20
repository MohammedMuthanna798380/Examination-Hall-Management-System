import React from "react";

const Header = ({ title, onRefresh }) => {
  return (
    <div className="dashboard-header">
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
