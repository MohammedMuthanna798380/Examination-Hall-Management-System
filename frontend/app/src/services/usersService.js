// frontend/app/src/services/usersService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function للحصول على token
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function للطلبات مع تحسينات
const makeRequest = async (url, options = {}) => {
    const token = getAuthToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        credentials: 'include', // إضافة credentials للCORS
        ...options,
    };

    try {
        console.log(`🔄 طلب ${options.method || 'GET'} إلى: ${API_BASE_URL}${url}`);
        console.log('📤 البيانات المرسلة:', options.body ? JSON.parse(options.body) : 'لا توجد بيانات');
        console.log('📋 Headers:', defaultOptions.headers);

        const response = await fetch(`${API_BASE_URL}${url}`, defaultOptions);

        console.log(`📊 حالة الاستجابة: ${response.status} ${response.statusText}`);

        // التحقق من Content-Type
        const contentType = response.headers.get('content-type');
        console.log('📄 نوع المحتوى:', contentType);

        let responseData;

        if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            const textResponse = await response.text();
            console.log('📄 استجابة نصية:', textResponse);

            // محاولة تحويل النص إلى JSON
            try {
                responseData = JSON.parse(textResponse);
            } catch (e) {
                throw new Error(`الخادم أرجع استجابة غير صالحة: ${textResponse.substring(0, 200)}...`);
            }
        }

        console.log('📥 البيانات المستلمة:', responseData);

        if (!response.ok) {
            // معالجة أخطاء HTTP المختلفة
            if (response.status === 422 && responseData.errors) {
                // أخطاء التحقق من صحة البيانات
                const errorMessages = Object.values(responseData.errors).flat().join(', ');
                throw new Error(errorMessages);
            } else if (response.status === 401) {
                // خطأ المصادقة - إعادة توجيه لتسجيل الدخول
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

        // معالجة أخطاء الشبكة
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('فشل في الاتصال بالخادم. تحقق من اتصال الإنترنت.');
        }

        // إعادة رمي الخطأ مع معلومات إضافية
        throw new Error(error.message || 'حدث خطأ غير متوقع أثناء الاتصال بالخادم');
    }
};

// Users API functions
export const usersService = {
    // اختبار الاتصال بقاعدة البيانات
    testDatabaseConnection: async () => {
        try {
            const response = await makeRequest('/test-db');
            console.log('✅ اختبار قاعدة البيانات نجح:', response);
            return response;
        } catch (error) {
            console.error('❌ فشل اختبار قاعدة البيانات:', error);
            throw error;
        }
    },

    // الحصول على قائمة المستخدمين
    getUsers: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
            if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
            if (filters.rank && filters.rank !== 'all') queryParams.append('rank', filters.rank);
            if (filters.search && filters.search.trim()) queryParams.append('search', filters.search.trim());

            const url = `/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const users = response.data || [];

            // إضافة تنسيق التواريخ
            const formattedUsers = users.map(user => ({
                ...user,
                created_at: user.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG') : 'غير محدد',
                updated_at: user.updated_at ? new Date(user.updated_at).toLocaleDateString('ar-EG') : 'غير محدد',
            }));

            console.log(`✅ تم جلب ${formattedUsers.length} مستخدم`);
            return formattedUsers;
        } catch (error) {
            console.error('❌ خطأ في جلب المستخدمين:', error);
            throw new Error(error.message || 'فشل في جلب قائمة المستخدمين');
        }
    },

    // إنشاء مستخدم جديد
    createUser: async (userData) => {
        try {
            // التحقق من البيانات قبل الإرسال
            const requiredFields = ['name', 'specialization', 'phone', 'whatsapp', 'type', 'rank'];
            const missingFields = requiredFields.filter(field => !userData[field] || !userData[field].toString().trim());

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            // تنظيف البيانات
            const cleanedData = {
                name: userData.name.toString().trim(),
                specialization: userData.specialization.toString().trim(),
                phone: userData.phone.toString().trim(),
                whatsapp: userData.whatsapp.toString().trim(),
                type: userData.type,
                rank: userData.rank,
            };

            console.log('📤 إنشاء مستخدم جديد:', cleanedData);

            const response = await makeRequest('/users', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم إنشاء المستخدم بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في إنشاء المستخدم:', error);
            throw new Error(error.message || 'فشل في إضافة المستخدم');
        }
    },

    // الحصول على مستخدم محدد
    getUser: async (id) => {
        try {
            if (!id) throw new Error('معرف المستخدم مطلوب');

            const response = await makeRequest(`/users/${id}`);
            console.log(`✅ تم جلب بيانات المستخدم ${id}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في جلب المستخدم ${id}:`, error);
            throw new Error(error.message || 'المستخدم غير موجود');
        }
    },

    // تحديث مستخدم
    updateUser: async (id, userData) => {
        try {
            if (!id) throw new Error('معرف المستخدم مطلوب');

            // التحقق من البيانات قبل الإرسال
            const requiredFields = ['name', 'specialization', 'phone', 'whatsapp', 'type', 'rank'];
            const missingFields = requiredFields.filter(field => !userData[field] || !userData[field].toString().trim());

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            // تنظيف البيانات
            const cleanedData = {
                name: userData.name.toString().trim(),
                specialization: userData.specialization.toString().trim(),
                phone: userData.phone.toString().trim(),
                whatsapp: userData.whatsapp.toString().trim(),
                type: userData.type,
                rank: userData.rank,
            };

            // إضافة الحالة إذا كانت موجودة
            if (userData.status) {
                cleanedData.status = userData.status;
            }

            console.log(`📤 تحديث المستخدم ${id}:`, cleanedData);

            const response = await makeRequest(`/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cleanedData),
            });

            console.log(`✅ تم تحديث المستخدم ${id} بنجاح:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في تحديث المستخدم ${id}:`, error);
            throw new Error(error.message || 'فشل في تحديث بيانات المستخدم');
        }
    },

    // حذف مستخدم
    deleteUser: async (id) => {
        try {
            if (!id) throw new Error('معرف المستخدم مطلوب');

            const response = await makeRequest(`/users/${id}`, {
                method: 'DELETE',
            });

            console.log(`✅ تم حذف المستخدم ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في حذف المستخدم ${id}:`, error);
            throw new Error(error.message || 'فشل في حذف المستخدم');
        }
    },

    // تعليق مستخدم
    suspendUser: async (id) => {
        try {
            if (!id) throw new Error('معرف المستخدم مطلوب');

            const response = await makeRequest(`/users/${id}/suspend`, {
                method: 'PATCH',
            });

            console.log(`✅ تم تعليق المستخدم ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في تعليق المستخدم ${id}:`, error);
            throw new Error(error.message || 'فشل في تعليق المستخدم');
        }
    },

    // تنشيط مستخدم
    activateUser: async (id) => {
        try {
            if (!id) throw new Error('معرف المستخدم مطلوب');

            const response = await makeRequest(`/users/${id}/activate`, {
                method: 'PATCH',
            });

            console.log(`✅ تم تنشيط المستخدم ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في تنشيط المستخدم ${id}:`, error);
            throw new Error(error.message || 'فشل في تنشيط المستخدم');
        }
    },

    // الحصول على إحصائيات المستخدمين
    getStatistics: async () => {
        try {
            const response = await makeRequest('/users/stats');
            console.log('✅ تم جلب إحصائيات المستخدمين:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            throw new Error(error.message || 'فشل في جلب الإحصائيات');
        }
    },

    // البحث في المستخدمين
    searchUsers: async (query) => {
        try {
            if (!query || !query.trim()) {
                throw new Error('نص البحث مطلوب');
            }

            const response = await makeRequest(`/users/search?q=${encodeURIComponent(query.trim())}`);
            console.log(`✅ تم البحث عن "${query}" - النتائج: ${response.data.length}`);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في البحث عن "${query}":`, error);
            throw new Error(error.message || 'فشل في البحث');
        }
    }
};

export default usersService;