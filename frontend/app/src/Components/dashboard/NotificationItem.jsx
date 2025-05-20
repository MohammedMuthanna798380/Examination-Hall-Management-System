import React from "react";

const NotificationItem = ({ type, icon, message, actionText, onAction }) => {
  const s = {
    backgroundColor: "#3498db",
    padding: "6px 16px",
  };
  return (
    <div className={`notification ${type}`}>
      <span className="notification-icon">{icon}</span>
      <p>{message}</p>
      <button className="action-btn" style={s} onClick={onAction}>
        {actionText}
      </button>
    </div>
  );
};

export default NotificationItem;
