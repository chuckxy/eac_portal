import { api, handleResponse, SPResponse } from './apiClient';
import { AcademicYear, Semester, SemesterRef } from '@/types';

export interface DependencyInfo {
    hasDependencies: boolean;
    counts: Record<string, number>;
}

export const AcademicService = {
    // ─── Semesters Reference (lookup table) ────────

    getSemesterRefs() {
        return handleResponse<SemesterRef[]>(api.get('/academic/semesters-ref'));
    },

    saveSemesterRef(data: Partial<SemesterRef>) {
        return handleResponse<SPResponse>(api.post('/academic/semesters-ref', data));
    },

    deleteSemesterRef(id: number) {
        return handleResponse<SPResponse>(api.delete(`/academic/semesters-ref/${id}`));
    },

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

    getYearDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/academic/years/${id}/dependencies`));
    },

    cascadeDeleteYear(id: number) {
        return handleResponse<SPResponse>(api.delete(`/academic/years/${id}/cascade`));
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
    },

    getSemesterDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/academic/semesters/${id}/dependencies`));
    },

    cascadeDeleteSemester(id: number) {
        return handleResponse<SPResponse>(api.delete(`/academic/semesters/${id}/cascade`));
    }
};
