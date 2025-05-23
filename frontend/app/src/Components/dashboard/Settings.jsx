import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Settings.css";

const Settings = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // إعدادات عامة
  const [generalSettings, setGeneralSettings] = useState({
    systemName: "نظام إدارة المشرفين والملاحظين",
    collegeName: "كلية الهندسة - جامعة تعز",
    maxConsecutiveAbsences: 2,
    autoSuspendEnabled: true,
    enableNotifications: true,
    defaultExamPeriod: "morning",
    workingDays: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
    academicYear: "2024-2025",
  });

  // إعدادات التوزيع
  const [distributionSettings, setDistributionSettings] = useState({
    prioritizeCollegeEmployees: true,
    allowObserverOverride: true,
    maxSupervisorsPerHall: 3,
    maxObserversPerHall: 5,
    enableFairRotation: true,
    allowTempAssignments: true,
    requireAllHallsCovered: false,
    autoReplaceAbsent: true,
  });

  // إعدادات النظام
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 120,
    enableBackup: true,
    backupFrequency: "daily",
    logLevel: "info",
    enableAuditLog: true,
    maintenanceMode: false,
    allowMultipleSessions: false,
    passwordExpiry: 90,
  });

  // إعدادات الإشعارات
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    webNotifications: true,
    notifyAbsence: true,
    notifyShortage: true,
    notifyReplacements: true,
    notifySystemMaintenance: true,
    adminEmail: "admin@taizu.edu.ye",
    adminPhone: "",
  });

  // بيانات المستخدمين
  const [users, setUsers] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    loadSettings();
    loadUsers();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // في التطبيق الحقيقي، سيتم جلب الإعدادات من API
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("تم تحميل الإعدادات بنجاح");
    } catch (error) {
      console.error("خطأ في تحميل الإعدادات:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // بيانات وهمية للمستخدمين
      const dummyUsers = [
        {
          id: 1,
          username: "admin",
          role: "admin",
          active: true,
          lastLogin: "2024-05-20",
          createdAt: "2024-01-15",
        },
        {
          id: 2,
          username: "supervisor_mgr",
          role: "data_entry",
          active: true,
          lastLogin: "2024-05-19",
          createdAt: "2024-02-10",
        },
        {
          id: 3,
          username: "monitor",
          role: "monitor",
          active: false,
          lastLogin: "2024-05-15",
          createdAt: "2024-03-05",
        },
      ];
      setUsers(dummyUsers);
    } catch (error) {
      console.error("خطأ في تحميل المستخدمين:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // في التطبيق الحقيقي، سيتم إرسال الإعدادات إلى API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setNotifications((prev) => [
        ...prev,
        {
          type: "success",
          message: "تم حفظ الإعدادات بنجاح",
        },
      ]);

      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    } catch (error) {
      setNotifications((prev) => [
        ...prev,
        {
          type: "error",
          message: "خطأ في حفظ الإعدادات",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (
      window.confirm(
        "هل أنت متأكد من رغبتك في إعادة تعيين الإعدادات إلى القيم الافتراضية؟"
      )
    ) {
      // إعادة تعيين الإعدادات إلى القيم الافتراضية
      setGeneralSettings({
        systemName: "نظام إدارة المشرفين والملاحظين",
        collegeName: "كلية الهندسة - جامعة تعز",
        maxConsecutiveAbsences: 2,
        autoSuspendEnabled: true,
        enableNotifications: true,
        defaultExamPeriod: "morning",
        workingDays: ["sunday", "monday", "tuesday", "wednesday", "thursday"],
        academicYear: "2024-2025",
      });

      setDistributionSettings({
        prioritizeCollegeEmployees: true,
        allowObserverOverride: true,
        maxSupervisorsPerHall: 3,
        maxObserversPerHall: 5,
        enableFairRotation: true,
        allowTempAssignments: true,
        requireAllHallsCovered: false,
        autoReplaceAbsent: true,
      });

      setSystemSettings({
        sessionTimeout: 120,
        enableBackup: true,
        backupFrequency: "daily",
        logLevel: "info",
        enableAuditLog: true,
        maintenanceMode: false,
        allowMultipleSessions: false,
        passwordExpiry: 90,
      });

      setNotificationSettings({
        emailNotifications: true,
        smsNotifications: false,
        webNotifications: true,
        notifyAbsence: true,
        notifyShortage: true,
        notifyReplacements: true,
        notifySystemMaintenance: true,
        adminEmail: "admin@taizu.edu.ye",
        adminPhone: "",
      });

      setNotifications((prev) => [
        ...prev,
        {
          type: "info",
          message: "تم إعادة تعيين الإعدادات إلى القيم الافتراضية",
        },
      ]);
    }
  };

  const handleBackupData = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setNotifications((prev) => [
        ...prev,
        {
          type: "success",
          message: "تم إنشاء نسخة احتياطية بنجاح",
        },
      ]);
    } catch (error) {
      setNotifications((prev) => [
        ...prev,
        {
          type: "error",
          message: "خطأ في إنشاء النسخة الاحتياطية",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreData = () => {
    if (
      window.confirm(
        "هل أنت متأكد من رغبتك في استعادة البيانات؟ سيتم استبدال البيانات الحالية."
      )
    ) {
      alert("وظيفة استعادة البيانات ستتم إضافتها لاحقاً");
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم؟")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setNotifications((prev) => [
        ...prev,
        {
          type: "success",
          message: "تم حذف المستخدم بنجاح",
        },
      ]);
    }
  };

  const handleToggleUserStatus = (userId) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, active: !user.active } : user
      )
    );
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (userData) => {
    if (currentUser) {
      // تعديل مستخدم موجود
      setUsers((prev) =>
        prev.map((user) =>
          user.id === currentUser.id ? { ...user, ...userData } : user
        )
      );
    } else {
      // إضافة مستخدم جديد
      const newUser = {
        ...userData,
        id: Math.max(...users.map((u) => u.id)) + 1,
        createdAt: new Date().toISOString().split("T")[0],
        lastLogin: null,
      };
      setUsers((prev) => [...prev, newUser]);
    }
    setIsUserModalOpen(false);
    setNotifications((prev) => [
      ...prev,
      {
        type: "success",
        message: currentUser
          ? "تم تعديل المستخدم بنجاح"
          : "تم إضافة المستخدم بنجاح",
      },
    ]);
  };

  const handleRefresh = () => {
    loadSettings();
    loadUsers();
  };

  const translateRole = (role) => {
    switch (role) {
      case "admin":
        return "مدير النظام";
      case "data_entry":
        return "مشرف إدخال البيانات";
      case "monitor":
        return "مراقب";
      default:
        return role;
    }
  };

  return (
    <div className="settings-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="settings" />
      <div className="settings-main">
        <Header title="الإعدادات" onRefresh={handleRefresh} />

        <div className="settings-content">
          {/* التنبيهات */}
          {notifications.length > 0 && (
            <div className="notifications">
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification ${notification.type}`}
                >
                  <span className="notification-icon">
                    {notification.type === "success"
                      ? "✅"
                      : notification.type === "error"
                      ? "❌"
                      : "ℹ️"}
                  </span>
                  <p>{notification.message}</p>
                  <button
                    className="notification-close"
                    onClick={() =>
                      setNotifications((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* تبويبات الإعدادات */}
          <div className="settings-tabs">
            <button
              className={`tab-button ${
                activeTab === "general" ? "active" : ""
              }`}
              onClick={() => setActiveTab("general")}
            >
              🏢 الإعدادات العامة
            </button>
            <button
              className={`tab-button ${
                activeTab === "distribution" ? "active" : ""
              }`}
              onClick={() => setActiveTab("distribution")}
            >
              📋 إعدادات التوزيع
            </button>
            <button
              className={`tab-button ${activeTab === "system" ? "active" : ""}`}
              onClick={() => setActiveTab("system")}
            >
              ⚙️ إعدادات النظام
            </button>
            <button
              className={`tab-button ${
                activeTab === "notifications" ? "active" : ""
              }`}
              onClick={() => setActiveTab("notifications")}
            >
              🔔 الإشعارات
            </button>
            <button
              className={`tab-button ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              👥 إدارة المستخدمين
            </button>
            <button
              className={`tab-button ${activeTab === "backup" ? "active" : ""}`}
              onClick={() => setActiveTab("backup")}
            >
              💾 النسخ الاحتياطي
            </button>
          </div>

          {/* محتوى التبويبات */}
          <div className="settings-tab-content">
            {/* الإعدادات العامة */}
            {activeTab === "general" && (
              <div className="settings-section">
                <h3>الإعدادات العامة للنظام</h3>

                <div className="form-group">
                  <label>اسم النظام</label>
                  <input
                    type="text"
                    value={generalSettings.systemName}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        systemName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>اسم الكلية</label>
                  <input
                    type="text"
                    value={generalSettings.collegeName}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        collegeName: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>السنة الدراسية</label>
                  <input
                    type="text"
                    value={generalSettings.academicYear}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        academicYear: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>عدد أيام الغياب المتتالية المسموحة</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={generalSettings.maxConsecutiveAbsences}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        maxConsecutiveAbsences: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>الفترة الافتراضية للامتحانات</label>
                  <select
                    value={generalSettings.defaultExamPeriod}
                    onChange={(e) =>
                      setGeneralSettings((prev) => ({
                        ...prev,
                        defaultExamPeriod: e.target.value,
                      }))
                    }
                  >
                    <option value="morning">صباحية</option>
                    <option value="evening">مسائية</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={generalSettings.autoSuspendEnabled}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          autoSuspendEnabled: e.target.checked,
                        }))
                      }
                    />
                    تفعيل التعليق التلقائي عند تجاوز أيام الغياب
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={generalSettings.enableNotifications}
                      onChange={(e) =>
                        setGeneralSettings((prev) => ({
                          ...prev,
                          enableNotifications: e.target.checked,
                        }))
                      }
                    />
                    تفعيل الإشعارات
                  </label>
                </div>

                <div className="form-group">
                  <label>أيام العمل</label>
                  <div className="working-days">
                    {[
                      { value: "sunday", label: "الأحد" },
                      { value: "monday", label: "الاثنين" },
                      { value: "tuesday", label: "الثلاثاء" },
                      { value: "wednesday", label: "الأربعاء" },
                      { value: "thursday", label: "الخميس" },
                      { value: "friday", label: "الجمعة" },
                      { value: "saturday", label: "السبت" },
                    ].map((day) => (
                      <label key={day.value} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={generalSettings.workingDays.includes(
                            day.value
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGeneralSettings((prev) => ({
                                ...prev,
                                workingDays: [...prev.workingDays, day.value],
                              }));
                            } else {
                              setGeneralSettings((prev) => ({
                                ...prev,
                                workingDays: prev.workingDays.filter(
                                  (d) => d !== day.value
                                ),
                              }));
                            }
                          }}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* إعدادات التوزيع */}
            {activeTab === "distribution" && (
              <div className="settings-section">
                <h3>إعدادات التوزيع</h3>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={distributionSettings.prioritizeCollegeEmployees}
                      onChange={(e) =>
                        setDistributionSettings((prev) => ({
                          ...prev,
                          prioritizeCollegeEmployees: e.target.checked,
                        }))
                      }
                    />
                    إعطاء أولوية لموظفي الكلية
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={distributionSettings.enableFairRotation}
                      onChange={(e) =>
                        setDistributionSettings((prev) => ({
                          ...prev,
                          enableFairRotation: e.target.checked,
                        }))
                      }
                    />
                    تفعيل المناوبة العادلة للموظفين الخارجيين
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={distributionSettings.allowTempAssignments}
                      onChange={(e) =>
                        setDistributionSettings((prev) => ({
                          ...prev,
                          allowTempAssignments: e.target.checked,
                        }))
                      }
                    />
                    السماح بالتعيينات المؤقتة
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={distributionSettings.autoReplaceAbsent}
                      onChange={(e) =>
                        setDistributionSettings((prev) => ({
                          ...prev,
                          autoReplaceAbsent: e.target.checked,
                        }))
                      }
                    />
                    الاستبدال التلقائي للغائبين
                  </label>
                </div>

                <div className="form-group">
                  <label>الحد الأقصى للمشرفين في القاعة الواحدة</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={distributionSettings.maxSupervisorsPerHall}
                    onChange={(e) =>
                      setDistributionSettings((prev) => ({
                        ...prev,
                        maxSupervisorsPerHall: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>الحد الأقصى للملاحظين في القاعة الواحدة</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={distributionSettings.maxObserversPerHall}
                    onChange={(e) =>
                      setDistributionSettings((prev) => ({
                        ...prev,
                        maxObserversPerHall: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {/* إعدادات النظام */}
            {activeTab === "system" && (
              <div className="settings-section">
                <h3>إعدادات النظام</h3>

                <div className="form-group">
                  <label>مهلة انتهاء الجلسة (بالدقائق)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>انتهاء صلاحية كلمة المرور (بالأيام)</label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={systemSettings.passwordExpiry}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        passwordExpiry: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>تكرار النسخ الاحتياطي</label>
                  <select
                    value={systemSettings.backupFrequency}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        backupFrequency: e.target.value,
                      }))
                    }
                  >
                    <option value="daily">يومياً</option>
                    <option value="weekly">أسبوعياً</option>
                    <option value="monthly">شهرياً</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>مستوى السجلات</label>
                  <select
                    value={systemSettings.logLevel}
                    onChange={(e) =>
                      setSystemSettings((prev) => ({
                        ...prev,
                        logLevel: e.target.value,
                      }))
                    }
                  >
                    <option value="error">أخطاء فقط</option>
                    <option value="warning">تحذيرات وأخطاء</option>
                    <option value="info">معلومات وتحذيرات وأخطاء</option>
                    <option value="debug">جميع السجلات</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableBackup}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          enableBackup: e.target.checked,
                        }))
                      }
                    />
                    تفعيل النسخ الاحتياطي التلقائي
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={systemSettings.enableAuditLog}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          enableAuditLog: e.target.checked,
                        }))
                      }
                    />
                    تفعيل سجل المراجعة
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={systemSettings.allowMultipleSessions}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          allowMultipleSessions: e.target.checked,
                        }))
                      }
                    />
                    السماح بعدة جلسات للمستخدم الواحد
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          maintenanceMode: e.target.checked,
                        }))
                      }
                    />
                    وضع الصيانة
                  </label>
                </div>
              </div>
            )}

            {/* إعدادات الإشعارات */}
            {activeTab === "notifications" && (
              <div className="settings-section">
                <h3>إعدادات الإشعارات</h3>

                <div className="form-group">
                  <label>البريد الإلكتروني للمسؤول</label>
                  <input
                    type="email"
                    value={notificationSettings.adminEmail}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        adminEmail: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>رقم هاتف المسؤول</label>
                  <input
                    type="tel"
                    value={notificationSettings.adminPhone}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        adminPhone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          emailNotifications: e.target.checked,
                        }))
                      }
                    />
                    تفعيل إشعارات البريد الإلكتروني
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          smsNotifications: e.target.checked,
                        }))
                      }
                    />
                    تفعيل إشعارات الرسائل النصية
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.webNotifications}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          webNotifications: e.target.checked,
                        }))
                      }
                    />
                    تفعيل الإشعارات على الموقع
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyAbsence}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          notifyAbsence: e.target.checked,
                        }))
                      }
                    />
                    إشعار عند حدوث غياب
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyShortage}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          notifyShortage: e.target.checked,
                        }))
                      }
                    />
                    إشعار عند نقص العدد المطلوب
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifyReplacements}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          notifyReplacements: e.target.checked,
                        }))
                      }
                    />
                    إشعار عند إجراء استبدال
                  </label>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={notificationSettings.notifySystemMaintenance}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          notifySystemMaintenance: e.target.checked,
                        }))
                      }
                    />
                    إشعار صيانة النظام
                  </label>
                </div>
              </div>
            )}

            {/* إدارة المستخدمين */}
            {activeTab === "users" && (
              <div className="settings-section">
                <div className="section-header">
                  <h3>إدارة المستخدمين</h3>
                  <button className="add-user-btn" onClick={handleAddUser}>
                    <span className="add-icon">+</span> إضافة مستخدم
                  </button>
                </div>

                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>اسم المستخدم</th>
                        <th>الدور</th>
                        <th>الحالة</th>
                        <th>آخر تسجيل دخول</th>
                        <th>تاريخ الإنشاء</th>
                        <th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.username}</td>
                          <td>{translateRole(user.role)}</td>
                          <td>
                            <span
                              className={`status-badge ${
                                user.active
                                  ? "status-active"
                                  : "status-inactive"
                              }`}
                            >
                              {user.active ? "نشط" : "معطل"}
                            </span>
                          </td>
                          <td>{user.lastLogin || "لم يسجل دخول"}</td>
                          <td>{user.createdAt}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEditUser(user)}
                                title="تعديل"
                              >
                                ✏️
                              </button>
                              <button
                                className={`action-btn ${
                                  user.active ? "disable-btn" : "enable-btn"
                                }`}
                                onClick={() => handleToggleUserStatus(user.id)}
                                title={user.active ? "تعطيل" : "تفعيل"}
                              >
                                {user.active ? "⏸️" : "▶️"}
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDeleteUser(user.id)}
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
              </div>
            )}

            {/* النسخ الاحتياطي */}
            {activeTab === "backup" && (
              <div className="settings-section">
                <h3>النسخ الاحتياطي واستعادة البيانات</h3>

                <div className="backup-section">
                  <h4>إنشاء نسخة احتياطية</h4>
                  <p>
                    يمكنك إنشاء نسخة احتياطية من جميع بيانات النظام للحفاظ على
                    البيانات وإمكانية استعادتها لاحقاً.
                  </p>

                  <div className="backup-actions">
                    <button
                      className="backup-btn create-backup"
                      onClick={handleBackupData}
                      disabled={isLoading}
                    >
                      💾 إنشاء نسخة احتياطية
                    </button>
                  </div>
                </div>

                <div className="backup-section">
                  <h4>استعادة البيانات</h4>
                  <p>
                    يمكنك استعادة البيانات من نسخة احتياطية سابقة. تحذير: سيتم
                    استبدال البيانات الحالية.
                  </p>

                  <div className="backup-actions">
                    <button
                      className="backup-btn restore-backup"
                      onClick={handleRestoreData}
                      disabled={isLoading}
                    >
                      📂 استعادة من نسخة احتياطية
                    </button>
                  </div>
                </div>

                <div className="backup-section">
                  <h4>الإعدادات التلقائية</h4>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={systemSettings.enableBackup}
                        onChange={(e) =>
                          setSystemSettings((prev) => ({
                            ...prev,
                            enableBackup: e.target.checked,
                          }))
                        }
                      />
                      تفعيل النسخ الاحتياطي التلقائي
                    </label>
                  </div>

                  <div className="form-group">
                    <label>تكرار النسخ الاحتياطي</label>
                    <select
                      value={systemSettings.backupFrequency}
                      onChange={(e) =>
                        setSystemSettings((prev) => ({
                          ...prev,
                          backupFrequency: e.target.value,
                        }))
                      }
                      disabled={!systemSettings.enableBackup}
                    >
                      <option value="daily">يومياً</option>
                      <option value="weekly">أسبوعياً</option>
                      <option value="monthly">شهرياً</option>
                    </select>
                  </div>

                  <div className="backup-info">
                    <h5>معلومات النسخ الاحتياطي:</h5>
                    <ul>
                      <li>آخر نسخة احتياطية: لم يتم إنشاء نسخ احتياطية بعد</li>
                      <li>حجم البيانات المقدر: 2.5 ميجابايت</li>
                      <li>مكان الحفظ: مجلد النظام المحلي</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* أزرار الحفظ والإعدادات */}
          <div className="settings-actions">
            <button
              className="save-settings-btn"
              onClick={handleSaveSettings}
              disabled={isLoading}
            >
              {isLoading ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
            </button>

            <button
              className="reset-settings-btn"
              onClick={handleResetSettings}
              disabled={isLoading}
            >
              🔄 إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* نافذة إضافة/تعديل مستخدم */}
      {isUserModalOpen && (
        <UserFormModal
          user={currentUser}
          onClose={() => setIsUserModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}

      {/* شاشة التحميل */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <h3>جاري المعالجة...</h3>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون نافذة إضافة/تعديل المستخدم
const UserFormModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user ? user.username : "",
    role: user ? user.role : "monitor",
    active: user ? user.active : true,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // مسح الخطأ عند التعديل
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "اسم المستخدم مطلوب";
    } else if (formData.username.length < 3) {
      newErrors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
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
          <h2>{user ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="username">اسم المستخدم</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? "error" : ""}
            />
            {errors.username && (
              <span className="error-message">{errors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role">الدور</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="admin">مدير النظام</option>
              <option value="data_entry">مشرف إدخال البيانات</option>
              <option value="monitor">مراقب</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="active"
                checked={formData.active}
                onChange={handleChange}
              />
              المستخدم نشط
            </label>
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

export default Settings;
