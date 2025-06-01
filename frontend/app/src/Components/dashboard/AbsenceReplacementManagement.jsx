import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import absenceReplacementService from "../../services/absenceReplacementService";
import "./AbsenceReplacementManagement.css";

const AbsenceReplacementManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
  const [activeTab, setActiveTab] = useState("supervisors");
  const [assignmentData, setAssignmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replacementModal, setReplacementModal] = useState({
    isOpen: false,
    type: null,
    originalUser: null,
    assignment: null,
    availableReplacements: [],
    loading: false,
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    loadAssignmentData();
  }, [selectedDate, selectedPeriod]);

  const loadAssignmentData = async () => {
    setIsLoading(true);
    setError("");

    try {
      console.log(
        "جلب البيانات للتاريخ:",
        selectedDate,
        "الفترة:",
        selectedPeriod
      );

      const data = await absenceReplacementService.getAssignments(
        selectedDate,
        selectedPeriod
      );

      setAssignmentData(data);
      console.log("تم جلب البيانات بنجاح:", data);
    } catch (error) {
      console.error("خطأ في تحميل البيانات:", error);
      setError(error.message || "حدث خطأ أثناء تحميل البيانات");
      setAssignmentData({ supervisors: [], observers: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAssignmentData();
    setIsRefreshing(false);
  };

  const handleAbsent = async (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    if (window.confirm(`هل أنت متأكد من تغييب ${user.name}؟`)) {
      try {
        const absenceData = {
          assignment_id: assignment.assignment_id,
          user_id: user.id,
          user_type: userType,
          reason: "غياب",
        };

        const result = await absenceReplacementService.recordAbsence(
          absenceData
        );

        if (result.was_suspended) {
          alert(`تم تعليق ${user.name} تلقائياً بسبب الغياب المتكرر`);
        }

        // إعادة تحميل البيانات
        await loadAssignmentData();

        alert(`تم تسجيل غياب ${user.name} بنجاح`);
      } catch (error) {
        console.error("خطأ في تسجيل الغياب:", error);
        alert("خطأ في تسجيل الغياب: " + error.message);
      }
    }
  };

  const handleAutoReplacement = async (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    if (window.confirm(`هل تريد البحث عن بديل تلقائي لـ ${user.name}؟`)) {
      try {
        const replacementData = {
          assignment_id: assignment.assignment_id,
          user_id: user.id,
          user_type: userType,
        };

        const result = await absenceReplacementService.autoReplace(
          replacementData
        );

        // إعادة تحميل البيانات
        await loadAssignmentData();

        alert(result.message);
      } catch (error) {
        console.error("خطأ في الاستبدال التلقائي:", error);
        alert("خطأ في الاستبدال التلقائي: " + error.message);
      }
    }
  };

  const handleManualReplacement = async (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    try {
      // جلب المتاحين للاستبدال
      setReplacementModal((prev) => ({
        ...prev,
        loading: true,
      }));

      const availableReplacements =
        await absenceReplacementService.getAvailableReplacements({
          assignment_id: assignment.assignment_id,
          user_type: userType,
          date: selectedDate,
          period: selectedPeriod,
        });

      setReplacementModal({
        isOpen: true,
        type: "manual",
        originalUser: user,
        assignment: assignment,
        availableReplacements: availableReplacements,
        loading: false,
      });
    } catch (error) {
      console.error("خطأ في جلب المتاحين للاستبدال:", error);
      alert("خطأ في جلب المتاحين للاستبدال: " + error.message);
      setReplacementModal((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  const confirmManualReplacement = async (replacement) => {
    const { assignment, originalUser } = replacementModal;
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";

    try {
      const replacementData = {
        assignment_id: assignment.assignment_id,
        original_user_id: originalUser.id,
        replacement_user_id: replacement.id,
        user_type: userType,
        reason: "استبدال يدوي",
      };

      const result = await absenceReplacementService.manualReplace(
        replacementData
      );

      // إغلاق النافذة المنبثقة
      setReplacementModal({
        isOpen: false,
        type: null,
        originalUser: null,
        assignment: null,
        availableReplacements: [],
        loading: false,
      });

      // إعادة تحميل البيانات
      await loadAssignmentData();

      alert(result.message);
    } catch (error) {
      console.error("خطأ في الاستبدال اليدوي:", error);
      alert("خطأ في الاستبدال اليدوي: " + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const statusText = absenceReplacementService.translateUserStatus(status);
    const statusClass = `status-${status}`;

    return <span className={`status-badge ${statusClass}`}>{statusText}</span>;
  };

  const formatDateForDisplay = (dateString) => {
    return absenceReplacementService.formatDateForDisplay(dateString);
  };

  const getCurrentData = () => {
    if (!assignmentData) return [];
    return activeTab === "supervisors"
      ? assignmentData.supervisors
      : assignmentData.observers;
  };

  const currentData = getCurrentData();

  // حساب الإحصائيات
  const statistics = assignmentData
    ? absenceReplacementService.calculateAbsenceStatistics(
        assignmentData.supervisors,
        assignmentData.observers
      )
    : null;

  return (
    <div className="absence-replacement-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="absences" />

      <div className="absence-replacement-main">
        <Header
          title="إدارة الغياب والاستبدال"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="absence-replacement-content">
          {/* رسالة الخطأ */}
          {error && <div className="error-message general-error">{error}</div>}

          {/* Controls Section */}
          <div className="absence-replacement-controls">
            <div className="date-period-controls">
              <div className="form-group">
                <label>التاريخ:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>الفترة:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="morning">صباحية</option>
                  <option value="evening">مسائية</option>
                </select>
              </div>
            </div>

            <div className="date-display">
              {formatDateForDisplay(selectedDate)} - الفترة{" "}
              {absenceReplacementService.translatePeriod(selectedPeriod)}
            </div>

            {/* عرض الإحصائيات */}
            {statistics && (
              <div className="statistics-display">
                <span>الحضور: {statistics.attendanceRate}%</span>
                <span>الغياب: {statistics.absentRate}%</span>
                <span>المجموع: {statistics.totalUsers}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="tabs-container">
            <div className="tabs-header">
              <button
                onClick={() => setActiveTab("supervisors")}
                className={`tab-button ${
                  activeTab === "supervisors" ? "active" : ""
                }`}
              >
                إدارة المشرفين
                {assignmentData && (
                  <span className="tab-count">
                    ({assignmentData.supervisors.length})
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("observers")}
                className={`tab-button ${
                  activeTab === "observers" ? "active" : ""
                }`}
              >
                إدارة الملاحظين
                {assignmentData && (
                  <span className="tab-count">
                    ({assignmentData.observers.length})
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="tab-content">
              {isLoading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  جاري تحميل البيانات...
                </div>
              ) : currentData.length === 0 ? (
                <div className="no-data">
                  لا توجد بيانات توزيع لهذا التاريخ والفترة
                </div>
              ) : (
                <div className="table-container">
                  <table className="assignments-table">
                    <thead>
                      <tr>
                        <th>القاعة</th>
                        <th>المبنى</th>
                        <th>
                          {activeTab === "supervisors" ? "المشرف" : "الملاحظ"}
                        </th>
                        <th>الرتبة</th>
                        <th>رقم الهاتف</th>
                        <th>أيام الغياب</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentData.map((assignment) => {
                        const userType =
                          activeTab === "supervisors"
                            ? "supervisor"
                            : "observer";
                        const user = assignment[userType];

                        return (
                          <tr
                            key={assignment.id}
                            className={
                              assignment.status === "absent" ? "absent-row" : ""
                            }
                          >
                            <td>
                              <div className="hall-info">
                                <strong>{assignment.hallName}</strong>
                                <div className="hall-floor">
                                  {assignment.floor}
                                </div>
                              </div>
                            </td>
                            <td>{assignment.building}</td>
                            <td>
                              <div className="user-info">
                                <div>{user.name}</div>
                                {assignment.replacementInfo && (
                                  <div className="replacement-info">
                                    (بدلاً من:{" "}
                                    {
                                      assignment.replacementInfo
                                        .replacement_name
                                    }
                                    )
                                    <br />
                                    <small>
                                      نوع الاستبدال:{" "}
                                      {assignment.replacementInfo.type}
                                    </small>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              {absenceReplacementService.translateUserRank(
                                user.rank
                              )}
                            </td>
                            <td className="phone-number">{user.phone}</td>
                            <td>
                              <div className="absence-info">
                                <span
                                  className={
                                    user.consecutiveAbsences >= 2
                                      ? "high-absences"
                                      : ""
                                  }
                                >
                                  {user.consecutiveAbsences}
                                </span>
                                {user.status === "suspended" && (
                                  <div className="suspended-label">
                                    معلق تلقائياً
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{getStatusBadge(assignment.status)}</td>
                            <td>
                              <div className="action-buttons">
                                {assignment.status !== "absent" && (
                                  <button
                                    onClick={() => handleAbsent(assignment)}
                                    className="btn btn-absent"
                                    title="تغييب"
                                  >
                                    تغييب
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    handleAutoReplacement(assignment)
                                  }
                                  className="btn btn-auto-replace"
                                  title="استبدال تلقائي"
                                >
                                  استبدال تلقائي
                                </button>

                                <button
                                  onClick={() =>
                                    handleManualReplacement(assignment)
                                  }
                                  className="btn btn-manual-replace"
                                  title="استبدال يدوي"
                                  disabled={replacementModal.loading}
                                >
                                  {replacementModal.loading
                                    ? "جاري التحميل..."
                                    : "استبدال يدوي"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Manual Replacement */}
      {replacementModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>اختيار البديل لـ {replacementModal.originalUser?.name}</h3>
              <button
                onClick={() =>
                  setReplacementModal({
                    isOpen: false,
                    type: null,
                    originalUser: null,
                    assignment: null,
                    availableReplacements: [],
                    loading: false,
                  })
                }
                className="close-btn"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {replacementModal.loading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  جاري البحث عن بدائل متاحة...
                </div>
              ) : replacementModal.availableReplacements.length === 0 ? (
                <div className="no-replacements">
                  لا يوجد مستخدمون متاحون للاستبدال
                  <br />
                  <small>
                    تأكد من وجود مستخدمين نشطين من نفس النوع وغير معينين في نفس
                    الفترة
                  </small>
                </div>
              ) : (
                <div className="replacements-list">
                  {replacementModal.availableReplacements.map((replacement) => (
                    <div key={replacement.id} className="replacement-item">
                      <div className="replacement-info">
                        <div className="replacement-name">
                          {replacement.name}
                        </div>
                        <div className="replacement-details">
                          <span>
                            النوع:{" "}
                            {absenceReplacementService.translateUserType(
                              replacement.type
                            )}
                          </span>
                          <span>
                            الرتبة:{" "}
                            {absenceReplacementService.translateUserRank(
                              replacement.rank
                            )}
                          </span>
                          <span>التخصص: {replacement.specialization}</span>
                          <span>الهاتف: {replacement.phone}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => confirmManualReplacement(replacement)}
                        className="btn btn-select"
                      >
                        اختيار
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AbsenceReplacementManagement;
