import { api, handleResponse } from './apiClient';

export interface SmsRecipient {
    studentIndex: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    programmeName: string;
    levelName: string;
}

export interface SmsSendResult {
    message: string;
    total: number;
    successCount: number;
    failCount: number;
    creditUsed: number;
    creditLeft: number | null;
    numbersSent: string[];
}

export interface SmsBalance {
    balance: string;
}

export interface SmsSenderId {
    id: number;
    senderName: string;
    purpose: string;
    status: string;
    isDefault: boolean;
    createdAt: string;
}

export const SmsService = {
    getRecipients(params?: { programmeId?: number; levelId?: number }) {
        return handleResponse<SmsRecipient[]>(api.get('/sms/recipients', { params }));
    },

    send(data: { recipients: string[]; message: string; senderId?: string }) {
        return handleResponse<SmsSendResult>(api.post('/sms/send', data));
    },

    getBalance() {
        return handleResponse<SmsBalance>(api.get('/sms/balance'));
    },

    getSenderIds() {
        return handleResponse<SmsSenderId[]>(api.get('/sms/sender-ids'));
    },

    registerSenderId(data: { senderName: string; purpose?: string }) {
        return handleResponse<{ message: string; id: number; status: string }>(api.post('/sms/sender-ids', data));
    },

    deleteSenderId(id: number) {
        return handleResponse<{ message: string }>(api.delete(`/sms/sender-ids/${id}`));
    },

    setDefaultSenderId(id: number) {
        return handleResponse<{ message: string }>(api.patch(`/sms/sender-ids/${id}/default`));
    },

    checkSenderIdStatus(data: { senderName: string; id?: number }) {
        return handleResponse<{ message: string; senderStatus: string }>(api.post('/sms/sender-ids/check-status', data));
    }
};
