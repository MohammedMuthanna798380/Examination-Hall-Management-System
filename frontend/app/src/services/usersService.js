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
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `فشل في الاتصال: ${response.status}`);
        }

        const data = await response.json();
        if (!data.status) {
            throw new Error(data.message || 'فشل في معالجة الطلب');
        }

        return data;
    } catch (error) {
        console.error(`خطأ أثناء الطلب إلى ${url}:`, error);
        throw new Error(error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم');
    }
};

// Users API functions
export const usersService = {
    // الحصول على قائمة المستخدمين
    getUsers: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.type) queryParams.append('type', filters.type);
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.rank) queryParams.append('rank', filters.rank);
            if (filters.search) queryParams.append('search', filters.search);

            const url = `/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const users = response.data || [];

            if (users.length === 0) {
                throw new Error('لا توجد بيانات مستخدمين حالياً.');
            }

            return users;
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            throw new Error(error.message || 'فشل في جلب قائمة المستخدمين');
        }
    },

    createUser: async (userData) => {
        try {
            const response = await makeRequest('/users', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'فشل في إضافة المستخدم');
        }
    },

    getUser: async (id) => {
        try {
            const response = await makeRequest(`/users/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'المستخدم غير موجود');
        }
    },

    updateUser: async (id, userData) => {
        try {
            const response = await makeRequest(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            });
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'فشل في تحديث بيانات المستخدم');
        }
    },

    deleteUser: async (id) => {
        try {
            const response = await makeRequest(`/users/${id}`, {
                method: 'DELETE',
            });
            return response;
        } catch (error) {
            throw new Error(error.message || 'فشل في حذف المستخدم');
        }
    },

    suspendUser: async (id) => {
        try {
            const response = await makeRequest(`/users/${id}/suspend`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            throw new Error(error.message || 'فشل في تعليق المستخدم');
        }
    },

    activateUser: async (id) => {
        try {
            const response = await makeRequest(`/users/${id}/activate`, {
                method: 'PATCH',
            });
            return response;
        } catch (error) {
            throw new Error(error.message || 'فشل في تنشيط المستخدم');
        }
    },

    getStatistics: async () => {
        try {
            const response = await makeRequest('/users/stats');
            return response.data;
        } catch (error) {
            throw new Error(error.message || 'فشل في جلب الإحصائيات');
        }
    }
};
