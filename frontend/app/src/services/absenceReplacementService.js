// frontend/app/src/services/absenceReplacementService.js

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

// Absence and Replacement Management API functions
export const absenceReplacementService = {
    // الحصول على التوزيعات لتاريخ وفترة محددة
    getAssignments: async (date, period) => {
        try {
            if (!date || !period) {
                throw new Error('التاريخ والفترة مطلوبان');
            }

            const queryParams = new URLSearchParams({
                date: date,
                period: period
            });

            const response = await makeRequest(`/absence-management/assignments?${queryParams.toString()}`);

            const data = response.data || { supervisors: [], observers: [] };
            console.log(`✅ تم جلب ${data.supervisors.length} مشرف و ${data.observers.length} ملاحظ`);
            return data;
        } catch (error) {
            console.error('❌ خطأ في جلب التوزيعات:', error);
            throw new Error(error.message || 'فشل في جلب التوزيعات');
        }
    },

    // تسجيل غياب مستخدم
    recordAbsence: async (absenceData) => {
        try {
            const requiredFields = ['assignment_id', 'user_id', 'user_type'];
            const missingFields = requiredFields.filter(field => !absenceData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                assignment_id: absenceData.assignment_id,
                user_id: absenceData.user_id,
                user_type: absenceData.user_type,
                reason: absenceData.reason || 'غياب',
            };

            console.log('📤 تسجيل غياب:', cleanedData);

            const response = await makeRequest('/absence-management/record-absence', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم تسجيل الغياب بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في تسجيل الغياب:', error);
            throw new Error(error.message || 'فشل في تسجيل الغياب');
        }
    },

    // الاستبدال التلقائي
    autoReplace: async (replacementData) => {
        try {
            const requiredFields = ['assignment_id', 'user_id', 'user_type'];
            const missingFields = requiredFields.filter(field => !replacementData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                assignment_id: replacementData.assignment_id,
                user_id: replacementData.user_id,
                user_type: replacementData.user_type,
            };

            console.log('📤 الاستبدال التلقائي:', cleanedData);

            const response = await makeRequest('/absence-management/auto-replace', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم الاستبدال التلقائي بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في الاستبدال التلقائي:', error);
            throw new Error(error.message || 'فشل في الاستبدال التلقائي');
        }
    },

    // الحصول على المتاحين للاستبدال اليدوي
    getAvailableReplacements: async (filters) => {
        try {
            const requiredFields = ['assignment_id', 'user_type', 'date', 'period'];
            const missingFields = requiredFields.filter(field => !filters[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const queryParams = new URLSearchParams();
            queryParams.append('assignment_id', filters.assignment_id);
            queryParams.append('user_type', filters.user_type);
            queryParams.append('date', filters.date);
            queryParams.append('period', filters.period);

            const response = await makeRequest(`/absence-management/available-replacements?${queryParams.toString()}`);

            const availableUsers = response.data || [];
            console.log(`✅ تم جلب ${availableUsers.length} مستخدم متاح للاستبدال`);
            return availableUsers;
        } catch (error) {
            console.error('❌ خطأ في جلب المتاحين للاستبدال:', error);
            throw new Error(error.message || 'فشل في جلب المتاحين للاستبدال');
        }
    },

    // الاستبدال اليدوي
    manualReplace: async (replacementData) => {
        try {
            const requiredFields = ['assignment_id', 'original_user_id', 'replacement_user_id', 'user_type'];
            const missingFields = requiredFields.filter(field => !replacementData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                assignment_id: replacementData.assignment_id,
                original_user_id: replacementData.original_user_id,
                replacement_user_id: replacementData.replacement_user_id,
                user_type: replacementData.user_type,
                reason: replacementData.reason || 'استبدال يدوي',
            };

            console.log('📤 الاستبدال اليدوي:', cleanedData);

            const response = await makeRequest('/absence-management/manual-replace', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم الاستبدال اليدوي بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في الاستبدال اليدوي:', error);
            throw new Error(error.message || 'فشل في الاستبدال اليدوي');
        }
    },

    // دوال المساعدة

    // ترجمة حالة المستخدم
    translateUserStatus: (status) => {
        switch (status) {
            case 'assigned':
                return 'معين';
            case 'absent':
                return 'غائب';
            case 'replaced':
                return 'مستبدل';
            default:
                return status;
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
    validateAbsenceData: (data) => {
        const errors = {};

        if (!data.assignment_id) {
            errors.assignment_id = 'معرف التوزيع مطلوب';
        }

        if (!data.user_id) {
            errors.user_id = 'معرف المستخدم مطلوب';
        }

        if (!data.user_type) {
            errors.user_type = 'نوع المستخدم مطلوب';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    },

    // التحقق من صحة بيانات الاستبدال
    validateReplacementData: (data) => {
        const errors = {};

        if (!data.assignment_id) {
            errors.assignment_id = 'معرف التوزيع مطلوب';
        }

        if (!data.original_user_id) {
            errors.original_user_id = 'معرف المستخدم الأصلي مطلوب';
        }

        if (!data.replacement_user_id) {
            errors.replacement_user_id = 'معرف المستخدم البديل مطلوب';
        }

        if (!data.user_type) {
            errors.user_type = 'نوع المستخدم مطلوب';
        }

        if (data.original_user_id === data.replacement_user_id) {
            errors.replacement_user_id = 'لا يمكن استبدال المستخدم بنفسه';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    },

    // حساب إحصائيات الغياب
    calculateAbsenceStatistics: (supervisors, observers) => {
        const allUsers = [...supervisors, ...observers];

        const stats = {
            totalUsers: allUsers.length,
            presentUsers: allUsers.filter(u => u.status === 'assigned').length,
            absentUsers: allUsers.filter(u => u.status === 'absent').length,
            replacedUsers: allUsers.filter(u => u.status === 'replaced').length,
            totalSupervisors: supervisors.length,
            absentSupervisors: supervisors.filter(s => s.status === 'absent').length,
            totalObservers: observers.length,
            absentObservers: observers.filter(o => o.status === 'absent').length,
        };

        stats.attendanceRate = stats.totalUsers > 0
            ? Math.round((stats.presentUsers / stats.totalUsers) * 100)
            : 0;

        stats.absentRate = stats.totalUsers > 0
            ? Math.round((stats.absentUsers / stats.totalUsers) * 100)
            : 0;

        return stats;
    },

    // تصفية المستخدمين حسب الحالة
    filterUsersByStatus: (users, status) => {
        return users.filter(user => user.status === status);
    },

    // تصفية المستخدمين حسب عدد الغيابات
    filterUsersByAbsenceCount: (users, minAbsences = 2) => {
        return users.filter(user => {
            const userInfo = user.supervisor || user.observer;
            return userInfo && userInfo.consecutiveAbsences >= minAbsences;
        });
    },

    // اختبار الاتصال (للتطوير)
    testConnection: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/test-absence/assignments?date=2025-06-01&period=morning`);
            const data = await response.json();
            console.log('✅ اختبار الاتصال نجح:', data);
            return data;
        } catch (error) {
            console.error('❌ فشل اختبار الاتصال:', error);
            throw error;
        }
    }
};

export default absenceReplacementService;