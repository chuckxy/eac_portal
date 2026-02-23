'use client';

import React, { useState, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { Page } from '@/types';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useAuth } from '@/layout/context/authcontext';

const RegisterAdmin: Page = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { registerAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registrationKey, setRegistrationKey] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const colorScheme = layoutConfig.colorScheme;
    const logoSrc = `/layout/images/logo/logo-${colorScheme === 'light' ? 'dark' : 'light'}.png`;

    const passwordHeader = <span className="font-semibold text-sm">Pick a password</span>;
    const passwordFooter = (
        <div className="mt-2">
            <Divider />
            <p className="mt-1 text-xs text-color-secondary">Requirements:</p>
            <ul className="pl-3 mt-1 text-xs text-color-secondary line-height-3">
                <li>At least 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
            </ul>
        </div>
    );

    const validate = (): boolean => {
        if (!username.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Username is required', life: 3000 });
            return false;
        }
        if (username.trim().length < 3) {
            toast.current?.show({ severity: 'warn', summary: 'Invalid', detail: 'Username must be at least 3 characters', life: 3000 });
            return false;
        }
        if (!password) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Password is required', life: 3000 });
            return false;
        }
        if (password.length < 8) {
            toast.current?.show({ severity: 'warn', summary: 'Weak Password', detail: 'Password must be at least 8 characters long', life: 3000 });
            return false;
        }
        if (password !== confirmPassword) {
            toast.current?.show({ severity: 'warn', summary: 'Mismatch', detail: 'Passwords do not match', life: 3000 });
            return false;
        }
        if (!registrationKey.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Registration key is required', life: 3000 });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            await registerAdmin({
                username: username.trim(),
                password,
                confirmPassword,
                registrationKey: registrationKey.trim()
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Admin account created successfully!', life: 3000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
            toast.current?.show({ severity: 'error', summary: 'Registration Failed', detail: message, life: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: 'var(--surface-ground)' }}>
                <div className="surface-card border-round shadow-2 p-5 w-full" style={{ maxWidth: '28rem' }}>
                    {/* Header */}
                    <div className="text-center mb-4">
                        <img src={logoSrc} alt="SMS Logo" className="mb-3" style={{ height: '48px' }} />
                        <div className="text-xl font-semibold text-color mb-1">Admin Registration</div>
                        <span className="text-color-secondary text-sm">Create the initial administrator account</span>
                    </div>

                    <Message severity="info" className="w-full mb-4" text="You need the registration key provided by the system administrator to create an admin account." />

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="reg-username" className="block text-color font-medium text-sm mb-2">
                                Username
                            </label>
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-user" />
                                <InputText id="reg-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="w-full" autoComplete="username" autoFocus />
                            </span>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="reg-password" className="block text-color font-medium text-sm mb-2">
                                Password
                            </label>
                            <Password
                                id="reg-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimum 8 characters"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                header={passwordHeader}
                                footer={passwordFooter}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="reg-confirm" className="block text-color font-medium text-sm mb-2">
                                Confirm Password
                            </label>
                            <Password
                                id="reg-confirm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your password"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                feedback={false}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="reg-key" className="block text-color font-medium text-sm mb-2">
                                Registration Key
                            </label>
                            <span className="p-input-icon-left w-full">
                                <i className="pi pi-key" />
                                <InputText id="reg-key" value={registrationKey} onChange={(e) => setRegistrationKey(e.target.value)} placeholder="Enter the admin registration key" className="w-full" autoComplete="off" />
                            </span>
                        </div>

                        <Button type="submit" label={submitting ? 'Creating Account...' : 'Create Admin Account'} icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-user-plus'} className="w-full mb-4" disabled={submitting || authLoading} />
                    </form>

                    {/* Back to Login */}
                    <div className="text-center">
                        <span className="text-color-secondary text-sm">Already have an account? </span>
                        <a className="text-primary text-sm cursor-pointer font-medium no-underline hover:underline" onClick={() => router.push('/auth/login')}>
                            Sign In
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RegisterAdmin;
