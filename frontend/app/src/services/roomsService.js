// frontend/app/src/services/roomsService.js

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
        credentials: 'include',
        ...options,
    };

    try {
        console.log(`🔄 طلب ${options.method || 'GET'} إلى: ${API_BASE_URL}${url}`);
        console.log('📤 البيانات المرسلة:', options.body ? JSON.parse(options.body) : 'لا توجد بيانات');

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

// Rooms API functions
export const roomsService = {
    // الحصول على قائمة القاعات
    getRooms: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.building_id && filters.building_id !== 'all') {
                queryParams.append('building_id', filters.building_id);
            }
            if (filters.floor_id && filters.floor_id !== 'all') {
                queryParams.append('floor_id', filters.floor_id);
            }
            if (filters.status && filters.status !== 'all') {
                queryParams.append('status', filters.status);
            }
            if (filters.search && filters.search.trim()) {
                queryParams.append('search', filters.search.trim());
            }

            const url = `/rooms${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const rooms = response.data || [];
            console.log(`✅ تم جلب ${rooms.length} قاعة`);
            return rooms;
        } catch (error) {
            console.error('❌ خطأ في جلب القاعات:', error);
            throw new Error(error.message || 'فشل في جلب قائمة القاعات');
        }
    },

    // الحصول على قائمة المباني
    getBuildings: async () => {
        try {
            const response = await makeRequest('/buildings');
            const buildings = response.data || [];
            console.log(`✅ تم جلب ${buildings.length} مبنى`);
            return buildings;
        } catch (error) {
            console.error('❌ خطأ في جلب المباني:', error);
            throw new Error(error.message || 'فشل في جلب قائمة المباني');
        }
    },

    // الحصول على قائمة الأدوار لمبنى معين
    getFloors: async (buildingId) => {
        try {
            if (!buildingId) throw new Error('معرف المبنى مطلوب');

            const response = await makeRequest(`/buildings/${buildingId}/floors`);
            const floors = response.data || [];
            console.log(`✅ تم جلب ${floors.length} دور للمبنى ${buildingId}`);
            return floors;
        } catch (error) {
            console.error(`❌ خطأ في جلب أدوار المبنى ${buildingId}:`, error);
            throw new Error(error.message || 'فشل في جلب قائمة الأدوار');
        }
    },

    // إنشاء قاعة جديدة
    createRoom: async (roomData) => {
        try {
            // التحقق من البيانات قبل الإرسال
            const requiredFields = ['name', 'floor_id', 'capacity', 'required_supervisors', 'required_observers'];
            const missingFields = requiredFields.filter(field => !roomData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            // تنظيف البيانات
            const cleanedData = {
                name: roomData.name.toString().trim(),
                floor_id: parseInt(roomData.floor_id),
                capacity: parseInt(roomData.capacity),
                required_supervisors: parseInt(roomData.required_supervisors),
                required_observers: parseInt(roomData.required_observers),
                can_add_observer: Boolean(roomData.can_add_observer),
            };

            console.log('📤 إنشاء قاعة جديدة:', cleanedData);

            const response = await makeRequest('/rooms', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم إنشاء القاعة بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في إنشاء القاعة:', error);
            throw new Error(error.message || 'فشل في إضافة القاعة');
        }
    },

    // الحصول على قاعة محددة
    getRoom: async (id) => {
        try {
            if (!id) throw new Error('معرف القاعة مطلوب');

            const response = await makeRequest(`/rooms/${id}`);
            console.log(`✅ تم جلب بيانات القاعة ${id}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في جلب القاعة ${id}:`, error);
            throw new Error(error.message || 'القاعة غير موجودة');
        }
    },

    // تحديث قاعة
    updateRoom: async (id, roomData) => {
        try {
            if (!id) throw new Error('معرف القاعة مطلوب');

            // التحقق من البيانات قبل الإرسال
            const requiredFields = ['name', 'floor_id', 'capacity', 'required_supervisors', 'required_observers'];
            const missingFields = requiredFields.filter(field => !roomData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            // تنظيف البيانات
            const cleanedData = {
                name: roomData.name.toString().trim(),
                floor_id: parseInt(roomData.floor_id),
                capacity: parseInt(roomData.capacity),
                required_supervisors: parseInt(roomData.required_supervisors),
                required_observers: parseInt(roomData.required_observers),
                can_add_observer: Boolean(roomData.can_add_observer),
            };

            // إضافة الحالة إذا كانت موجودة
            if (roomData.status) {
                cleanedData.status = roomData.status;
            }

            console.log(`📤 تحديث القاعة ${id}:`, cleanedData);

            const response = await makeRequest(`/rooms/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cleanedData),
            });

            console.log(`✅ تم تحديث القاعة ${id} بنجاح:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في تحديث القاعة ${id}:`, error);
            throw new Error(error.message || 'فشل في تحديث بيانات القاعة');
        }
    },

    // حذف قاعة
    deleteRoom: async (id) => {
        try {
            if (!id) throw new Error('معرف القاعة مطلوب');

            const response = await makeRequest(`/rooms/${id}`, {
                method: 'DELETE',
            });

            console.log(`✅ تم حذف القاعة ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في حذف القاعة ${id}:`, error);
            throw new Error(error.message || 'فشل في حذف القاعة');
        }
    },

    // تغيير حالة القاعة
    toggleRoomStatus: async (id) => {
        try {
            if (!id) throw new Error('معرف القاعة مطلوب');

            const response = await makeRequest(`/rooms/${id}/toggle-status`, {
                method: 'PATCH',
            });

            console.log(`✅ تم تغيير حالة القاعة ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في تغيير حالة القاعة ${id}:`, error);
            throw new Error(error.message || 'فشل في تغيير حالة القاعة');
        }
    },

    // الحصول على إحصائيات القاعات
    getStatistics: async () => {
        try {
            const response = await makeRequest('/rooms/stats');
            console.log('✅ تم جلب إحصائيات القاعات:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            throw new Error(error.message || 'فشل في جلب الإحصائيات');
        }
    },

    // اختبار الاتصال بدون مصادقة
    testConnection: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/test-rooms-list`);
            const data = await response.json();
            console.log('✅ اختبار الاتصال نجح:', data);
            return data;
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error);
            throw error;
        }
    }
};

export default roomsService;