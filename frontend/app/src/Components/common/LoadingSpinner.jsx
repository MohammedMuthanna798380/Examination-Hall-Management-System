// frontend/app/src/Components/common/LoadingSpinner.jsx
import React from "react";

const LoadingSpinner = ({ message = "جاري التحميل..." }) => {
  return (
    <div
      className="loading-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "20px 0",
      }}
    >
      <div
        className="spinner"
        style={{
          width: "40px",
          height: "40px",
          border: "4px solid #f3f3f3",
          borderTop: "4px solid #3498db",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: "15px",
        }}
      ></div>
      <p
        style={{
          margin: 0,
          color: "#7f8c8d",
          fontSize: "1.1rem",
        }}
      >
        {message}
      </p>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

// frontend/app/src/Components/common/ErrorMessage.jsx
const ErrorMessage = ({ message, onRetry, showRetry = true }) => {
  return (
    <div
      className="error-container"
      style={{
        padding: "20px",
        backgroundColor: "#fdeaea",
        border: "1px solid #e74c3c",
        borderRadius: "8px",
        margin: "20px 0",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "10px",
        }}
      >
        ❌
      </div>
      <h3
        style={{
          margin: "0 0 10px 0",
          color: "#e74c3c",
        }}
      >
        حدث خطأ
      </h3>
      <p
        style={{
          margin: "10px 0",
          color: "#c0392b",
          fontSize: "1rem",
        }}
      >
        {message}
      </p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: "10px 20px",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "0.9rem",
            marginTop: "10px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#c0392b")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#e74c3c")}
        >
          إعادة المحاولة
        </button>
      )}
    </div>
  );
};

// frontend/app/src/Components/common/SuccessMessage.jsx
const SuccessMessage = ({
  message,
  onClose,
  autoHide = false,
  autoHideDelay = 3000,
}) => {
  React.useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, onClose, autoHideDelay]);

  return (
    <div
      className="success-container"
      style={{
        padding: "15px 20px",
        backgroundColor: "#d5f4e6",
        border: "1px solid #27ae60",
        borderRadius: "8px",
        margin: "20px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontSize: "1.5rem",
            marginLeft: "10px",
          }}
        >
          ✅
        </span>
        <span
          style={{
            color: "#27ae60",
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          {message}
        </span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.2rem",
            cursor: "pointer",
            color: "#27ae60",
            padding: "0 5px",
          }}
          title="إغلاق"
        >
          ×
        </button>
      )}
    </div>
  );
};

// frontend/app/src/Components/common/NoDataMessage.jsx
const NoDataMessage = ({
  message = "لا توجد بيانات للعرض",
  icon = "📄",
  actionText,
  onAction,
}) => {
  return (
    <div
      className="no-data-container"
      style={{
        padding: "40px",
        textAlign: "center",
        backgroundColor: "white",
        borderRadius: "10px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        margin: "20px 0",
      }}
    >
      <div
        style={{
          fontSize: "3rem",
          marginBottom: "15px",
          opacity: 0.6,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          margin: "0 0 10px 0",
          color: "#7f8c8d",
          fontSize: "1.2rem",
        }}
      >
        {message}
      </h3>

      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "0.9rem",
            marginTop: "15px",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#2980b9")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#3498db")}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// تصدير جميع المكونات
export { LoadingSpinner, ErrorMessage, SuccessMessage, NoDataMessage };
