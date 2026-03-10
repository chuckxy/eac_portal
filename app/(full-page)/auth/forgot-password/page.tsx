'use client';

import React, { useState, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Steps } from 'primereact/steps';
import { Divider } from 'primereact/divider';
import { Message } from 'primereact/message';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { AuthService } from '@/lib/service/AuthService';

const ForgotPasswordPage = () => {
    const { layoutConfig } = useContext(LayoutContext);
    const router = useRouter();
    const toast = useRef<Toast>(null);

    const colorScheme = layoutConfig.colorScheme;
    const logoSrc = `/layout/images/logo/logo-${colorScheme === 'light' ? 'dark' : 'light'}.png`;

    // ─── Step tracker ─────────────────────────────────
    const [activeStep, setActiveStep] = useState(0);
    const steps = [{ label: 'Verify ID' }, { label: 'Phone' }, { label: 'OTP' }, { label: 'New Password' }];

    // ─── Step 1: Verify User ──────────────────────────
    const [username, setUsername] = useState('');
    const [verifying, setVerifying] = useState(false);

    // ─── Step 2: Phone Verification ───────────────────
    const [userId, setUserId] = useState<number | null>(null);
    const [maskedPhone, setMaskedPhone] = useState('');
    const [phone, setPhone] = useState('');
    const [sendingOtp, setSendingOtp] = useState(false);

    // ─── Step 3: OTP Verification ─────────────────────
    const [otp, setOtp] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    // ─── Step 4: Reset Password ───────────────────────
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetting, setResetting] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    // ─── Step 1 Handler ───────────────────────────────
    const handleVerifyUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please enter your User ID.', life: 3000 });
            return;
        }

        setVerifying(true);
        try {
            const result = await AuthService.verifyUser(username.trim());
            setUserId(result.userId);
            setMaskedPhone(result.maskedPhone);
            setActiveStep(1);
            toast.current?.show({ severity: 'success', summary: 'Verified', detail: 'Account found. Please verify your phone number.', life: 3000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Verification failed.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setVerifying(false);
        }
    };

    // ─── Step 2 Handler ───────────────────────────────
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please enter your phone number.', life: 3000 });
            return;
        }

        setSendingOtp(true);
        try {
            const result = await AuthService.sendResetOtp(userId!, phone.trim());
            setActiveStep(2);
            toast.current?.show({ severity: 'success', summary: 'OTP Sent', detail: result.message, life: 5000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to send OTP.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setSendingOtp(false);
        }
    };

    // ─── Step 3 Handler ───────────────────────────────
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpStr = otp.trim();
        if (otpStr.length !== 6 || !/^\d{6}$/.test(otpStr)) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please enter the 6-digit OTP.', life: 3000 });
            return;
        }

        setVerifyingOtp(true);
        try {
            const result = await AuthService.verifyOtp(userId!, otpStr);
            setResetToken(result.resetToken);
            setActiveStep(3);
            toast.current?.show({ severity: 'success', summary: 'Verified', detail: 'OTP verified. Set your new password.', life: 3000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'OTP verification failed.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setVerifyingOtp(false);
        }
    };

    // ─── Step 4 Handler ───────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newPassword) {
            toast.current?.show({ severity: 'warn', summary: 'Required', detail: 'Please enter a new password.', life: 3000 });
            return;
        }
        if (newPassword.length < 8) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Password must be at least 8 characters.', life: 3000 });
            return;
        }
        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Password must include uppercase, lowercase, and a number.', life: 4000 });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Passwords do not match.', life: 3000 });
            return;
        }

        setResetting(true);
        try {
            const result = await AuthService.resetPassword(userId!, resetToken, newPassword);
            setResetComplete(true);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: result.message, life: 5000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Password reset failed.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setResetting(false);
        }
    };

    // ─── Resend OTP ───────────────────────────────────
    const handleResendOtp = async () => {
        setSendingOtp(true);
        try {
            const result = await AuthService.sendResetOtp(userId!, phone.trim());
            setOtp('');
            toast.current?.show({ severity: 'success', summary: 'OTP Resent', detail: result.message, life: 5000 });
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.message || 'Failed to resend OTP.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: message, life: 4000 });
        } finally {
            setSendingOtp(false);
        }
    };

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

    return (
        <>
            <Toast ref={toast} />
            <div className="flex align-items-center justify-content-center min-h-screen" style={{ background: 'var(--surface-ground)' }}>
                <div className="surface-card border-round shadow-2 p-5 w-full" style={{ maxWidth: '30rem' }}>
                    {/* Header */}
                    <div className="text-center mb-4">
                        <img src={logoSrc} alt="SMS Logo" className="mb-3" style={{ height: '48px' }} />
                        <div className="text-xl font-semibold text-color mb-1">Reset Password</div>
                        <span className="text-color-secondary text-sm">Verify your identity to reset your password</span>
                    </div>

                    {/* Steps indicator */}
                    <Steps model={steps} activeIndex={activeStep} readOnly className="mb-4" />

                    {/* ─── Step 1: Verify User ID ──────────── */}
                    {activeStep === 0 && (
                        <form onSubmit={handleVerifyUser}>
                            <div className="mb-4">
                                <label htmlFor="username" className="block text-color font-medium text-sm mb-2">
                                    User ID
                                </label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-user" />
                                    <InputText
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Student Index / Staff ID"
                                        className="w-full"
                                        autoFocus
                                    />
                                </span>
                                <small className="text-color-secondary text-xs mt-1 block">Enter the same ID you use to log in.</small>
                            </div>
                            <Button type="submit" label={verifying ? 'Verifying...' : 'Verify'} icon={verifying ? 'pi pi-spin pi-spinner' : 'pi pi-arrow-right'} className="w-full" disabled={verifying} />
                        </form>
                    )}

                    {/* ─── Step 2: Phone verification ──────── */}
                    {activeStep === 1 && (
                        <form onSubmit={handleSendOtp}>
                            <Message severity="info" className="w-full mb-3" text={`We found your account. A phone number ending in ${maskedPhone} is on file.`} />

                            <div className="mb-4">
                                <label htmlFor="phone" className="block text-color font-medium text-sm mb-2">
                                    Enter your full phone number
                                </label>
                                <span className="p-input-icon-left w-full">
                                    <i className="pi pi-phone" />
                                    <InputText
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g. 0241234567"
                                        className="w-full"
                                        autoFocus
                                    />
                                </span>
                                <small className="text-color-secondary text-xs mt-1 block">Must match the phone number in your profile.</small>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" label="Back" icon="pi pi-arrow-left" className="p-button-outlined flex-1" onClick={() => setActiveStep(0)} />
                                <Button type="submit" label={sendingOtp ? 'Sending...' : 'Send OTP'} icon={sendingOtp ? 'pi pi-spin pi-spinner' : 'pi pi-send'} className="flex-1" disabled={sendingOtp} />
                            </div>
                        </form>
                    )}

                    {/* ─── Step 3: Enter OTP ───────────────── */}
                    {activeStep === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            <Message severity="info" className="w-full mb-3" text={`A 6-digit code was sent to ${maskedPhone}. Enter it below.`} />

                            <div className="mb-4">
                                <label htmlFor="otp" className="block text-color font-medium text-sm mb-2">
                                    Enter 6-digit code
                                </label>
                                <InputText
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                                        setOtp(val);
                                    }}
                                    placeholder="000000"
                                    className="w-full text-center text-2xl"
                                    style={{ letterSpacing: '0.5em' }}
                                    maxLength={6}
                                    keyfilter="int"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-2 mb-3">
                                <Button type="button" label="Back" icon="pi pi-arrow-left" className="p-button-outlined flex-1" onClick={() => setActiveStep(1)} />
                                <Button type="submit" label={verifyingOtp ? 'Verifying...' : 'Verify OTP'} icon={verifyingOtp ? 'pi pi-spin pi-spinner' : 'pi pi-check'} className="flex-1" disabled={verifyingOtp} />
                            </div>

                            <div className="text-center">
                                <span className="text-color-secondary text-sm">Didn&apos;t receive it? </span>
                                <a className="text-primary text-sm cursor-pointer font-medium no-underline hover:underline" onClick={sendingOtp ? undefined : handleResendOtp}>
                                    {sendingOtp ? 'Sending...' : 'Resend OTP'}
                                </a>
                            </div>
                        </form>
                    )}

                    {/* ─── Step 4: New Password ────────────── */}
                    {activeStep === 3 && !resetComplete && (
                        <form onSubmit={handleResetPassword}>
                            <Message severity="success" className="w-full mb-3" text="Identity verified! Set your new password below." />

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
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="block text-color font-medium text-sm mb-2">
                                    Confirm Password
                                </label>
                                <Password
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="w-full"
                                    inputClassName="w-full"
                                    toggleMask
                                    feedback={false}
                                />
                            </div>

                            <Button type="submit" label={resetting ? 'Resetting...' : 'Reset Password'} icon={resetting ? 'pi pi-spin pi-spinner' : 'pi pi-lock'} className="w-full" disabled={resetting} />
                        </form>
                    )}

                    {/* ─── Success ─────────────────────────── */}
                    {resetComplete && (
                        <div className="text-center">
                            <i className="pi pi-check-circle text-green-500 text-5xl mb-3" />
                            <div className="text-lg font-medium text-color mb-2">Password Reset Successful</div>
                            <p className="text-color-secondary text-sm mb-4">You can now log in with your new password.</p>
                            <Button label="Go to Login" icon="pi pi-sign-in" className="w-full" onClick={() => router.push('/auth/login')} />
                        </div>
                    )}

                    {/* Back to Login link */}
                    {!resetComplete && (
                        <div className="text-center mt-4">
                            <a className="text-primary text-sm cursor-pointer font-medium no-underline hover:underline" onClick={() => router.push('/auth/login')}>
                                <i className="pi pi-arrow-left mr-1 text-xs" />
                                Back to Login
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ForgotPasswordPage;
