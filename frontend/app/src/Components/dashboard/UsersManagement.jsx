import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ToastNotification from "../common/ToastNotification";
import { usersService } from "../../services/usersService";
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
  const [toast, setToast] = useState(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    supervisors: 0,
    observers: 0,
    college_employees: 0,
  });

  useEffect(() => {
    // Get user info from localStorage
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");

    // Fetch users from API
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters and search when data changes
    applyFiltersAndSearch();
  }, [users, searchTerm, filterType, filterStatus, filterRank]);

  // دالة لعرض التنبيهات
  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // تحضير الفلاتر
      const filters = {
        type: filterType !== "all" ? filterType : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        rank: filterRank !== "all" ? filterRank : undefined,
        search: searchTerm.trim() || undefined,
      };

      // إزالة الفلاتر الفارغة
      Object.keys(filters).forEach((key) => {
        if (!filters[key]) {
          delete filters[key];
        }
      });

      const usersData = await usersService.getUsers(filters);
      setUsers(usersData);

      // جلب الإحصائيات
      const stats = await usersService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast("حدث خطأ أثناء تحميل البيانات: " + error.message, "error");
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
      result = result.filter((user) => {
        const name = user?.name?.toLowerCase() || "";
        const specialization = user?.specialization?.toLowerCase() || "";
        const phone = user?.phone || "";
        return (
          name.includes(term) ||
          specialization.includes(term) ||
          phone.includes(term)
        );
      });
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

  const handleDeleteUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم؟")) {
      try {
        await usersService.deleteUser(userId);
        // تحديث الحالة المحلية
        const updatedUsers = users.map((user) =>
          user.id === userId ? { ...user, status: "deleted" } : user
        );
        setUsers(updatedUsers);
        showToast("تم حذف المستخدم بنجاح", "success");
      } catch (error) {
        console.error("Error deleting user:", error);
        showToast("حدث خطأ أثناء حذف المستخدم: " + error.message, "error");
      }
    }
  };

  const handleSuspendUser = async (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في تعليق هذا المستخدم؟")) {
      try {
        await usersService.suspendUser(userId);
        // تحديث الحالة المحلية
        const updatedUsers = users.map((user) =>
          user.id === userId ? { ...user, status: "suspended" } : user
        );
        setUsers(updatedUsers);
        showToast("تم تعليق المستخدم بنجاح", "success");
      } catch (error) {
        console.error("Error suspending user:", error);
        showToast("حدث خطأ أثناء تعليق المستخدم: " + error.message, "error");
      }
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await usersService.activateUser(userId);
      // تحديث الحالة المحلية
      const updatedUsers = users.map((user) =>
        user.id === userId ? { ...user, status: "active" } : user
      );
      setUsers(updatedUsers);
      showToast("تم تنشيط المستخدم بنجاح", "success");
    } catch (error) {
      console.error("Error activating user:", error);
      showToast("حدث خطأ أثناء تنشيط المستخدم: " + error.message, "error");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveUser = async (userData) => {
    try {
      if (currentUser) {
        // تحديث مستخدم موجود
        const updatedUser = await usersService.updateUser(
          userData.id,
          userData
        );
        const updatedUsers = users.map((user) =>
          user.id === userData.id ? updatedUser : user
        );
        setUsers(updatedUsers);
        showToast("تم تحديث بيانات المستخدم بنجاح", "success");
      } else {
        // إضافة مستخدم جديد
        const newUser = await usersService.createUser(userData);
        setUsers([...users, newUser]);
        showToast("تم إضافة المستخدم بنجاح", "success");
      }
      setIsModalOpen(false);

      // إعادة تحميل البيانات للتأكد من التحديث
      await fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);

      // عرض رسائل الخطأ من الخادم
      if (error.message && error.message.includes("errors")) {
        showToast(
          "خطأ في البيانات المدخلة. يرجى التحقق من البيانات والمحاولة مرة أخرى.",
          "error"
        );
      } else {
        showToast("حدث خطأ أثناء حفظ البيانات: " + error.message, "error");
      }
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
              <p className="summary-number">{statistics.total}</p>
            </div>
            <div className="summary-card">
              <h3>المشرفين</h3>
              <p className="summary-number">{statistics.supervisors}</p>
            </div>
            <div className="summary-card">
              <h3>الملاحظين</h3>
              <p className="summary-number">{statistics.observers}</p>
            </div>
            <div className="summary-card">
              <h3>موظفي الكلية</h3>
              <p className="summary-number">{statistics.college_employees}</p>
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
                      <td>
                        {new Date(user.created_at).toLocaleDateString("ar-EG")}
                      </td>
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

      {/* Modal */}
      {isModalOpen && (
        <UserFormModal
          user={currentUser}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <ToastNotification
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // إضافة معرف المستخدم للتحديث
      const dataToSend = user ? { ...formData, id: user.id } : formData;
      await onSave(dataToSend);
    } catch (error) {
      console.error("Error in form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{user ? "تعديل بيانات مشرف/ملاحظ" : "إضافة مشرف/ملاحظ جديد"}</h2>
          <button
            className="close-btn"
            onClick={onClose}
            disabled={isSubmitting}
          >
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                  disabled={isSubmitting}
                >
                  <option value="active">نشط</option>
                  <option value="suspended">معلق</option>
                  <option value="deleted">محذوف</option>
                </select>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UsersManagement;
