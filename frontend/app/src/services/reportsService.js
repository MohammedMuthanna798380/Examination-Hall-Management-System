// frontend/app/src/services/reportsService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function للحصول على token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function للطلبات
const makeRequest = async (url, options = {}) => {
    const token = getAuthToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include',
        ...options,
    };

    try {
        console.log(`🔄 طلب التقارير ${options.method || 'GET'} إلى: ${API_BASE_URL}${url}`);
        if (options.body) {
            console.log('📤 البيانات المرسلة:', JSON.parse(options.body));
        }

        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
        console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            try {
                responseData = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`الخادم أرجع استجابة غير صالحة: ${textResponse.substring(0, 200)}...`);
            }
        }

        console.log('📥 البيانات المستلمة:', responseData);

        if (!response.ok) {
            if (response.status === 422 && responseData.errors) {
                const errorMessages = Object.values(responseData.errors).flat().join(', ');
                throw new Error(errorMessages);
            } else if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.');
            } else if (response.status === 403) {
                throw new Error('غير مصرح لك بتنفيذ هذا الإجراء');
            } else if (response.status === 404) {
                throw new Error('البيانات المطلوبة غير موجودة');
            } else if (response.status >= 500) {
                throw new Error(responseData.message || 'خطأ في الخادم. يرجى المحاولة لاحقاً.');
            } else {
                throw new Error(responseData.message || `خطأ HTTP: ${response.status}`);
            }
        }

        if (responseData && typeof responseData === 'object' && responseData.status === false) {
            throw new Error(responseData.message || 'فشل في معالجة الطلب');
        }

        return responseData;
    } catch (error) {
        console.error(`❌ خطأ في الطلب ${url}:`, error);

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
        }

        throw new Error(error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم');
    }
};

// Reports API functions
export const reportsService = {
    // الحصول على نظرة عامة للنظام
    getOverview: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);

            const url = `/reports/overview${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const overviewData = response.data || {};
            console.log('✅ تم جلب نظرة عامة النظام بنجاح');
            return overviewData;
        } catch (error) {
            console.error('❌ خطأ في جلب نظرة عامة النظام:', error);
            throw new Error(error.message || 'فشل في جلب نظرة عامة النظام');
        }
    },

    // الحصول على تقرير الحضور والغياب
    getAttendanceReport: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);
            if (filters.user_type && filters.user_type !== 'all') {
                queryParams.append('user_type', filters.user_type);
            }

            const url = `/reports/attendance${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const attendanceData = response.data || [];
            console.log(`✅ تم جلب تقرير الحضور والغياب: ${attendanceData.length} مستخدم`);
            return attendanceData;
        } catch (error) {
            console.error('❌ خطأ في جلب تقرير الحضور والغياب:', error);
            throw new Error(error.message || 'فشل في جلب تقرير الحضور والغياب');
        }
    },

    // الحصول على تقرير استخدام القاعات
    getHallUsageReport: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);

            const url = `/reports/hall-usage${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const hallUsageData = response.data || [];
            console.log(`✅ تم جلب تقرير استخدام القاعات: ${hallUsageData.length} قاعة`);
            return hallUsageData;
        } catch (error) {
            console.error('❌ خطأ في جلب تقرير استخدام القاعات:', error);
            throw new Error(error.message || 'فشل في جلب تقرير استخدام القاعات');
        }
    },

    // الحصول على تقرير الاستبدالات
    getReplacementReport: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);

            const url = `/reports/replacements${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const replacementData = response.data || [];
            console.log(`✅ تم جلب تقرير الاستبدالات: ${replacementData.length} استبدال`);
            return replacementData;
        } catch (error) {
            console.error('❌ خطأ في جلب تقرير الاستبدالات:', error);
            throw new Error(error.message || 'فشل في جلب تقرير الاستبدالات');
        }
    },

    // الحصول على التقرير الشهري للتوزيع
    getMonthlyDistribution: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.year) queryParams.append('year', filters.year);

            const url = `/reports/monthly-distribution${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const monthlyData = response.data || [];
            console.log(`✅ تم جلب التقرير الشهري: ${monthlyData.length} شهر`);
            return monthlyData;
        } catch (error) {
            console.error('❌ خطأ في جلب التقرير الشهري:', error);
            throw new Error(error.message || 'فشل في جلب التقرير الشهري');
        }
    },

    // تصدير التقرير
    exportReport: async (exportData) => {
        try {
            const requiredFields = ['report_type', 'format'];
            const missingFields = requiredFields.filter(field => !exportData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                report_type: exportData.report_type,
                format: exportData.format,
                start_date: exportData.start_date || null,
                end_date: exportData.end_date || null,
            };

            console.log('📤 تصدير التقرير:', cleanedData);

            const response = await makeRequest('/reports/export', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم طلب تصدير التقرير بنجاح');
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير:', error);
            throw new Error(error.message || 'فشل في تصدير التقرير');
        }
    },

    // دوال المساعدة

    // تنسيق التاريخ للعرض
    formatDateForDisplay: (dateString) => {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Date(dateString).toLocaleDateString('ar-EG', options);
    },

    // ترجمة نوع المستخدم
    translateUserType: (type) => {
        switch (type) {
            case 'supervisor':
                return 'مشرف';
            case 'observer':
                return 'ملاحظ';
            default:
                return type;
        }
    },

    // ترجمة رتبة المستخدم
    translateUserRank: (rank) => {
        switch (rank) {
            case 'college_employee':
                return 'موظف كلية';
            case 'external_employee':
                return 'موظف خارجي';
            default:
                return rank;
        }
    },

    // ترجمة حالة المستخدم
    translateUserStatus: (status) => {
        switch (status) {
            case 'active':
                return 'نشط';
            case 'suspended':
                return 'معلق';
            case 'deleted':
                return 'محذوف';
            default:
                return status;
        }
    },

    // الحصول على لون معدل الحضور
    getAttendanceColor: (rate) => {
        if (rate >= 95) return '#27ae60';
        if (rate >= 85) return '#f39c12';
        return '#e74c3c';
    },

    // الحصول على لون معدل الاستخدام
    getUtilizationColor: (rate) => {
        if (rate >= 80) return '#27ae60';
        if (rate >= 60) return '#f39c12';
        return '#e74c3c';
    },

    // حساب إحصائيات سريعة من البيانات
    calculateQuickStats: (data, type) => {
        if (!data || data.length === 0) {
            return {
                total: 0,
                average: 0,
                highest: null,
                lowest: null
            };
        }

        let values = [];
        let nameField = '';

        switch (type) {
            case 'attendance':
                values = data.map(item => item.attendanceRate);
                nameField = 'name';
                break;
            case 'hall-usage':
                values = data.map(item => item.utilizationRate);
                nameField = 'hallName';
                break;
            case 'replacements':
                return {
                    total: data.length,
                    automatic: data.filter(item => item.type === 'تلقائي').length,
                    manual: data.filter(item => item.type === 'يدوي').length,
                };
            default:
                return {};
        }

        const total = data.length;
        const average = total > 0 ? values.reduce((sum, val) => sum + val, 0) / total : 0;
        const maxIndex = values.indexOf(Math.max(...values));
        const minIndex = values.indexOf(Math.min(...values));

        return {
            total,
            average: Math.round(average * 10) / 10,
            highest: maxIndex >= 0 ? {
                name: data[maxIndex][nameField],
                value: values[maxIndex]
            } : null,
            lowest: minIndex >= 0 ? {
                name: data[minIndex][nameField],
                value: values[minIndex]
            } : null
        };
    },

    // تصفية البيانات حسب المعايير
    filterData: (data, filters) => {
        if (!data || data.length === 0) return data;

        let filteredData = [...data];

        // تصفية حسب النوع (للحضور والغياب)
        if (filters.userType && filters.userType !== 'all') {
            filteredData = filteredData.filter(item => item.type === filters.userType);
        }

        // تصفية حسب الرتبة
        if (filters.userRank && filters.userRank !== 'all') {
            filteredData = filteredData.filter(item => item.rank === filters.userRank);
        }

        // تصفية حسب الحالة
        if (filters.userStatus && filters.userStatus !== 'all') {
            filteredData = filteredData.filter(item => item.status === filters.userStatus);
        }

        // تصفية حسب معدل الحضور
        if (filters.minAttendanceRate) {
            filteredData = filteredData.filter(item =>
                item.attendanceRate >= filters.minAttendanceRate
            );
        }

        // تصفية حسب المبنى (لاستخدام القاعات)
        if (filters.building && filters.building !== 'all') {
            filteredData = filteredData.filter(item => item.building === filters.building);
        }

        return filteredData;
    },

    // ترتيب البيانات
    sortData: (data, sortBy, order = 'desc') => {
        if (!data || data.length === 0) return data;

        return [...data].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // معالجة القيم النصية
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    },

    // تجميع البيانات حسب معيار
    groupData: (data, groupBy) => {
        if (!data || data.length === 0) return {};

        return data.reduce((groups, item) => {
            const key = item[groupBy];
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);
            return groups;
        }, {});
    },

    // تحويل البيانات للتصدير
    prepareDataForExport: (data, reportType) => {
        if (!data || data.length === 0) return [];

        switch (reportType) {
            case 'attendance':
                return data.map(item => ({
                    'الاسم': item.name,
                    'النوع': reportsService.translateUserType(item.type),
                    'الرتبة': reportsService.translateUserRank(item.rank),
                    'إجمالي الأيام': item.totalDays,
                    'أيام الحضور': item.attendedDays,
                    'أيام الغياب': item.absenceDays,
                    'معدل الحضور': item.attendanceRate + '%',
                    'الحالة': reportsService.translateUserStatus(item.status)
                }));

            case 'hall-usage':
                return data.map(item => ({
                    'اسم القاعة': item.hallName,
                    'المبنى': item.building,
                    'الدور': item.floor,
                    'السعة': item.capacity,
                    'عدد مرات الاستخدام': item.usageCount,
                    'معدل الاستخدام': item.utilizationRate + '%'
                }));

            case 'replacements':
                return data.map(item => ({
                    'التاريخ': item.date,
                    'القاعة': item.hallName,
                    'المستخدم الأصلي': item.originalUser,
                    'المستخدم البديل': item.replacementUser,
                    'السبب': item.reason,
                    'نوع الاستبدال': item.type,
                    'نوع المستخدم': item.userType
                }));

            default:
                return data;
        }
    },

    // إنشاء ملخص للتقرير
    generateReportSummary: (data, reportType) => {
        if (!data || data.length === 0) {
            return {
                title: 'لا توجد بيانات',
                stats: {},
                insights: []
            };
        }

        switch (reportType) {
            case 'overview':
                return {
                    title: 'نظرة عامة على النظام',
                    stats: data,
                    insights: [
                        `إجمالي المشرفين: ${data.totalSupervisors}`,
                        `إجمالي الملاحظين: ${data.totalObservers}`,
                        `معدل الحضور: ${data.attendanceRate}%`,
                        `أكثر القاعات استخداماً: ${data.mostUsedHall}`
                    ]
                };

            case 'attendance':
                const attendanceStats = reportsService.calculateQuickStats(data, 'attendance');
                return {
                    title: 'تقرير الحضور والغياب',
                    stats: attendanceStats,
                    insights: [
                        `إجمالي المستخدمين: ${attendanceStats.total}`,
                        `متوسط معدل الحضور: ${attendanceStats.average}%`,
                        `أعلى معدل حضور: ${attendanceStats.highest?.name} (${attendanceStats.highest?.value}%)`,
                        `أقل معدل حضور: ${attendanceStats.lowest?.name} (${attendanceStats.lowest?.value}%)`
                    ]
                };

            case 'hall-usage':
                const usageStats = reportsService.calculateQuickStats(data, 'hall-usage');
                return {
                    title: 'تقرير استخدام القاعات',
                    stats: usageStats,
                    insights: [
                        `إجمالي القاعات: ${usageStats.total}`,
                        `متوسط معدل الاستخدام: ${usageStats.average}%`,
                        `أكثر القاعات استخداماً: ${usageStats.highest?.name} (${usageStats.highest?.value}%)`,
                        `أقل القاعات استخداماً: ${usageStats.lowest?.name} (${usageStats.lowest?.value}%)`
                    ]
                };

            case 'replacements':
                const replacementStats = reportsService.calculateQuickStats(data, 'replacements');
                return {
                    title: 'تقرير الاستبدالات',
                    stats: replacementStats,
                    insights: [
                        `إجمالي الاستبدالات: ${replacementStats.total}`,
                        `الاستبدالات التلقائية: ${replacementStats.automatic}`,
                        `الاستبدالات اليدوية: ${replacementStats.manual}`,
                        `نسبة الاستبدال التلقائي: ${Math.round((replacementStats.automatic / replacementStats.total) * 100)}%`
                    ]
                };

            default:
                return {
                    title: 'تقرير',
                    stats: {},
                    insights: []
                };
        }
    },

    // اختبار الاتصال (للتطوير)
    testConnection: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/reports/overview`);
            const data = await response.json();
            console.log('✅ اختبار اتصال التقارير نجح:', data);
            return data;
        } catch (error) {
            console.error('❌ فشل اختبار اتصال التقارير:', error);
            throw error;
        }
    }
};

export default reportsService;