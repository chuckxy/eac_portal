'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { StudentService } from '@/lib/service/StudentService';
import { useAuth } from '@/layout/context/authcontext';
import type { StudentProfile } from '@/types';

const StudentProfilePage = () => {
    const { user } = useAuth();
    const studentIndex = String(user?.profileId || '');
    const toast = useRef<Toast>(null);

    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await StudentService.getProfile(studentIndex);
            setProfile(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load profile', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const enterEditMode = () => {
        if (!profile) return;
        setEditForm({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone
        });
        setEditMode(true);
    };

    const cancelEdit = () => {
        setEditMode(false);
    };

    const save = async () => {
        if (!profile) return;
        setSaving(true);
        try {
            await StudentService.updateProfile(studentIndex, editForm);
            setProfile({ ...profile, ...editForm });
            toast.current?.show({ severity: 'success', summary: 'Profile updated', life: 3000 });
            setEditMode(false);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to update profile', life: 3000 });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round p-4 mb-3">
                        <div className="flex flex-column sm:flex-row align-items-center gap-4">
                            <Skeleton shape="circle" size="80px" />
                            <div className="flex flex-column gap-2" style={{ flex: 1 }}>
                                <Skeleton width="200px" height="1.5rem" />
                                <Skeleton width="140px" height="1rem" />
                                <Skeleton width="300px" height="1.5rem" />
                            </div>
                        </div>
                    </div>
                    <div className="surface-card shadow-1 border-round p-4 mb-3">
                        <Skeleton width="200px" height="1.2rem" className="mb-3" />
                        <div className="grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="col-12 sm:col-6 mb-3">
                                    <Skeleton width="100px" height="0.8rem" className="mb-1" />
                                    <Skeleton width="180px" height="1rem" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round p-4 text-center">
                        <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3" />
                        <div className="text-lg font-medium">Profile not found</div>
                        <Button label="Retry" icon="pi pi-refresh" className="mt-3" onClick={loadProfile} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between mb-3">
                    <div>
                        <h2 className="m-0 text-xl font-bold">My Profile</h2>
                        <p className="mt-1 mb-0 text-color-secondary text-sm">View and manage your student profile</p>
                    </div>
                    {!editMode ? (
                        <Button label="Edit Profile" icon="pi pi-pencil" className="p-button-outlined mt-2 sm:mt-0" onClick={enterEditMode} />
                    ) : (
                        <div className="flex gap-2 mt-2 sm:mt-0">
                            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={cancelEdit} disabled={saving} />
                            <Button label="Save" icon="pi pi-check" onClick={save} loading={saving} />
                        </div>
                    )}
                </div>

                {/* Avatar & basic info */}
                <div className="surface-card shadow-1 border-round p-4 mb-3">
                    <div className="flex flex-column sm:flex-row align-items-center gap-4">
                        <Avatar label={profile.firstName[0] + profile.lastName[0]} size="xlarge" shape="circle" className="bg-primary text-white" style={{ width: '80px', height: '80px', fontSize: '2rem' }} />
                        <div className="text-center sm:text-left">
                            <div className="text-2xl font-bold">{editMode ? `${editForm.firstName} ${editForm.lastName}` : `${profile.firstName} ${profile.lastName}`}</div>
                            <div className="text-color-secondary mt-1">{profile.studentIndex}</div>
                            <div className="flex flex-wrap gap-2 mt-2 justify-content-center sm:justify-content-start">
                                <Tag value={profile.programmeName} severity="info" />
                                <Tag value={profile.levelName} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal info */}
                <div className="surface-card shadow-1 border-round p-4 mb-3">
                    <h3 className="text-lg font-bold mt-0 mb-3">Personal Information</h3>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">First Name</label>
                            {editMode ? <InputText value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /> : <span className="font-medium">{profile.firstName}</span>}
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Last Name</label>
                            {editMode ? <InputText value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /> : <span className="font-medium">{profile.lastName}</span>}
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Email</label>
                            {editMode ? <InputText value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /> : <span className="font-medium">{profile.email}</span>}
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Phone</label>
                            {editMode ? <InputText value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /> : <span className="font-medium">{profile.phone}</span>}
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Gender</label>
                            <span className="font-medium">{profile.gender}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Date of Birth</label>
                            <span className="font-medium">{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Academic info */}
                <div className="surface-card shadow-1 border-round p-4">
                    <h3 className="text-lg font-bold mt-0 mb-3">Academic Information</h3>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Index Number</label>
                            <span className="font-medium">{profile.studentIndex}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Programme</label>
                            <span className="font-medium">{profile.programmeName}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Department</label>
                            <span className="font-medium">{profile.departmentName}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Faculty</label>
                            <span className="font-medium">{profile.facultyName}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Current Level</label>
                            <span className="font-medium">{profile.levelName}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Enrollment Date</label>
                            <span className="font-medium">{profile.enrollmentDate ? new Date(profile.enrollmentDate).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1 mb-3">
                            <label className="text-sm font-medium text-color-secondary">Academic Year</label>
                            <span className="font-medium">{profile.academicYearName || '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;
