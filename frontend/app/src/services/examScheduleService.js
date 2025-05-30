// frontend/app/src/services/examScheduleService.js

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

// Exam Schedule API functions
export const examScheduleService = {
    // الحصول على قائمة جداول الامتحانات
    getExamSchedules: async (filters = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (filters.date) queryParams.append('date', filters.date);
            if (filters.period && filters.period !== 'all') queryParams.append('period', filters.period);
            if (filters.status && filters.status !== 'all') queryParams.append('status', filters.status);
            if (filters.search && filters.search.trim()) queryParams.append('search', filters.search.trim());

            const url = `/exam-schedules${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await makeRequest(url);

            const examSchedules = response.data || [];

            // تنسيق التواريخ
            const formattedSchedules = examSchedules.map(schedule => ({
                ...schedule,
                date: schedule.date,
                created_at: schedule.created_at,
                // إضافة معلومات إضافية
                formatted_date: new Date(schedule.date).toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                period_text: schedule.period === 'morning' ? 'صباحية' : 'مسائية',
                status_text: this.translateStatus(schedule.distribution_status),
            }));

            console.log(`✅ تم جلب ${formattedSchedules.length} جدول امتحان`);
            return formattedSchedules;
        } catch (error) {
            console.error('❌ خطأ في جلب جداول الامتحانات:', error);
            throw new Error(error.message || 'فشل في جلب قائمة جداول الامتحانات');
        }
    },

    // إنشاء جدول امتحان جديد
    createExamSchedule: async (scheduleData) => {
        try {
            const requiredFields = ['date', 'period', 'rooms'];
            const missingFields = requiredFields.filter(field => !scheduleData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            if (!Array.isArray(scheduleData.rooms) || scheduleData.rooms.length === 0) {
                throw new Error('يجب اختيار قاعة واحدة على الأقل');
            }

            const cleanedData = {
                date: scheduleData.date,
                period: scheduleData.period,
                rooms: scheduleData.rooms,
            };

            console.log('📤 إنشاء جدول امتحان جديد:', cleanedData);

            const response = await makeRequest('/exam-schedules', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم إنشاء جدول الامتحان بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في إنشاء جدول الامتحان:', error);
            throw new Error(error.message || 'فشل في إضافة جدول الامتحان');
        }
    },

    // الحصول على جدول امتحان محدد
    getExamSchedule: async (id) => {
        try {
            if (!id) throw new Error('معرف جدول الامتحان مطلوب');

            const response = await makeRequest(`/exam-schedules/${id}`);
            console.log(`✅ تم جلب بيانات جدول الامتحان ${id}:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في جلب جدول الامتحان ${id}:`, error);
            throw new Error(error.message || 'جدول الامتحان غير موجود');
        }
    },

    // تحديث جدول امتحان
    updateExamSchedule: async (id, scheduleData) => {
        try {
            if (!id) throw new Error('معرف جدول الامتحان مطلوب');

            const requiredFields = ['date', 'period', 'rooms'];
            const missingFields = requiredFields.filter(field => !scheduleData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            if (!Array.isArray(scheduleData.rooms) || scheduleData.rooms.length === 0) {
                throw new Error('يجب اختيار قاعة واحدة على الأقل');
            }

            const cleanedData = {
                date: scheduleData.date,
                period: scheduleData.period,
                rooms: scheduleData.rooms,
            };

            console.log(`📤 تحديث جدول الامتحان ${id}:`, cleanedData);

            const response = await makeRequest(`/exam-schedules/${id}`, {
                method: 'PUT',
                body: JSON.stringify(cleanedData),
            });

            console.log(`✅ تم تحديث جدول الامتحان ${id} بنجاح:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`❌ خطأ في تحديث جدول الامتحان ${id}:`, error);
            throw new Error(error.message || 'فشل في تحديث جدول الامتحان');
        }
    },

    // حذف جدول امتحان
    deleteExamSchedule: async (id) => {
        try {
            if (!id) throw new Error('معرف جدول الامتحان مطلوب');

            const response = await makeRequest(`/exam-schedules/${id}`, {
                method: 'DELETE',
            });

            console.log(`✅ تم حذف جدول الامتحان ${id} بنجاح`);
            return response;
        } catch (error) {
            console.error(`❌ خطأ في حذف جدول الامتحان ${id}:`, error);
            throw new Error(error.message || 'فشل في حذف جدول الامتحان');
        }
    },

    // الحصول على القاعات المتاحة
    getAvailableRooms: async () => {
        try {
            const response = await makeRequest('/exam-schedules/available-rooms');

            const rooms = response.data || [];

            // تجميع القاعات حسب المبنى والدور
            const groupedRooms = rooms.reduce((acc, room) => {
                const buildingName = room.building_name;
                const floorName = room.floor_name;

                if (!acc[buildingName]) {
                    acc[buildingName] = {};
                }

                if (!acc[buildingName][floorName]) {
                    acc[buildingName][floorName] = [];
                }

                acc[buildingName][floorName].push(room);
                return acc;
            }, {});

            console.log(`✅ تم جلب ${rooms.length} قاعة متاحة`);
            return {
                rooms,
                groupedRooms,
                buildings: Object.keys(groupedRooms),
            };
        } catch (error) {
            console.error('❌ خطأ في جلب القاعات المتاحة:', error);
            throw new Error(error.message || 'فشل في جلب القاعات المتاحة');
        }
    },

    // الحصول على إحصائيات جداول الامتحانات
    getStatistics: async () => {
        try {
            const response = await makeRequest('/exam-schedules/statistics');
            console.log('✅ تم جلب إحصائيات جداول الامتحانات:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            throw new Error(error.message || 'فشل في جلب الإحصائيات');
        }
    },

    // ترجمة حالة التوزيع
    translateStatus: (status) => {
        switch (status) {
            case 'complete':
                return 'مكتمل';
            case 'partial':
                return 'جزئي';
            case 'incomplete':
                return 'غير مكتمل';
            default:
                return status;
        }
    },

    // ترجمة الفترة
    translatePeriod: (period) => {
        switch (period) {
            case 'morning':
                return 'صباحية';
            case 'evening':
                return 'مسائية';
            default:
                return period;
        }
    },

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

    // التحقق من صحة البيانات قبل الإرسال
    validateScheduleData: (data) => {
        const errors = {};

        if (!data.date) {
            errors.date = 'التاريخ مطلوب';
        } else {
            const selectedDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                errors.date = 'لا يمكن إنشاء جدول امتحان لتاريخ ماضي';
            }
        }

        if (!data.period) {
            errors.period = 'الفترة مطلوبة';
        }

        if (!data.rooms || !Array.isArray(data.rooms) || data.rooms.length === 0) {
            errors.rooms = 'يجب اختيار قاعة واحدة على الأقل';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    },
};

export default examScheduleService;