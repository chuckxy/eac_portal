import { api, handleResponse } from './apiClient';
import type { Semester, SemesterRef, Department, Programme, Level, Lecturer, Course } from '@/types';

/**
 * LookupService — read-only reference data endpoints.
 * Available to any authenticated user (admin, lecturer, student).
 * Use these instead of admin-only services when you only need dropdown/list data.
 */
export const LookupService = {
    getSemesters(yearId?: number) {
        return handleResponse<Semester[]>(api.get('/lookup/semesters', { params: yearId ? { yearId } : undefined }));
    },

    getSemesterRefs() {
        return handleResponse<SemesterRef[]>(api.get('/lookup/semesters-ref'));
    },

    getDepartments(facultyId?: number) {
        return handleResponse<Department[]>(api.get('/lookup/departments', { params: facultyId ? { facultyId } : undefined }));
    },

    getProgrammes(departmentId?: number) {
        return handleResponse<Programme[]>(api.get('/lookup/programmes', { params: departmentId ? { departmentId } : undefined }));
    },

    getLevels() {
        return handleResponse<Level[]>(api.get('/lookup/levels'));
    },

    getLecturers(departmentId?: number) {
        return handleResponse<Lecturer[]>(api.get('/lookup/lecturers', { params: departmentId ? { departmentId } : undefined }));
    },

    getCourses(departmentId?: number) {
        return handleResponse<Course[]>(api.get('/lookup/courses', { params: departmentId ? { departmentId } : undefined }));
    }
};
