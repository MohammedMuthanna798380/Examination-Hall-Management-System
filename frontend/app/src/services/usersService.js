// frontend/app/src/services/usersService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function للحصول على token
const getAuthToken = () => {
    const token = localStorage.getItem('token');
    console.log('Getting token for API request:', token ? 'Token exists' : 'No token found');
    return token;
};

// Helper function للطلبات مع معالجة محسنة للأخطاء
const makeRequest = async (url, options = {}) => {
    const token = getAuthToken();

    // تحقق من وجود token
    if (!token) {
        console.error('No authentication token found');
        throw new Error('غير مسجل دخول - يرجى تسجيل الدخول مرة أخرى');
    }

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        ...options,
    };

    console.log('Making API request to:', `${API_BASE_URL}${url}`);
    console.log('Request headers:', defaultOptions.headers);

    try {
        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

        console.log('API Response status:', response.status);
        console.log('API Response headers:', response.headers);

        // التحقق من نوع المحتوى
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Response is not JSON:', contentType);
            throw new Error('خطأ في الخادم - الاستجابة ليست بصيغة JSON');
        }

        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok) {
            // معالجة أخطاء التوثيق
            if (response.status === 401) {
                console.error('Authentication failed - removing invalid token');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                throw new Error('انتهت صلاحية الجلسة - يرجى تسجيل الدخول مرة أخرى');
            }

            throw new Error(data.message || `خطأ في الخادم: ${response.status}`);
        }

        // التحقق من بنية الاستجابة
        if (!data.status) {
            throw new Error(data.message || 'فشل في العملية');
        }

        return data;
    } catch (error) {
        console.error('API Error details:', error);

        // معالجة أخطاء الشبكة
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('خطأ في الاتصال بالخادم - تحقق من الاتصال بالإنترنت');
        }

        throw error;
    }
};

// Users API functions
export const usersService = {
    // الحصول على جميع المستخدمين
    getUsers: async () => {
        console.log('Fetching users from API...');
        const response = await makeRequest('/users');
        return response.data;
    },

    // إضافة مستخدم جديد
    createUser: async (userData) => {
        console.log('Creating new user:', userData);
        const response = await makeRequest('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        return response.data;
    },

    // تحديث مستخدم موجود
    updateUser: async (userId, userData) => {
        console.log('Updating user:', userId, userData);
        const response = await makeRequest(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
        return response.data;
    },

    // حذف مستخدم
    deleteUser: async (userId) => {
        console.log('Deleting user:', userId);
        const response = await makeRequest(`/users/${userId}`, {
            method: 'DELETE',
        });
        return response.data;
    },

    // تعليق مستخدم
    suspendUser: async (userId) => {
        console.log('Suspending user:', userId);
        const response = await makeRequest(`/users/${userId}/suspend`, {
            method: 'PATCH',
        });
        return response.data;
    },

    // تنشيط مستخدم
    activateUser: async (userId) => {
        console.log('Activating user:', userId);
        const response = await makeRequest(`/users/${userId}/activate`, {
            method: 'PATCH',
        });
        return response.data;
    },

    // البحث في المستخدمين
    searchUsers: async (searchParams) => {
        console.log('Searching users with params:', searchParams);
        const queryParams = new URLSearchParams(searchParams).toString();
        const response = await makeRequest(`/users/search?${queryParams}`);
        return response.data;
    },

    // الحصول على إحصائيات المستخدمين
    getUsersStats: async () => {
        console.log('Fetching users statistics...');
        const response = await makeRequest('/users/stats');
        return response.data;
    },

    // تحديث حالة متعددة
    bulkUpdateStatus: async (userIds, status) => {
        console.log('Bulk updating user status:', userIds, status);
        const response = await makeRequest('/users/bulk-status', {
            method: 'PATCH',
            body: JSON.stringify({ user_ids: userIds, status }),
        });
        return response.data;
    },
};

export default usersService;