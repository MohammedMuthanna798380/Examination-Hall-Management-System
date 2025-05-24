// frontend/app/src/services/dashboardService.js

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
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        ...options,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'حدث خطأ في الطلب');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Dashboard API functions
export const dashboardService = {
    // الحصول على الإحصائيات الرئيسية
    getStatistics: async () => {
        const response = await makeRequest('/dashboard/statistics');
        return response.data;
    },

    // الحصول على بيانات الغياب
    getAbsenceData: async () => {
        const response = await makeRequest('/dashboard/absence-data');
        return response.data;
    },

    // الحصول على امتحانات الغد
    getTomorrowExams: async () => {
        const response = await makeRequest('/dashboard/tomorrow-exams');
        return response.data;
    },

    // الحصول على التنبيهات
    getNotifications: async () => {
        const response = await makeRequest('/dashboard/notifications');
        return response.data;
    },

    // الحصول على الإحصائيات السريعة
    getQuickStats: async () => {
        const response = await makeRequest('/dashboard/quick-stats');
        return response.data;
    },

    // التحقق من وجود توزيع اليوم
    checkTodayDistribution: async () => {
        const response = await makeRequest('/dashboard/check-distribution');
        return response.data;
    },
};

export default dashboardService;