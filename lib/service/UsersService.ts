import { api, handleResponse, SPResponse } from './apiClient';
import { Student, StudentDetail, Lecturer } from '@/types';

export interface BulkUploadResult {
    message: string;
    successCount: number;
    errorCount: number;
    total: number;
    results: { row: number; studentIndex?: string; staffId?: string; success: boolean; message: string }[];
}

export const UsersService = {
    // ─── Students ────────────────────────────────────

    getStudents(params?: { programmeId?: number; levelId?: number }) {
        return handleResponse<Student[]>(api.get('/users/students', { params }));
    },

    getStudent(studentIndex: string) {
        return handleResponse<StudentDetail>(api.get(`/users/students/${encodeURIComponent(studentIndex)}`));
    },

    saveStudent(data: Partial<Student>) {
        return handleResponse<SPResponse>(api.post('/users/students', data));
    },

    bulkUploadStudents(data: { students: Record<string, any>[]; programmeId: number; levelId: number; academicYearId: number }) {
        return handleResponse<BulkUploadResult>(api.post('/users/students/bulk', data));
    },

    toggleStudentStatus(studentIndex: string, isActive: boolean) {
        return handleResponse<SPResponse>(api.patch(`/users/students/${encodeURIComponent(studentIndex)}/status`, { isActive }));
    },

    // ─── Lecturers ───────────────────────────────────

    getLecturers(params?: { departmentId?: number }) {
        return handleResponse<Lecturer[]>(api.get('/users/lecturers', { params }));
    },

    getLecturer(id: number) {
        return handleResponse<Lecturer>(api.get(`/users/lecturers/${id}`));
    },

    saveLecturer(data: Partial<Lecturer>) {
        return handleResponse<SPResponse>(api.post('/users/lecturers', data));
    },

    bulkUploadLecturers(data: { lecturers: Record<string, any>[]; departmentId: number }) {
        return handleResponse<BulkUploadResult>(api.post('/users/lecturers/bulk', data));
    },

    toggleLecturerStatus(id: number, isActive: boolean) {
        return handleResponse<SPResponse>(api.patch(`/users/lecturers/${id}/status`, { isActive }));
    }
};
