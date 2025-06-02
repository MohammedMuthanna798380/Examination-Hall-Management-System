// frontend/app/src/Components/dashboard/PreviousAssignments.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import dailyAssignmentService from "../../services/dailyAssignmentService";
import "./DailyAssignment.css";

const PreviousAssignments = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  // حالة البيانات
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // حالة الفلاتر
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    period: "all",
    status: "all",
    search_text: "",
  });

  // حالة التصفيف (pagination)
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
    from: 1,
    to: 10,
  });

  // حالة العرض
  const [viewMode, setViewMode] = useState("list"); // list, cards
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // حالة البحث
  const [searchType, setSearchType] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // حالة التصدير
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    fetchPreviousAssignments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [assignments, filters]);

  // جلب التوزيعات السابقة
  const fetchPreviousAssignments = async (page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const queryFilters = {
        page: page,
        per_page: pagination.per_page,
        ...filters,
      };

      const response = await dailyAssignmentService.getPreviousAssignments(
        queryFilters
      );

      setAssignments(response.assignments || []);
      setPagination(
        response.pagination || {
          current_page: 1,
          per_page: 10,
          total: 0,
          last_page: 1,
          from: 1,
          to: 0,
        }
      );

      console.log(`تم جلب ${response.assignments?.length || 0} توزيع سابق`);
    } catch (error) {
      console.error("خطأ في جلب التوزيعات السابقة:", error);
      setError(error.message || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    let filtered = [...assignments];

    // تطبيق البحث النصي
    if (filters.search_text.trim()) {
      const searchTerm = filters.search_text.toLowerCase();
      filtered = filtered.filter((assignment) => {
        const searchableText = `
          ${assignment.date} 
          ${assignment.period_arabic} 
          ${
            assignment.rooms
              ?.map(
                (r) =>
                  `${r.room_name} ${r.supervisor?.name || ""} ${
                    r.observers?.map((o) => o.name).join(" ") || ""
                  }`
              )
              .join(" ") || ""
          }
        `.toLowerCase();

        return searchableText.includes(searchTerm);
      });
    }

    setFilteredAssignments(filtered);
  };

  // تغيير الفلاتر
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // تطبيق الفلاتر وإعادة جلب البيانات
  const applyFiltersAndRefetch = async () => {
    setPagination((prev) => ({ ...prev, current_page: 1 }));
    await fetchPreviousAssignments(1);
  };

  // البحث في التوزيعات
  const performSearch = async () => {
    if (!filters.search_text.trim()) return;

    setIsSearching(true);
    try {
      const results = await dailyAssignmentService.searchAssignments(
        filters.search_text,
        searchType
      );
      setSearchResults(results);
    } catch (error) {
      console.error("خطأ في البحث:", error);
      setError(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  // عرض تفاصيل توزيع محدد
  const showAssignmentDetails = async (assignment) => {
    try {
      setIsLoading(true);
      const details = await dailyAssignmentService.getAssignmentDetails(
        assignment.date,
        assignment.period
      );
      setSelectedAssignment(details);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("خطأ في جلب تفاصيل التوزيع:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // تصدير التوزيعات
  const exportAssignments = async (format = "pdf") => {
    try {
      setIsExporting(true);
      await dailyAssignmentService.exportPreviousAssignments(filters, format);
      alert(`تم طلب تصدير التوزيعات بصيغة ${format.toUpperCase()}`);
    } catch (error) {
      console.error("خطأ في التصدير:", error);
      alert("فشل في تصدير التوزيعات: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  // تحديث البيانات
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPreviousAssignments(pagination.current_page);
    setIsRefreshing(false);
  };

  // تغيير الصفحة
  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.last_page &&
      newPage !== pagination.current_page
    ) {
      fetchPreviousAssignments(newPage);
    }
  };

  // تنسيق التاريخ للعرض
  const formatDateForDisplay = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("ar-EG", options);
  };

  // تحديد لون حالة التوزيع
  const getStatusColor = (successRate) => {
    if (successRate >= 100) return "success";
    if (successRate > 0) return "warning";
    return "danger";
  };

  // تحديد نص حالة التوزيع
  const getStatusText = (successRate) => {
    if (successRate >= 100) return "مكتمل";
    if (successRate > 0) return "جزئي";
    return "غير مكتمل";
  };

  // مسح الفلاتر
  const clearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      period: "all",
      status: "all",
      search_text: "",
    });
  };

  // نسخ التوزيع كقالب
  const copyAsTemplate = (assignment) => {
    navigate("/assignments", {
      state: {
        template: assignment,
        date: assignment.date,
        period: assignment.period,
      },
    });
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className="daily-assignment-container">
        <Sidebar
          userName={userName}
          onLogout={onLogout}
          activePage="assignments"
        />
        <div className="daily-assignment-main">
          <Header
            title="التوزيعات السابقة"
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>جاري تحميل التوزيعات السابقة...</p>
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
          title="التوزيعات السابقة"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="daily-assignment-content">
          {error && <div className="error-message general-error">{error}</div>}

          {/* أدوات التحكم والفلاتر */}
          <div className="assignment-header">
            <h2 style={{ margin: "0 0 20px 0", color: "#2c3e50" }}>
              التوزيعات السابقة للمشرفين والملاحظين
            </h2>

            <div className="assignment-controls">
              <div className="date-period-selector">
                <div className="form-group">
                  <label>من تاريخ:</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      handleFilterChange("start_date", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>إلى تاريخ:</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      handleFilterChange("end_date", e.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label>الفترة:</label>
                  <select
                    value={filters.period}
                    onChange={(e) =>
                      handleFilterChange("period", e.target.value)
                    }
                  >
                    <option value="all">الكل</option>
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>الحالة:</label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <option value="all">الكل</option>
                    <option value="complete">مكتمل</option>
                    <option value="partial">جزئي</option>
                    <option value="incomplete">غير مكتمل</option>
                  </select>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={applyFiltersAndRefetch}
                  disabled={isLoading}
                >
                  🔍 تطبيق الفلاتر
                </button>

                <button className="btn btn-warning" onClick={clearFilters}>
                  🗑️ مسح الفلاتر
                </button>

                <button
                  className="btn btn-success"
                  onClick={() => exportAssignments("pdf")}
                  disabled={isExporting}
                >
                  📄 تصدير PDF
                </button>

                <button
                  className="btn btn-warning"
                  onClick={() => exportAssignments("excel")}
                  disabled={isExporting}
                >
                  📊 تصدير Excel
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={() => navigate("/assignments")}
                >
                  ➕ توزيع جديد
                </button>
              </div>
            </div>

            {/* شريط البحث */}
            <div
              className="search-controls"
              style={{
                marginTop: "15px",
                display: "flex",
                gap: "10px",
                alignItems: "end",
              }}
            >
              <div className="form-group" style={{ flex: "1" }}>
                <label>البحث:</label>
                <input
                  type="text"
                  placeholder="ابحث في التوزيعات..."
                  value={filters.search_text}
                  onChange={(e) =>
                    handleFilterChange("search_text", e.target.value)
                  }
                  onKeyPress={(e) => e.key === "Enter" && performSearch()}
                />
              </div>

              <div className="form-group">
                <label>نوع البحث:</label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="user_name">اسم المستخدم</option>
                  <option value="room_name">اسم القاعة</option>
                  <option value="date">التاريخ</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                onClick={performSearch}
                disabled={isSearching || !filters.search_text.trim()}
              >
                {isSearching ? "جاري البحث..." : "🔍 بحث"}
              </button>
            </div>
          </div>

          {/* الإحصائيات السريعة */}
          <div className="statistics">
            <div className="stat-card">
              <p className="stat-number">{filteredAssignments.length}</p>
              <p className="stat-label">إجمالي التوزيعات</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {
                  filteredAssignments.filter(
                    (a) => a.statistics?.success_rate >= 100
                  ).length
                }
              </p>
              <p className="stat-label">توزيعات مكتملة</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {filteredAssignments.reduce(
                  (sum, a) => sum + (a.statistics?.total_rooms || 0),
                  0
                )}
              </p>
              <p className="stat-label">إجمالي القاعات</p>
            </div>
            <div className="stat-card">
              <p className="stat-number">
                {filteredAssignments.length > 0
                  ? Math.round(
                      filteredAssignments.reduce(
                        (sum, a) => sum + (a.statistics?.success_rate || 0),
                        0
                      ) / filteredAssignments.length
                    )
                  : 0}
                %
              </p>
              <p className="stat-label">متوسط معدل النجاح</p>
            </div>
          </div>

          {/* أدوات التحكم في العرض */}
          <div className="assignment-result">
            <div className="result-header">
              <h3 style={{ margin: 0 }}>
                التوزيعات السابقة ({filteredAssignments.length} توزيع)
              </h3>
              <div className="view-controls">
                <button
                  className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                  onClick={() => setViewMode("list")}
                  title="عرض قائمة"
                >
                  📋
                </button>
                <button
                  className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
                  onClick={() => setViewMode("cards")}
                  title="عرض بطاقات"
                >
                  🔲
                </button>
              </div>
            </div>

            {/* عرض النتائج */}
            {filteredAssignments.length === 0 ? (
              <div className="no-results">
                {isLoading
                  ? "جاري التحميل..."
                  : "لا توجد توزيعات تطابق معايير البحث"}
              </div>
            ) : viewMode === "list" ? (
              <table className="assignment-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الفترة</th>
                    <th>عدد القاعات</th>
                    <th>المشرفين</th>
                    <th>الملاحظين</th>
                    <th>معدل النجاح</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssignments.map((assignment, index) => (
                    <tr key={`${assignment.date}_${assignment.period}`}>
                      <td>
                        <div>
                          <strong>
                            {formatDateForDisplay(assignment.date)}
                          </strong>
                          <br />
                          <small style={{ color: "#666" }}>
                            {assignment.date}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`period-badge ${assignment.period}`}>
                          {assignment.period_arabic}
                        </span>
                      </td>
                      <td>{assignment.statistics?.total_rooms || 0}</td>
                      <td>
                        <span className="count-display">
                          {assignment.statistics?.total_supervisors || 0} /{" "}
                          {assignment.statistics?.required_supervisors || 0}
                        </span>
                      </td>
                      <td>
                        <span className="count-display">
                          {assignment.statistics?.total_observers || 0} /{" "}
                          {assignment.statistics?.required_observers || 0}
                        </span>
                      </td>
                      <td>
                        <div className="progress-container">
                          <div
                            className={`progress-bar ${getStatusColor(
                              assignment.statistics?.success_rate || 0
                            )}`}
                            style={{
                              width: `${
                                assignment.statistics?.success_rate || 0
                              }%`,
                            }}
                          ></div>
                          <span className="progress-text">
                            {assignment.statistics?.success_rate || 0}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge status-${getStatusColor(
                            assignment.statistics?.success_rate || 0
                          )}`}
                        >
                          {getStatusText(
                            assignment.statistics?.success_rate || 0
                          )}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => showAssignmentDetails(assignment)}
                            title="عرض التفاصيل"
                          >
                            👁️ تفاصيل
                          </button>
                          <button
                            className="btn btn-warning btn-small"
                            onClick={() => copyAsTemplate(assignment)}
                            title="استخدام كقالب"
                          >
                            📋 نسخ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="assignments-cards-grid">
                {filteredAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={`${assignment.date}_${assignment.period}`}
                    assignment={assignment}
                    onShowDetails={showAssignmentDetails}
                    onCopyAsTemplate={copyAsTemplate}
                    formatDateForDisplay={formatDateForDisplay}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                  />
                ))}
              </div>
            )}

            {/* التصفيف (Pagination) */}
            {pagination.last_page > 1 && (
              <PaginationControls
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </div>
      </div>

      {/* نافذة تفاصيل التوزيع */}
      {showDetailsModal && selectedAssignment && (
        <AssignmentDetailsModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAssignment(null);
          }}
        />
      )}
    </div>
  );
};

// مكون بطاقة التوزيع
const AssignmentCard = ({
  assignment,
  onShowDetails,
  onCopyAsTemplate,
  formatDateForDisplay,
  getStatusColor,
  getStatusText,
}) => {
  return (
    <div className="assignment-card">
      <div className="card-header">
        <div className="assignment-date">
          <h4>{formatDateForDisplay(assignment.date)}</h4>
          <span className={`period-badge ${assignment.period}`}>
            {assignment.period_arabic}
          </span>
        </div>
        <div className="assignment-status">
          <span
            className={`status-badge status-${getStatusColor(
              assignment.statistics?.success_rate || 0
            )}`}
          >
            {getStatusText(assignment.statistics?.success_rate || 0)}
          </span>
        </div>
      </div>

      <div className="card-content">
        <div className="assignment-stats">
          <div className="stat-item">
            <label>القاعات:</label>
            <span>{assignment.statistics?.total_rooms || 0}</span>
          </div>
          <div className="stat-item">
            <label>المشرفين:</label>
            <span>
              {assignment.statistics?.total_supervisors || 0}/
              {assignment.statistics?.required_supervisors || 0}
            </span>
          </div>
          <div className="stat-item">
            <label>الملاحظين:</label>
            <span>
              {assignment.statistics?.total_observers || 0}/
              {assignment.statistics?.required_observers || 0}
            </span>
          </div>
          <div className="stat-item">
            <label>معدل النجاح:</label>
            <span
              className={`success-rate ${getStatusColor(
                assignment.statistics?.success_rate || 0
              )}`}
            >
              {assignment.statistics?.success_rate || 0}%
            </span>
          </div>
        </div>

        <div className="rooms-preview">
          <h5>القاعات ({assignment.rooms?.length || 0}):</h5>
          <div className="rooms-list">
            {assignment.rooms?.slice(0, 3).map((room) => (
              <span key={room.room_id} className="room-chip">
                {room.room_name}
              </span>
            )) || []}
            {(assignment.rooms?.length || 0) > 3 && (
              <span className="room-chip more">
                +{assignment.rooms.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button
          className="btn btn-primary btn-small"
          onClick={() => onShowDetails(assignment)}
        >
          عرض التفاصيل
        </button>
        <button
          className="btn btn-warning btn-small"
          onClick={() => onCopyAsTemplate(assignment)}
        >
          استخدام كقالب
        </button>
      </div>
    </div>
  );
};

// مكون أدوات التصفيف
const PaginationControls = ({ pagination, onPageChange }) => {
  const { current_page, last_page, from, to, total } = pagination;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        عرض {from} إلى {to} من أصل {total} توزيع
      </div>
      <div className="pagination-controls">
        <button
          className="btn btn-secondary btn-small"
          onClick={() => onPageChange(1)}
          disabled={current_page === 1}
        >
          الأولى
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page === 1}
        >
          السابقة
        </button>

        <span className="page-info">
          صفحة {current_page} من {last_page}
        </span>

        <button
          className="btn btn-secondary btn-small"
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page === last_page}
        >
          التالية
        </button>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => onPageChange(last_page)}
          disabled={current_page === last_page}
        >
          الأخيرة
        </button>
      </div>
    </div>
  );
};

// مكون نافذة تفاصيل التوزيع
const AssignmentDetailsModal = ({ assignment, onClose }) => {
  const formatDateForDisplay = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("ar-EG", options);
  };

  const translateUserRank = (rank) => {
    return rank === "college_employee" ? "موظف كلية" : "موظف خارجي";
  };

  const translateStatus = (status) => {
    switch (status) {
      case "complete":
        return "مكتمل";
      case "partial":
        return "جزئي";
      case "incomplete":
        return "غير مكتمل";
      default:
        return status;
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: "90%",
          width: "1000px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div className="modal-header">
          <h2>
            تفاصيل التوزيع - {formatDateForDisplay(assignment.date)} -{" "}
            {assignment.period_arabic}
          </h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body" style={{ padding: "20px" }}>
          {/* إحصائيات التوزيع */}
          <div className="assignment-summary" style={{ marginBottom: "30px" }}>
            <h3>ملخص التوزيع</h3>
            <div
              className="statistics"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "15px",
              }}
            >
              <div className="stat-card">
                <p className="stat-number">
                  {assignment.statistics?.total_rooms || 0}
                </p>
                <p className="stat-label">إجمالي القاعات</p>
              </div>
              <div className="stat-card">
                <p className="stat-number">
                  {assignment.statistics?.supervisor_coverage || 0}%
                </p>
                <p className="stat-label">تغطية المشرفين</p>
              </div>
              <div className="stat-card">
                <p className="stat-number">
                  {assignment.statistics?.observer_coverage || 0}%
                </p>
                <p className="stat-label">تغطية الملاحظين</p>
              </div>
              <div className="stat-card">
                <p className="stat-number">
                  {assignment.statistics?.success_rate || 0}%
                </p>
                <p className="stat-label">معدل النجاح</p>
              </div>
            </div>
          </div>

          {/* تفاصيل التوزيعات */}
          <div className="assignments-details">
            <h3>تفاصيل القاعات والتوزيعات</h3>
            <table className="assignment-table">
              <thead>
                <tr>
                  <th>القاعة</th>
                  <th>المبنى</th>
                  <th>الدور</th>
                  <th>السعة</th>
                  <th>المشرف</th>
                  <th>الملاحظين</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {assignment.assignments?.map((roomAssignment) => (
                  <tr key={roomAssignment.id}>
                    <td>
                      <strong>{roomAssignment.room?.name}</strong>
                    </td>
                    <td>{roomAssignment.room?.building}</td>
                    <td>{roomAssignment.room?.floor}</td>
                    <td>{roomAssignment.room?.capacity}</td>
                    <td>
                      {roomAssignment.supervisor?.missing ? (
                        <span className="missing-staff">غير محدد</span>
                      ) : (
                        <div>
                          <strong>{roomAssignment.supervisor?.name}</strong>
                          <br />
                          <small>
                            (
                            {translateUserRank(roomAssignment.supervisor?.rank)}
                            )
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="observers-list">
                        {roomAssignment.observers?.map((observer, index) => (
                          <div
                            key={index}
                            className={
                              observer.missing
                                ? "missing-staff"
                                : "observer-chip"
                            }
                          >
                            {observer.missing ? (
                              "غير محدد"
                            ) : (
                              <div>
                                <span>{observer.name}</span>
                                <br />
                                <small>
                                  ({translateUserRank(observer.rank)})
                                </small>
                              </div>
                            )}
                          </div>
                        )) || []}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge status-${roomAssignment.status}`}
                      >
                        {translateStatus(roomAssignment.status)}
                      </span>
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>

          {/* سجلات الغياب والاستبدال */}
          {assignment.absence_replacements &&
            assignment.absence_replacements.length > 0 && (
              <div
                className="absence-replacements"
                style={{ marginTop: "30px" }}
              >
                <h3>سجلات الغياب والاستبدال</h3>
                <table className="assignment-table">
                  <thead>
                    <tr>
                      <th>نوع الإجراء</th>
                      <th>المستخدم الأصلي</th>
                      <th>المستخدم البديل</th>
                      <th>القاعة</th>
                      <th>السبب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignment.absence_replacements.map((record, index) => (
                      <tr key={index}>
                        <td>
                          <span className={`action-type ${record.action_type}`}>
                            {record.action_type_arabic}
                          </span>
                        </td>
                        <td>
                          {record.original_user_name}
                          <br />
                          <small>({record.user_type})</small>
                        </td>
                        <td>{record.replacement_user_name}</td>
                        <td>{record.room_name}</td>
                        <td>{record.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* ملخص أداء التوزيع */}
          <div className="performance-summary" style={{ marginTop: "30px" }}>
            <h3>ملخص الأداء</h3>
            <div
              className="performance-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
              }}
            >
              <div className="performance-item">
                <h4>التغطية الإجمالية</h4>
                <div className="progress-bar-container">
                  <div
                    className={`progress-bar ${
                      assignment.statistics?.success_rate >= 100
                        ? "success"
                        : assignment.statistics?.success_rate > 0
                        ? "warning"
                        : "danger"
                    }`}
                    style={{
                      width: `${assignment.statistics?.success_rate || 0}%`,
                    }}
                  ></div>
                  <span>{assignment.statistics?.success_rate || 0}%</span>
                </div>
              </div>

              <div className="performance-item">
                <h4>استخدام الموارد</h4>
                <p>
                  المشرفين: {assignment.statistics?.total_supervisors || 0} /{" "}
                  {assignment.statistics?.required_supervisors || 0}
                </p>
                <p>
                  الملاحظين: {assignment.statistics?.total_observers || 0} /{" "}
                  {assignment.statistics?.required_observers || 0}
                </p>
              </div>

              <div className="performance-item">
                <h4>حالة القاعات</h4>
                <p>مكتمل: {assignment.statistics?.complete_assignments || 0}</p>
                <p>جزئي: {assignment.statistics?.partial_assignments || 0}</p>
                <p>
                  غير مكتمل:{" "}
                  {assignment.statistics?.incomplete_assignments || 0}
                </p>
              </div>
            </div>
          </div>

          {/* ملاحظات إضافية */}
          {assignment.notes && (
            <div className="additional-notes" style={{ marginTop: "30px" }}>
              <h3>ملاحظات إضافية</h3>
              <div
                className="notes-content"
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "15px",
                  borderRadius: "5px",
                  border: "1px solid #dee2e6",
                }}
              >
                <p>{assignment.notes}</p>
              </div>
            </div>
          )}
        </div>

        <div
          className="modal-footer"
          style={{
            padding: "20px",
            borderTop: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => window.print()}>
              🖨️ طباعة
            </button>
            <button
              className="btn btn-success"
              onClick={() => {
                // يمكن إضافة وظيفة تصدير PDF هنا
                alert("سيتم إضافة وظيفة تصدير PDF قريباً");
              }}
            >
              📄 تصدير PDF
            </button>
          </div>

          <button className="btn btn-secondary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousAssignments;
