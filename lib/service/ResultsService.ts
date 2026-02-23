import { api, handleResponse, SPResponse } from './apiClient';
import { ScoreRecord, StudentScore, BulkScoreResult } from '@/types';

export const ResultsService = {
    /** Browse all scores with optional filters */
    getScores(params?: { assessmentId?: number; studentIndex?: string; assignmentId?: number; semesterId?: number }) {
        return handleResponse<ScoreRecord[]>(api.get('/results/scores', { params }));
    },

    /** Get students enrolled in the course for a specific assessment (with existing scores if any) */
    getStudentsForAssessment(assessmentId: number) {
        return handleResponse<StudentScore[]>(api.get(`/results/students-for-assessment/${assessmentId}`));
    },

    /** Save a single score */
    saveScore(data: { assessmentId: number; studentIndex: string; marksObtained: number; uploadedBy: number }) {
        return handleResponse<SPResponse>(api.post('/results/scores', data));
    },

    /** Save multiple scores at once */
    saveBulkScores(scores: { assessmentId: number; studentIndex: string; marksObtained: number; uploadedBy: number }[]) {
        console.log('Saving bulk scores:', scores);
        return handleResponse<BulkScoreResult>(api.post('/results/scores/bulk', { scores }));
    }
};
