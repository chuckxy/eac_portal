import { api, handleResponse, SPResponse } from './apiClient';
import { AcademicYear, Semester } from '@/types';

export const AcademicService = {
    // ─── Academic Years ──────────────────────────────

    getYears() {
        return handleResponse<AcademicYear[]>(api.get('/academic/years'));
    },

    getYear(id: number) {
        return handleResponse<AcademicYear>(api.get(`/academic/years/${id}`));
    },

    saveYear(data: Partial<AcademicYear>) {
        return handleResponse<SPResponse>(api.post('/academic/years', data));
    },

    deleteYear(id: number) {
        return handleResponse<SPResponse>(api.delete(`/academic/years/${id}`));
    },

    // ─── Academic Semesters ──────────────────────────

    getSemesters(yearId?: number) {
        const params = yearId ? { yearId } : {};
        return handleResponse<Semester[]>(api.get('/academic/semesters', { params }));
    },

    saveSemester(data: Partial<Semester>) {
        return handleResponse<SPResponse>(api.post('/academic/semesters', data));
    },

    deleteSemester(id: number) {
        return handleResponse<SPResponse>(api.delete(`/academic/semesters/${id}`));
    }
};
