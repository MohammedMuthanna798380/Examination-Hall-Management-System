import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import examScheduleService from "../../services/examScheduleService";
import "./ExamSchedule.css";

const ExamSchedule = ({ onLogout }) => {
  const navigate = useNavigate();
  const [examSchedules, setExamSchedules] = useState([]);
  const [filteredSchedules, setFilteredSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [selectedView, setSelectedView] = useState("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);
  const [userName, setUserName] = useState("");
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [statistics, setStatistics] = useState({
    total_schedules: 0,
    today_schedules: 0,
    complete_distributions: 0,
    incomplete_distributions: 0,
  });
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    fetchData();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [examSchedules, searchTerm, filterDate, filterPeriod]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // جلب جداول الامتحانات
      const schedulesData = await examScheduleService.getExamSchedules();
      setExamSchedules(schedulesData);

      // جلب القاعات المتاحة
      const roomsData = await examScheduleService.getAvailableRooms();
      setRooms(roomsData.rooms || []);

      // جلب الإحصائيات
      const statsData = await examScheduleService.getStatistics();
      setStatistics(statsData);
    } catch (error) {
      console.error("خطأ في جلب البيانات:", error);
      setError(error.message || "حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...examSchedules];

    if (filterDate) {
      result = result.filter((schedule) => schedule.date === filterDate);
    }

    if (filterPeriod !== "all") {
      result = result.filter((schedule) => schedule.period === filterPeriod);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((schedule) => {
        const roomsMatch =
          schedule.rooms_data &&
          schedule.rooms_data.some(
            (room) =>
              room.name.toLowerCase().includes(term) ||
              room.building_name.toLowerCase().includes(term) ||
              room.floor_name.toLowerCase().includes(term)
          );
        const dateMatch = schedule.date.includes(term);
        return roomsMatch || dateMatch;
      });
    }

    setFilteredSchedules(result);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterDate = (e) => {
    setFilterDate(e.target.value);
  };

  const handleFilterPeriod = (e) => {
    setFilterPeriod(e.target.value);
  };

  const handleAddSchedule = () => {
    setCurrentSchedule(null);
    setSelectedRooms([]);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (schedule) => {
    setCurrentSchedule(schedule);
    setSelectedRooms(schedule.rooms || []);
    setIsModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا الجدول؟")) {
      try {
        await examScheduleService.deleteExamSchedule(scheduleId);
        await fetchData();
      } catch (error) {
        alert("خطأ في حذف الجدول: " + error.message);
      }
    }
  };

  const handleViewDistribution = (schedule) => {
    alert(
      `عرض توزيع الجدول رقم ${schedule.id} بتاريخ ${
        schedule.date
      } فترة ${translatePeriod(schedule.period)}`
    );
  };

  const handleCreateDistribution = (schedule) => {
    alert(
      `إنشاء توزيع للجدول رقم ${schedule.id} بتاريخ ${
        schedule.date
      } فترة ${translatePeriod(schedule.period)}`
    );
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRoomSelection = (roomId) => {
    if (selectedRooms.includes(roomId)) {
      setSelectedRooms(selectedRooms.filter((id) => id !== roomId));
    } else {
      setSelectedRooms([...selectedRooms, roomId]);
    }
  };

  const handleSaveSchedule = async (scheduleData) => {
    if (selectedRooms.length === 0) {
      alert("يرجى اختيار قاعة واحدة على الأقل");
      return;
    }

    try {
      const dataToSend = {
        ...scheduleData,
        rooms: selectedRooms,
      };

      if (currentSchedule) {
        await examScheduleService.updateExamSchedule(
          currentSchedule.id,
          dataToSend
        );
      } else {
        await examScheduleService.createExamSchedule(dataToSend);
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (error) {
      alert("خطأ في حفظ البيانات: " + error.message);
    }
  };

  const translatePeriod = (period) => {
    switch (period) {
      case "morning":
        return "صباحية";
      case "evening":
        return "مسائية";
      default:
        return period;
    }
  };

  const translateDistributionStatus = (status) => {
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

  const getStatusClass = (status) => {
    switch (status) {
      case "complete":
        return "status-complete";
      case "partial":
        return "status-partial";
      case "incomplete":
        return "status-incomplete";
      default:
        return "";
    }
  };

  const formatDateForDisplay = (dateString) => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString("ar-EG", options);
  };

  if (isLoading) {
    return (
      <div className="exam-schedule-container">
        <Sidebar userName={userName} onLogout={onLogout} activePage="exams" />
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-schedule-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="exams" />
      <div className="exam-schedule-main">
        <Header
          title="جدول الامتحانات"
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        <div className="exam-schedule-content">
          {error && <div className="error-message general-error">{error}</div>}

          {/* أدوات التحكم */}
          <div className="exam-schedule-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="بحث بتاريخ الاختبار..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>التاريخ:</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={handleFilterDate}
                />
              </div>

              <div className="view-toggle">
                <button
                  className={`view-btn ${
                    selectedView === "table" ? "active" : ""
                  }`}
                  onClick={() => setSelectedView("table")}
                  title="عرض جدول"
                >
                  📋
                </button>
                <button
                  className={`view-btn ${
                    selectedView === "grid" ? "active" : ""
                  }`}
                  onClick={() => setSelectedView("grid")}
                  title="عرض شبكة"
                >
                  🔲
                </button>
              </div>

              <div className="filter-group">
                <label>الفترة:</label>
                <select value={filterPeriod} onChange={handleFilterPeriod}>
                  <option value="all">الكل</option>
                  <option value="morning">صباحية</option>
                  <option value="evening">مسائية</option>
                </select>
              </div>
            </div>

            <button className="add-schedule-btn" onClick={handleAddSchedule}>
              <span className="add-icon">+</span> إضافة جدول امتحان
            </button>
          </div>

          {/* بطاقات الإحصائيات */}
          <div className="schedules-summary">
            <div className="summary-card">
              <h3>إجمالي الجداول</h3>
              <p className="summary-number">{statistics.total_schedules}</p>
            </div>
            <div className="summary-card">
              <h3>جداول اليوم</h3>
              <p className="summary-number">{statistics.today_schedules}</p>
            </div>
            <div className="summary-card">
              <h3>توزيعات مكتملة</h3>
              <p className="summary-number">
                {statistics.complete_distributions}
              </p>
            </div>
            <div className="summary-card">
              <h3>توزيعات غير مكتملة</h3>
              <p className="summary-number">
                {statistics.incomplete_distributions}
              </p>
            </div>
          </div>

          {/* عرض النتائج */}
          {filteredSchedules.length === 0 ? (
            <div className="no-results">لا توجد نتائج تطابق معايير البحث</div>
          ) : selectedView === "table" ? (
            <div className="schedules-table-container">
              <table className="schedules-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الفترة</th>
                    <th>القاعات</th>
                    <th>عدد القاعات</th>
                    <th>حالة التوزيع</th>
                    <th>تاريخ الإنشاء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{formatDateForDisplay(schedule.date)}</td>
                      <td>{translatePeriod(schedule.period)}</td>
                      <td>
                        <div className="rooms-list">
                          {schedule.rooms_data &&
                            schedule.rooms_data.map((room, index) => (
                              <span key={room.id} className="room-chip">
                                {room.name}
                                {index < schedule.rooms_data.length - 1
                                  ? "، "
                                  : ""}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td>{schedule.rooms ? schedule.rooms.length : 0}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            schedule.distribution_status
                          )}`}
                        >
                          {translateDistributionStatus(
                            schedule.distribution_status
                          )}
                        </span>
                      </td>
                      <td>{schedule.created_at}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn-exam edit-btn"
                            onClick={() => handleEditSchedule(schedule)}
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          {schedule.distribution_status === "incomplete" ? (
                            <button
                              className="action-btn-exam"
                              onClick={() => handleCreateDistribution(schedule)}
                              title="إنشاء توزيع"
                            >
                              📋
                            </button>
                          ) : (
                            <button
                              className="action-btn-exam view-distribution-btn"
                              onClick={() => handleViewDistribution(schedule)}
                              title="عرض التوزيع"
                            >
                              👁️
                            </button>
                          )}

                          <button
                            className="action-btn-exam delete-btn"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="schedules-grid">
              {filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="schedule-card full-width">
                  <div className="schedule-card-header">
                    <div className="schedule-date-info">
                      <h3>
                        {formatDateForDisplay(schedule.date).split("،")[0]}
                      </h3>
                      <span className="period-badge">
                        {translatePeriod(schedule.period)}
                      </span>
                    </div>
                    <div className="schedule-date">
                      <span>
                        {formatDateForDisplay(schedule.date)
                          .split("،")
                          .slice(1)
                          .join("،")
                          .trim()}
                      </span>
                    </div>
                  </div>
                  <div className="schedule-card-body">
                    <div className="schedule-rooms-section">
                      <h4>القاعات المحددة:</h4>
                      <div className="rooms-grid">
                        {schedule.rooms_data &&
                          schedule.rooms_data.map((room) => (
                            <div key={room.id} className="room-item-small">
                              <span className="room-name">{room.name}</span>
                              <span className="room-location">
                                {room.building_name} - {room.floor_name}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="schedule-details-section">
                      <div className="schedule-detail-item">
                        <span className="detail-label">عدد القاعات:</span>
                        <span className="detail-value">
                          {schedule.rooms ? schedule.rooms.length : 0}
                        </span>
                      </div>
                      <div className="schedule-detail-item">
                        <span className="detail-label">حالة التوزيع:</span>
                        <span
                          className={`status-badge ${getStatusClass(
                            schedule.distribution_status
                          )}`}
                        >
                          {translateDistributionStatus(
                            schedule.distribution_status
                          )}
                        </span>
                      </div>
                      <div className="schedule-detail-item">
                        <span className="detail-label">تاريخ الإنشاء:</span>
                        <span className="detail-value">
                          {schedule.created_at}
                        </span>
                      </div>

                      <div className="schedule-actions">
                        <button
                          className="card-action-btn edit-btn"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          تعديل البيانات
                        </button>

                        {schedule.distribution_status === "incomplete" ? (
                          <button
                            className="card-action-btn create-distribution-btn"
                            onClick={() => handleCreateDistribution(schedule)}
                          >
                            إنشاء توزيع
                          </button>
                        ) : (
                          <button
                            className="card-action-btn view-distribution-btn"
                            onClick={() => handleViewDistribution(schedule)}
                          >
                            عرض التوزيع
                          </button>
                        )}

                        <button
                          className="card-action-btn delete-btn"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          حذف الجدول
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <ScheduleFormModal
          schedule={currentSchedule}
          rooms={rooms}
          selectedRooms={selectedRooms}
          onRoomSelection={handleRoomSelection}
          onClose={handleCloseModal}
          onSave={handleSaveSchedule}
        />
      )}
    </div>
  );
};

// Modal Component
const ScheduleFormModal = ({
  schedule,
  rooms,
  selectedRooms,
  onRoomSelection,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    date: schedule ? schedule.date : new Date().toISOString().split("T")[0],
    period: schedule ? schedule.period : "morning",
  });

  const [errors, setErrors] = useState({});
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const buildings = [...new Set(rooms.map((room) => room.building_name))];

  const getFloors = () => {
    if (filterBuilding === "all") {
      return [...new Set(rooms.map((room) => room.floor_name))];
    }
    return [
      ...new Set(
        rooms
          .filter((room) => room.building_name === filterBuilding)
          .map((room) => room.floor_name)
      ),
    ];
  };

  const floors = getFloors();

  const getFilteredRooms = () => {
    return rooms.filter((room) => {
      if (room.status !== "available") return false;
      if (filterBuilding !== "all" && room.building_name !== filterBuilding)
        return false;
      if (filterFloor !== "all" && room.floor_name !== filterFloor)
        return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          room.name.toLowerCase().includes(term) ||
          room.building_name.toLowerCase().includes(term) ||
          room.floor_name.toLowerCase().includes(term)
        );
      }
      return true;
    });
  };

  const filteredRooms = getFilteredRooms();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleBuildingFilter = (e) => {
    setFilterBuilding(e.target.value);
    setFilterFloor("all");
  };

  const handleFloorFilter = (e) => {
    setFilterFloor(e.target.value);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) {
      newErrors.date = "التاريخ مطلوب";
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(formData);
  };

  const selectAllRooms = () => {
    const availableRoomIds = rooms
      .filter((room) => room.status === "available")
      .map((room) => room.id);
    availableRoomIds.forEach((roomId) => {
      if (!selectedRooms.includes(roomId)) {
        onRoomSelection(roomId);
      }
    });
  };

  const selectFilteredRooms = () => {
    const filteredRoomIds = filteredRooms.map((room) => room.id);
    filteredRoomIds.forEach((roomId) => {
      if (!selectedRooms.includes(roomId)) {
        onRoomSelection(roomId);
      }
    });
  };

  const clearRoomSelection = () => {
    selectedRooms.forEach((roomId) => onRoomSelection(roomId));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content schedule-modal">
        <div className="modal-header">
          <h2>{schedule ? "تعديل جدول امتحان" : "إضافة جدول امتحان جديد"}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="schedule-form">
          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">التاريخ</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? "error" : ""}
              />
              {errors.date && (
                <span className="error-message">{errors.date}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="period">الفترة</label>
              <select
                id="period"
                name="period"
                value={formData.period}
                onChange={handleChange}
              >
                <option value="morning">صباحية</option>
                <option value="evening">مسائية</option>
              </select>
            </div>
          </div>

          <div className="rooms-selection-container">
            <div className="rooms-selection-header">
              <h3>اختيار القاعات</h3>
              <div className="selection-actions">
                <button
                  type="button"
                  className="select-all-btn"
                  onClick={selectAllRooms}
                >
                  اختيار الكل
                </button>
                <button
                  type="button"
                  className="select-filtered-btn"
                  onClick={selectFilteredRooms}
                >
                  اختيار الظاهر
                </button>
                <button
                  type="button"
                  className="clear-selection-btn"
                  onClick={clearRoomSelection}
                >
                  مسح الاختيار
                </button>
              </div>
            </div>

            <div className="rooms-filter-controls">
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="بحث عن قاعة..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <span className="search-icon">🔍</span>
              </div>

              <div className="filter-group">
                <label>المبنى:</label>
                <select value={filterBuilding} onChange={handleBuildingFilter}>
                  <option value="all">الكل</option>
                  {buildings.map((building, index) => (
                    <option key={index} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>الدور:</label>
                <select value={filterFloor} onChange={handleFloorFilter}>
                  <option value="all">الكل</option>
                  {floors.map((floor, index) => (
                    <option key={index} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rooms-selection-info">
              <span className="selected-count">
                تم اختيار {selectedRooms.length} قاعة
              </span>
            </div>

            <div className="rooms-list-container">
              {filteredRooms.length === 0 ? (
                <div className="no-rooms">
                  لا توجد قاعات متاحة تطابق معايير البحث
                </div>
              ) : (
                <div className="rooms-grid">
                  {filteredRooms.map((room) => (
                    <div
                      key={room.id}
                      className={`room-item ${
                        selectedRooms.includes(room.id) ? "selected" : ""
                      }`}
                      onClick={() => onRoomSelection(room.id)}
                    >
                      <div className="room-selection-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedRooms.includes(room.id)}
                          onChange={() => onRoomSelection(room.id)}
                        />
                      </div>
                      <div className="room-info">
                        <h4>{room.name}</h4>
                        <p>
                          {room.building_name} - {room.floor_name}
                        </p>
                        <p>
                          السعة: {room.capacity} | المشرفين:{" "}
                          {room.required_supervisors} | الملاحظين:{" "}
                          {room.required_observers}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              إلغاء
            </button>
            <button type="submit" className="save-btn">
              حفظ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExamSchedule;
