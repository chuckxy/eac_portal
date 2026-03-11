import { api, handleResponse, SPResponse } from './apiClient';
import { Course, CourseAssignment } from '@/types';
import { DependencyInfo } from './AcademicService';

export interface BulkCourseUploadResult {
    message: string;
    successCount: number;
    errorCount: number;
    total: number;
    results: { row: number; courseCode: string; success: boolean; message: string }[];
}

export const CoursesService = {
    // ─── Courses ─────────────────────────────────────

    getCourses(departmentId?: number) {
        const params = departmentId ? { departmentId } : {};
        return handleResponse<Course[]>(api.get('/courses/list', { params }));
    },

    saveCourse(data: Partial<Course>) {
        return handleResponse<SPResponse>(api.post('/courses/list', data));
    },

    bulkUploadCourses(data: { courses: Record<string, any>[]; departmentId: number; levelId: number; semesterId?: number }) {
        return handleResponse<BulkCourseUploadResult>(api.post('/courses/list/bulk', data));
    },

    deleteCourse(id: number) {
        return handleResponse<SPResponse>(api.delete(`/courses/list/${id}`));
    },

    getCourseDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/courses/list/${id}/dependencies`));
    },

    cascadeDeleteCourse(id: number) {
        return handleResponse<SPResponse>(api.delete(`/courses/list/${id}/cascade`));
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
    },

    getAssignmentDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/courses/assignments/${id}/dependencies`));
    },

    cascadeDeleteAssignment(id: number) {
        return handleResponse<SPResponse>(api.delete(`/courses/assignments/${id}/cascade`));
    }
};
