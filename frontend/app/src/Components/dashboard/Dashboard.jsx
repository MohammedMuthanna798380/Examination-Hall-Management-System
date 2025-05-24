import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import StatCard from "./StatCard";
import NotificationItem from "./NotificationItem";
import Table from "./Table";
import "./Dashboard.css";

// خدمة API للوحة التحكم
const dashboardAPI = {
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",

  getAuthHeaders: () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  },

  async request(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.status) {
        throw new Error(data.message || "فشل في جلب البيانات");
      }

      return data.data;
    } catch (error) {
      console.error(`خطأ في API ${endpoint}:`, error);
      throw error;
    }
  },

  // دوال API المختلفة
  getStatistics: () => dashboardAPI.request("/dashboard/statistics"),
  getAbsenceData: () => dashboardAPI.request("/dashboard/absence-data"),
  getTomorrowExams: () => dashboardAPI.request("/dashboard/tomorrow-exams"),
  getNotifications: () => dashboardAPI.request("/dashboard/notifications"),
  getQuickStats: () => dashboardAPI.request("/dashboard/quick-stats"),
  checkTodayDistribution: () =>
    dashboardAPI.request("/dashboard/check-distribution"),
};

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();

  // حالات البيانات
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // بيانات لوحة التحكم
  const [stats, setStats] = useState({
    supervisors: 0,
    observers: 0,
    halls: 0,
    todayExams: 0,
  });

  const [absenceData, setAbsenceData] = useState([]);
  const [examsData, setExamsData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [quickStats, setQuickStats] = useState({
    mostUsedHall: "غير محدد",
    topSupervisor: "غير محدد",
    absenceRate: "0%",
    avgObservers: "0",
  });

  const [hasDistribution, setHasDistribution] = useState(false);

  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    initializeDashboard();
  }, []);

  // تهيئة لوحة التحكم
  const initializeDashboard = () => {
    // الحصول على معلومات المستخدم
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // تحميل البيانات
    loadDashboardData();
  };

  // تحميل جميع بيانات لوحة التحكم
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // تحميل جميع البيانات بشكل متوازي
      const [
        statisticsData,
        absenceResponse,
        examsResponse,
        notificationsData,
        quickStatsData,
        distributionCheck,
      ] = await Promise.allSettled([
        dashboardAPI.getStatistics(),
        dashboardAPI.getAbsenceData(),
        dashboardAPI.getTomorrowExams(),
        dashboardAPI.getNotifications(),
        dashboardAPI.getQuickStats(),
        dashboardAPI.checkTodayDistribution(),
      ]);

      // معالجة النتائج
      if (statisticsData.status === "fulfilled") {
        setStats(statisticsData.value);
      }

      if (absenceResponse.status === "fulfilled") {
        setAbsenceData(absenceResponse.value);
      }

      if (examsResponse.status === "fulfilled") {
        setExamsData(examsResponse.value);
      }

      if (notificationsData.status === "fulfilled") {
        setNotifications(notificationsData.value);
      }

      if (quickStatsData.status === "fulfilled") {
        setQuickStats(quickStatsData.value);
      }

      if (distributionCheck.status === "fulfilled") {
        setHasDistribution(distributionCheck.value.hasDistribution);
      }

      // التحقق من وجود أخطاء في أي من الطلبات
      const failedRequests = [
        statisticsData,
        absenceResponse,
        examsResponse,
        notificationsData,
        quickStatsData,
        distributionCheck,
      ].filter((result) => result.status === "rejected");

      if (failedRequests.length > 0) {
        console.warn("بعض الطلبات فشلت:", failedRequests);
        // يمكن عرض تحذير للمستخدم هنا
      }
    } catch (error) {
      console.error("خطأ في تحميل بيانات لوحة التحكم:", error);
      setError(
        "فشل في تحميل البيانات. يرجى التحقق من الاتصال والمحاولة مرة أخرى."
      );
      loadFallbackData();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // تحميل البيانات الاحتياطية
  const loadFallbackData = () => {
    setStats({
      supervisors: 25,
      observers: 40,
      halls: 15,
      todayExams: 8,
    });

    setAbsenceData([
      { name: "أحمد محمد", type: "مشرف", hall: "قاعة 101" },
      { name: "سعيد علي", type: "ملاحظ", hall: "قاعة 203" },
    ]);

    setExamsData([
      {
        hall: "قاعة 101",
        building: "مبنى الكهرباء",
        floor: "الدور الثاني",
        supervisors: 1,
        observers: 2,
      },
      {
        hall: "قاعة 203",
        building: "مبنى المدني",
        floor: "الدور الأول",
        supervisors: 1,
        observers: 3,
      },
      {
        hall: "قاعة 305",
        building: "مبنى الكهرباء",
        floor: "الدور الرابع",
        supervisors: 1,
        observers: 2,
      },
    ]);

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

    setQuickStats({
      mostUsedHall: "قاعة 101",
      topSupervisor: "د. أحمد محمد",
      absenceRate: "5%",
      avgObservers: "2.3",
    });
  };

  // إعادة تحميل البيانات
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
  };

  // معالجة إجراءات الغياب
  const handleAbsenceAction = (row) => {
    navigate("/users");
  };

  // معالجة إجراءات التنبيهات
  const handleNotificationAction = (notification) => {
    if (notification.id.toString().startsWith("suspended_")) {
      navigate("/users");
    } else {
      navigate("/assignments");
    }
  };

  // إنشاء توزيع جديد
  const handleCreateDistribution = () => {
    navigate("/assignments");
  };

  // عرض التوزيع الحالي
  const handleViewDistribution = () => {
    navigate("/assignments");
  };

  // أنماط مخصصة
  const buttonStyle = {
    backgroundColor: "#27ae60",
    padding: "6px 16px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const viewButtonStyle = {
    backgroundColor: "#9b59b6",
    padding: "6px 16px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="dashboard-container">
        <Sidebar
          userName={userName}
          onLogout={onLogout}
          activePage="dashboard"
        />
        <div className="dashboard-main">
          <Header title="لوحة التحكم" onRefresh={handleRefresh} />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "5px solid #f3f3f3",
                borderTop: "5px solid #3498db",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <div style={{ fontSize: "1.2rem", color: "#7f8c8d" }}>
              جاري تحميل البيانات...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error && !stats.supervisors) {
    return (
      <div className="dashboard-container">
        <Sidebar
          userName={userName}
          onLogout={onLogout}
          activePage="dashboard"
        />
        <div className="dashboard-main">
          <Header title="لوحة التحكم" onRefresh={handleRefresh} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "50vh",
              gap: "20px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem" }}>❌</div>
            <div
              style={{
                fontSize: "1.2rem",
                color: "#e74c3c",
                maxWidth: "500px",
              }}
            >
              {error}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              style={{
                padding: "12px 24px",
                backgroundColor: isRefreshing ? "#95a5a6" : "#3498db",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: isRefreshing ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {isRefreshing ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="dashboard" />
      <div className="dashboard-main">
        <Header
          title="لوحة التحكم"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* عرض تحذير في حالة وجود خطأ مع عرض البيانات الاحتياطية */}
        {error && (
          <div
            style={{
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              color: "#856404",
              padding: "10px 15px",
              borderRadius: "5px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span>⚠️</span>
            <span>
              تم عرض البيانات الاحتياطية بسبب مشكلة في الاتصال. {error}
            </span>
            <button
              onClick={handleRefresh}
              style={{
                marginRight: "auto",
                padding: "5px 10px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        <div className="dashboard-content">
          {/* بطاقات الإحصائيات */}
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

          {/* أقسام لوحة التحكم */}
          <div className="dashboard-sections">
            {/* قسم توزيع اليوم */}
            <div className="dashboard-section">
              <h3>توزيع اليوم</h3>
              <div className="dashboard-card">
                {hasDistribution ? (
                  <div
                    className="distribution-exists"
                    style={{ textAlign: "center" }}
                  >
                    <div
                      style={{
                        color: "#27ae60",
                        fontWeight: "bold",
                        marginBottom: "15px",
                      }}
                    >
                      ✅ تم إنشاء التوزيع لهذا اليوم
                    </div>
                    <button
                      onClick={handleViewDistribution}
                      style={viewButtonStyle}
                    >
                      عرض التوزيع
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>لم يتم إنشاء توزيع لهذا اليوم بعد</p>
                    <button
                      onClick={handleCreateDistribution}
                      style={buttonStyle}
                    >
                      إنشاء التوزيع
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* قسم حالات الغياب */}
            <div className="dashboard-section">
              <h3>حالات الغياب</h3>
              <div className="dashboard-card">
                {absenceData.length > 0 ? (
                  <Table
                    headers={["الاسم", "النوع", "القاعة", "الإجراء"]}
                    data={absenceData}
                    actionColumn="استبدال"
                    onAction={handleAbsenceAction}
                  />
                ) : (
                  <div className="empty-state">
                    <p style={{ color: "#27ae60" }}>
                      ✅ لا توجد حالات غياب اليوم
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* قسم التنبيهات */}
          <div className="dashboard-sections">
            <div className="dashboard-section full-width">
              <h3>التنبيهات</h3>
              <div className="dashboard-card">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      type={notification.type}
                      icon={notification.icon}
                      message={notification.message}
                      actionText={notification.actionText}
                      onAction={() => handleNotificationAction(notification)}
                    />
                  ))
                ) : (
                  <div className="empty-state">
                    <p style={{ color: "#27ae60" }}>✅ لا توجد تنبيهات جديدة</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* أقسام إضافية */}
          <div className="dashboard-sections">
            {/* امتحانات الغد */}
            <div className="dashboard-section">
              <h3>امتحانات الغد</h3>
              <div className="dashboard-card">
                {examsData.length > 0 ? (
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
                ) : (
                  <div className="empty-state">
                    <p>لا توجد امتحانات مجدولة للغد</p>
                  </div>
                )}
              </div>
            </div>

            {/* إحصائيات سريعة */}
            <div className="dashboard-section">
              <h3>إحصائيات سريعة</h3>
              <div className="dashboard-card">
                <div className="quick-stats">
                  <div className="quick-stat">
                    <p className="stat-label">أكثر القاعات استخداماً</p>
                    <p className="stat-value">{quickStats.mostUsedHall}</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">المشرف الأكثر إشرافاً</p>
                    <p className="stat-value">{quickStats.topSupervisor}</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">نسبة الغياب</p>
                    <p className="stat-value">{quickStats.absenceRate}</p>
                  </div>
                  <div className="quick-stat">
                    <p className="stat-label">متوسط عدد الملاحظين</p>
                    <p className="stat-value">{quickStats.avgObservers}</p>
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
