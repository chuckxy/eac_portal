'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import { UsersService } from '@/lib/service/UsersService';
import { InstitutionService } from '@/lib/service/InstitutionService';
import type { Student } from '@/types';

const StudentsPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Student | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [programmeOptions, setProgrammeOptions] = useState<{ label: string; value: number }[]>([]);
    const [levelOptions, setLevelOptions] = useState<{ label: string; value: number }[]>([]);

    const [formData, setFormData] = useState({
        studentIndex: '',
        firstName: '',
        lastName: '',
        otherNames: '',
        email: '',
        phone: '',
        gender: null as string | null,
        dateOfBirth: null as Date | null,
        programmeId: null as number | null,
        levelId: null as number | null,
        enrollmentDate: null as Date | null
    });

    const genderOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' }
    ];

    const loadStudents = useCallback(async () => {
        try {
            setLoading(true);
            const data = await UsersService.getStudents();
            setStudents(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDropdowns = useCallback(async () => {
        try {
            const [programmes, levels] = await Promise.all([InstitutionService.getProgrammes(), InstitutionService.getLevels()]);
            setProgrammeOptions(programmes.map((p) => ({ label: p.programmeName, value: p.id })));
            setLevelOptions(levels.map((l) => ({ label: l.levelName, value: l.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load dropdown data.', life: 4000 });
        }
    }, []);

    useEffect(() => {
        loadStudents();
        loadDropdowns();
    }, [loadStudents, loadDropdowns]);

    const openNew = () => {
        setEditing(null);
        setFormData({ studentIndex: '', firstName: '', lastName: '', otherNames: '', email: '', phone: '', gender: null, dateOfBirth: null, programmeId: null, levelId: null, enrollmentDate: null });
        setShowDialog(true);
    };

    const openEdit = (s: Student) => {
        setEditing(s);
        setFormData({
            studentIndex: s.studentIndex,
            firstName: s.firstName,
            lastName: s.lastName,
            otherNames: s.otherNames || '',
            email: s.email,
            phone: s.phone || '',
            gender: s.gender || null,
            dateOfBirth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
            programmeId: s.programmeId || null,
            levelId: s.levelId || null,
            enrollmentDate: s.enrollmentDate ? new Date(s.enrollmentDate) : null
        });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            setSaving(true);
            const payload = {
                ...formData,
                dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : null,
                enrollmentDate: formData.enrollmentDate ? formData.enrollmentDate.toISOString().split('T')[0] : null,
                isEdit: !!editing,
                ...(editing ? { studentIndex: editing.studentIndex } : {})
            };
            await UsersService.saveStudent(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Student record saved.', life: 3000 });
            setShowDialog(false);
            loadStudents();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmToggleStatus = (s: Student) => {
        const action = s.isActive ? 'Deactivate' : 'Activate';
        confirmDialog({
            message: `${action} student "${s.firstName} ${s.lastName}" (${s.studentIndex})?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: s.isActive ? 'p-button-danger' : 'p-button-success',
            accept: async () => {
                try {
                    await UsersService.toggleStudentStatus(s.studentIndex, !s.isActive);
                    toast.current?.show({ severity: 'info', summary: `${action}d`, detail: `Student ${action.toLowerCase()}d successfully.`, life: 3000 });
                    loadStudents();
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
                }
            }
        });
    };

    const nameTemplate = (row: Student) => (
        <div className="flex align-items-center gap-2">
            <Avatar label={row.firstName[0]} shape="circle" size="normal" className="bg-primary text-white flex-shrink-0" style={{ width: '2rem', height: '2rem', fontSize: '0.85rem' }} />
            <div>
                <div className="font-medium text-sm">
                    {row.firstName} {row.lastName}
                </div>
                <div className="text-xs text-color-secondary hidden sm:block">{row.email}</div>
            </div>
        </div>
    );

    const actionTemplate = (row: Student) => (
        <div className="flex gap-1">
            <Button icon="pi pi-eye" className="p-button-text p-button-sm" tooltip="View" tooltipOptions={{ position: 'top' }} />
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" tooltip="Edit" tooltipOptions={{ position: 'top' }} onClick={() => openEdit(row)} />
            <Button
                icon={row.isActive ? 'pi pi-ban' : 'pi pi-check-circle'}
                className={`p-button-text p-button-sm ${row.isActive ? 'p-button-danger' : 'p-button-success'}`}
                onClick={() => confirmToggleStatus(row)}
                tooltip={row.isActive ? 'Deactivate' : 'Activate'}
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 sm:align-items-center sm:justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText placeholder="Search by name or index..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
            </span>
            <div className="flex gap-2">
                <Button label="Export" icon="pi pi-download" className="p-button-outlined p-button-sm" />
            </div>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <PageHeader title="Students" subtitle="Manage student records and enrolment" actionLabel="Register Student" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={students}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No students found."
                        globalFilterFields={['studentIndex', 'firstName', 'lastName', 'email']}
                        tableStyle={{ minWidth: '38rem' }}
                    >
                        <Column field="studentIndex" header="Index No." sortable style={{ width: '140px', minWidth: '140px' }} />
                        <Column header="Name" body={nameTemplate} sortable sortField="firstName" style={{ minWidth: '12rem' }} />
                        <Column field="programmeName" header="Programme" sortable style={{ minWidth: '10rem' }} />
                        <Column field="levelName" header="Level" sortable style={{ width: '100px' }}  />
                        <Column header="Status" body={(row) => <StatusChip active={row.isActive} />} style={{ width: '80px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            {/* Register / Edit Dialog */}
            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Student' : 'Register Student'} modal className="w-full sm:w-35rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Student Index</label>
                        <InputText value={formData.studentIndex} onChange={(e) => setFormData({ ...formData, studentIndex: e.target.value })} placeholder="e.g. UNI/0234/2026" disabled={!!editing} />
                    </div>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">First Name</label>
                            <InputText value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Last Name</label>
                            <InputText value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Other Names</label>
                        <InputText value={formData.otherNames} onChange={(e) => setFormData({ ...formData, otherNames: e.target.value })} />
                    </div>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Email</label>
                            <InputText value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Phone</label>
                            <InputText value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Gender</label>
                            <Dropdown value={formData.gender} options={genderOptions} onChange={(e) => setFormData({ ...formData, gender: e.value })} placeholder="Select" />
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Date of Birth</label>
                            <Calendar value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.value as Date })} dateFormat="yy-mm-dd" showIcon />
                        </div>
                    </div>
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Programme</label>
                            <Dropdown value={formData.programmeId} options={programmeOptions} onChange={(e) => setFormData({ ...formData, programmeId: e.value })} placeholder="Select programme" filter />
                        </div>
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Level</label>
                            <Dropdown value={formData.levelId} options={levelOptions} onChange={(e) => setFormData({ ...formData, levelId: e.value })} placeholder="Select level" />
                        </div>
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Enrollment Date</label>
                        <Calendar value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.value as Date })} dateFormat="yy-mm-dd" showIcon />
                    </div>
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                        <Button label="Save" icon="pi pi-check" onClick={save} loading={saving} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default StudentsPage;
