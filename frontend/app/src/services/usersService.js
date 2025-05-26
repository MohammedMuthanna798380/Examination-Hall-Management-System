// frontend/app/src/services/usersService.js

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

// Users API functions
export const usersService = {
    // الحصول على قائمة المستخدمين
    getUsers: async (filters = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.type) queryParams.append('type', filters.type);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.rank) queryParams.append('rank', filters.rank);
        if (filters.search) queryParams.append('search', filters.search);

        const url = `/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await makeRequest(url);
        return response.data;
    },

    // إضافة مستخدم جديد
    createUser: async (userData) => {
        const response = await makeRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response.data;
    },

    // الحصول على مستخدم محدد
    getUser: async (id) => {
        const response = await makeRequest(`/users/${id}`);
        return response.data;
    },

    // تحديث بيانات مستخدم
    updateUser: async (id, userData) => {
        const response = await makeRequest(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response.data;
    },

    // حذف مستخدم
    deleteUser: async (id) => {
        const response = await makeRequest(`/users/${id}`, {
            method: 'DELETE',
        });
        return response;
    },

    // تعليق مستخدم
    suspendUser: async (id) => {
        const response = await makeRequest(`/users/${id}/suspend`, {
            method: 'PATCH',
        });
        return response;
    },

    // تنشيط مستخدم
    activateUser: async (id) => {
        const response = await makeRequest(`/users/${id}/activate`, {
            method: 'PATCH',
        });
        return response;
    },

    // الحصول على إحصائيات المستخدمين
    getStatistics: async () => {
        const response = await makeRequest('/users/stats');
        return response.data;
    },

    // البحث في المستخدمين
    searchUsers: async (query) => {
        const response = await makeRequest(`/users/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    // تحديث حالة عدة مستخدمين
    bulkUpdateStatus: async (userIds, status) => {
        const response = await makeRequest('/users/bulk-status', {
            method: 'PATCH',
            body: JSON.stringify({ userIds, status }),
        });
        return response;
    },
};

export default usersService;