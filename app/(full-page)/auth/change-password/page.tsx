'use client';

import React, { useState, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { useAuth } from '@/layout/context/authcontext';
import { AuthService } from '@/lib/service/AuthService';

const ChangePasswordPage = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const { user, updateUser, logout } = useAuth();
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const colorScheme = layoutConfig.colorScheme;
    const logoSrc = `/layout/images/logo/logo-${colorScheme === 'light' ? 'dark' : 'light'}.png`;

    const isForced = user?.mustChangePassword === true;

    const passwordHeader = <div className="font-bold mb-2 text-sm">Password Strength</div>;
    const passwordFooter = (
        <>
            <Divider />
            <p className="mt-2 text-xs text-color-secondary">Requirements:</p>
            <ul className="pl-3 mt-1 text-xs text-color-secondary line-height-3">
                <li>At least 8 characters</li>
                <li>At least one uppercase letter</li>
                <li>At least one lowercase letter</li>
                <li>At least one number</li>
            </ul>
        </>
    );

    const validate = (): string | null => {
        if (!currentPassword) return 'Current password is required.';
        if (!newPassword) return 'New password is required.';
        if (newPassword.length < 8) return 'New password must be at least 8 characters.';
        if (!/[A-Z]/.test(newPassword)) return 'New password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(newPassword)) return 'New password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(newPassword)) return 'New password must contain at least one number.';
        if (currentPassword === newPassword) return 'New password must be different from your current password.';
        if (newPassword !== confirmPassword) return 'Passwords do not match.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const error = validate();
        if (error) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: error, life: 4000 });
            return;
        }

        setSubmitting(true);
        try {
            const res = await AuthService.changePassword(currentPassword, newPassword);

            // Update tokens and user in session (mustChangePassword is now false)
            AuthService.saveTokens(res.accessToken, res.refreshToken);
            AuthService.saveUser(res.user);
            updateUser(res.user);

            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Password changed successfully. Redirecting...', life: 2000 });

            // Redirect to dashboard after brief delay
            setTimeout(() => {
                const dashPath = getDashboardPath(res.user.role);
                router.replace(dashPath);
            }, 1500);
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to change password.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: 'var(--surface-ground)' }}>
                <div className="surface-card border-round shadow-2 p-5 w-full" style={{ maxWidth: '26rem' }}>
                    {/* Header */}
                    <div className="text-center mb-4">
                        <img src={logoSrc} alt="SMS Logo" className="mb-3" style={{ height: '48px' }} />
                        <div className="text-xl font-semibold text-color mb-1">Change Password</div>
                        {isForced ? (
                            <Message severity="warn" className="w-full mt-2" text="You must change your password before continuing. This is required for first-time login." />
                        ) : (
                            <span className="text-color-secondary text-sm">Update your account password</span>
                        )}
                    </div>

                    {/* User info */}
                    {user && (
                        <div className="surface-100 border-round p-3 mb-4 text-center">
                            <div className="text-sm font-medium text-color">
                                {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-color-secondary">{user.username}</div>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="currentPassword" className="block text-color font-medium text-sm mb-2">
                                Current Password
                            </label>
                            <Password
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                feedback={false}
                                autoComplete="current-password"
                                autoFocus
                            />
                            {isForced && <small className="text-color-secondary">For first-time login, this is typically your Student Index or Staff ID.</small>}
                        </div>

                        <div className="mb-3">
                            <label htmlFor="newPassword" className="block text-color font-medium text-sm mb-2">
                                New Password
                            </label>
                            <Password
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                header={passwordHeader}
                                footer={passwordFooter}
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="confirmPassword" className="block text-color font-medium text-sm mb-2">
                                Confirm New Password
                            </label>
                            <Password
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter new password"
                                className="w-full"
                                inputClassName="w-full"
                                toggleMask
                                feedback={false}
                                autoComplete="new-password"
                            />
                        </div>

                        <Button type="submit" label={submitting ? 'Changing...' : 'Change Password'} icon={submitting ? 'pi pi-spin pi-spinner' : 'pi pi-lock'} className="w-full mb-3" disabled={submitting} />

                        {!isForced && <Button type="button" label="Cancel" className="p-button-text w-full" onClick={() => router.back()} disabled={submitting} />}

                        {isForced && (
                            <div className="text-center mt-2">
                                <a className="text-color-secondary text-sm cursor-pointer hover:underline" onClick={handleLogout}>
                                    <i className="pi pi-sign-out mr-1 text-xs" />
                                    Sign out instead
                                </a>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
};

function getDashboardPath(role: string): string {
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

export default ChangePasswordPage;
