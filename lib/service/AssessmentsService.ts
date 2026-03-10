import { api, handleResponse, SPResponse } from './apiClient';
import { AssessmentType, Assessment } from '@/types';
import { DependencyInfo } from './AcademicService';

export const AssessmentsService = {
    // ─── Assessment Types ────────────────────────────

    getTypes() {
        return handleResponse<AssessmentType[]>(api.get('/assessments/types'));
    },

    saveType(data: Partial<AssessmentType>) {
        return handleResponse<SPResponse>(api.post('/assessments/types', data));
    },

    deleteType(id: number) {
        return handleResponse<SPResponse>(api.delete(`/assessments/types/${id}`));
    },

    getTypeDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/assessments/types/${id}/dependencies`));
    },

    cascadeDeleteType(id: number) {
        return handleResponse<SPResponse>(api.delete(`/assessments/types/${id}/cascade`));
    },

    // ─── Assessments ─────────────────────────────────

    getAssessments(assignmentId?: number) {
        const params = assignmentId ? { assignmentId } : {};
        return handleResponse<Assessment[]>(api.get('/assessments/list', { params }));
    },

    saveAssessment(data: Partial<Assessment>) {
        return handleResponse<SPResponse>(api.post('/assessments/list', data));
    },

    deleteAssessment(id: number) {
        return handleResponse<SPResponse>(api.delete(`/assessments/list/${id}`));
    },

    getAssessmentDependencies(id: number) {
        return handleResponse<DependencyInfo>(api.get(`/assessments/list/${id}/dependencies`));
    },

    cascadeDeleteAssessment(id: number) {
        return handleResponse<SPResponse>(api.delete(`/assessments/list/${id}/cascade`));
    }
};
