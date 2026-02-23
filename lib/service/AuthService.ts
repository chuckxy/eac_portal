import { api, handleResponse } from './apiClient';
import type { AuthResponse, LoginRequest, RegisterAdminRequest, AuthUser } from '@/types';

const TOKEN_KEY = 'sms_access_token';
const REFRESH_KEY = 'sms_refresh_token';
const USER_KEY = 'sms_user';

export const AuthService = {
    /** Login with username/password */
    login(data: LoginRequest) {
        return handleResponse<AuthResponse>(api.post('/auth/login', data));
    },

    /** Register a new admin account */
    registerAdmin(data: RegisterAdminRequest) {
        return handleResponse<AuthResponse>(api.post('/auth/register-admin', data));
    },

    /** Refresh the access token using the refresh token */
    refresh(refreshToken: string) {
        return handleResponse<AuthResponse>(api.post('/auth/refresh', { refreshToken }));
    },

    /** Get current user profile (requires valid access token) */
    getMe() {
        return handleResponse<{ user: AuthUser }>(api.get('/auth/me'));
    },

    /** Change password */
    changePassword(currentPassword: string, newPassword: string) {
        return handleResponse<{ message: string }>(api.post('/auth/change-password', { currentPassword, newPassword }));
    },

    // ─── Token Storage ───────────────────────────────

    saveTokens(accessToken: string, refreshToken: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, accessToken);
            localStorage.setItem(REFRESH_KEY, refreshToken);
        }
    },

    getAccessToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(TOKEN_KEY);
        }
        return null;
    },

    getRefreshToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(REFRESH_KEY);
        }
        return null;
    },

    saveUser(user: AuthUser) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
    },

    getSavedUser(): AuthUser | null {
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem(USER_KEY);
            if (raw) {
                try {
                    return JSON.parse(raw);
                } catch {
                    return null;
                }
            }
        }
        return null;
    },

    clearStorage() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
            localStorage.removeItem(USER_KEY);
        }
    }
};
