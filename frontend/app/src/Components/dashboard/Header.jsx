import React from "react";

const Header = ({ title, onRefresh, isRefreshing = false }) => {
  const s = {
    padding: "20px",
    borderBottom: "2px solid #ccc",
  };

  return (
    <div className="dashboard-header" style={s}>
      <h2>{title}</h2>
      <div className="header-actions">
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            backgroundColor: isRefreshing ? "#95a5a6" : "#3498db",
            cursor: isRefreshing ? "not-allowed" : "pointer",
            opacity: isRefreshing ? 0.7 : 1,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          {isRefreshing && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid transparent",
                borderTop: "2px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
          )}
          {isRefreshing ? "جاري التحديث..." : "تحديث البيانات"}
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
