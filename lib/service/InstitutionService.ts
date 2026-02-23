import { api, handleResponse, SPResponse } from './apiClient';
import { Faculty, Department, Programme, Level } from '@/types';

export const InstitutionService = {
    // ─── Faculties ───────────────────────────────────

    getFaculties() {
        return handleResponse<Faculty[]>(api.get('/institution/faculties'));
    },

    saveFaculty(data: Partial<Faculty>) {
        return handleResponse<SPResponse>(api.post('/institution/faculties', data));
    },

    deleteFaculty(id: number) {
        return handleResponse<SPResponse>(api.delete(`/institution/faculties/${id}`));
    },

    // ─── Departments ─────────────────────────────────

    getDepartments(facultyId?: number) {
        const params = facultyId ? { facultyId } : {};
        return handleResponse<Department[]>(api.get('/institution/departments', { params }));
    },

    saveDepartment(data: Partial<Department>) {
        return handleResponse<SPResponse>(api.post('/institution/departments', data));
    },

    deleteDepartment(id: number) {
        return handleResponse<SPResponse>(api.delete(`/institution/departments/${id}`));
    },

    // ─── Programmes ──────────────────────────────────

    getProgrammes(departmentId?: number) {
        const params = departmentId ? { departmentId } : {};
        return handleResponse<Programme[]>(api.get('/institution/programmes', { params }));
    },

    saveProgramme(data: Partial<Programme>) {
        return handleResponse<SPResponse>(api.post('/institution/programmes', data));
    },

    deleteProgramme(id: number) {
        return handleResponse<SPResponse>(api.delete(`/institution/programmes/${id}`));
    },

    // ─── Levels (read-only) ──────────────────────────

    getLevels() {
        return handleResponse<Level[]>(api.get('/institution/levels'));
    }
};
