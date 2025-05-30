import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import dailyAssignmentService from "../../services/dailyAssignmentService";
import roomsService from "../../services/roomsService";
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
  const [isAssignmentSaved, setIsAssignmentSaved] = useState(false);
  const [statistics, setStatistics] = useState({
    totalSupervisors: 0,
    totalObservers: 0,
    availableSupervisors: 0,
    availableObservers: 0,
  });

  // بيانات من الخادم
  const [halls, setHalls] = useState([]);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // حالات النوافذ المنبثقة
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [replacementData, setReplacementData] = useState({});
  const [absenceData, setAbsenceData] = useState({});
  const [availableForReplacement, setAvailableForReplacement] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    fetchInitialData();
  }, []);

  // جلب البيانات الأولية
  const fetchInitialData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // جلب القاعات المتاحة
      const roomsData = await roomsService.getRooms({ status: "available" });
      setHalls(roomsData);

      // جلب إحصائيات المستخدمين
      // يمكن إضافة API endpoint للإحصائيات لاحقاً
    } catch (error) {
      console.error("خطأ في جلب البيانات الأولية:", error);
      setError(error.message || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  // تحقق من وجود توزيع سابق للتاريخ والفترة المحددة
  const checkExistingAssignment = async () => {
    try {
      const existingAssignments =
        await dailyAssignmentService.getAssignmentByDate(
          selectedDate,
          selectedPeriod
        );

      if (existingAssignments && existingAssignments.length > 0) {
        setAssignmentResult(formatExistingAssignments(existingAssignments));
        setIsAssignmentSaved(true);
        setNotifications([
          {
            type: "info",
            message: "تم العثور على توزيع سابق لهذا التاريخ والفترة",
          },
        ]);
      } else {
        setAssignmentResult(null);
        setIsAssignmentSaved(false);
        setNotifications([]);
      }
    } catch (error) {
      console.error("خطأ في التحقق من التوزيع السابق:", error);
      // لا نعرض خطأ هنا لأنه قد يكون طبيعي عدم وجود توزيع
    }
  };

  // تنسيق التوزيعات الموجودة للعرض
  const formatExistingAssignments = (assignments) => {
    const formattedAssignments = assignments.map((assignment) => ({
      hallId: assignment.room.id,
      hallName: assignment.room.name,
      building: assignment.room.building_name,
      floor: assignment.room.floor_name,
      requiredSupervisors: assignment.room.required_supervisors,
      requiredObservers: assignment.room.required_observers,
      assignedSupervisors: assignment.supervisor
        ? [assignment.supervisor]
        : [{ name: "غير محدد", missing: true }],
      assignedObservers: assignment.observers || [],
      status: assignment.status,
      assignmentId: assignment.id,
    }));

    const statistics =
      dailyAssignmentService.calculateAssignmentStatistics(
        formattedAssignments
      );

    return {
      assignments: formattedAssignments,
      notifications: [],
      statistics,
    };
  };

  // خوارزمية التوزيع الآلي
  const performAutomaticAssignment = async () => {
    if (selectedHalls.length === 0) {
      alert("يرجى اختيار قاعة واحدة على الأقل");
      return;
    }

    console.log("بدء عملية التوزيع...");
    setIsLoading(true);
    setError("");

    try {
      const assignmentData = {
        date: selectedDate,
        period: selectedPeriod,
        selected_halls: selectedHalls,
      };

      // التحقق من صحة البيانات
      const validation =
        dailyAssignmentService.validateAssignmentData(assignmentData);
      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(", ");
        throw new Error(errorMessages);
      }

      const result = await dailyAssignmentService.performAutomaticAssignment(
        assignmentData
      );

      setAssignmentResult(result);
      setNotifications(result.notifications || []);
      setIsAssignmentSaved(false);

      console.log("تم التوزيع بنجاح:", result);
    } catch (error) {
      console.error("خطأ في التوزيع:", error);
      setError(error.message || "حدث خطأ أثناء التوزيع");
      setNotifications([
        {
          type: "error",
          message: error.message || "فشل في التوزيع التلقائي",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // حفظ التوزيع
  const saveAssignment = async () => {
    if (!assignmentResult) return;

    try {
      setIsLoading(true);

      await dailyAssignmentService.saveAssignment(
        selectedDate,
        selectedPeriod,
        assignmentResult.assignments
      );

      setIsAssignmentSaved(true);
      setNotifications((prev) => [
        ...prev,
        {
          type: "info",
          message: "تم حفظ التوزيع بنجاح في قاعدة البيانات",
        },
      ]);
    } catch (error) {
      console.error("خطأ في حفظ التوزيع:", error);
      alert("فشل في حفظ التوزيع: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // تعديل التوزيع
  const editAssignment = () => {
    setAssignmentResult(null);
    setIsAssignmentSaved(false);
    setNotifications([]);
  };

  // حذف التوزيع
  const deleteAssignment = async () => {
    if (!window.confirm("هل أنت متأكد من حذف التوزيع؟")) return;

    try {
      setIsLoading(true);

      await dailyAssignmentService.deleteAssignment(
        selectedDate,
        selectedPeriod
      );

      setAssignmentResult(null);
      setIsAssignmentSaved(false);
      setNotifications([]);

      alert("تم حذف التوزيع بنجاح");
    } catch (error) {
      console.error("خطأ في حذف التوزيع:", error);
      alert("فشل في حذف التوزيع: " + error.message);
    } finally {
      setIsLoading(false);
    }
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

  // تغيير التاريخ أو الفترة
  const handleDateOrPeriodChange = () => {
    setAssignmentResult(null);
    setIsAssignmentSaved(false);
    setNotifications([]);
    setSelectedHalls([]);

    // التحقق من وجود توزيع سابق
    checkExistingAssignment();
  };

  useEffect(() => {
    handleDateOrPeriodChange();
  }, [selectedDate, selectedPeriod]);

  // اختيار/إلغاء اختيار القاعات
  const toggleHallSelection = (hallId) => {
    setSelectedHalls((prev) =>
      prev.includes(hallId)
        ? prev.filter((id) => id !== hallId)
        : [...prev, hallId]
    );
  };

  // اختيار كل القاعات
  const selectAllHalls = () => {
    const availableHallIds = halls
      .filter((h) => h.status === "available")
      .map((h) => h.id);
    setSelectedHalls(availableHallIds);
  };

  // مسح اختيار القاعات
  const clearHallSelection = () => {
    setSelectedHalls([]);
  };

  // عرض نافذة الاستبدال
  const showReplacement = (assignment, userType, user = null) => {
    setReplacementData({
      assignmentId: assignment.assignmentId,
      roomId: assignment.hallId,
      userType,
      originalUser: user,
      supervisorId: assignment.assignedSupervisors[0]?.id || null,
    });
    setShowReplacementModal(true);

    // جلب المتاحين للاستبدال
    fetchAvailableForReplacement(
      assignment.hallId,
      userType,
      assignment.assignedSupervisors[0]?.id
    );
  };

  // جلب المتاحين للاستبدال
  const fetchAvailableForReplacement = async (
    roomId,
    userType,
    supervisorId = null
  ) => {
    try {
      const filters = {
        date: selectedDate,
        period: selectedPeriod,
        user_type: userType,
        room_id: roomId,
      };

      if (userType === "observer" && supervisorId) {
        filters.supervisor_id = supervisorId;
      }

      const available = await dailyAssignmentService.getAvailableForReplacement(
        filters
      );
      setAvailableForReplacement(available);
    } catch (error) {
      console.error("خطأ في جلب المتاحين للاستبدال:", error);
      setAvailableForReplacement([]);
    }
  };

  // تنفيذ الاستبدال
  const performReplacement = async (replacementUserId, reason) => {
    try {
      const data = {
        assignment_id: replacementData.assignmentId,
        user_type: replacementData.userType,
        original_user_id: replacementData.originalUser?.id || null,
        replacement_user_id: replacementUserId,
        reason: reason,
      };

      await dailyAssignmentService.replaceUser(data);

      // إعادة جلب التوزيع المحدث
      await checkExistingAssignment();

      setShowReplacementModal(false);
      setReplacementData({});
      setAvailableForReplacement([]);

      alert("تم الاستبدال بنجاح");
    } catch (error) {
      console.error("خطأ في الاستبدال:", error);
      alert("فشل في الاستبدال: " + error.message);
    }
  };

  // عرض نافذة تسجيل الغياب
  const showAbsence = (assignment, user) => {
    setAbsenceData({
      assignmentId: assignment.assignmentId,
      user: user,
    });
    setShowAbsenceModal(true);
  };

  // تنفيذ تسجيل الغياب
  const performAbsence = async (reason) => {
    try {
      const data = {
        assignment_id: absenceData.assignmentId,
        user_id: absenceData.user.id,
        reason: reason,
      };

      const result = await dailyAssignmentService.recordAbsence(data);

      setShowAbsenceModal(false);
      setAbsenceData({});

      let message = "تم تسجيل الغياب بنجاح";
      if (result.user_status === "suspended") {
        message += "\n⚠️ تم تعليق المستخدم تلقائياً بسبب الغياب المتكرر";
      }

      alert(message);
    } catch (error) {
      console.error("خطأ في تسجيل الغياب:", error);
      alert("فشل في تسجيل الغياب: " + error.message);
    }
  };

  // تصدير النتائج
  const exportResults = () => {
    if (!assignmentResult) return;

    const report = dailyAssignmentService.generateAssignmentReport(
      assignmentResult.assignments,
      selectedDate,
      selectedPeriod
    );

    // يمكن تنفيذ تصدير PDF هنا
    console.log("تقرير التوزيع:", report);
    alert("سيتم تصدير النتائج إلى PDF");
  };

  // طباعة النتائج
  const printResults = () => {
    window.print();
  };

  // تحديث البيانات
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInitialData();
    await checkExistingAssignment();
    setIsRefreshing(false);
  };

  if (isLoading && !assignmentResult) {
    return (
      <div className="daily-assignment-container">
        <Sidebar
          userName={userName}
          onLogout={onLogout}
          activePage="assignments"
        />
        <div className="daily-assignment-main">
          <Header title="التوزيع اليومي" onRefresh={handleRefresh} />
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-assignment-container">
      <Sidebar
        userName={userName}
        onLogout={onLogout}
        activePage="assignments"
      />
      <div className="daily-assignment-main">
        <Header
          title="التوزيع اليومي"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="daily-assignment-content">
          {error && <div className="error-message general-error">{error}</div>}

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
                    disabled={assignmentResult && isAssignmentSaved}
                  />
                </div>

                <div className="form-group">
                  <label>الفترة:</label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    disabled={assignmentResult && isAssignmentSaved}
                  >
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                  </select>
                </div>
              </div>

              <div className="action-buttons">
                {!assignmentResult ? (
                  <button
                    className="btn btn-primary"
                    onClick={performAutomaticAssignment}
                    disabled={selectedHalls.length === 0 || isLoading}
                  >
                    {isLoading ? "جاري التوزيع..." : "تكوين التوزيع التلقائي"}
                  </button>
                ) : !isAssignmentSaved ? (
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
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={createNewAssignment}
                    >
                      ➕ إنشاء توزيع جديد
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={deleteAssignment}
                    >
                      🗑️ حذف التوزيع
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
            <div className="stat-card">
              <p className="stat-number">
                {assignmentResult
                  ? assignmentResult.statistics?.total_rooms || 0
                  : selectedHalls.length}
              </p>
              <p className="stat-label">القاعات المحددة</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {assignmentResult
                  ? assignmentResult.statistics?.complete_assignments || 0
                  : 0}
              </p>
              <p className="stat-label">توزيعات مكتملة</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {assignmentResult
                  ? assignmentResult.statistics?.total_assigned_supervisors || 0
                  : 0}
              </p>
              <p className="stat-label">مشرفين معينين</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {assignmentResult
                  ? assignmentResult.statistics?.total_assigned_observers || 0
                  : 0}
              </p>
              <p className="stat-label">ملاحظين معينين</p>
            </div>
          </div>

          {/* اختيار القاعات */}
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
                        <strong>المبنى:</strong> {hall.building_name}
                      </p>
                      <p>
                        <strong>الدور:</strong> {hall.floor_name}
                      </p>
                      <p>
                        <strong>السعة:</strong> {hall.capacity} طالب
                      </p>
                      <p>
                        <strong>المشرفين:</strong> {hall.required_supervisors}
                      </p>
                      <p>
                        <strong>الملاحظين:</strong> {hall.required_observers}
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
                    مكتمل:{" "}
                    {assignmentResult.statistics?.complete_assignments || 0}
                  </span>
                  {(assignmentResult.statistics?.partial_assignments || 0) >
                    0 && (
                    <span
                      className="status-badge status-partial"
                      style={{ marginRight: "10px" }}
                    >
                      ناقص: {assignmentResult.statistics?.partial_assignments}
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
                    <th>الإجراءات</th>
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
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <span>{supervisor.name}</span>
                              {supervisor.missing && " (مطلوب)"}
                              {!supervisor.missing && isAssignmentSaved && (
                                <div style={{ display: "flex", gap: "5px" }}>
                                  <button
                                    className="action-btn-user"
                                    onClick={() =>
                                      showReplacement(
                                        assignment,
                                        "supervisor",
                                        supervisor
                                      )
                                    }
                                    title="استبدال"
                                    style={{
                                      fontSize: "0.8rem",
                                      padding: "2px 6px",
                                    }}
                                  >
                                    🔄
                                  </button>
                                  <button
                                    className="action-btn-user"
                                    onClick={() =>
                                      showAbsence(assignment, supervisor)
                                    }
                                    title="تغييب"
                                    style={{
                                      fontSize: "0.8rem",
                                      padding: "2px 6px",
                                    }}
                                  >
                                    ❌
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </td>
                      <td>
                        <div className="observers-list">
                          {assignment.assignedObservers.map(
                            (observer, index) => (
                              <div
                                key={index}
                                className={
                                  observer.missing
                                    ? "missing-staff"
                                    : "observer-chip"
                                }
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  marginBottom: "5px",
                                }}
                              >
                                <span>{observer.name}</span>
                                {observer.missing && " (مطلوب)"}
                                {!observer.missing && isAssignmentSaved && (
                                  <div style={{ display: "flex", gap: "3px" }}>
                                    <button
                                      className="action-btn-user"
                                      onClick={() =>
                                        showReplacement(
                                          assignment,
                                          "observer",
                                          observer
                                        )
                                      }
                                      title="استبدال"
                                      style={{
                                        fontSize: "0.7rem",
                                        padding: "1px 4px",
                                      }}
                                    >
                                      🔄
                                    </button>
                                    <button
                                      className="action-btn-user"
                                      onClick={() =>
                                        showAbsence(assignment, observer)
                                      }
                                      title="تغييب"
                                      style={{
                                        fontSize: "0.7rem",
                                        padding: "1px 4px",
                                      }}
                                    >
                                      ❌
                                    </button>
                                  </div>
                                )}
                              </div>
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
                      <td>
                        {isAssignmentSaved && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "5px",
                            }}
                          >
                            {/* أزرار إضافة مشرف/ملاحظ في حالة النقص */}
                            {assignment.assignedSupervisors.some(
                              (s) => s.missing
                            ) && (
                              <button
                                className="btn btn-primary btn-small"
                                onClick={() =>
                                  showReplacement(assignment, "supervisor")
                                }
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "4px 8px",
                                }}
                              >
                                إضافة مشرف
                              </button>
                            )}
                            {assignment.assignedObservers.some(
                              (o) => o.missing
                            ) && (
                              <button
                                className="btn btn-warning btn-small"
                                onClick={() =>
                                  showReplacement(assignment, "observer")
                                }
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "4px 8px",
                                }}
                              >
                                إضافة ملاحظ
                              </button>
                            )}
                          </div>
                        )}
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

      {/* نافذة الاستبدال */}
      {showReplacementModal && (
        <ReplacementModal
          replacementData={replacementData}
          availableUsers={availableForReplacement}
          onClose={() => {
            setShowReplacementModal(false);
            setReplacementData({});
            setAvailableForReplacement([]);
          }}
          onReplace={performReplacement}
        />
      )}

      {/* نافذة تسجيل الغياب */}
      {showAbsenceModal && (
        <AbsenceModal
          absenceData={absenceData}
          onClose={() => {
            setShowAbsenceModal(false);
            setAbsenceData({});
          }}
          onRecord={performAbsence}
        />
      )}
    </div>
  );
};

// مكون نافذة الاستبدال
const ReplacementModal = ({
  replacementData,
  availableUsers,
  onClose,
  onReplace,
}) => {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      alert("يرجى اختيار مستخدم للاستبدال");
      return;
    }

    if (!reason.trim()) {
      alert("يرجى إدخال سبب الاستبدال");
      return;
    }

    setIsLoading(true);
    try {
      await onReplace(selectedUserId, reason.trim());
    } catch (error) {
      console.error("خطأ في الاستبدال:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserTypeText = (type) => {
    return type === "supervisor" ? "مشرف" : "ملاحظ";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>
            {replacementData.originalUser
              ? `استبدال ${getUserTypeText(replacementData.userType)}`
              : `إضافة ${getUserTypeText(replacementData.userType)}`}
          </h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          {replacementData.originalUser && (
            <div className="form-group">
              <label>المستخدم الحالي:</label>
              <input
                type="text"
                value={replacementData.originalUser.name}
                disabled
                style={{ backgroundColor: "#f8f9fa" }}
              />
            </div>
          )}

          <div className="form-group">
            <label>
              {replacementData.originalUser
                ? "المستخدم البديل:"
                : "المستخدم الجديد:"}
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
            >
              <option value="">
                اختر {getUserTypeText(replacementData.userType)}
              </option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} -{" "}
                  {user.rank === "college_employee"
                    ? "موظف كلية"
                    : "موظف خارجي"}
                  {user.participation_count &&
                    ` (${user.participation_count} مرات)`}
                </option>
              ))}
            </select>
            {availableUsers.length === 0 && (
              <small style={{ color: "#e74c3c" }}>
                لا يوجد {getUserTypeText(replacementData.userType)}ين متاحين
                للاستبدال
              </small>
            )}
          </div>

          <div className="form-group">
            <label>
              سبب {replacementData.originalUser ? "الاستبدال" : "الإضافة"}:
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`أدخل سبب ${
                replacementData.originalUser ? "الاستبدال" : "الإضافة"
              }...`}
              rows="3"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              إلغاء
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading || availableUsers.length === 0}
            >
              {isLoading
                ? "جاري الحفظ..."
                : replacementData.originalUser
                ? "استبدال"
                : "إضافة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// مكون نافذة تسجيل الغياب
const AbsenceModal = ({ absenceData, onClose, onRecord }) => {
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("يرجى إدخال سبب الغياب");
      return;
    }

    setIsLoading(true);
    try {
      await onRecord(reason.trim());
    } catch (error) {
      console.error("خطأ في تسجيل الغياب:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>تسجيل غياب</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label>المستخدم:</label>
            <input
              type="text"
              value={absenceData.user?.name || ""}
              disabled
              style={{ backgroundColor: "#f8f9fa" }}
            />
          </div>

          <div className="form-group">
            <label>سبب الغياب:</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="أدخل سبب الغياب..."
              rows="3"
              required
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                fontSize: "0.9rem",
                resize: "vertical",
              }}
            />
          </div>

          <div
            style={{
              padding: "10px",
              backgroundColor: "#fff3cd",
              border: "1px solid #ffeaa7",
              borderRadius: "5px",
              marginBottom: "15px",
            }}
          >
            <small style={{ color: "#856404" }}>
              <strong>تنبيه:</strong> سيتم تسجيل الغياب وقد يؤدي للتعليق
              التلقائي في حالة تكرار الغياب.
            </small>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              إلغاء
            </button>
            <button
              type="submit"
              className="save-btn"
              disabled={isLoading}
              style={{ backgroundColor: "#e74c3c" }}
            >
              {isLoading ? "جاري التسجيل..." : "تسجيل الغياب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyAssignment;
