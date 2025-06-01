import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import reportsService from "../../services/reportsService";
import "./Reports.css";

const Reports = ({ onLogout }) => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // آخر 30 يوم
    endDate: new Date().toISOString().split("T")[0],
  });

  // بيانات التقارير
  const [reportData, setReportData] = useState({
    overview: null,
    attendance: [],
    hallUsage: [],
    replacements: [],
    monthlyDistribution: [],
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    setUserName(user.username || "المستخدم");
  }, []);

  useEffect(() => {
    loadReportData();
  }, [selectedReport, dateRange]);

  const loadReportData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filters = {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      };

      let data;
      switch (selectedReport) {
        case "overview":
          data = await reportsService.getOverview(filters);
          setReportData((prev) => ({ ...prev, overview: data }));
          break;
        case "attendance":
          data = await reportsService.getAttendanceReport(filters);
          setReportData((prev) => ({ ...prev, attendance: data }));
          break;
        case "hall-usage":
          data = await reportsService.getHallUsageReport(filters);
          setReportData((prev) => ({ ...prev, hallUsage: data }));
          break;
        case "replacements":
          data = await reportsService.getReplacementReport(filters);
          setReportData((prev) => ({ ...prev, replacements: data }));
          break;
        case "distribution":
          const currentYear = new Date().getFullYear();
          data = await reportsService.getMonthlyDistribution({
            year: currentYear,
          });
          setReportData((prev) => ({ ...prev, monthlyDistribution: data }));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      setError(error.message || "فشل في تحميل البيانات من الخادم");
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

  const handleExportReport = async (format) => {
    try {
      const exportData = {
        report_type: selectedReport,
        format: format,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      };

      await reportsService.exportReport(exportData);
      alert(
        `تم طلب تصدير التقرير بصيغة ${format === "pdf" ? "PDF" : "Excel"} بنجاح`
      );
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("فشل في تصدير التقرير: " + error.message);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const getAttendanceColor = (rate) => {
    return reportsService.getAttendanceColor(rate);
  };

  const getUtilizationColor = (rate) => {
    return reportsService.getUtilizationColor(rate);
  };

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="reports-container">
        <Sidebar userName={userName} onLogout={onLogout} activePage="reports" />
        <div className="reports-main">
          <Header title="التقارير والإحصائيات" onRefresh={handleRefresh} />

          <div className="reports-content">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "60vh",
                padding: "20px",
                textAlign: "center",
                backgroundColor: "white",
                borderRadius: "10px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ fontSize: "4rem", marginBottom: "20px" }}>❌</div>
              <h2 style={{ color: "#e74c3c", marginBottom: "10px" }}>
                فشل في تحميل التقارير
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
      </div>
    );
  }

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

              {selectedReport !== "distribution" && (
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
              )}
            </div>

            <div className="report-actions">
              <button
                className="export-btn pdf"
                onClick={() => handleExportReport("pdf")}
                disabled={isLoading}
              >
                📄 تصدير PDF
              </button>
              <button
                className="export-btn excel"
                onClick={() => handleExportReport("excel")}
                disabled={isLoading}
              >
                📊 تصدير Excel
              </button>
              <button
                className="print-btn"
                onClick={handlePrintReport}
                disabled={isLoading}
              >
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
              {selectedReport === "overview" && reportData.overview && (
                <div className="report-section">
                  <h2>نظرة عامة على النظام</h2>

                  <div className="overview-stats">
                    <div className="overview-card">
                      <div className="card-icon supervisors">👨‍🏫</div>
                      <div className="card-content">
                        <h3>إجمالي المشرفين</h3>
                        <p className="big-number">
                          {reportData.overview.totalSupervisors}
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon observers">👁️</div>
                      <div className="card-content">
                        <h3>إجمالي الملاحظين</h3>
                        <p className="big-number">
                          {reportData.overview.totalObservers}
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon halls">🏢</div>
                      <div className="card-content">
                        <h3>إجمالي القاعات</h3>
                        <p className="big-number">
                          {reportData.overview.totalHalls}
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon exams">📝</div>
                      <div className="card-content">
                        <h3>إجمالي الامتحانات</h3>
                        <p className="big-number">
                          {reportData.overview.totalExams}
                        </p>
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
                              reportData.overview.attendanceRate
                            ),
                          }}
                        >
                          {reportData.overview.attendanceRate}%
                        </p>
                      </div>
                    </div>

                    <div className="overview-card">
                      <div className="card-icon replacement">🔄</div>
                      <div className="card-content">
                        <h3>معدل الاستبدال</h3>
                        <p className="big-number">
                          {reportData.overview.replacementRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="summary-details">
                    <div className="detail-card">
                      <h4>أكثر القاعات استخداماً</h4>
                      <p className="highlight">
                        {reportData.overview.mostUsedHall}
                      </p>
                    </div>
                    <div className="detail-card">
                      <h4>أكثر المشرفين نشاطاً</h4>
                      <p className="highlight">
                        {reportData.overview.mostActiveSupervisor}
                      </p>
                    </div>
                    <div className="detail-card">
                      <h4>متوسط المشرفين لكل امتحان</h4>
                      <p className="highlight">
                        {reportData.overview.avgSupervisorsPerExam}
                      </p>
                    </div>
                    <div className="detail-card">
                      <h4>متوسط الملاحظين لكل امتحان</h4>
                      <p className="highlight">
                        {reportData.overview.avgObserversPerExam}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* تقرير الحضور والغياب */}
              {selectedReport === "attendance" && (
                <div className="report-section">
                  <h2>تقرير الحضور والغياب</h2>

                  {reportData.attendance.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <p>لا توجد بيانات حضور وغياب للفترة المحددة</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>الاسم</th>
                            <th>النوع</th>
                            <th>الرتبة</th>
                            <th>إجمالي الأيام</th>
                            <th>أيام الحضور</th>
                            <th>أيام الغياب</th>
                            <th>معدل الحضور</th>
                            <th>الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.attendance.map((person, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{person.name}</strong>
                              </td>
                              <td>
                                {reportsService.translateUserType(person.type)}
                              </td>
                              <td>
                                {reportsService.translateUserRank(person.rank)}
                              </td>
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
                              <td>
                                {reportsService.translateUserStatus(
                                  person.status
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* تقرير استخدام القاعات */}
              {selectedReport === "hall-usage" && (
                <div className="report-section">
                  <h2>تقرير استخدام القاعات</h2>

                  {reportData.hallUsage.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <p>لا توجد بيانات استخدام قاعات للفترة المحددة</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="report-table">
                        <thead>
                          <tr>
                            <th>اسم القاعة</th>
                            <th>المبنى</th>
                            <th>الدور</th>
                            <th>السعة</th>
                            <th>عدد مرات الاستخدام</th>
                            <th>معدل الاستخدام</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.hallUsage.map((hall, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{hall.hallName}</strong>
                              </td>
                              <td>{hall.building}</td>
                              <td>{hall.floor}</td>
                              <td>{hall.capacity}</td>
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
                  )}
                </div>
              )}

              {/* تقرير الاستبدالات */}
              {selectedReport === "replacements" && (
                <div className="report-section">
                  <h2>تقرير الاستبدالات</h2>

                  {reportData.replacements.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <p>لا توجد بيانات استبدالات للفترة المحددة</p>
                    </div>
                  ) : (
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
                            <th>نوع المستخدم</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.replacements.map((replacement, index) => (
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
                              <td>{replacement.userType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* التوزيع الشهري */}
              {selectedReport === "distribution" && (
                <div className="report-section">
                  <h2>تقرير التوزيع الشهري</h2>

                  {reportData.monthlyDistribution.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                      <p>لا توجد بيانات توزيع شهري</p>
                    </div>
                  ) : (
                    <div className="distribution-chart">
                      <div className="chart-container">
                        {reportData.monthlyDistribution.map((data, index) => (
                          <div key={index} className="month-data">
                            <h4>{data.monthName || data.month}</h4>
                            <div className="month-stats">
                              <div className="stat-item">
                                <span className="stat-label">
                                  أيام المشرفين:
                                </span>
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
                                    width: `${Math.min(
                                      (data.supervisorDays / 200) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill observers"
                                  style={{
                                    width: `${Math.min(
                                      (data.observerDays / 300) * 100,
                                      100
                                    )}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
