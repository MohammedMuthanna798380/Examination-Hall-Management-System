import React from "react";

const NotificationItem = ({ type, icon, message, actionText, onAction }) => {
  return (
    <div className={`notification ${type}`}>
      <span className="notification-icon">{icon}</span>
      <p>{message}</p>
      <button className="action-btn" onClick={onAction}>
        {actionText}
      </button>
    </div>
  );
};

export default NotificationItem;
