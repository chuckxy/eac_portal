'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { AuthUser, UserRole, LoginRequest, RegisterAdminRequest } from '@/types';
import { AuthService } from '@/lib/service/AuthService';

interface AuthContextValue {
    /** The authenticated user, or null if not logged in */
    user: AuthUser | null;
    /** True while checking initial session on mount */
    loading: boolean;
    /** Login with username/password */
    login: (data: LoginRequest) => Promise<void>;
    /** Register a new admin and auto-login */
    registerAdmin: (data: RegisterAdminRequest) => Promise<void>;
    /** Clear session and redirect to login */
    logout: () => void;
    /** Check if user has one of the given roles */
    hasRole: (...roles: UserRole[]) => boolean;
    /** True if user is authenticated */
    isAuthenticated: boolean;
    /** Update user in state and storage (e.g. after password change) */
    updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue>({
    user: null,
    loading: true,
    login: async () => {},
    registerAdmin: async () => {},
    logout: () => {},
    hasRole: () => false,
    isAuthenticated: false,
    updateUser: () => {}
});

/** Public pages that don't require authentication */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password'];

/** Pages that require authentication but are exempt from mustChangePassword redirect */
const PASSWORD_CHANGE_PATH = '/auth/change-password';

/**
 * Route-based access control map.
 * Each key is a path prefix; the value is the list of roles allowed to access it.
 * Routes not listed here are accessible to any authenticated user.
 */
const ROUTE_ROLES: Record<string, UserRole[]> = {
    // Admin-only management pages
    '/dashboard/admin': ['admin'],
    '/academic': ['admin'],
    '/institution': ['admin'],
    '/users': ['admin'],
    '/grading': ['admin'],

    // Admin + Lecturer pages
    '/courses': ['admin', 'lecturer'],
    '/assessments': ['admin', 'lecturer'],
    '/results': ['admin', 'lecturer'],

    // Lecturer-only pages
    '/dashboard/lecturer': ['lecturer'],

    // Student-only pages
    '/dashboard/student': ['student'],
    '/student': ['student']
};

/** Check whether a given role is allowed to access the given path */
function isRouteAllowed(path: string, role: UserRole): boolean {
    for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLES)) {
        if (path.startsWith(prefix)) {
            return allowedRoles.includes(role);
        }
    }
    // Routes not in the map are accessible to any authenticated user
    return true;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // ─── Initialize session from storage ─────────────
    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedUser = AuthService.getSavedUser();
                const accessToken = AuthService.getAccessToken();

                if (savedUser && accessToken) {
                    // Set user from storage immediately for fast UI render
                    setUser(savedUser);

                    // Validate token in background
                    try {
                        const { user: freshUser } = await AuthService.getMe();
                        setUser(freshUser);
                        AuthService.saveUser(freshUser);
                    } catch {
                        // Token invalid — try refresh
                        const refreshToken = AuthService.getRefreshToken();
                        if (refreshToken) {
                            try {
                                const res = await AuthService.refresh(refreshToken);
                                AuthService.saveTokens(res.accessToken, res.refreshToken);
                                AuthService.saveUser(res.user);
                                setUser(res.user);
                            } catch {
                                // Refresh failed — clear everything
                                AuthService.clearStorage();
                                setUser(null);
                            }
                        } else {
                            AuthService.clearStorage();
                            setUser(null);
                        }
                    }
                } else {
                    setUser(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    // ─── Redirect logic ──────────────────────────────
    useEffect(() => {
        if (loading) return;

        const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
        const isPasswordChangePage = pathname === PASSWORD_CHANGE_PATH;

        if (!user && !isPublic) {
            // Not logged in and not on a public page → go to login
            // Allow change-password page only if user is set (handled below)
            if (!isPasswordChangePage) {
                router.replace('/auth/login');
            } else {
                // Not logged in on change-password page → go to login
                router.replace('/auth/login');
            }
        } else if (user && user.mustChangePassword) {
            // ─── Force password change ───────────────
            // User must change password — only allow the change-password page
            if (!isPasswordChangePage) {
                router.replace(PASSWORD_CHANGE_PATH);
            }
        } else if (user && isPublic) {
            // Redirect logged-in users away from login/register pages
            const dashboardPath = getDashboardPath(user.role);
            router.replace(dashboardPath);
        } else if (user && isPasswordChangePage) {
            // User already changed password but is still on change-password page
            // Allow it — they can voluntarily change password again
        } else if (user && pathname && !isPublic) {
            // ─── Role-based route protection ─────────
            if (!isRouteAllowed(pathname, user.role)) {
                // Redirect to user's own dashboard
                const dashboardPath = getDashboardPath(user.role);
                router.replace(dashboardPath);
            }
        }
    }, [user, loading, pathname, router]);

    const login = useCallback(
        async (data: LoginRequest) => {
            const res = await AuthService.login(data);
            AuthService.saveTokens(res.accessToken, res.refreshToken);
            AuthService.saveUser(res.user);
            setUser(res.user);

            if (res.user.mustChangePassword) {
                router.replace(PASSWORD_CHANGE_PATH);
            } else {
                const dashboardPath = getDashboardPath(res.user.role);
                router.replace(dashboardPath);
            }
        },
        [router]
    );

    const registerAdmin = useCallback(
        async (data: RegisterAdminRequest) => {
            const res = await AuthService.registerAdmin(data);
            AuthService.saveTokens(res.accessToken, res.refreshToken);
            AuthService.saveUser(res.user);
            setUser(res.user);
            router.replace('/dashboard/admin');
        },
        [router]
    );

    const logout = useCallback(() => {
        AuthService.clearStorage();
        setUser(null);
        router.replace('/auth/login');
    }, [router]);

    const hasRole = useCallback(
        (...roles: UserRole[]) => {
            return user ? roles.includes(user.role) : false;
        },
        [user]
    );

    const updateUser = useCallback((updatedUser: AuthUser) => {
        setUser(updatedUser);
        AuthService.saveUser(updatedUser);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            login,
            registerAdmin,
            logout,
            hasRole,
            isAuthenticated: !!user,
            updateUser
        }),
        [user, loading, login, registerAdmin, logout, hasRole, updateUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/** Return the default dashboard path for a given role */
function getDashboardPath(role: UserRole): string {
    switch (role) {
        case 'admin':
            return '/dashboard/admin';
        case 'lecturer':
            return '/dashboard/lecturer';
        case 'student':
            return '/dashboard/student';
        default:
            return '/dashboard/admin';
    }
}
