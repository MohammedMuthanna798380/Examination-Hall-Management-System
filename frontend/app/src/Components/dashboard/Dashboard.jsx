// frontend/app/src/Components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import StatCard from "./StatCard";
import NotificationItem from "./NotificationItem";
import Table from "./Table";
import "./Dashboard.css";

// خدمة API محسنة للوحة التحكم
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
      console.log(`محاولة الوصول إلى: ${this.baseURL}${endpoint}`);
      console.log("Headers:", this.getAuthHeaders());

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      console.log(
        `استجابة من ${endpoint}:`,
        response.status,
        response.statusText
      );

      // التحقق من حالة المصادقة
      if (response.status === 401) {
        console.warn("خطأ في المصادقة - سيتم استخدام البيانات الوهمية");
        throw new Error("AUTHENTICATION_FAILED");
      }

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

      // إذا كان خطأ في المصادقة، استخدم البيانات الوهمية
      if (
        error.message === "AUTHENTICATION_FAILED" ||
        error.message.includes("401")
      ) {
        return this.getFallbackData(endpoint);
      }

      throw error;
    }
  },

  // البيانات الوهمية لكل endpoint
  getFallbackData(endpoint) {
    console.log(`استخدام البيانات الوهمية لـ: ${endpoint}`);

    switch (endpoint) {
      case "/dashboard/statistics":
        return {
          supervisors: 25,
          observers: 40,
          halls: 15,
          todayExams: 8,
        };

      case "/dashboard/absence-data":
        return [
          { name: "أحمد محمد", type: "مشرف", hall: "قاعة 101" },
          { name: "سعيد علي", type: "ملاحظ", hall: "قاعة 203" },
        ];

      case "/dashboard/tomorrow-exams":
        return [
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
        ];

      case "/dashboard/notifications":
        return [
          {
            id: 1,
            type: "warning",
            icon: "⚠️",
            message: "يوجد نقص في عدد الملاحظين للامتحانات غداً",
            actionText: "معالجة",
          },
          {
            id: 2,
            type: "info",
            icon: "ℹ️",
            message: "تم تعليق مستخدم تلقائياً بسبب الغياب المتكرر",
            actionText: "استعراض",
          },
        ];

      case "/dashboard/quick-stats":
        return {
          mostUsedHall: "قاعة 101",
          topSupervisor: "د. أحمد محمد",
          absenceRate: "5%",
          avgObservers: "2.3",
        };

      case "/dashboard/check-distribution":
        return {
          hasDistribution: false,
        };

      default:
        return {};
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
  const [usingFallbackData, setUsingFallbackData] = useState(false);

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

    // التحقق من وجود token
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("لا يوجد token - سيتم استخدام البيانات الوهمية");
      setUsingFallbackData(true);
    }

    // تحميل البيانات
    loadDashboardData();
  };

  // تحميل جميع بيانات لوحة التحكم
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("بدء تحميل بيانات لوحة التحكم...");

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

      console.log("نتائج تحميل البيانات:", {
        statisticsData: statisticsData.status,
        absenceResponse: absenceResponse.status,
        examsResponse: examsResponse.status,
        notificationsData: notificationsData.status,
        quickStatsData: quickStatsData.status,
        distributionCheck: distributionCheck.status,
      });

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
        setUsingFallbackData(true);
      }

      console.log("تم تحميل البيانات بنجاح");
    } catch (error) {
      console.error("خطأ في تحميل بيانات لوحة التحكم:", error);
      setError("فشل في تحميل البيانات. يتم عرض البيانات الوهمية.");
      setUsingFallbackData(true);
      // لا نحتاج لاستدعاء loadFallbackData هنا لأن البيانات الوهمية تأتي من getFallbackData
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
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

  return (
    <div className="dashboard-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="dashboard" />
      <div className="dashboard-main">
        <Header
          title="لوحة التحكم"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* عرض تحذير عند استخدام البيانات الوهمية */}
        {usingFallbackData && (
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
              يتم عرض البيانات الوهمية بسبب مشكلة في الاتصال مع الخادم.
              {error && ` (${error})`}
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
