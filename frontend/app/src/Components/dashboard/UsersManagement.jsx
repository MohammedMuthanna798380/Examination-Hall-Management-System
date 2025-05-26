import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { usersService } from "../../services/usersService";
import "./UsersManagement.css";

const UsersManagement = ({ onLogout }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRank, setFilterRank] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [users, searchTerm, filterType, filterStatus, filterRank]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters = {};
      if (filterType !== "all") filters.type = filterType;
      if (filterStatus !== "all") filters.status = filterStatus;
      if (filterRank !== "all") filters.rank = filterRank;
      if (searchTerm.trim()) filters.search = searchTerm.trim();

      const userData = await usersService.getUsers(filters);
      setUsers(userData);
      setFilteredUsers(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message || "فشل في تحميل البيانات من الخادم");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSearch = () => {
    let result = [...users];

    if (filterType !== "all") {
      result = result.filter((user) => user.type === filterType);
    }

    if (filterStatus !== "all") {
      result = result.filter((user) => user.status === filterStatus);
    }

    if (filterRank !== "all") {
      result = result.filter((user) => user.rank === filterRank);
    }

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
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم؟")) {
      try {
        await usersService.deleteUser(userId);
        await fetchUsers(); // إعادة تحميل البيانات
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("فشل في حذف المستخدم: " + (error.message || "خطأ غير محدد"));
      }
    }
  };

  const handleSuspendUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في تعليق هذا المستخدم؟")) {
      try {
        await usersService.suspendUser(userId);
        await fetchUsers();
      } catch (error) {
        console.error("Error suspending user:", error);
        alert("فشل في تعليق المستخدم: " + (error.message || "خطأ غير محدد"));
      }
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await usersService.activateUser(userId);
      await fetchUsers();
    } catch (error) {
      console.error("Error activating user:", error);
      alert("فشل في تنشيط المستخدم: " + (error.message || "خطأ غير محدد"));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (currentUser) {
        await usersService.updateUser(currentUser.id, userData);
      } else {
        await usersService.createUser(userData);
      }
      await fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving user:", error);
      alert("فشل في حفظ بيانات المستخدم: " + (error.message || "خطأ غير محدد"));
    }
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

  // إذا كان هناك خطأ أو لا توجد بيانات
  if (error) {
    return (
      <div className="users-management-container">
        <Sidebar userName={userName} onLogout={onLogout} activePage="users" />
        <div className="users-management-main">
          <Header title="إدارة المشرفين والملاحظين" onRefresh={handleRefresh} />

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
      </div>
    );
  }

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
          ) : filteredUsers.length === 0 ? (
            <div className="no-results">
              {users.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "20px" }}>
                    📝
                  </div>
                  <h3>لا توجد بيانات</h3>
                  <p>لم يتم إضافة أي مشرفين أو ملاحظين بعد.</p>
                  <button
                    onClick={handleAddUser}
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
                    إضافة أول مشرف/ملاحظ
                  </button>
                </div>
              ) : (
                "لا توجد نتائج تطابق معايير البحث"
              )}
            </div>
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
