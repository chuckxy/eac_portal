import { api, handleResponse, SPResponse } from './apiClient';
import { AssessmentType, Assessment } from '@/types';

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
    }
};
