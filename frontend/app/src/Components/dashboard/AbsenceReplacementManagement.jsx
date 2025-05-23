import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./AbsenceReplacementManagement.css";

const AbsenceReplacementManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPeriod, setSelectedPeriod] = useState("morning");
  const [activeTab, setActiveTab] = useState("supervisors"); // 'supervisors' or 'observers'
  const [assignmentData, setAssignmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [replacementModal, setReplacementModal] = useState({
    isOpen: false,
    type: null, // 'auto', 'manual'
    originalUser: null,
    availableReplacements: [],
  });

  // بيانات وهمية للتوزيع
  const [dummyAssignments] = useState({
    supervisors: [
      {
        id: 1,
        hallName: "قاعة 101",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        supervisor: {
          id: 1,
          name: "د. أحمد محمد علي",
          type: "supervisor",
          rank: "college_employee",
          phone: "773123456",
          consecutiveAbsences: 0,
        },
        status: "assigned",
      },
      {
        id: 2,
        hallName: "قاعة 102",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        supervisor: {
          id: 2,
          name: "د. خالد عبدالله سعيد",
          type: "supervisor",
          rank: "college_employee",
          phone: "774567890",
          consecutiveAbsences: 1,
        },
        status: "assigned",
      },
      {
        id: 3,
        hallName: "قاعة 201",
        building: "مبنى الكهرباء",
        floor: "الدور الثاني",
        supervisor: {
          id: 3,
          name: "م. محمد سعيد ناصر",
          type: "supervisor",
          rank: "external_employee",
          phone: "776789012",
          consecutiveAbsences: 0,
        },
        status: "assigned",
      },
      {
        id: 4,
        hallName: "قاعة 301",
        building: "مبنى الكهرباء",
        floor: "الدور الثالث",
        supervisor: {
          id: 4,
          name: "م. عمر خالد محمد",
          type: "supervisor",
          rank: "external_employee",
          phone: "778901234",
          consecutiveAbsences: 2,
        },
        status: "absent",
      },
    ],
    observers: [
      {
        id: 1,
        hallName: "قاعة 101",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        observer: {
          id: 5,
          name: "أ. فاطمة أحمد حسن",
          type: "observer",
          rank: "college_employee",
          phone: "775678901",
          consecutiveAbsences: 0,
        },
        status: "assigned",
      },
      {
        id: 2,
        hallName: "قاعة 101",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        observer: {
          id: 6,
          name: "أ. سارة محمد قاسم",
          type: "observer",
          rank: "college_employee",
          phone: "777890123",
          consecutiveAbsences: 1,
        },
        status: "assigned",
      },
      {
        id: 3,
        hallName: "قاعة 102",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        observer: {
          id: 7,
          name: "أ. نور علي أحمد",
          type: "observer",
          rank: "external_employee",
          phone: "779012345",
          consecutiveAbsences: 0,
        },
        status: "assigned",
      },
      {
        id: 4,
        hallName: "قاعة 102",
        building: "مبنى الكهرباء",
        floor: "الدور الأول",
        observer: {
          id: 8,
          name: "أ. زينب محمد علي",
          type: "observer",
          rank: "external_employee",
          phone: "770123456",
          consecutiveAbsences: 2,
        },
        status: "absent",
      },
    ],
  });

  // بيانات المشرفين والملاحظين المتاحين للاستبدال
  const [availableUsers] = useState({
    supervisors: [
      {
        id: 9,
        name: "د. صالح محمد علي",
        type: "supervisor",
        rank: "college_employee",
        phone: "771111111",
        isAvailable: true,
      },
      {
        id: 10,
        name: "م. حسام أحمد قاسم",
        type: "supervisor",
        rank: "external_employee",
        phone: "772222222",
        isAvailable: true,
      },
    ],
    observers: [
      {
        id: 11,
        name: "أ. منى عبدالله حسن",
        type: "observer",
        rank: "college_employee",
        phone: "773333333",
        isAvailable: true,
      },
      {
        id: 12,
        name: "أ. ريم سعيد ناصر",
        type: "observer",
        rank: "external_employee",
        phone: "774444444",
        isAvailable: true,
      },
    ],
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    loadAssignmentData();
  }, [selectedDate, selectedPeriod]);

  const loadAssignmentData = () => {
    setIsLoading(true);

    setTimeout(() => {
      setAssignmentData(dummyAssignments);
      setIsLoading(false);
    }, 1000);
  };

  const handleRefresh = () => {
    loadAssignmentData();
  };

  const handleAbsent = (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    if (window.confirm(`هل أنت متأكد من تغييب ${user.name}؟`)) {
      const updatedData = { ...assignmentData };
      const targetArray = updatedData[activeTab];
      const targetIndex = targetArray.findIndex((a) => a.id === assignment.id);

      if (targetIndex !== -1) {
        targetArray[targetIndex].status = "absent";
        targetArray[targetIndex][userType].consecutiveAbsences += 1;

        if (targetArray[targetIndex][userType].consecutiveAbsences >= 2) {
          targetArray[targetIndex][userType].status = "suspended";
          alert(`تم تعليق ${user.name} تلقائياً بسبب الغياب المتكرر`);
        }

        setAssignmentData(updatedData);
      }
    }
  };

  const handleAutoReplacement = (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    const availableReplacements = availableUsers[activeTab].filter(
      (u) => u.isAvailable && u.rank === user.rank
    );

    if (availableReplacements.length === 0) {
      alert("لا يوجد مستخدمون متاحون للاستبدال التلقائي");
      return;
    }

    const replacement = availableReplacements[0];

    if (
      window.confirm(
        `هل تريد استبدال ${user.name} بـ ${replacement.name} تلقائياً؟`
      )
    ) {
      const updatedData = { ...assignmentData };
      const targetArray = updatedData[activeTab];
      const targetIndex = targetArray.findIndex((a) => a.id === assignment.id);

      if (targetIndex !== -1) {
        targetArray[targetIndex][userType] = {
          ...replacement,
          consecutiveAbsences: 0,
        };
        targetArray[targetIndex].status = "replaced";
        targetArray[targetIndex].replacementType = "automatic";
        targetArray[targetIndex].originalUser = user;

        setAssignmentData(updatedData);
        alert(`تم استبدال ${user.name} بـ ${replacement.name} بنجاح`);
      }
    }
  };

  const handleManualReplacement = (assignment) => {
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";
    const user = assignment[userType];

    setReplacementModal({
      isOpen: true,
      type: "manual",
      originalUser: user,
      assignment: assignment,
      availableReplacements: availableUsers[activeTab].filter(
        (u) => u.isAvailable
      ),
    });
  };

  const confirmManualReplacement = (replacement) => {
    const { assignment, originalUser } = replacementModal;
    const userType = activeTab === "supervisors" ? "supervisor" : "observer";

    const updatedData = { ...assignmentData };
    const targetArray = updatedData[activeTab];
    const targetIndex = targetArray.findIndex((a) => a.id === assignment.id);

    if (targetIndex !== -1) {
      targetArray[targetIndex][userType] = {
        ...replacement,
        consecutiveAbsences: 0,
      };
      targetArray[targetIndex].status = "replaced";
      targetArray[targetIndex].replacementType = "manual";
      targetArray[targetIndex].originalUser = originalUser;

      setAssignmentData(updatedData);
      setReplacementModal({
        isOpen: false,
        type: null,
        originalUser: null,
        availableReplacements: [],
      });
      alert(`تم استبدال ${originalUser.name} بـ ${replacement.name} بنجاح`);
    }
  };

  const getStatusBadge = (assignment) => {
    switch (assignment.status) {
      case "assigned":
        return <span className="status-badge status-assigned">معين</span>;
      case "absent":
        return <span className="status-badge status-absent">غائب</span>;
      case "replaced":
        return <span className="status-badge status-replaced">مستبدل</span>;
      default:
        return <span className="status-badge">{assignment.status}</span>;
    }
  };

  const formatDateForDisplay = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="absence-replacement-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="absences" />

      <div className="absence-replacement-main">
        <Header title="إدارة الغياب والاستبدال" onRefresh={handleRefresh} />

        <div className="absence-replacement-content">
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
              {selectedPeriod === "morning" ? "الصباحية" : "المسائية"}
            </div>
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
              </button>
              <button
                onClick={() => setActiveTab("observers")}
                className={`tab-button ${
                  activeTab === "observers" ? "active" : ""
                }`}
              >
                إدارة الملاحظين
              </button>
            </div>

            {/* Content */}
            <div className="tab-content">
              {isLoading ? (
                <div className="loading-indicator">جاري تحميل البيانات...</div>
              ) : assignmentData && assignmentData[activeTab] ? (
                <div className="table-container">
                  <table className="assignments-table">
                    <thead>
                      <tr>
                        <th>القاعة</th>
                        <th>المبنى</th>
                        <th>
                          {activeTab === "supervisors" ? "المشرف" : "الملاحظ"}
                        </th>
                        <th>رقم الهاتف</th>
                        <th>أيام الغياب</th>
                        <th>الحالة</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentData[activeTab].map((assignment) => {
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
                                {assignment.originalUser && (
                                  <div className="replacement-info">
                                    (بدلاً من: {assignment.originalUser.name})
                                  </div>
                                )}
                              </div>
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
                                {user.consecutiveAbsences >= 2 && (
                                  <div className="suspended-label">
                                    معلق تلقائياً
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>{getStatusBadge(assignment)}</td>
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
                                >
                                  استبدال يدوي
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="no-data">لا توجد بيانات توزيع لهذا التاريخ</div>
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
                    availableReplacements: [],
                  })
                }
                className="close-btn"
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              {replacementModal.availableReplacements.length === 0 ? (
                <div className="no-replacements">
                  لا يوجد مستخدمون متاحون للاستبدال
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
                            الرتبة:{" "}
                            {replacement.rank === "college_employee"
                              ? "موظف كلية"
                              : "موظف خارجي"}
                          </span>
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
