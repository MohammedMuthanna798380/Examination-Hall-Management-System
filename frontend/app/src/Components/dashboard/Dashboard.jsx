import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import StatCard from "./StatCard";
import NotificationItem from "./NotificationItem";
import Table from "./Table";
import "./Dashboard.css";

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    supervisors: 0,
    observers: 0,
    halls: 0,
    todayExams: 0,
  });
  const handleNavigation = (path) => {
    navigate(path);
  };
  const [absenceData, setAbsenceData] = useState([]);
  const [examsData, setExamsData] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // In a real app, fetch data from API
    // For now, we'll use dummy data
    loadDummyData();
  }, []);

  const loadDummyData = () => {
    // Stats data
    setStats({
      supervisors: 25,
      observers: 40,
      halls: 15,
      todayExams: 8,
    });

    // Absence data
    setAbsenceData([
      { name: "أحمد محمد", type: "مشرف", hall: "قاعة 101" },
      { name: "سعيد علي", type: "ملاحظ", hall: "قاعة 203" },
    ]);

    // Exams data
    setExamsData([
      {
        hall: "قاعة 101",
        building: "الكهرباء",
        floor: "الثاني",
        supervisors: 1,
        observers: 2,
      },
      {
        hall: "قاعة 203",
        building: "المدني",
        floor: "الأول",
        supervisors: 1,
        observers: 3,
      },
      {
        hall: "قاعة 305",
        building: "الكهرباء",
        floor: "الرابع",
        supervisors: 1,
        observers: 2,
      },
    ]);

    // Notifications
    setNotifications([
      {
        id: 1,
        type: "warning",
        icon: "⚠️",
        message:
          "يوجد نقص في عدد الملاحظين للامتحانات غداً (مطلوب 2 ملاحظ إضافي)",
        actionText: "معالجة",
      },
      {
        id: 2,
        type: "info",
        icon: "ℹ️",
        message: 'تم تعليق مستخدم "خالد أحمد" تلقائياً بسبب الغياب المتكرر',
        actionText: "استعراض",
      },
    ]);
  };

  const handleRefresh = () => {
    // In a real app, this would fetch fresh data
    loadDummyData();
  };

  const handleAbsenceAction = (row) => {
    navigate("/users");
  };

  const handleNotificationAction = (notification) => {
    alert(
      `تم النقر على ${notification.actionText} للإشعار: ${notification.message}`
    );
  };

  const handleCreateDistribution = () => {
    alert("سيتم إنشاء التوزيع لليوم الحالي");
  };

  const s = {
    backgroundColor: "#27ae60",
    padding: "6px 16px",
  };
  return (
    <div className="dashboard-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="dashboard" />
      <div className="dashboard-main">
        <Header title="لوحة التحكم" onRefresh={handleRefresh} />
        <div className="dashboard-content">
          <div className="stats-cards">
            <StatCard
              title="المشرفين"
              value={stats.supervisors}
              icon="👨‍🏫"
              iconClass="supervisor-icon"
            />
            <StatCard
              title="الملاحظين"
              value={stats.observers}
              icon="👁️"
              iconClass="observer-icon"
            />
            <StatCard
              title="القاعات"
              value={stats.halls}
              icon="🏛️"
              iconClass="hall-icon"
            />
            <StatCard
              title="امتحانات اليوم"
              value={stats.todayExams}
              icon="📝"
              iconClass="exam-icon"
            />
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h3>توزيع اليوم</h3>
              <div className="dashboard-card">
                <div className="empty-state">
                  <p>لم يتم إنشاء توزيع لهذا اليوم بعد</p>
                  <button
                    className="action-btn create-distribution-btn"
                    onClick={() => handleNavigation("/assignments")}
                    style={s}
                  >
                    إنشاء التوزيع
                  </button>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <h3>حالات الغياب</h3>
              <div className="dashboard-card">
                <Table
                  headers={["الاسم", "النوع", "القاعة", "الإجراء"]}
                  data={absenceData}
                  actionColumn="استبدال"
                  onAction={handleAbsenceAction}
                />
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section full-width">
              <h3>التنبيهات</h3>
              <div className="dashboard-card">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    type={notification.type}
                    icon={notification.icon}
                    message={notification.message}
                    actionText={notification.actionText}
                    onAction={() => handleNotificationAction(notification)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="dashboard-section">
              <h3>امتحانات الغد</h3>
              <div className="dashboard-card">
                <Table
                  headers={[
                    "القاعة",
                    "المبنى",
                    "الدور",
                    "عدد المشرفين",
                    "عدد الملاحظين",
                  ]}
                  data={examsData}
                />
              </div>
            </div>

            <div className="dashboard-section">
              <h3>إحصائيات سريعة</h3>
              <div className="dashboard-card">
                <div className="quick-stats">
                  <div className="quick-stat">
                    <p className="stat-label">أكثر القاعات استخداماً</p>
                    <p className="stat-value">قاعة 101</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">المشرف الأكثر إشرافاً</p>
                    <p className="stat-value">سامي محمد</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">نسبة الغياب</p>
                    <p className="stat-value">5%</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">متوسط عدد الملاحظين</p>
                    <p className="stat-value">2.3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
