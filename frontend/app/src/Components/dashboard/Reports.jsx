import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "./Reports.css";

const Reports = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // آخر 30 يوم
    endDate: new Date().toISOString().split("T")[0],
  });

  // بيانات الإحصائيات
  const [overviewStats, setOverviewStats] = useState({
    totalSupervisors: 25,
    totalObservers: 40,
    totalHalls: 15,
    totalExams: 45,
    attendanceRate: 92.5,
    avgSupervisorsPerExam: 8.2,
    avgObserversPerExam: 14.5,
    mostUsedHall: "قاعة 101",
    mostActiveSupervisor: "د. أحمد محمد",
    replacementRate: 7.3,
  });

  const [attendanceData, setAttendanceData] = useState([
    {
      name: "د. أحمد محمد علي",
      type: "مشرف",
      totalDays: 15,
      attendedDays: 14,
      absenceDays: 1,
      attendanceRate: 93.3,
    },
    {
      name: "د. خالد عبدالله",
      type: "مشرف",
      totalDays: 12,
      attendedDays: 12,
      absenceDays: 0,
      attendanceRate: 100,
    },
    {
      name: "أ. فاطمة أحمد",
      type: "ملاحظ",
      totalDays: 18,
      attendedDays: 16,
      absenceDays: 2,
      attendanceRate: 88.9,
    },
    {
      name: "أ. سارة محمد",
      type: "ملاحظ",
      totalDays: 20,
      attendedDays: 19,
      absenceDays: 1,
      attendanceRate: 95.0,
    },
    {
      name: "م. محمد سعيد",
      type: "مشرف",
      totalDays: 10,
      attendedDays: 8,
      absenceDays: 2,
      attendanceRate: 80.0,
    },
  ]);

  const [hallUsageData, setHallUsageData] = useState([
    {
      hallName: "قاعة 101",
      building: "مبنى الكهرباء",
      floor: "الدور الأول",
      usageCount: 25,
      utilizationRate: 85.5,
    },
    {
      hallName: "قاعة 201",
      building: "مبنى الكهرباء",
      floor: "الدور الثاني",
      usageCount: 22,
      utilizationRate: 78.2,
    },
    {
      hallName: "قاعة 301",
      building: "مبنى الكهرباء",
      floor: "الدور الثالث",
      usageCount: 18,
      utilizationRate: 62.1,
    },
    {
      hallName: "قاعة 101م",
      building: "مبنى المدني",
      floor: "الدور الأول",
      usageCount: 20,
      utilizationRate: 74.1,
    },
    {
      hallName: "قاعة 201م",
      building: "مبنى المدني",
      floor: "الدور الثاني",
      usageCount: 15,
      utilizationRate: 55.6,
    },
  ]);

  const [replacementData, setReplacementData] = useState([
    {
      date: "2023-05-20",
      hallName: "قاعة 101",
      originalUser: "د. أحمد محمد",
      replacementUser: "د. خالد عبدالله",
      reason: "غياب طارئ",
      type: "تلقائي",
    },
    {
      date: "2023-05-19",
      hallName: "قاعة 201",
      originalUser: "أ. فاطمة أحمد",
      replacementUser: "أ. سارة محمد",
      reason: "اعتذار مسبق",
      type: "يدوي",
    },
    {
      date: "2023-05-18",
      hallName: "قاعة 301",
      originalUser: "م. محمد سعيد",
      replacementUser: "د. عمر خالد",
      reason: "غياب طارئ",
      type: "تلقائي",
    },
  ]);

  const [distributionData, setDistributionData] = useState([
    { month: "يناير", supervisorDays: 120, observerDays: 200, totalExams: 25 },
    { month: "فبراير", supervisorDays: 135, observerDays: 215, totalExams: 28 },
    { month: "مارس", supervisorDays: 145, observerDays: 230, totalExams: 30 },
    { month: "أبريل", supervisorDays: 150, observerDays: 240, totalExams: 32 },
    { month: "مايو", supervisorDays: 160, observerDays: 250, totalExams: 35 },
  ]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // محاكاة تحميل البيانات من API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // هنا يتم تحميل البيانات الفعلية من API حسب التقرير المحدد
    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadReportData();
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExportReport = (format) => {
    // في التطبيق الحقيقي، سيتم تصدير التقرير بالصيغة المحددة
    alert(`سيتم تصدير التقرير بصيغة ${format === "pdf" ? "PDF" : "Excel"}`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 95) return "#27ae60";
    if (rate >= 85) return "#f39c12";
    return "#e74c3c";
  };

  const getUtilizationColor = (rate) => {
    if (rate >= 80) return "#27ae60";
    if (rate >= 60) return "#f39c12";
    return "#e74c3c";
  };

  return (
    <div className="reports-container">
      <Sidebar userName={userName} onLogout={onLogout} activePage="reports" />
      <div className="reports-main">
        <Header title="التقارير والإحصائيات" onRefresh={handleRefresh} />

        <div className="reports-content">
          {/* شريط التحكم */}
          <div className="reports-controls">
            <div className="report-selector">
              <div className="filter-group">
                <label>نوع التقرير:</label>
                <select
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value)}
                >
                  <option value="overview">نظرة عامة</option>
                  <option value="attendance">تقرير الحضور والغياب</option>
                  <option value="hall-usage">استخدام القاعات</option>
                  <option value="replacements">تقرير الاستبدالات</option>
                  <option value="distribution">توزيع شهري</option>
                </select>
              </div>

              <div className="date-range-selector">
                <div className="filter-group">
                  <label>من تاريخ:</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) =>
                      handleDateRangeChange("startDate", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>إلى تاريخ:</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) =>
                      handleDateRangeChange("endDate", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button
                className="export-btn pdf"
                onClick={() => handleExportReport("pdf")}
              >
                📄 تصدير PDF
              </button>
              <button
                className="export-btn excel"
                onClick={() => handleExportReport("excel")}
              >
                📊 تصدير Excel
              </button>
              <button className="print-btn" onClick={handlePrintReport}>
                🖨️ طباعة
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>جاري تحميل التقرير...</p>
            </div>
          ) : (
            <>
              {/* نظرة عامة */}
              {selectedReport === "overview" && (
                <div className="report-section">
                  <h2>نظرة عامة على النظام</h2>

                  <div className="overview-stats">
                    <div className="overview-card">
                      <div className="card-icon supervisors">👨‍🏫</div>
                      <div className="card-content">
                        <h3>إجمالي المشرفين</h3>
                        <p className="big-number">
                          {overviewStats.totalSupervisors}
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon observers">👁️</div>
                      <div className="card-content">
                        <h3>إجمالي الملاحظين</h3>
                        <p className="big-number">
                          {overviewStats.totalObservers}
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon halls">🏢</div>
                      <div className="card-content">
                        <h3>إجمالي القاعات</h3>
                        <p className="big-number">{overviewStats.totalHalls}</p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon exams">📝</div>
                      <div className="card-content">
                        <h3>إجمالي الامتحانات</h3>
                        <p className="big-number">{overviewStats.totalExams}</p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon attendance">📈</div>
                      <div className="card-content">
                        <h3>معدل الحضور</h3>
                        <p
                          className="big-number"
                          style={{
                            color: getAttendanceColor(
                              overviewStats.attendanceRate
                            ),
                          }}
                        >
                          {overviewStats.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon replacement">🔄</div>
                      <div className="card-content">
                        <h3>معدل الاستبدال</h3>
                        <p className="big-number">
                          {overviewStats.replacementRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="summary-details">
                    <div className="detail-card">
                      <h4>أكثر القاعات استخداماً</h4>
                      <p className="highlight">{overviewStats.mostUsedHall}</p>
                    </div>
                    <div className="detail-card">
                      <h4>أكثر المشرفين نشاطاً</h4>
                      <p className="highlight">
                        {overviewStats.mostActiveSupervisor}
                      </p>
                    </div>
                    <div className="detail-card">
                      <h4>متوسط المشرفين لكل امتحان</h4>
                      <p className="highlight">
                        {overviewStats.avgSupervisorsPerExam}
                      </p>
                    </div>
                    <div className="detail-card">
                      <h4>متوسط الملاحظين لكل امتحان</h4>
                      <p className="highlight">
                        {overviewStats.avgObserversPerExam}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* تقرير الحضور والغياب */}
              {selectedReport === "attendance" && (
                <div className="report-section">
                  <h2>تقرير الحضور والغياب</h2>

                  <div className="table-container">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>الاسم</th>
                          <th>النوع</th>
                          <th>إجمالي الأيام</th>
                          <th>أيام الحضور</th>
                          <th>أيام الغياب</th>
                          <th>معدل الحضور</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceData.map((person, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{person.name}</strong>
                            </td>
                            <td>{person.type}</td>
                            <td>{person.totalDays}</td>
                            <td className="attendance-good">
                              {person.attendedDays}
                            </td>
                            <td className="attendance-bad">
                              {person.absenceDays}
                            </td>
                            <td>
                              <span
                                className="attendance-rate"
                                style={{
                                  color: getAttendanceColor(
                                    person.attendanceRate
                                  ),
                                }}
                              >
                                {person.attendanceRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* تقرير استخدام القاعات */}
              {selectedReport === "hall-usage" && (
                <div className="report-section">
                  <h2>تقرير استخدام القاعات</h2>

                  <div className="table-container">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>اسم القاعة</th>
                          <th>المبنى</th>
                          <th>الدور</th>
                          <th>عدد مرات الاستخدام</th>
                          <th>معدل الاستخدام</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hallUsageData.map((hall, index) => (
                          <tr key={index}>
                            <td>
                              <strong>{hall.hallName}</strong>
                            </td>
                            <td>{hall.building}</td>
                            <td>{hall.floor}</td>
                            <td>{hall.usageCount}</td>
                            <td>
                              <span
                                className="utilization-rate"
                                style={{
                                  color: getUtilizationColor(
                                    hall.utilizationRate
                                  ),
                                }}
                              >
                                {hall.utilizationRate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* تقرير الاستبدالات */}
              {selectedReport === "replacements" && (
                <div className="report-section">
                  <h2>تقرير الاستبدالات</h2>

                  <div className="table-container">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>التاريخ</th>
                          <th>القاعة</th>
                          <th>المستخدم الأصلي</th>
                          <th>المستخدم البديل</th>
                          <th>السبب</th>
                          <th>نوع الاستبدال</th>
                        </tr>
                      </thead>
                      <tbody>
                        {replacementData.map((replacement, index) => (
                          <tr key={index}>
                            <td>{replacement.date}</td>
                            <td>{replacement.hallName}</td>
                            <td>
                              <strong>{replacement.originalUser}</strong>
                            </td>
                            <td className="replacement-user">
                              {replacement.replacementUser}
                            </td>
                            <td>{replacement.reason}</td>
                            <td>
                              <span
                                className={`replacement-type ${
                                  replacement.type === "تلقائي"
                                    ? "automatic"
                                    : "manual"
                                }`}
                              >
                                {replacement.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* التوزيع الشهري */}
              {selectedReport === "distribution" && (
                <div className="report-section">
                  <h2>تقرير التوزيع الشهري</h2>

                  <div className="distribution-chart">
                    <div className="chart-container">
                      {distributionData.map((data, index) => (
                        <div key={index} className="month-data">
                          <h4>{data.month}</h4>
                          <div className="month-stats">
                            <div className="stat-item">
                              <span className="stat-label">أيام المشرفين:</span>
                              <span className="stat-value">
                                {data.supervisorDays}
                              </span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">
                                أيام الملاحظين:
                              </span>
                              <span className="stat-value">
                                {data.observerDays}
                              </span>
                            </div>
                            <div className="stat-item">
                              <span className="stat-label">
                                عدد الامتحانات:
                              </span>
                              <span className="stat-value">
                                {data.totalExams}
                              </span>
                            </div>
                          </div>
                          <div className="progress-bars">
                            <div className="progress-bar">
                              <div
                                className="progress-fill supervisors"
                                style={{
                                  width: `${
                                    (data.supervisorDays / 200) * 100
                                  }%`,
                                }}
                              ></div>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill observers"
                                style={{
                                  width: `${(data.observerDays / 300) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
