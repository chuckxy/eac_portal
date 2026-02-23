import { api, handleResponse, SPResponse } from './apiClient';
import { StudentProfile, StudentResultRow, TranscriptData, StudentCourseRow } from '@/types';

export const StudentService = {
    /** Get student profile */
    getProfile(studentIndex: string) {
        return handleResponse<StudentProfile>(api.get('/student/profile', { params: { studentIndex } }));
    },

    /** Update own profile (limited fields) */
    updateProfile(studentIndex: string, data: { firstName?: string; lastName?: string; email?: string; phone?: string }) {
        return handleResponse<SPResponse>(api.patch('/student/profile', { studentIndex, ...data }));
    },

    /** Get all results for a student, optionally filtered by semester */
    getResults(studentIndex: string, semesterId?: number) {
        const params: Record<string, any> = { studentIndex };
        if (semesterId) params.semesterId = semesterId;
        return handleResponse<StudentResultRow[]>(api.get('/student/results', { params }));
    },

    /** Get full transcript with GPA */
    getTranscript(studentIndex: string) {
        return handleResponse<TranscriptData>(api.get('/student/transcript', { params: { studentIndex } }));
    },

    /** Get enrolled courses */
    getCourses(studentIndex: string, semesterId?: number) {
        const params: Record<string, any> = { studentIndex };
        if (semesterId) params.semesterId = semesterId;
        return handleResponse<StudentCourseRow[]>(api.get('/student/courses', { params }));
    }
};
