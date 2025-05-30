import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { roomsService } from "../../services/roomsService";
import ToastNotification from "../common/ToastNotification";
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userName, setUserName] = useState("");
  const [selectedView, setSelectedView] = useState("table");
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // بدء تحميل البيانات
    initializeData();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [rooms, searchTerm, filterBuilding, filterFloor, filterStatus]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  const initializeData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("🔄 بدء تحميل البيانات الأولية...");

      // تحميل المباني والقاعات بشكل متوازي
      const [buildingsData, roomsData] = await Promise.all([
        roomsService.getBuildings(),
        roomsService.getRooms(),
      ]);

      console.log("✅ تم تحميل البيانات بنجاح");
      setBuildings(buildingsData);
      setRooms(roomsData);
      setFilteredRooms(roomsData);

      showToast("تم تحميل البيانات بنجاح", "success");
    } catch (error) {
      console.error("❌ خطأ في تحميل البيانات:", error);
      setError(error.message || "فشل في تحميل البيانات من الخادم");
      showToast("فشل في تحميل البيانات: " + error.message, "error");

      // في حالة الفشل، استخدم البيانات الوهمية
      loadFallbackData();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackData = () => {
    console.log("📋 استخدام البيانات الوهمية...");

    const dummyBuildings = [
      { id: 1, name: "مبنى الكهرباء" },
      { id: 2, name: "مبنى المدني" },
    ];

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
    ];

    setBuildings(dummyBuildings);
    setRooms(dummyRooms);
    setFilteredRooms(dummyRooms);
  };

  const fetchFloors = async (buildingId) => {
    if (!buildingId || buildingId === "all") {
      setFloors([]);
      return;
    }

    try {
      console.log(`🔄 جلب أدوار المبنى ${buildingId}...`);
      const floorsData = await roomsService.getFloors(buildingId);
      setFloors(floorsData);
      console.log(`✅ تم جلب ${floorsData.length} دور`);
    } catch (error) {
      console.error("❌ خطأ في جلب الأدوار:", error);
      showToast("فشل في جلب أدوار المبنى", "error");
      setFloors([]);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...rooms];

    // تطبيق فلتر المبنى
    if (filterBuilding !== "all") {
      const buildingId = parseInt(filterBuilding);
      result = result.filter((room) => room.building_id === buildingId);
    }

    // تطبيق فلتر الدور
    if (filterFloor !== "all") {
      const floorId = parseInt(filterFloor);
      result = result.filter((room) => room.floor_id === floorId);
    }

    // تطبيق فلتر الحالة
    if (filterStatus !== "all") {
      result = result.filter((room) => room.status === filterStatus);
    }

    // تطبيق البحث
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

  const handleRefresh = async () => {
    await initializeData();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterBuilding = async (e) => {
    const buildingId = e.target.value;
    setFilterBuilding(buildingId);
    setFilterFloor("all"); // إعادة تعيين فلتر الدور

    // جلب أدوار المبنى الجديد
    await fetchFloors(buildingId);
  };

  const handleFilterFloor = (e) => {
    setFilterFloor(e.target.value);
  };

  const handleFilterStatus = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleAddRoom = () => {
    setCurrentRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setCurrentRoom(room);
    setIsModalOpen(true);
  };

  const handleToggleRoomStatus = async (roomId) => {
    try {
      console.log(`🔄 تغيير حالة القاعة ${roomId}...`);

      await roomsService.toggleRoomStatus(roomId);

      // تحديث القائمة المحلية
      const updatedRooms = rooms.map((room) => {
        if (room.id === roomId) {
          const newStatus =
            room.status === "available" ? "unavailable" : "available";
          return { ...room, status: newStatus };
        }
        return room;
      });

      setRooms(updatedRooms);
      showToast("تم تغيير حالة القاعة بنجاح", "success");

      console.log(`✅ تم تغيير حالة القاعة ${roomId} بنجاح`);
    } catch (error) {
      console.error(`❌ خطأ في تغيير حالة القاعة ${roomId}:`, error);
      showToast("فشل في تغيير حالة القاعة: " + error.message, "error");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه القاعة؟")) {
      return;
    }

    try {
      console.log(`🔄 حذف القاعة ${roomId}...`);

      await roomsService.deleteRoom(roomId);

      // إزالة القاعة من القائمة المحلية
      const updatedRooms = rooms.filter((room) => room.id !== roomId);
      setRooms(updatedRooms);

      showToast("تم حذف القاعة بنجاح", "success");
      console.log(`✅ تم حذف القاعة ${roomId} بنجاح`);
    } catch (error) {
      console.error(`❌ خطأ في حذف القاعة ${roomId}:`, error);
      showToast("فشل في حذف القاعة: " + error.message, "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveRoom = async (roomData) => {
    try {
      let savedRoom;

      if (currentRoom) {
        // تحديث قاعة موجودة
        console.log(`🔄 تحديث القاعة ${currentRoom.id}...`);
        savedRoom = await roomsService.updateRoom(currentRoom.id, roomData);

        // تحديث القائمة المحلية
        const updatedRooms = rooms.map((room) =>
          room.id === currentRoom.id ? savedRoom : room
        );
        setRooms(updatedRooms);

        showToast("تم تحديث القاعة بنجاح", "success");
        console.log(`✅ تم تحديث القاعة ${currentRoom.id} بنجاح`);
      } else {
        // إنشاء قاعة جديدة
        console.log("🔄 إنشاء قاعة جديدة...");
        savedRoom = await roomsService.createRoom(roomData);

        // إضافة القاعة للقائمة المحلية
        setRooms([...rooms, savedRoom]);

        showToast("تم إضافة القاعة بنجاح", "success");
        console.log("✅ تم إنشاء القاعة بنجاح");
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("❌ خطأ في حفظ القاعة:", error);
      showToast("فشل في حفظ القاعة: " + error.message, "error");
    }
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

  // عرض شاشة الخطأ
  if (error && rooms.length === 0) {
    return (
      <div className="rooms-management-container">
        <Sidebar userName={userName} onLogout={onLogout} activePage="halls" />
        <div className="rooms-management-main">
          <Header title="إدارة القاعات" onRefresh={handleRefresh} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "60vh",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>❌</div>
            <h2 style={{ color: "#e74c3c", marginBottom: "10px" }}>
              فشل في تحميل البيانات
            </h2>
            <p
              style={{
                color: "#7f8c8d",
                marginBottom: "30px",
                maxWidth: "500px",
              }}
            >
              {error}
            </p>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                backgroundColor: isLoading ? "#95a5a6" : "#3498db",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "1rem",
                fontWeight: "bold",
              }}
            >
              {isLoading ? "جاري إعادة المحاولة..." : "إعادة المحاولة"}
            </button>
          </div>
        </div>

        {toast && (
          <ToastNotification
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </div>
    );
  }

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
            <div className="loading-indicator">
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #3498db",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 20px",
                }}
              ></div>
              جاري تحميل البيانات...
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="no-results">
              {rooms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "20px" }}>
                    🏢
                  </div>
                  <h3>لا توجد قاعات</h3>
                  <p>لم يتم إضافة أي قاعات بعد.</p>
                  <button
                    onClick={handleAddRoom}
                    style={{
                      marginTop: "20px",
                      padding: "10px 20px",
                      backgroundColor: "#27ae60",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    إضافة أول قاعة
                  </button>
                </div>
              ) : (
                "لا توجد نتائج تطابق معايير البحث"
              )}
            </div>
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
                            className="action-btn-room edit-btn"
                            onClick={() => handleEditRoom(room)}
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          <button
                            className={`action-btn-room ${
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
                            className="action-btn-room delete-btn"
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
          onFetchFloors={fetchFloors}
        />
      )}

      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

// Room Form Modal Component - محدث للعمل مع API
const RoomFormModal = ({
  room,
  buildings,
  floors,
  onClose,
  onSave,
  onFetchFloors,
}) => {
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
  const [isLoadingFloors, setIsLoadingFloors] = useState(false);

  // تحميل الأدوار عند تغيير المبنى
  useEffect(() => {
    if (formData.building_id) {
      loadFloors(formData.building_id);
    } else {
      setAvailableFloors([]);
    }
  }, [formData.building_id]);

  const loadFloors = async (buildingId) => {
    if (!buildingId) return;

    setIsLoadingFloors(true);
    try {
      const floorsData = await onFetchFloors(buildingId);
      setAvailableFloors(
        floorsData ||
          floors.filter((f) => f.building_id === parseInt(buildingId))
      );

      // إذا كان الدور الحالي لا ينتمي للمبنى الجديد، إعادة تعيينه
      if (formData.floor_id) {
        const floorExists = (floorsData || floors).some(
          (floor) =>
            floor.id === parseInt(formData.floor_id) &&
            floor.building_id === parseInt(buildingId)
        );

        if (!floorExists) {
          setFormData((prev) => ({
            ...prev,
            floor_id:
              floorsData && floorsData.length > 0 ? floorsData[0].id : "",
          }));
        }
      }
    } catch (error) {
      console.error("خطأ في تحميل الأدوار:", error);
      setAvailableFloors([]);
    } finally {
      setIsLoadingFloors(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // مسح الخطأ لهذا الحقل
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
    } else if (parseInt(formData.capacity) > 1000) {
      newErrors.capacity = "السعة كبيرة جداً (الحد الأقصى 1000)";
    }

    if (!formData.required_supervisors) {
      newErrors.required_supervisors = "عدد المشرفين مطلوب";
    } else if (
      isNaN(formData.required_supervisors) ||
      parseInt(formData.required_supervisors) <= 0
    ) {
      newErrors.required_supervisors = "يجب أن يكون عدد المشرفين رقماً موجباً";
    } else if (parseInt(formData.required_supervisors) > 10) {
      newErrors.required_supervisors =
        "عدد المشرفين كبير جداً (الحد الأقصى 10)";
    }

    if (!formData.required_observers) {
      newErrors.required_observers = "عدد الملاحظين مطلوب";
    } else if (
      isNaN(formData.required_observers) ||
      parseInt(formData.required_observers) <= 0
    ) {
      newErrors.required_observers = "يجب أن يكون عدد الملاحظين رقماً موجباً";
    } else if (parseInt(formData.required_observers) > 20) {
      newErrors.required_observers = "عدد الملاحظين كبير جداً (الحد الأقصى 20)";
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

    // تحويل الحقول الرقمية إلى أرقام
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
                placeholder="مثال: قاعة 101"
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
                max="1000"
                className={errors.capacity ? "error" : ""}
                placeholder="عدد الطلاب"
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
                disabled={!formData.building_id || isLoadingFloors}
                className={errors.floor_id ? "error" : ""}
              >
                <option value="">
                  {isLoadingFloors ? "جاري التحميل..." : "اختر الدور"}
                </option>
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
                max="10"
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
                max="20"
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
            <button
              type="submit"
              className="save-btn"
              disabled={isLoadingFloors}
            >
              {isLoadingFloors ? "جاري التحميل..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomsManagement;
