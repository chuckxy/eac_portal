'use client';

import React, { useState, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Page } from '@/types';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useAuth } from '@/layout/context/authcontext';

const Login: Page = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { login, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const colorScheme = layoutConfig.colorScheme;
    const logoSrc = `/layout/images/logo/logo-${colorScheme === 'light' ? 'dark' : 'light'}.png`;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please enter your username and password', life: 3000 });
            return;
        }

        setSubmitting(true);
        try {
            await login({ username: username.trim(), password });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Login failed. Please try again.';
            toast.current?.show({ severity: 'error', summary: 'Login Failed', detail: message, life: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: 'var(--surface-ground)' }}>
                <div className="surface-card border-round shadow-2 p-5 w-full" style={{ maxWidth: '26rem' }}>
                    {/* Header */}
                    <div className="text-center mb-5">
                        <img src={logoSrc} alt="SMS Logo" className="mb-3" style={{ height: '48px' }} />
                        <div className="text-xl font-semibold text-color mb-1">Student Results Portal</div>
                        <span className="text-color-secondary text-sm">Sign in to continue</span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label htmlFor="username" className="block text-color font-medium text-sm mb-2">
                                Username
                            </label>
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-user" />
                                <InputText id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Student Index / Staff ID / Admin" className="w-full" autoComplete="username" autoFocus />
                            </span>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-color font-medium text-sm mb-2">
                                Password
                            </label>
                            <Password
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                feedback={false}
                                autoComplete="current-password"
                            />
                        </div>

                        <Button type="submit" label={submitting ? 'Signing in...' : 'Sign In'} icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'} className="w-full mb-3" disabled={submitting || authLoading} />

                        {/* Forgot Password Link */}
                        <div className="text-right mb-3">
                            <a className="text-primary text-sm cursor-pointer font-medium no-underline hover:underline" onClick={() => router.push('/auth/forgot-password')}>
                                Forgot Password?
                            </a>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="flex align-items-center gap-2 mb-4">
                        <div className="flex-1 border-bottom-1 surface-border"></div>
                        <span className="text-color-secondary text-xs">OR</span>
                        <div className="flex-1 border-bottom-1 surface-border"></div>
                    </div>

                    {/* Admin Registration Link */}
                    <div className="text-center">
                        <span className="text-color-secondary text-sm">Admin setup? </span>
                        <a className="text-primary text-sm cursor-pointer font-medium no-underline hover:underline" onClick={() => router.push('/auth/register')}>
                            Register Admin Account
                        </a>
                    </div>

                    {/* Help text */}
                    <div className="text-center mt-4">
                        <span className="text-color-secondary text-xs">Students: use your Index Number &bull; Lecturers: use your Staff ID</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
