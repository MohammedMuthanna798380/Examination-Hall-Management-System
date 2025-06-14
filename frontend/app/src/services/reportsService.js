// frontend/app/src/services/reportsService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function للحصول على token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function للطلبات مع معالجة شاملة للأخطاء
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
        console.log(`🔄 طلب ${options.method || 'GET'} إلى: ${API_BASE_URL}${url}`);

        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
        console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);

        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.warn('استجابة غير JSON:', textResponse.substring(0, 500));

            try {
                responseData = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`الخادم أرجع استجابة غير صالحة. يرجى المحاولة لاحقاً.`);
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
                throw new Error('التقرير المطلوب غير موجود');
            } else if (response.status >= 500) {
                throw new Error('خطأ في الخادم. يرجى المحاولة لاحقاً.');
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
    // الحصول على تقرير النظرة العامة
    getOverview: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.start_date) queryParams.append('start_date', filters.start_date);
            if (filters.end_date) queryParams.append('end_date', filters.end_date);

            const url = `/reports/overview${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const data = response.data || {};
            console.log('✅ تم جلب تقرير النظرة العامة بنجاح');
            return data;
        } catch (error) {
            console.error('❌ خطأ في جلب تقرير النظرة العامة:', error);

            // إرجاع بيانات افتراضية في حالة الخطأ
            throw new Error(error.message || 'فشل في جلب تقرير النظرة العامة');
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

            const data = response.data || [];
            console.log(`✅ تم جلب تقرير الحضور والغياب بنجاح - ${data.length} سجل`);
            return data;
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

            const data = response.data || [];
            console.log(`✅ تم جلب تقرير استخدام القاعات بنجاح - ${data.length} قاعة`);
            return data;
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

            const data = response.data || [];
            console.log(`✅ تم جلب تقرير الاستبدالات بنجاح - ${data.length} سجل`);
            return data;
        } catch (error) {
            console.error('❌ خطأ في جلب تقرير الاستبدالات:', error);
            throw new Error(error.message || 'فشل في جلب تقرير الاستبدالات');
        }
    },

    // الحصول على التقرير الشهري
    getMonthlyDistribution: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.year) queryParams.append('year', filters.year);

            const url = `/reports/monthly-distribution${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const data = response.data || [];
            console.log(`✅ تم جلب التقرير الشهري بنجاح - ${data.length} شهر`);
            return data;
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

            console.log('✅ تم تصدير التقرير بنجاح');
            return response.data || {};
        } catch (error) {
            console.error('❌ خطأ في تصدير التقرير:', error);
            throw new Error(error.message || 'فشل في تصدير التقرير');
        }
    },

    // دوال المساعدة والترجمة

    // ترجمة نوع التقرير
    translateReportType: (type) => {
        switch (type) {
            case 'overview':
                return 'نظرة عامة';
            case 'attendance':
                return 'الحضور والغياب';
            case 'hall-usage':
                return 'استخدام القاعات';
            case 'replacements':
                return 'الاستبدالات';
            case 'distribution':
                return 'التوزيع الشهري';
            default:
                return type;
        }
    },

    // ترجمة صيغة التصدير
    translateExportFormat: (format) => {
        switch (format) {
            case 'pdf':
                return 'PDF';
            case 'excel':
                return 'Excel';
            default:
                return format;
        }
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
        if (rate >= 90) return '#27ae60'; // أخضر - ممتاز
        if (rate >= 75) return '#f39c12'; // برتقالي - جيد
        if (rate >= 60) return '#e67e22'; // برتقالي داكن - متوسط
        return '#e74c3c'; // أحمر - ضعيف
    },

    // الحصول على لون معدل الاستخدام
    getUtilizationColor: (rate) => {
        if (rate >= 80) return '#27ae60'; // أخضر - عالي
        if (rate >= 60) return '#f39c12'; // برتقالي - متوسط
        if (rate >= 40) return '#e67e22'; // برتقالي داكن - منخفض
        return '#e74c3c'; // أحمر - ضعيف جداً
    },

    // تنسيق التاريخ للعرض
    formatDateForDisplay: (dateString) => {
        if (!dateString) return 'غير محدد';

        try {
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };
            return new Date(dateString).toLocaleDateString('ar-EG', options);
        } catch (error) {
            return dateString;
        }
    },

    // التحقق من صحة فترة التاريخ
    validateDateRange: (startDate, endDate) => {
        const errors = {};

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);

            if (start > end) {
                errors.dateRange = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية';
            }

            // التحقق من أن الفترة ليست طويلة جداً (أكثر من سنة)
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 365) {
                errors.dateRange = 'الفترة المحددة طويلة جداً (أكثر من سنة)';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    },

    // حساب إحصائيات سريعة من البيانات
    calculateQuickStats: (data, type) => {
        if (!data || !Array.isArray(data)) return {};

        switch (type) {
            case 'attendance':
                return {
                    totalUsers: data.length,
                    avgAttendanceRate: data.length > 0
                        ? Math.round(data.reduce((sum, user) => sum + (user.attendanceRate || 0), 0) / data.length)
                        : 0,
                    perfectAttendance: data.filter(user => (user.attendanceRate || 0) === 100).length,
                    poorAttendance: data.filter(user => (user.attendanceRate || 0) < 80).length,
                };

            case 'hall-usage':
                return {
                    totalHalls: data.length,
                    avgUtilization: data.length > 0
                        ? Math.round(data.reduce((sum, hall) => sum + (hall.utilizationRate || 0), 0) / data.length)
                        : 0,
                    mostUsed: data.length > 0 ? data[0].hallName : 'غير محدد',
                    leastUsed: data.length > 0 ? data[data.length - 1].hallName : 'غير محدد',
                };

            case 'replacements':
                return {
                    totalReplacements: data.length,
                    automaticReplacements: data.filter(r => r.type === 'تلقائي').length,
                    manualReplacements: data.filter(r => r.type === 'يدوي').length,
                    supervisorReplacements: data.filter(r => r.userType === 'مشرف').length,
                    observerReplacements: data.filter(r => r.userType === 'ملاحظ').length,
                };

            default:
                return {};
        }
    },

    // تجميع البيانات حسب فترة زمنية
    groupDataByPeriod: (data, period = 'month') => {
        if (!data || !Array.isArray(data)) return {};

        return data.reduce((groups, item) => {
            let key;

            try {
                const date = new Date(item.date || item.assignment_date || item.created_at);

                switch (period) {
                    case 'day':
                        key = date.toISOString().split('T')[0];
                        break;
                    case 'week':
                        const week = Math.ceil(date.getDate() / 7);
                        key = `${date.getFullYear()}-${date.getMonth() + 1}-W${week}`;
                        break;
                    case 'month':
                        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                        break;
                    case 'year':
                        key = date.getFullYear().toString();
                        break;
                    default:
                        key = 'unknown';
                }
            } catch (error) {
                key = 'unknown';
            }

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(item);

            return groups;
        }, {});
    },

    // إنشاء بيانات افتراضية للاختبار
    generateDefaultData: (type) => {
        switch (type) {
            case 'overview':
                return {
                    totalSupervisors: 0,
                    totalObservers: 0,
                    totalHalls: 0,
                    totalExams: 0,
                    attendanceRate: 0,
                    avgSupervisorsPerExam: 0,
                    avgObserversPerExam: 0,
                    mostUsedHall: 'لا توجد بيانات',
                    mostActiveSupervisor: 'لا توجد بيانات',
                    replacementRate: 0,
                };

            case 'attendance':
                return [];

            case 'hall-usage':
                return [];

            case 'replacements':
                return [];

            case 'distribution':
                return [];

            default:
                return null;
        }
    },

    // اختبار الاتصال مع التقارير
    testConnection: async () => {
        try {
            console.log('🔄 اختبار اتصال التقارير...');

            // جرب الاتصال بمسار الاختبار أولاً
            const response = await fetch(`${API_BASE_URL}/test-reports-data`);
            const data = await response.json();

            console.log('✅ اختبار الاتصال نجح:', data);
            return data;
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error);

            // جرب مسار اختبار التقارير المحمي
            try {
                const fallbackResponse = await makeRequest('/reports/test-connection');
                console.log('✅ اختبار الاتصال البديل نجح:', fallbackResponse);
                return fallbackResponse;
            } catch (fallbackError) {
                console.error('❌ فشل اختبار الاتصال البديل:', fallbackError);
                throw new Error('فشل في الاتصال بخدمة التقارير');
            }
        }
    },

    // دالة مساعدة للتحقق من حالة الخدمة
    checkServiceHealth: async () => {
        try {
            const healthCheck = await makeRequest('/reports/test-connection');
            return {
                isHealthy: true,
                message: 'خدمة التقارير تعمل بشكل طبيعي',
                data: healthCheck.data || null
            };
        } catch (error) {
            return {
                isHealthy: false,
                message: error.message || 'خدمة التقارير غير متاحة',
                data: null
            };
        }
    },

    // دالة لمعالجة الأخطاء بشكل موحد
    handleError: (error, context = '') => {
        console.error(`❌ خطأ في ${context}:`, error);

        // رسائل خطأ مخصصة حسب السياق
        const errorMessages = {
            'network': 'فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.',
            'auth': 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.',
            'permission': 'غير مصرح لك بالوصول إلى هذا التقرير.',
            'data': 'لا توجد بيانات كافية لإنشاء التقرير.',
            'server': 'خطأ في الخادم. يرجى المحاولة لاحقاً.',
        };

        // تحديد نوع الخطأ
        if (error.message.includes('fetch')) {
            return errorMessages.network;
        } else if (error.message.includes('401') || error.message.includes('انتهت صلاحية')) {
            return errorMessages.auth;
        } else if (error.message.includes('403') || error.message.includes('غير مصرح')) {
            return errorMessages.permission;
        } else if (error.message.includes('404') || error.message.includes('لا توجد')) {
            return errorMessages.data;
        } else if (error.message.includes('500') || error.message.includes('خادم')) {
            return errorMessages.server;
        }

        return error.message || 'حدث خطأ غير متوقع';
    }
};

export default reportsService;