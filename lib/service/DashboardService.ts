import { api, handleResponse } from './apiClient';
import { DashboardStats, RecentStudent, LecturerDashboardStats, StudentByLevel, GradeDistributionItem } from '@/types';

export const DashboardService = {
    /** Get admin dashboard stats */
    getStats() {
        return handleResponse<DashboardStats>(api.get('/dashboard/stats'));
    },

    /** Get recent students */
    getRecentStudents() {
        return handleResponse<RecentStudent[]>(api.get('/dashboard/recent-students'));
    },

    /** Get lecturer dashboard stats */
    getLecturerStats(lecturerId: number) {
        return handleResponse<LecturerDashboardStats>(api.get(`/dashboard/lecturer-stats/${lecturerId}`));
    },

    /** Get student count per level */
    getStudentsByLevel() {
        return handleResponse<StudentByLevel[]>(api.get('/dashboard/students-by-level'));
    },

    /** Get grade distribution across all scores */
    getGradeDistribution() {
        return handleResponse<GradeDistributionItem[]>(api.get('/dashboard/grade-distribution'));
    }
};
