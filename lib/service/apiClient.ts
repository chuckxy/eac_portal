import axios from 'axios';

const TOKEN_KEY = 'sms_access_token';
const REFRESH_KEY = 'sms_refresh_token';

const api = axios.create({ baseURL: '/api' });

// ─── Request interceptor: attach JWT ─────────────────────
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// ─── Response interceptor: auto-refresh on 401 ──────────
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

function processQueue(error: any, token: string | null) {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token!);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 with TOKEN_EXPIRED code, and not for auth endpoints
        if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry && !originalRequest.url?.startsWith('/auth/')) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
                if (!refreshToken) throw new Error('No refresh token');

                const { data } = await axios.post('/api/auth/refresh', { refreshToken });

                if (typeof window !== 'undefined') {
                    localStorage.setItem(TOKEN_KEY, data.accessToken);
                    localStorage.setItem(REFRESH_KEY, data.refreshToken);
                    localStorage.setItem('sms_user', JSON.stringify(data.user));
                }

                processQueue(null, data.accessToken);

                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                // Clear storage and redirect to login
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(TOKEN_KEY);
                    localStorage.removeItem(REFRESH_KEY);
                    localStorage.removeItem('sms_user');
                    window.location.href = '/auth/login';
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

/** Standardized API response handler */
async function handleResponse<T>(promise: Promise<any>): Promise<T> {
    const { data } = await promise;
    return data as T;
}

export interface SPResponse {
    message: string;
    id?: number;
}

export { api, handleResponse };
