import { api, handleResponse, SPResponse } from './apiClient';
import { Course, CourseAssignment } from '@/types';

export const CoursesService = {
    // ─── Courses ─────────────────────────────────────

    getCourses(departmentId?: number) {
        const params = departmentId ? { departmentId } : {};
        return handleResponse<Course[]>(api.get('/courses/list', { params }));
    },

    saveCourse(data: Partial<Course>) {
        return handleResponse<SPResponse>(api.post('/courses/list', data));
    },

    deleteCourse(id: number) {
        return handleResponse<SPResponse>(api.delete(`/courses/list/${id}`));
    },

    // ─── Course Assignments ──────────────────────────

    getAssignments(params?: { semesterId?: number; lecturerId?: number }) {
        return handleResponse<CourseAssignment[]>(api.get('/courses/assignments', { params }));
    },

    saveAssignment(data: Partial<CourseAssignment>) {
        return handleResponse<SPResponse>(api.post('/courses/assignments', data));
    },

    deleteAssignment(id: number) {
        return handleResponse<SPResponse>(api.delete(`/courses/assignments/${id}`));
    }
};
