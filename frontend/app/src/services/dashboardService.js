// frontend/app/src/services/dashboardService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function للحصول على token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function للطلبات مع معالجة أفضل للأخطاء
const makeRequest = async (url, options = {}) => {
    const token = getAuthToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...options,
    };

    try {
        console.log(`🔄 طلب Dashboard ${options.method || 'GET'} إلى: ${API_BASE_URL}${url}`);

        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

        console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);

        // التحقق من نوع المحتوى
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            // في حالة عدم وجود JSON، محاولة قراءة النص
            const textResponse = await response.text();
            console.warn('استجابة غير JSON:', textResponse);

            // محاولة تحويل النص إلى JSON
            try {
                data = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`الخادم أرجع استجابة غير صالحة: ${textResponse.substring(0, 200)}...`);
            }
        }

        if (!response.ok) {
            // معالجة أخطاء HTTP المختلفة
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                throw new Error('انتهت صلاحية الجلسة');
            } else if (response.status === 500) {
                console.error('خطأ خادم 500:', data);
                throw new Error(data.message || 'خطأ في الخادم');
            } else {
                throw new Error(data.message || `خطأ HTTP: ${response.status}`);
            }
        }

        // التحقق من حالة النجاح في البيانات
        if (data && typeof data === 'object' && data.status === false) {
            throw new Error(data.message || 'فشل في معالجة الطلب');
        }

        console.log('📥 البيانات المستلمة بنجاح');
        return data;

    } catch (error) {
        console.error(`❌ خطأ في الطلب ${url}:`, error);

        // معالجة أخطاء الشبكة
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
        }

        // إعادة رمي الخطأ مع معلومات إضافية
        throw error;
    }
};

// Dashboard API functions
export const dashboardService = {
    // الحصول على الإحصائيات الرئيسية
    getStatistics: async () => {
        try {
            const response = await makeRequest('/dashboard/statistics');
            return response.data || {};
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات:', error);
            // إرجاع بيانات افتراضية في حالة الخطأ
            return {
                supervisors: 0,
                observers: 0,
                halls: 0,
                todayExams: 0
            };
        }
    },

    // الحصول على بيانات الغياب
    getAbsenceData: async () => {
        try {
            const response = await makeRequest('/dashboard/absence-data');
            return response.data || [];
        } catch (error) {
            console.error('خطأ في جلب بيانات الغياب:', error);
            return [];
        }
    },

    // الحصول على امتحانات الغد
    getTomorrowExams: async () => {
        try {
            const response = await makeRequest('/dashboard/tomorrow-exams');
            return response.data || [];
        } catch (error) {
            console.error('خطأ في جلب امتحانات الغد:', error);
            return [];
        }
    },

    // الحصول على التنبيهات
    getNotifications: async () => {
        try {
            const response = await makeRequest('/dashboard/notifications');
            return response.data || [];
        } catch (error) {
            console.error('خطأ في جلب التنبيهات:', error);
            return [];
        }
    },

    // الحصول على الإحصائيات السريعة
    getQuickStats: async () => {
        try {
            const response = await makeRequest('/dashboard/quick-stats');
            return response.data || {
                mostUsedHall: 'غير محدد',
                topSupervisor: 'غير محدد',
                absenceRate: '0%',
                avgObservers: 0
            };
        } catch (error) {
            console.error('خطأ في جلب الإحصائيات السريعة:', error);
            return {
                mostUsedHall: 'غير محدد',
                topSupervisor: 'غير محدد',
                absenceRate: '0%',
                avgObservers: 0
            };
        }
    },

    // التحقق من وجود توزيع اليوم
    checkTodayDistribution: async () => {
        try {
            const response = await makeRequest('/dashboard/check-distribution');
            return response.data || { hasDistribution: false };
        } catch (error) {
            console.error('خطأ في التحقق من التوزيع:', error);
            return { hasDistribution: false };
        }
    },

    // اختبار اتصال API
    testConnection: async () => {
        try {
            const response = await makeRequest('/dashboard/statistics');
            console.log('✅ اختبار اتصال Dashboard نجح');
            return true;
        } catch (error) {
            console.error('❌ فشل اختبار اتصال Dashboard:', error);
            return false;
        }
    }
};

export default dashboardService;