import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./DailyAssignment.css";

const DailyAssignment = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  // حالة التطبيق
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [assignmentResult, setAssignmentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isAssignmentSaved, setIsAssignmentSaved] = useState(false); // حالة جديدة لحفظ التوزيع
  const [statistics, setStatistics] = useState({
    totalSupervisors: 0,
    totalObservers: 0,
    availableSupervisors: 0,
    availableObservers: 0,
  });

  // باقي البيانات الوهمية كما هي...
  const [halls] = useState([
    {
      id: 1,
      name: "قاعة 101",
      building: "مبنى الكهرباء",
      floor: "الدور الأول",
      capacity: 50,
      requiredSupervisors: 1,
      requiredObservers: 2,
      canAddObserver: true,
      status: "available",
    },
    {
      id: 2,
      name: "قاعة 102",
      building: "مبنى الكهرباء",
      floor: "الدور الأول",
      capacity: 40,
      requiredSupervisors: 1,
      requiredObservers: 2,
      canAddObserver: false,
      status: "available",
    },
    {
      id: 3,
      name: "قاعة 201",
      building: "مبنى الكهرباء",
      floor: "الدور الثاني",
      capacity: 60,
      requiredSupervisors: 1,
      requiredObservers: 3,
      canAddObserver: true,
      status: "available",
    },
    {
      id: 4,
      name: "قاعة 301",
      building: "مبنى الكهرباء",
      floor: "الدور الثالث",
      capacity: 30,
      requiredSupervisors: 1,
      requiredObservers: 1,
      canAddObserver: true,
      status: "available",
    },
    {
      id: 5,
      name: "قاعة 401",
      building: "مبنى الكهرباء",
      floor: "الدور الرابع",
      capacity: 70,
      requiredSupervisors: 2,
      requiredObservers: 3,
      canAddObserver: true,
      status: "available",
    },
    {
      id: 6,
      name: "قاعة 101م",
      building: "مبنى المدني",
      floor: "الدور الأول",
      capacity: 45,
      requiredSupervisors: 1,
      requiredObservers: 2,
      canAddObserver: true,
      status: "available",
    },
  ]);

  const [supervisors] = useState([
    {
      id: 1,
      name: "د. أحمد محمد علي",
      type: "supervisor",
      rank: "college_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 5,
    },
    {
      id: 2,
      name: "د. خالد عبدالله سعيد",
      type: "supervisor",
      rank: "college_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 3,
    },
    {
      id: 3,
      name: "م. محمد سعيد ناصر",
      type: "supervisor",
      rank: "external_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 7,
    },
    {
      id: 4,
      name: "م. عمر خالد محمد",
      type: "supervisor",
      rank: "external_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 2,
    },
  ]);

  const [observers] = useState([
    {
      id: 5,
      name: "أ. فاطمة أحمد حسن",
      type: "observer",
      rank: "college_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 4,
      supervisorHistory: [],
    },
    {
      id: 6,
      name: "أ. سارة محمد قاسم",
      type: "observer",
      rank: "college_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 6,
      supervisorHistory: [],
    },
    {
      id: 7,
      name: "أ. نور علي أحمد",
      type: "observer",
      rank: "external_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 3,
      supervisorHistory: [],
    },
    {
      id: 8,
      name: "أ. زينب محمد علي",
      type: "observer",
      rank: "external_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 8,
      supervisorHistory: [],
    },
    {
      id: 9,
      name: "أ. ليلى عبدالله أحمد",
      type: "observer",
      rank: "external_employee",
      status: "active",
      assignmentHistory: [],
      participationCount: 1,
      supervisorHistory: [],
    },
  ]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    const activeSupervisors = supervisors.filter((s) => s.status === "active");
    const activeObservers = observers.filter((o) => o.status === "active");

    setStatistics({
      totalSupervisors: activeSupervisors.length,
      totalObservers: activeObservers.length,
      availableSupervisors: activeSupervisors.length,
      availableObservers: activeObservers.length,
    });
  }, [supervisors, observers]);

  // خوارزمية التوزيع الآلي
  const performAutomaticAssignment = () => {
    console.log("بدء عملية التوزيع...");
    setIsLoading(true);

    setTimeout(() => {
      const result = distributeSupervisorsAndObservers();
      setAssignmentResult(result);
      updateNotifications(result);
      setIsLoading(false);
    }, 2000);
  };

  // حفظ التوزيع
  const saveAssignment = () => {
    if (!assignmentResult) return;

    // في التطبيق الحقيقي، هنا سيتم إرسال البيانات للـ API
    console.log("حفظ التوزيع:", assignmentResult);

    // محاكاة عملية الحفظ
    setTimeout(() => {
      setIsAssignmentSaved(true);
      setNotifications((prev) => [
        ...prev,
        {
          type: "info",
          message: "تم حفظ التوزيع بنجاح في قاعدة البيانات",
        },
      ]);
    }, 1000);
  };

  // تعديل التوزيع
  const editAssignment = () => {
    setAssignmentResult(null);
    setIsAssignmentSaved(false);
    setNotifications([]);
  };

  // إنشاء توزيع جديد
  const createNewAssignment = () => {
    setSelectedHalls([]);
    setAssignmentResult(null);
    setIsAssignmentSaved(false);
    setNotifications([]);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setSelectedPeriod("morning");
  };

  // باقي الدوال كما هي...
  const distributeSupervisorsAndObservers = () => {
    const assignments = [];
    const usedSupervisors = new Set();
    const usedObservers = new Set();
    let notifications = [];

    const availableSupervisors = supervisors
      .filter((s) => s.status === "active")
      .sort((a, b) => {
        if (a.rank === "college_employee" && b.rank !== "college_employee")
          return -1;
        if (b.rank === "college_employee" && a.rank !== "college_employee")
          return 1;
        return a.participationCount - b.participationCount;
      });

    const availableObservers = observers
      .filter((o) => o.status === "active")
      .sort((a, b) => {
        if (a.rank === "college_employee" && b.rank !== "college_employee")
          return -1;
        if (b.rank === "college_employee" && a.rank !== "college_employee")
          return 1;
        return a.participationCount - b.participationCount;
      });

    selectedHalls.forEach((hallId) => {
      const hall = halls.find((h) => h.id === hallId);
      if (!hall) return;

      const assignment = {
        hallId: hall.id,
        hallName: hall.name,
        building: hall.building,
        floor: hall.floor,
        requiredSupervisors: hall.requiredSupervisors,
        requiredObservers: hall.requiredObservers,
        assignedSupervisors: [],
        assignedObservers: [],
        status: "complete",
      };

      for (let i = 0; i < hall.requiredSupervisors; i++) {
        const availableSupervisor = availableSupervisors.find(
          (s) =>
            !usedSupervisors.has(s.id) && !s.assignmentHistory.includes(hallId)
        );

        if (availableSupervisor) {
          assignment.assignedSupervisors.push(availableSupervisor);
          usedSupervisors.add(availableSupervisor.id);
        } else {
          assignment.status = "partial";
          assignment.assignedSupervisors.push({
            name: "غير محدد",
            missing: true,
          });
          notifications.push({
            type: "error",
            message: `نقص في المشرفين لقاعة ${hall.name}`,
          });
        }
      }

      for (let i = 0; i < hall.requiredObservers; i++) {
        const assignedSupervisorIds = assignment.assignedSupervisors
          .filter((s) => !s.missing)
          .map((s) => s.id);

        const availableObserver = availableObservers.find(
          (o) =>
            !usedObservers.has(o.id) &&
            !o.assignmentHistory.includes(hallId) &&
            !assignedSupervisorIds.some((sid) =>
              o.supervisorHistory.includes(sid)
            )
        );

        if (availableObserver) {
          assignment.assignedObservers.push(availableObserver);
          usedObservers.add(availableObserver.id);
        } else {
          assignment.status = "partial";
          assignment.assignedObservers.push({
            name: "غير محدد",
            missing: true,
          });
          notifications.push({
            type: "warning",
            message: `نقص في الملاحظين لقاعة ${hall.name}`,
          });
        }
      }

      assignments.push(assignment);
    });

    return {
      assignments,
      notifications,
      statistics: {
        totalHalls: selectedHalls.length,
        completeAssignments: assignments.filter((a) => a.status === "complete")
          .length,
        partialAssignments: assignments.filter((a) => a.status === "partial")
          .length,
        totalAssignedStaff: usedSupervisors.size + usedObservers.size,
      },
    };
  };

  const updateNotifications = (result) => {
    setNotifications(result.notifications);
  };

  const toggleHallSelection = (hallId) => {
    setSelectedHalls((prev) =>
      prev.includes(hallId)
        ? prev.filter((id) => id !== hallId)
        : [...prev, hallId]
    );
  };

  const selectAllHalls = () => {
    const availableHallIds = halls
      .filter((h) => h.status === "available")
      .map((h) => h.id);
    setSelectedHalls(availableHallIds);
  };

  const clearHallSelection = () => {
    setSelectedHalls([]);
  };

  const exportResults = () => {
    if (!assignmentResult) return;
    alert("سيتم تصدير النتائج إلى PDF");
  };

  const printResults = () => {
    window.print();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const s = {
    justifyCcontent: "space-evenly !important",
  };

  return (
    <div className="daily-assignment-container">
      <Sidebar
        userName={userName}
        onLogout={onLogout}
        activePage="assignments"
      />
      <div className="daily-assignment-main">
        <Header title="التوزيع اليومي" onRefresh={handleRefresh} />

        <div className="daily-assignment-content">
          {/* رأس الصفحة */}
          <div className="assignment-header">
            <h1 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
              نظام التوزيع اليومي للمشرفين والملاحظين
            </h1>

            <div className="assignment-controls">
              <div className="date-period-selector">
                <div className="form-group">
                  <label>التاريخ:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    disabled={assignmentResult && !isAssignmentSaved} // تعطيل التعديل بعد إنشاء التوزيع
                  />
                </div>

                <div className="form-group">
                  <label>الفترة:</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    disabled={assignmentResult && !isAssignmentSaved} // تعطيل التعديل بعد إنشاء التوزيع
                  >
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                  </select>
                </div>
              </div>

              <div className="action-buttons">
                {!assignmentResult ? (
                  // أزرار قبل إنشاء التوزيع
                  <button
                    className="btn btn-primary"
                    onClick={performAutomaticAssignment}
                    disabled={selectedHalls.length === 0 || isLoading}
                    style={{
                      cursor:
                        selectedHalls.length === 0 || isLoading
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        selectedHalls.length === 0 || isLoading ? 0.6 : 1,
                    }}
                  >
                    {isLoading ? "جاري التوزيع..." : "تكوين التوزيع التلقائي"}
                  </button>
                ) : !isAssignmentSaved ? (
                  // أزرار بعد إنشاء التوزيع وقبل الحفظ
                  <>
                    <button
                      className="btn btn-success"
                      onClick={saveAssignment}
                      disabled={isLoading}
                    >
                      💾 حفظ التوزيع
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={editAssignment}
                      disabled={isLoading}
                    >
                      ✏️ تعديل التوزيع
                    </button>
                    <button className="btn btn-primary" onClick={exportResults}>
                      📄 تصدير النتائج
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={printResults}
                    >
                      🖨️ طباعة
                    </button>
                  </>
                ) : (
                  // أزرار بعد حفظ التوزيع
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={createNewAssignment}
                    >
                      ➕ إنشاء توزيع جديد
                    </button>
                    <button className="btn btn-success" onClick={exportResults}>
                      📄 تصدير النتائج
                    </button>
                    <button className="btn btn-warning" onClick={printResults}>
                      🖨️ طباعة
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* الإحصائيات */}
          <div className="statistics">
            <div className="stat-card" style={s}>
              <p className="stat-number">{statistics.availableSupervisors}</p>
              <p className="stat-label">إجمالي المشرفين</p>
            </div>
            <div className="stat-card" style={s}>
              <p className="stat-number">{statistics.availableObservers}</p>
              <p className="stat-label">إجمالي الملاحظين</p>
            </div>
            <div className="stat-card" style={s}>
              <p className="stat-number">{selectedHalls.length}</p>
              <p className="stat-label">القاعات المحددة</p>
            </div>
            <div className="stat-card" style={s}>
              <p className="stat-number">
                {assignmentResult
                  ? assignmentResult.statistics.totalAssignedStaff
                  : 0}
              </p>
              <p className="stat-label">الموظفين المعينين</p>
            </div>
          </div>

          {/* اختيار القاعات - يظهر فقط عندما لا يوجد توزيع أو في حالة التعديل */}
          {!assignmentResult && (
            <div className="halls-selection">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3 style={{ margin: 0, color: "#2c3e50" }}>
                  اختيار القاعات التي ستعقد فيها امتحانات
                </h3>
                <div>
                  <button
                    className="btn btn-primary btn-small"
                    onClick={selectAllHalls}
                  >
                    اختيار الكل
                  </button>
                  <button
                    className="btn btn-warning btn-small"
                    onClick={clearHallSelection}
                    style={{ marginRight: "10px" }}
                  >
                    مسح الاختيار
                  </button>
                </div>
              </div>

              <div className="halls-grid">
                {halls
                  .filter((h) => h.status === "available")
                  .map((hall) => (
                    <div
                      key={hall.id}
                      className={`hall-item ${
                        selectedHalls.includes(hall.id) ? "selected" : ""
                      }`}
                      onClick={() => toggleHallSelection(hall.id)}
                    >
                      <h4>{hall.name}</h4>
                      <p>
                        <strong>المبنى:</strong> {hall.building}
                      </p>
                      <p>
                        <strong>الدور:</strong> {hall.floor}
                      </p>
                      <p>
                        <strong>السعة:</strong> {hall.capacity} طالب
                      </p>
                      <p>
                        <strong>المشرفين:</strong> {hall.requiredSupervisors}
                      </p>
                      <p>
                        <strong>الملاحظين:</strong> {hall.requiredObservers}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* نتائج التوزيع */}
          {assignmentResult && (
            <div className="assignment-result">
              <div className="result-header">
                <h3 style={{ margin: 0 }}>
                  نتائج التوزيع -{" "}
                  {new Date(selectedDate).toLocaleDateString("ar-SA")} -
                  {selectedPeriod === "morning"
                    ? " الفترة الصباحية"
                    : " الفترة المسائية"}
                  {isAssignmentSaved && (
                    <span
                      style={{
                        color: "#27ae60",
                        marginRight: "15px",
                        fontSize: "0.9rem",
                      }}
                    >
                      ✅ محفوظ
                    </span>
                  )}
                </h3>
                <div>
                  <span className="status-badge status-complete">
                    مكتمل: {assignmentResult.statistics.completeAssignments}
                  </span>
                  {assignmentResult.statistics.partialAssignments > 0 && (
                    <span
                      className="status-badge status-partial"
                      style={{ marginRight: "10px" }}
                    >
                      ناقص: {assignmentResult.statistics.partialAssignments}
                    </span>
                  )}
                </div>
              </div>

              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>القاعة</th>
                    <th>المبنى</th>
                    <th>الدور</th>
                    <th>المشرف</th>
                    <th>الملاحظين</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentResult.assignments.map((assignment) => (
                    <tr key={assignment.hallId}>
                      <td>
                        <strong>{assignment.hallName}</strong>
                      </td>
                      <td>{assignment.building}</td>
                      <td>{assignment.floor}</td>
                      <td>
                        {assignment.assignedSupervisors.map(
                          (supervisor, index) => (
                            <div
                              key={index}
                              className={
                                supervisor.missing ? "missing-staff" : ""
                              }
                            >
                              {supervisor.name}
                              {supervisor.missing && " (مطلوب)"}
                            </div>
                          )
                        )}
                      </td>
                      <td>
                        <div className="observers-list">
                          {assignment.assignedObservers.map(
                            (observer, index) => (
                              <span
                                key={index}
                                className={
                                  observer.missing
                                    ? "missing-staff"
                                    : "observer-chip"
                                }
                              >
                                {observer.name}
                                {observer.missing && " (مطلوب)"}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${assignment.status}`}
                        >
                          {assignment.status === "complete" ? "مكتمل" : "ناقص"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* التنبيهات */}
          {notifications.length > 0 && (
            <div className="notifications">
              <h3 style={{ marginTop: 0, color: "#2c3e50" }}>
                التنبيهات والملاحظات
              </h3>
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification ${notification.type}`}
                >
                  <span className="notification-icon">
                    {notification.type === "error"
                      ? "❌"
                      : notification.type === "warning"
                      ? "⚠️"
                      : "ℹ️"}
                  </span>
                  <p style={{ margin: 0, flexGrow: 1 }}>
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* شاشة التحميل */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>جاري تنفيذ التوزيع الآلي...</h3>
            <p>يتم تطبيق قواعد التوزيع وحساب الأولويات</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAssignment;
