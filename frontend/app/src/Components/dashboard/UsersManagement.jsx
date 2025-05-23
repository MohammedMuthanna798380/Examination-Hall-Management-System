import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./UsersManagement.css";

const UsersManagement = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'supervisor', 'observer'
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'suspended', 'deleted'
  const [filterRank, setFilterRank] = useState("all"); // 'all', 'college_employee', 'external_employee'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // Fetch users from API
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and search
    applyFiltersAndSearch();
  }, [users, searchTerm, filterType, filterStatus, filterRank]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // In a real app, fetch from API
      // For now, we'll use dummy data
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

      const dummyUsers = [
        {
          id: 1,
          name: "أحمد محمد علي",
          specialization: "هندسة كهربائية",
          phone: "773123456",
          whatsapp: "773123456",
          type: "supervisor", // supervisor or observer
          rank: "college_employee", // college_employee or external_employee
          status: "active", // active, suspended, or deleted
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-01-15",
        },
        {
          id: 2,
          name: "خالد عبدالله سعيد",
          specialization: "هندسة مدنية",
          phone: "774567890",
          whatsapp: "774567890",
          type: "supervisor",
          rank: "college_employee",
          status: "active",
          consecutive_absence_days: 1,
          last_absence_date: "2023-05-10",
          created_at: "2023-01-20",
        },
        {
          id: 3,
          name: "فاطمة أحمد حسن",
          specialization: "هندسة ميكانيكية",
          phone: "775678901",
          whatsapp: "775678901",
          type: "observer",
          rank: "college_employee",
          status: "active",
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-02-05",
        },
        {
          id: 4,
          name: "محمد سعيد ناصر",
          specialization: "هندسة برمجيات",
          phone: "776789012",
          whatsapp: "776789012",
          type: "observer",
          rank: "external_employee",
          status: "suspended",
          consecutive_absence_days: 2,
          last_absence_date: "2023-05-15",
          created_at: "2023-02-10",
        },
        {
          id: 5,
          name: "سارة محمد قاسم",
          specialization: "هندسة حاسوب",
          phone: "777890123",
          whatsapp: "777890123",
          type: "observer",
          rank: "external_employee",
          status: "active",
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-02-15",
        },
        {
          id: 6,
          name: "عمر خالد محمد",
          specialization: "هندسة كهربائية",
          phone: "778901234",
          whatsapp: "778901234",
          type: "supervisor",
          rank: "external_employee",
          status: "deleted",
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-03-01",
        },
        {
          id: 7,
          name: "نور علي أحمد",
          specialization: "هندسة مدنية",
          phone: "779012345",
          whatsapp: "779012345",
          type: "observer",
          rank: "college_employee",
          status: "active",
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-03-10",
        },
        {
          id: 8,
          name: "صالح محمد علي",
          specialization: "هندسة ميكانيكية",
          phone: "770123456",
          whatsapp: "770123456",
          type: "supervisor",
          rank: "college_employee",
          status: "active",
          consecutive_absence_days: 0,
          last_absence_date: null,
          created_at: "2023-03-15",
        },
      ];

      setUsers(dummyUsers);
      setFilteredUsers(dummyUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...users];

    // Apply type filter
    if (filterType !== "all") {
      result = result.filter((user) => user.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter((user) => user.status === filterStatus);
    }

    // Apply rank filter
    if (filterRank !== "all") {
      result = result.filter((user) => user.rank === filterRank);
    }

    // Apply search
    if (searchTerm.trim() !== "") {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.specialization.toLowerCase().includes(term) ||
          user.phone.includes(term)
      );
    }

    setFilteredUsers(result);
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterType = (type) => {
    setFilterType(type);
  };

  const handleFilterStatus = (status) => {
    setFilterStatus(status);
  };

  const handleFilterRank = (rank) => {
    setFilterRank(rank);
  };

  const handleAddUser = () => {
    setCurrentUser(null); // Reset current user for new user
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم؟")) {
      // In a real app, call delete API
      // For now, we'll update the local state
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, status: "deleted" } : user
      );
      setUsers(updatedUsers);
    }
  };

  const handleSuspendUser = (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في تعليق هذا المستخدم؟")) {
      // In a real app, call suspend API
      // For now, we'll update the local state
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, status: "suspended" } : user
      );
      setUsers(updatedUsers);
    }
  };

  const handleActivateUser = (userId) => {
    // In a real app, call activate API
    // For now, we'll update the local state
    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, status: "active" } : user
    );
    setUsers(updatedUsers);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveUser = (userData) => {
    if (currentUser) {
      // Edit existing user
      const updatedUsers = users.map((user) =>
        user.id === userData.id ? { ...userData } : user
      );
      setUsers(updatedUsers);
    } else {
      // Add new user
      const newUser = {
        ...userData,
        id: users.length + 1, // In a real app, this would come from the server
        consecutive_absence_days: 0,
        last_absence_date: null,
        created_at: new Date().toISOString().split("T")[0],
      };
      setUsers([...users, newUser]);
    }
    setIsModalOpen(false);
  };

  const translateType = (type) => {
    return type === "supervisor" ? "مشرف" : "ملاحظ";
  };

  const translateRank = (rank) => {
    return rank === "college_employee" ? "موظف كلية" : "موظف خارجي";
  };

  const translateStatus = (status) => {
    switch (status) {
      case "active":
        return "نشط";
      case "suspended":
        return "معلق";
      case "deleted":
        return "محذوف";
      default:
        return status;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "status-active";
      case "suspended":
        return "status-suspended";
      case "deleted":
        return "status-deleted";
      default:
        return "";
    }
  };

  return (
    <div className="users-management-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="users" />
      <div className="users-management-main">
        <Header title="إدارة المشرفين والملاحظين" onRefresh={handleRefresh} />

        <div className="users-management-content">
          <div className="users-management-controls">
            <div className="search-bar">
              <input
                type="text"
                placeholder="بحث بالاسم، التخصص، رقم الهاتف..."
                value={searchTerm}
                onChange={handleSearch}
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label>النوع:</label>
                <select
                  value={filterType}
                  onChange={(e) => handleFilterType(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="supervisor">مشرف</option>
                  <option value="observer">ملاحظ</option>
                </select>
              </div>

              <div className="filter-group">
                <label>الحالة:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterStatus(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="active">نشط</option>
                  <option value="suspended">معلق</option>
                  <option value="deleted">محذوف</option>
                </select>
              </div>

              <div className="filter-group">
                <label>الرتبة:</label>
                <select
                  value={filterRank}
                  onChange={(e) => handleFilterRank(e.target.value)}
                >
                  <option value="all">الكل</option>
                  <option value="college_employee">موظف كلية</option>
                  <option value="external_employee">موظف خارجي</option>
                </select>
              </div>
            </div>

            <button className="add-user-btn" onClick={handleAddUser}>
              <span className="add-icon">+</span> إضافة مشرف/ملاحظ
            </button>
          </div>

          <div className="users-summary">
            <div className="summary-card">
              <h3>إجمالي المشرفين والملاحظين</h3>
              <p className="summary-number">
                {users.filter((user) => user.status !== "deleted").length}
              </p>
            </div>
            <div className="summary-card">
              <h3>المشرفين</h3>
              <p className="summary-number">
                {
                  users.filter(
                    (user) =>
                      user.type === "supervisor" && user.status !== "deleted"
                  ).length
                }
              </p>
            </div>
            <div className="summary-card">
              <h3>الملاحظين</h3>
              <p className="summary-number">
                {
                  users.filter(
                    (user) =>
                      user.type === "observer" && user.status !== "deleted"
                  ).length
                }
              </p>
            </div>
            <div className="summary-card">
              <h3>موظفي الكلية</h3>
              <p className="summary-number">
                {
                  users.filter(
                    (user) =>
                      user.rank === "college_employee" &&
                      user.status !== "deleted"
                  ).length
                }
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-indicator">جاري تحميل البيانات...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-results">لا توجد نتائج تطابق معايير البحث</div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>النوع</th>
                    <th>الرتبة</th>
                    <th>التخصص</th>
                    <th>الهاتف</th>
                    <th>واتساب</th>
                    <th>الحالة</th>
                    <th>أيام الغياب</th>
                    <th>تاريخ الإضافة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className={user.status === "deleted" ? "row-deleted" : ""}
                    >
                      <td>{index + 1}</td>
                      <td>{user.name}</td>
                      <td>{translateType(user.type)}</td>
                      <td>{translateRank(user.rank)}</td>
                      <td>{user.specialization}</td>
                      <td dir="ltr">{user.phone}</td>
                      <td dir="ltr">{user.whatsapp}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            user.status
                          )}`}
                        >
                          {translateStatus(user.status)}
                        </span>
                      </td>
                      <td>{user.consecutive_absence_days}</td>
                      <td>{user.created_at}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn-user edit-btn"
                            onClick={() => handleEditUser(user)}
                            title="تعديل"
                          >
                            ✏️
                          </button>

                          {user.status === "active" ? (
                            <button
                              className="action-btn-user suspend-btn"
                              onClick={() => handleSuspendUser(user.id)}
                              title="تعليق"
                            >
                              ⏸️
                            </button>
                          ) : user.status === "suspended" ? (
                            <button
                              className="action-btn-user activate-btn"
                              onClick={() => handleActivateUser(user.id)}
                              title="تنشيط"
                            >
                              ▶️
                            </button>
                          ) : null}

                          {user.status !== "deleted" && (
                            <button
                              className="action-btn-user delete-btn"
                              onClick={() => handleDeleteUser(user.id)}
                              title="حذف"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <UserFormModal
          user={currentUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

// User Form Modal Component
const UserFormModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: user ? user.id : null,
    name: user ? user.name : "",
    specialization: user ? user.specialization : "",
    phone: user ? user.phone : "",
    whatsapp: user ? user.whatsapp : "",
    type: user ? user.type : "observer",
    rank: user ? user.rank : "external_employee",
    status: user ? user.status : "active",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      newErrors.name = "الاسم مطلوب";
    }

    if (!formData.specialization.trim()) {
      newErrors.specialization = "التخصص مطلوب";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!/^\d{9,10}$/.test(formData.phone.trim())) {
      newErrors.phone = "رقم الهاتف غير صالح";
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "رقم الواتساب مطلوب";
    } else if (!/^\d{9,10}$/.test(formData.whatsapp.trim())) {
      newErrors.whatsapp = "رقم الواتساب غير صالح";
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

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? "تعديل بيانات مشرف/ملاحظ" : "إضافة مشرف/ملاحظ جديد"}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">الاسم</label>
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
              <label htmlFor="specialization">التخصص</label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className={errors.specialization ? "error" : ""}
              />
              {errors.specialization && (
                <span className="error-message">{errors.specialization}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">رقم الهاتف</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? "error" : ""}
                dir="ltr"
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">رقم الواتساب</label>
              <input
                type="text"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className={errors.whatsapp ? "error" : ""}
                dir="ltr"
              />
              {errors.whatsapp && (
                <span className="error-message">{errors.whatsapp}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">النوع</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="supervisor">مشرف</option>
                <option value="observer">ملاحظ</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="rank">الرتبة</label>
              <select
                id="rank"
                name="rank"
                value={formData.rank}
                onChange={handleChange}
              >
                <option value="college_employee">موظف كلية</option>
                <option value="external_employee">موظف خارجي</option>
              </select>
            </div>
          </div>

          {user && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">الحالة</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">نشط</option>
                  <option value="suspended">معلق</option>
                  <option value="deleted">محذوف</option>
                </select>
              </div>
            </div>
          )}

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

export default UsersManagement;
