import { api, handleResponse, SPResponse } from './apiClient';
import { GradingScale } from '@/types';

export const GradingService = {
    /** Get all grading scale rows */
    getScales() {
        return handleResponse<GradingScale[]>(api.get('/grading/scales'));
    },

    /** Update a single grading scale row */
    saveScale(data: Partial<GradingScale>) {
        return handleResponse<SPResponse>(api.post('/grading/scales', data));
    },

    /** Update multiple grading scale rows */
    saveBulkScales(scales: Partial<GradingScale>[]) {
        return handleResponse<SPResponse>(api.post('/grading/scales/bulk', { scales }));
    }
};
