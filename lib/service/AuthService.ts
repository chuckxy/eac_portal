import { api, handleResponse } from './apiClient';
import type { AuthResponse, LoginRequest, RegisterAdminRequest, AuthUser } from '@/types';

const TOKEN_KEY = 'sms_access_token';
const REFRESH_KEY = 'sms_refresh_token';
const USER_KEY = 'sms_user';

export interface ChangePasswordResponse {
    message: string;
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

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

    /** Change password — returns new tokens with mustChangePassword cleared */
    changePassword(currentPassword: string, newPassword: string) {
        return handleResponse<ChangePasswordResponse>(api.post('/auth/change-password', { currentPassword, newPassword }));
    },

    // ─── Password Reset (public, no auth) ────────────

    /** Step 1: Verify user exists and has a phone number */
    verifyUser(username: string) {
        return handleResponse<{ message: string; userId: number; maskedPhone: string; role: string }>(api.post('/auth/verify-user', { username }));
    },

    /** Step 2: Send OTP to user's phone */
    sendResetOtp(userId: number, phone: string) {
        return handleResponse<{ message: string; userId: number }>(api.post('/auth/send-reset-otp', { userId, phone }));
    },

    /** Step 3: Verify OTP and get reset token */
    verifyOtp(userId: number, otp: string) {
        return handleResponse<{ message: string; resetToken: string; userId: number }>(api.post('/auth/verify-otp', { userId, otp }));
    },

    /** Step 4: Reset password using reset token */
    resetPassword(userId: number, resetToken: string, newPassword: string) {
        return handleResponse<{ message: string }>(api.post('/auth/reset-password', { userId, resetToken, newPassword }));
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
