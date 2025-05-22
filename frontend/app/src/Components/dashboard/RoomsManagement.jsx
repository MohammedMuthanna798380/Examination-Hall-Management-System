import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./RoomsManagement.css";

const RoomsManagement = ({ onLogout }) => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'available', 'unavailable'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userName, setUserName] = useState("");
  const [selectedView, setSelectedView] = useState("table"); // 'table' or 'grid'

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // Fetch rooms, buildings, and floors from API
    fetchData();
  }, []);

  useEffect(() => {
    // Apply filters and search
    applyFiltersAndSearch();
  }, [rooms, searchTerm, filterBuilding, filterFloor, filterStatus]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // In a real app, fetch from API
      // For now, we'll use dummy data
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

      // Dummy buildings data
      const dummyBuildings = [
        { id: 1, name: "مبنى الكهرباء" },
        { id: 2, name: "مبنى المدني" },
      ];

      // Dummy floors data
      const dummyFloors = [
        { id: 1, building_id: 1, name: "الدور الأول" },
        { id: 2, building_id: 1, name: "الدور الثاني" },
        { id: 3, building_id: 1, name: "الدور الثالث" },
        { id: 4, building_id: 1, name: "الدور الرابع" },
        { id: 5, building_id: 2, name: "الدور الأول" },
        { id: 6, building_id: 2, name: "الدور الثاني" },
      ];

      // Dummy rooms data
      const dummyRooms = [
        {
          id: 1,
          name: "قاعة 101",
          floor_id: 1,
          building_id: 1,
          floor_name: "الدور الأول",
          building_name: "مبنى الكهرباء",
          capacity: 50,
          required_supervisors: 1,
          required_observers: 2,
          can_add_observer: true,
          status: "available",
          created_at: "2023-01-15",
        },
        {
          id: 2,
          name: "قاعة 102",
          floor_id: 1,
          building_id: 1,
          floor_name: "الدور الأول",
          building_name: "مبنى الكهرباء",
          capacity: 40,
          required_supervisors: 1,
          required_observers: 2,
          can_add_observer: false,
          status: "available",
          created_at: "2023-01-15",
        },
        {
          id: 3,
          name: "قاعة 201",
          floor_id: 2,
          building_id: 1,
          floor_name: "الدور الثاني",
          building_name: "مبنى الكهرباء",
          capacity: 60,
          required_supervisors: 1,
          required_observers: 3,
          can_add_observer: true,
          status: "available",
          created_at: "2023-01-20",
        },
        {
          id: 4,
          name: "قاعة 301",
          floor_id: 3,
          building_id: 1,
          floor_name: "الدور الثالث",
          building_name: "مبنى الكهرباء",
          capacity: 30,
          required_supervisors: 1,
          required_observers: 1,
          can_add_observer: true,
          status: "unavailable",
          created_at: "2023-02-05",
        },
        {
          id: 5,
          name: "قاعة 401",
          floor_id: 4,
          building_id: 1,
          floor_name: "الدور الرابع",
          building_name: "مبنى الكهرباء",
          capacity: 70,
          required_supervisors: 2,
          required_observers: 3,
          can_add_observer: true,
          status: "available",
          created_at: "2023-02-10",
        },
        {
          id: 6,
          name: "قاعة 101م",
          floor_id: 5,
          building_id: 2,
          floor_name: "الدور الأول",
          building_name: "مبنى المدني",
          capacity: 45,
          required_supervisors: 1,
          required_observers: 2,
          can_add_observer: true,
          status: "available",
          created_at: "2023-02-15",
        },
        {
          id: 7,
          name: "قاعة 201م",
          floor_id: 6,
          building_id: 2,
          floor_name: "الدور الثاني",
          building_name: "مبنى المدني",
          capacity: 55,
          required_supervisors: 1,
          required_observers: 2,
          can_add_observer: false,
          status: "unavailable",
          created_at: "2023-03-01",
        },
      ];

      setBuildings(dummyBuildings);
      setFloors(dummyFloors);
      setRooms(dummyRooms);
      setFilteredRooms(dummyRooms);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...rooms];

    // Apply building filter
    if (filterBuilding !== "all") {
      const buildingId = parseInt(filterBuilding);
      result = result.filter((room) => room.building_id === buildingId);
    }

    // Apply floor filter
    if (filterFloor !== "all") {
      const floorId = parseInt(filterFloor);
      result = result.filter((room) => room.floor_id === floorId);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter((room) => room.status === filterStatus);
    }

    // Apply search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (room) =>
          room.name.toLowerCase().includes(term) ||
          room.building_name.toLowerCase().includes(term) ||
          room.floor_name.toLowerCase().includes(term)
      );
    }

    setFilteredRooms(result);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterBuilding = (e) => {
    const buildingId = e.target.value;
    setFilterBuilding(buildingId);

    // Reset floor filter when building changes
    if (buildingId === "all") {
      setFilterFloor("all");
    } else {
      setFilterFloor("all");
    }
  };

  const handleFilterFloor = (e) => {
    setFilterFloor(e.target.value);
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleAddRoom = () => {
    setCurrentRoom(null); // Reset current room for new room
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setCurrentRoom(room);
    setIsModalOpen(true);
  };

  const handleToggleRoomStatus = (roomId) => {
    // Toggle room status between available and unavailable
    const updatedRooms = rooms.map((room) => {
      if (room.id === roomId) {
        const newStatus =
          room.status === "available" ? "unavailable" : "available";
        return { ...room, status: newStatus };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  const handleDeleteRoom = (roomId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذه القاعة؟")) {
      // In a real app, call delete API
      // For now, we'll update the local state
      const updatedRooms = rooms.filter((room) => room.id !== roomId);
      setRooms(updatedRooms);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveRoom = (roomData) => {
    if (currentRoom) {
      // Edit existing room
      const updatedRooms = rooms.map((room) =>
        room.id === roomData.id ? { ...roomData } : room
      );
      setRooms(updatedRooms);
    } else {
      // Add new room
      // In a real app, this would come from the server after saving
      const buildingInfo = buildings.find(
        (b) => b.id === parseInt(roomData.building_id)
      );
      const floorInfo = floors.find(
        (f) => f.id === parseInt(roomData.floor_id)
      );

      const newRoom = {
        ...roomData,
        id: rooms.length + 1,
        building_name: buildingInfo?.name || "",
        floor_name: floorInfo?.name || "",
        created_at: new Date().toISOString().split("T")[0],
      };
      setRooms([...rooms, newRoom]);
    }
    setIsModalOpen(false);
  };

  const translateStatus = (status) => {
    return status === "available" ? "متاحة" : "غير متاحة";
  };

  const getStatusClass = (status) => {
    return status === "available" ? "status-available" : "status-unavailable";
  };

  const getAvailableFloors = () => {
    if (filterBuilding === "all") {
      return floors;
    }

    const buildingId = parseInt(filterBuilding);
    return floors.filter((floor) => floor.building_id === buildingId);
  };

  return (
    <div className="rooms-management-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="halls" />
      <div className="rooms-management-main">
        <Header title="إدارة القاعات" onRefresh={handleRefresh} />

        <div className="rooms-management-content">
          <div className="rooms-management-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="بحث باسم القاعة، المبنى، الدور..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>المبنى:</label>
                <select value={filterBuilding} onChange={handleFilterBuilding}>
                  <option value="all">الكل</option>
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>الدور:</label>
                <select
                  value={filterFloor}
                  onChange={handleFilterFloor}
                  disabled={filterBuilding === "all"}
                >
                  <option value="all">الكل</option>
                  {getAvailableFloors().map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>الحالة:</label>
                <select value={filterStatus} onChange={handleFilterStatus}>
                  <option value="all">الكل</option>
                  <option value="available">متاحة</option>
                  <option value="unavailable">غير متاحة</option>
                </select>
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
            </div>

            <button className="add-room-btn" onClick={handleAddRoom}>
              <span className="add-icon">+</span> إضافة قاعة
            </button>
          </div>

          <div className="rooms-summary">
            <div className="summary-card">
              <h3>إجمالي القاعات</h3>
              <p className="summary-number">{rooms.length}</p>
            </div>
            <div className="summary-card">
              <h3>القاعات المتاحة</h3>
              <p className="summary-number">
                {rooms.filter((room) => room.status === "available").length}
              </p>
            </div>
            <div className="summary-card">
              <h3>إجمالي السعة</h3>
              <p className="summary-number">
                {rooms.reduce((sum, room) => sum + room.capacity, 0)}
              </p>
            </div>
            <div className="summary-card">
              <h3>عدد المشرفين المطلوبين</h3>
              <p className="summary-number">
                {rooms.reduce(
                  (sum, room) => sum + room.required_supervisors,
                  0
                )}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-indicator">جاري تحميل البيانات...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="no-results">لا توجد نتائج تطابق معايير البحث</div>
          ) : selectedView === "table" ? (
            <div className="rooms-table-container">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>اسم القاعة</th>
                    <th>المبنى</th>
                    <th>الدور</th>
                    <th>السعة</th>
                    <th>عدد المشرفين</th>
                    <th>عدد الملاحظين</th>
                    <th>قابلية زيادة ملاحظ</th>
                    <th>الحالة</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room, index) => (
                    <tr key={room.id}>
                      <td>{index + 1}</td>
                      <td>{room.name}</td>
                      <td>{room.building_name}</td>
                      <td>{room.floor_name}</td>
                      <td>{room.capacity}</td>
                      <td>{room.required_supervisors}</td>
                      <td>{room.required_observers}</td>
                      <td>{room.can_add_observer ? "نعم" : "لا"}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            room.status
                          )}`}
                        >
                          {translateStatus(room.status)}
                        </span>
                      </td>
                      <td>{room.created_at}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditRoom(room)}
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          <button
                            className={`action-btn ${
                              room.status === "available"
                                ? "disable-btn"
                                : "enable-btn"
                            }`}
                            onClick={() => handleToggleRoomStatus(room.id)}
                            title={
                              room.status === "available" ? "تعطيل" : "تفعيل"
                            }
                          >
                            {room.status === "available" ? "⏸️" : "▶️"}
                          </button>

                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteRoom(room.id)}
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
            <div className="rooms-grid">
              {filteredRooms.map((room) => (
                <div key={room.id} className="room-card">
                  <div className="room-card-header">
                    <h3>{room.name}</h3>
                    <span
                      className={`status-badge ${getStatusClass(room.status)}`}
                    >
                      {translateStatus(room.status)}
                    </span>
                  </div>

                  <div className="room-card-info">
                    <div className="info-item">
                      <span className="info-label">المبنى:</span>
                      <span className="info-value">{room.building_name}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">الدور:</span>
                      <span className="info-value">{room.floor_name}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">السعة:</span>
                      <span className="info-value">{room.capacity}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">المشرفين:</span>
                      <span className="info-value">
                        {room.required_supervisors}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">الملاحظين:</span>
                      <span className="info-value">
                        {room.required_observers}
                      </span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">قابلية زيادة ملاحظ:</span>
                      <span className="info-value">
                        {room.can_add_observer ? "نعم" : "لا"}
                      </span>
                    </div>
                  </div>

                  <div className="room-card-actions">
                    <button
                      className="card-action-btn edit-btn"
                      onClick={() => handleEditRoom(room)}
                    >
                      تعديل
                    </button>

                    <button
                      className={`card-action-btn ${
                        room.status === "available"
                          ? "disable-btn"
                          : "enable-btn"
                      }`}
                      onClick={() => handleToggleRoomStatus(room.id)}
                    >
                      {room.status === "available" ? "تعطيل" : "تفعيل"}
                    </button>

                    <button
                      className="card-action-btn delete-btn"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <RoomFormModal
          room={currentRoom}
          buildings={buildings}
          floors={floors}
          onClose={handleCloseModal}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
};

// Room Form Modal Component
const RoomFormModal = ({ room, buildings, floors, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: room ? room.id : null,
    name: room ? room.name : "",
    building_id: room
      ? room.building_id
      : buildings.length > 0
      ? buildings[0].id
      : "",
    floor_id: room ? room.floor_id : "",
    capacity: room ? room.capacity : "",
    required_supervisors: room ? room.required_supervisors : 1,
    required_observers: room ? room.required_observers : 2,
    can_add_observer: room ? room.can_add_observer : false,
    status: room ? room.status : "available",
  });

  const [errors, setErrors] = useState({});
  const [availableFloors, setAvailableFloors] = useState([]);

  // Update available floors when building changes
  useEffect(() => {
    if (formData.building_id) {
      const buildingId = parseInt(formData.building_id);
      const filteredFloors = floors.filter(
        (floor) => floor.building_id === buildingId
      );
      setAvailableFloors(filteredFloors);

      // If current floor is not in the available floors, reset it
      if (
        formData.floor_id &&
        !filteredFloors.some(
          (floor) => floor.id === parseInt(formData.floor_id)
        )
      ) {
        setFormData((prev) => ({
          ...prev,
          floor_id: filteredFloors.length > 0 ? filteredFloors[0].id : "",
        }));
      }
    } else {
      setAvailableFloors([]);
    }
  }, [formData.building_id, floors]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "اسم القاعة مطلوب";
    }

    if (!formData.building_id) {
      newErrors.building_id = "اختيار المبنى مطلوب";
    }

    if (!formData.floor_id) {
      newErrors.floor_id = "اختيار الدور مطلوب";
    }

    if (!formData.capacity) {
      newErrors.capacity = "السعة مطلوبة";
    } else if (isNaN(formData.capacity) || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = "يجب أن تكون السعة رقماً موجباً";
    }

    if (!formData.required_supervisors) {
      newErrors.required_supervisors = "عدد المشرفين مطلوب";
    } else if (
      isNaN(formData.required_supervisors) ||
      parseInt(formData.required_supervisors) <= 0
    ) {
      newErrors.required_supervisors = "يجب أن يكون عدد المشرفين رقماً موجباً";
    }

    if (!formData.required_observers) {
      newErrors.required_observers = "عدد الملاحظين مطلوب";
    } else if (
      isNaN(formData.required_observers) ||
      parseInt(formData.required_observers) <= 0
    ) {
      newErrors.required_observers = "يجب أن يكون عدد الملاحظين رقماً موجباً";
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

    // Convert numeric fields to numbers
    const processedData = {
      ...formData,
      building_id: parseInt(formData.building_id),
      floor_id: parseInt(formData.floor_id),
      capacity: parseInt(formData.capacity),
      required_supervisors: parseInt(formData.required_supervisors),
      required_observers: parseInt(formData.required_observers),
    };

    onSave(processedData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{room ? "تعديل بيانات قاعة" : "إضافة قاعة جديدة"}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">اسم القاعة</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? "error" : ""}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="capacity">السعة</label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                className={errors.capacity ? "error" : ""}
              />
              {errors.capacity && (
                <span className="error-message">{errors.capacity}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="building_id">المبنى</label>
              <select
                id="building_id"
                name="building_id"
                value={formData.building_id}
                onChange={handleChange}
                className={errors.building_id ? "error" : ""}
              >
                <option value="">اختر المبنى</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
              {errors.building_id && (
                <span className="error-message">{errors.building_id}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="floor_id">الدور</label>
              <select
                id="floor_id"
                name="floor_id"
                value={formData.floor_id}
                onChange={handleChange}
                disabled={!formData.building_id}
                className={errors.floor_id ? "error" : ""}
              >
                <option value="">اختر الدور</option>
                {availableFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name}
                  </option>
                ))}
              </select>
              {errors.floor_id && (
                <span className="error-message">{errors.floor_id}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="required_supervisors">
                عدد المشرفين المطلوبين
              </label>
              <input
                type="number"
                id="required_supervisors"
                name="required_supervisors"
                value={formData.required_supervisors}
                onChange={handleChange}
                min="1"
                className={errors.required_supervisors ? "error" : ""}
              />
              {errors.required_supervisors && (
                <span className="error-message">
                  {errors.required_supervisors}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="required_observers">
                عدد الملاحظين المطلوبين
              </label>
              <input
                type="number"
                id="required_observers"
                name="required_observers"
                value={formData.required_observers}
                onChange={handleChange}
                min="1"
                className={errors.required_observers ? "error" : ""}
              />
              {errors.required_observers && (
                <span className="error-message">
                  {errors.required_observers}
                </span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="can_add_observer"
                  checked={formData.can_add_observer}
                  onChange={handleChange}
                />
                قابلية زيادة ملاحظ
              </label>
            </div>

            {room && (
              <div className="form-group">
                <label htmlFor="status">الحالة</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="available">متاحة</option>
                  <option value="unavailable">غير متاحة</option>
                </select>
              </div>
            )}
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

export default RoomsManagement;
