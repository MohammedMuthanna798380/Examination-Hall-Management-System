// frontend/app/src/services/dailyAssignmentService.js

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

// Daily Assignment API functions
export const dailyAssignmentService = {
    // تنفيذ التوزيع التلقائي
    performAutomaticAssignment: async (assignmentData) => {
        try {
            // التحقق من البيانات قبل الإرسال
            const requiredFields = ['date', 'period', 'selected_halls'];
            const missingFields = requiredFields.filter(field => !assignmentData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            if (!Array.isArray(assignmentData.selected_halls) || assignmentData.selected_halls.length === 0) {
                throw new Error('يجب اختيار قاعة واحدة على الأقل');
            }

            const cleanedData = {
                date: assignmentData.date,
                period: assignmentData.period,
                selected_halls: assignmentData.selected_halls,
            };

            console.log('📤 تنفيذ التوزيع التلقائي:', cleanedData);

            const response = await makeRequest('/daily-assignments/automatic', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم التوزيع بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في التوزيع التلقائي:', error);
            throw new Error(error.message || 'فشل في التوزيع التلقائي');
        }
    },

    // الحصول على التوزيع لتاريخ وفترة محددة
    getAssignmentByDate: async (date, period) => {
        try {
            if (!date || !period) {
                throw new Error('التاريخ والفترة مطلوبان');
            }

            const queryParams = new URLSearchParams({
                date: date,
                period: period
            });

            const response = await makeRequest(`/daily-assignments/by-date?${queryParams.toString()}`);

            const assignments = response.data || [];
            console.log(`✅ تم جلب ${assignments.length} توزيع`);
            return assignments;
        } catch (error) {
            console.error('❌ خطأ في جلب التوزيع:', error);
            throw new Error(error.message || 'فشل في جلب التوزيع');
        }
    },

    // حفظ التوزيع النهائي
    saveAssignment: async (date, period, assignments) => {
        try {
            if (!date || !period) {
                throw new Error('التاريخ والفترة مطلوبان');
            }

            const cleanedData = {
                date: date,
                period: period,
                assignments: assignments || []
            };

            console.log('📤 حفظ التوزيع:', cleanedData);

            const response = await makeRequest('/daily-assignments/save', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم حفظ التوزيع بنجاح');
            return response;
        } catch (error) {
            console.error('❌ خطأ في حفظ التوزيع:', error);
            throw new Error(error.message || 'فشل في حفظ التوزيع');
        }
    },

    // حذف التوزيع
    deleteAssignment: async (date, period) => {
        try {
            if (!date || !period) {
                throw new Error('التاريخ والفترة مطلوبان');
            }

            const cleanedData = {
                date: date,
                period: period
            };

            console.log('📤 حذف التوزيع:', cleanedData);

            const response = await makeRequest('/daily-assignments/delete', {
                method: 'DELETE',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم حذف التوزيع بنجاح');
            return response;
        } catch (error) {
            console.error('❌ خطأ في حذف التوزيع:', error);
            throw new Error(error.message || 'فشل في حذف التوزيع');
        }
    },

    // استبدال مشرف أو ملاحظ
    replaceUser: async (replacementData) => {
        try {
            const requiredFields = ['assignment_id', 'user_type', 'replacement_user_id', 'reason'];
            const missingFields = requiredFields.filter(field => !replacementData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                assignment_id: replacementData.assignment_id,
                user_type: replacementData.user_type,
                original_user_id: replacementData.original_user_id || null,
                replacement_user_id: replacementData.replacement_user_id,
                reason: replacementData.reason,
            };

            console.log('📤 استبدال مستخدم:', cleanedData);

            const response = await makeRequest('/daily-assignments/replace-user', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم الاستبدال بنجاح:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ خطأ في الاستبدال:', error);
            throw new Error(error.message || 'فشل في الاستبدال');
        }
    },

    // تسجيل غياب
    recordAbsence: async (absenceData) => {
        try {
            const requiredFields = ['assignment_id', 'user_id', 'reason'];
            const missingFields = requiredFields.filter(field => !absenceData[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const cleanedData = {
                assignment_id: absenceData.assignment_id,
                user_id: absenceData.user_id,
                reason: absenceData.reason,
            };

            console.log('📤 تسجيل غياب:', cleanedData);

            const response = await makeRequest('/daily-assignments/record-absence', {
                method: 'POST',
                body: JSON.stringify(cleanedData),
            });

            console.log('✅ تم تسجيل الغياب بنجاح');
            return response;
        } catch (error) {
            console.error('❌ خطأ في تسجيل الغياب:', error);
            throw new Error(error.message || 'فشل في تسجيل الغياب');
        }
    },

    // الحصول على المتاحين للاستبدال
    getAvailableForReplacement: async (filters) => {
        try {
            const requiredFields = ['date', 'period', 'user_type', 'room_id'];
            const missingFields = requiredFields.filter(field => !filters[field]);

            if (missingFields.length > 0) {
                throw new Error(`الحقول التالية مطلوبة: ${missingFields.join(', ')}`);
            }

            const queryParams = new URLSearchParams();
            queryParams.append('date', filters.date);
            queryParams.append('period', filters.period);
            queryParams.append('user_type', filters.user_type);
            queryParams.append('room_id', filters.room_id);

            if (filters.supervisor_id) {
                queryParams.append('supervisor_id', filters.supervisor_id);
            }

            const response = await makeRequest(`/daily-assignments/available-for-replacement?${queryParams.toString()}`);

            const availableUsers = response.data || [];
            console.log(`✅ تم جلب ${availableUsers.length} مستخدم متاح للاستبدال`);
            return availableUsers;
        } catch (error) {
            console.error('❌ خطأ في جلب المتاحين للاستبدال:', error);
            throw new Error(error.message || 'فشل في جلب المتاحين للاستبدال');
        }
    },

    // دوال المساعدة

    // التحقق من صحة بيانات التوزيع
    validateAssignmentData: (data) => {
        const errors = {};

        if (!data.date) {
            errors.date = 'التاريخ مطلوب';
        } else {
            const selectedDate = new Date(data.date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                errors.date = 'لا يمكن إنشاء توزيع لتاريخ ماضي';
            }
        }

        if (!data.period) {
            errors.period = 'الفترة مطلوبة';
        }

        if (!data.selected_halls || !Array.isArray(data.selected_halls) || data.selected_halls.length === 0) {
            errors.selected_halls = 'يجب اختيار قاعة واحدة على الأقل';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
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

    // ترجمة نوع التوزيع
    translateAssignmentType: (type) => {
        switch (type) {
            case 'automatic':
                return 'تلقائي';
            case 'manual':
                return 'يدوي';
            default:
                return type;
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

    // حساب إحصائيات التوزيع
    calculateAssignmentStatistics: (assignments) => {
        if (!assignments || assignments.length === 0) {
            return {
                totalRooms: 0,
                completeAssignments: 0,
                partialAssignments: 0,
                incompleteAssignments: 0,
                totalSupervisors: 0,
                totalObservers: 0,
                successRate: 0
            };
        }

        const stats = {
            totalRooms: assignments.length,
            completeAssignments: assignments.filter(a => a.status === 'complete').length,
            partialAssignments: assignments.filter(a => a.status === 'partial').length,
            incompleteAssignments: assignments.filter(a => a.status === 'incomplete').length,
            totalSupervisors: 0,
            totalObservers: 0,
        };

        assignments.forEach(assignment => {
            if (assignment.supervisor && !assignment.supervisor.missing) {
                stats.totalSupervisors++;
            }
            if (assignment.observers) {
                stats.totalObservers += assignment.observers.filter(o => !o.missing).length;
            }
        });

        stats.successRate = stats.totalRooms > 0
            ? Math.round((stats.completeAssignments / stats.totalRooms) * 100)
            : 0;

        return stats;
    },

    // فحص التعارضات في التوزيع
    checkAssignmentConflicts: (assignments) => {
        const conflicts = [];
        const usedSupervisors = new Set();
        const usedObservers = new Set();

        assignments.forEach((assignment, index) => {
            // فحص تكرار المشرفين
            if (assignment.supervisor && !assignment.supervisor.missing) {
                if (usedSupervisors.has(assignment.supervisor.id)) {
                    conflicts.push({
                        type: 'supervisor_duplicate',
                        message: `المشرف ${assignment.supervisor.name} معين في أكثر من قاعة`,
                        assignmentIndex: index,
                        userId: assignment.supervisor.id
                    });
                } else {
                    usedSupervisors.add(assignment.supervisor.id);
                }
            }

            // فحص تكرار الملاحظين
            if (assignment.observers) {
                assignment.observers.forEach(observer => {
                    if (!observer.missing) {
                        if (usedObservers.has(observer.id)) {
                            conflicts.push({
                                type: 'observer_duplicate',
                                message: `الملاحظ ${observer.name} معين في أكثر من قاعة`,
                                assignmentIndex: index,
                                userId: observer.id
                            });
                        } else {
                            usedObservers.add(observer.id);
                        }
                    }
                });
            }
        });

        return conflicts;
    },

    // إنشاء تقرير التوزيع
    generateAssignmentReport: (assignments, date, period) => {
        const statistics = dailyAssignmentService.calculateAssignmentStatistics(assignments);
        const conflicts = dailyAssignmentService.checkAssignmentConflicts(assignments);

        return {
            header: {
                title: 'تقرير التوزيع اليومي',
                date: dailyAssignmentService.formatDateForDisplay(date),
                period: dailyAssignmentService.translatePeriod(period),
                generatedAt: new Date().toLocaleString('ar-EG'),
            },
            statistics,
            conflicts,
            assignments: assignments.map(assignment => ({
                room: assignment.room,
                supervisor: assignment.supervisor,
                observers: assignment.observers,
                status: dailyAssignmentService.translateStatus(assignment.status),
                type: dailyAssignmentService.translateAssignmentType(assignment.assignment_type),
                notes: assignment.notes
            })),
            summary: {
                totalStaff: statistics.totalSupervisors + statistics.totalObservers,
                coverage: `${statistics.completeAssignments}/${statistics.totalRooms}`,
                successRate: `${statistics.successRate}%`,
                hasConflicts: conflicts.length > 0,
                conflictCount: conflicts.length
            }
        };
    }
};

export default dailyAssignmentService;