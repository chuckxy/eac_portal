import { api, handleResponse, SPResponse } from './apiClient';
import { Student, StudentDetail, Lecturer } from '@/types';

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

    toggleLecturerStatus(id: number, isActive: boolean) {
        return handleResponse<SPResponse>(api.patch(`/users/lecturers/${id}/status`, { isActive }));
    }
};
