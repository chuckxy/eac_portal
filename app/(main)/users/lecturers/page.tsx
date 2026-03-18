'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import BulkUploadDialog from '@/components/BulkUploadDialog';
import { UsersService } from '@/lib/service/UsersService';
import { InstitutionService } from '@/lib/service/InstitutionService';
import type { Lecturer } from '@/types';

const LecturersPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Lecturer | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: number }[]>([]);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const [formData, setFormData] = useState({
        staffId: '',
        title: null as string | null,
        firstName: '',
        lastName: '',
        otherNames: '',
        email: '',
        phone: '',
        departmentId: null as number | null,
        specialization: ''
    });

    const titleOptions = [
        { label: 'Prof.', value: 'Prof.' },
        { label: 'Dr.', value: 'Dr.' },
        { label: 'Mr.', value: 'Mr.' },
        { label: 'Mrs.', value: 'Mrs.' },
        { label: 'Ms.', value: 'Ms.' }
    ];

    const loadLecturers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await UsersService.getLecturers();
            setLecturers(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDropdowns = useCallback(async () => {
        try {
            const departments = await InstitutionService.getDepartments();
            setDepartmentOptions(departments.map((d) => ({ label: d.departmentName, value: d.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load department data.', life: 4000 });
        }
    }, []);

    useEffect(() => {
        loadLecturers();
        loadDropdowns();
    }, [loadLecturers, loadDropdowns]);

    const openNew = () => {
        setEditing(null);
        setFormData({ staffId: '', title: null, firstName: '', lastName: '', otherNames: '', email: '', phone: '', departmentId: null, specialization: '' });
        setShowDialog(true);
    };

    const openEdit = (l: Lecturer) => {
        setEditing(l);
        setFormData({
            staffId: l.staffId,
            title: l.title,
            firstName: l.firstName,
            lastName: l.lastName,
            otherNames: l.otherNames || '',
            email: l.email,
            phone: l.phone || '',
            departmentId: l.departmentId || null,
            specialization: l.specialization || ''
        });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            setSaving(true);
            const payload = {
                ...formData,
                ...(editing ? { id: editing.id } : {})
            };
            await UsersService.saveLecturer(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: 'Lecturer record saved.', life: 3000 });
            setShowDialog(false);
            loadLecturers();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmToggleStatus = (l: Lecturer) => {
        const action = l.isActive ? 'Deactivate' : 'Activate';
        confirmDialog({
            message: `${action} ${l.title} ${l.firstName} ${l.lastName}?`,
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: l.isActive ? 'p-button-danger' : 'p-button-success',
            accept: async () => {
                try {
                    await UsersService.toggleLecturerStatus(l.id, !l.isActive);
                    toast.current?.show({ severity: 'info', summary: `${action}d`, detail: `Lecturer ${action.toLowerCase()}d successfully.`, life: 3000 });
                    loadLecturers();
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
                }
            }
        });
    };

    const nameTemplate = (row: Lecturer) => (
        <div className="flex align-items-center gap-2">
            <Avatar label={row.firstName[0]} shape="circle" size="normal" className="bg-primary text-white flex-shrink-0" style={{ width: '2rem', height: '2rem', fontSize: '0.85rem' }} />
            <div>
                <div className="font-medium text-sm">
                    {row.title} {row.firstName} {row.lastName}
                </div>
                <div className="text-xs text-color-secondary hidden sm:block">{row.specialization}</div>
            </div>
        </div>
    );

    const actionTemplate = (row: Lecturer) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
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
                <InputText placeholder="Search..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
            </span>
            <div className="flex gap-2">
                <Button label="Upload" icon="pi pi-upload" className="p-button-outlined p-button-sm" onClick={() => setShowBulkUpload(true)} />
            </div>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Lecturers" subtitle="Manage lecturer profiles" actionLabel="Add Lecturer" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={lecturers}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={20}
                        rowsPerPageOptions={[20, 50, 100, lecturers.length]}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No lecturers found."
                        globalFilterFields={['staffId', 'firstName', 'lastName', 'email', 'departmentName']}
                        tableStyle={{ minWidth: '30rem' }}
                    >
                        <Column field="staffId" header="Staff ID" sortable style={{ width: '110px', minWidth: '110px' }} />
                        <Column header="Name" body={nameTemplate} sortable sortField="firstName" style={{ minWidth: '12rem' }} />
                        <Column field="departmentName" header="Department" sortable style={{ minWidth: '8rem' }} />
                        <Column header="Status" body={(row) => <StatusChip active={row.isActive} />} style={{ width: '80px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Lecturer' : 'Add Lecturer'} modal className="w-full sm:w-35rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="grid">
                        <div className="col-12 sm:col-4 flex flex-column gap-1">
                            <label className="text-sm font-medium">Staff ID</label>
                            <InputText value={formData.staffId} onChange={(e) => setFormData({ ...formData, staffId: e.target.value })} placeholder="STF/0001" />
                        </div>
                        <div className="col-12 sm:col-8 flex flex-column gap-1">
                            <label className="text-sm font-medium">Title</label>
                            <Dropdown value={formData.title} options={titleOptions} onChange={(e) => setFormData({ ...formData, title: e.value })} placeholder="Select" />
                        </div>
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
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Department</label>
                        <Dropdown value={formData.departmentId} options={departmentOptions} onChange={(e) => setFormData({ ...formData, departmentId: e.value })} placeholder="Select department" filter />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Specialization</label>
                        <InputText value={formData.specialization} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="e.g. AI & Machine Learning" />
                    </div>
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                        <Button label="Save" icon="pi pi-check" onClick={save} loading={saving} />
                    </div>
                </div>
            </Dialog>

            <BulkUploadDialog
                visible={showBulkUpload}
                onHide={() => setShowBulkUpload(false)}
                title="Bulk Upload Lecturers"
                columns={[
                    { field: 'staffId', header: 'Staff ID', required: true },
                    { field: 'title', header: 'Title' },
                    { field: 'firstName', header: 'First Name', required: true },
                    { field: 'lastName', header: 'Last Name', required: true },
                    { field: 'otherNames', header: 'Other Names' },
                    { field: 'email', header: 'Email' },
                    { field: 'phone', header: 'Phone' },
                    { field: 'specialization', header: 'Specialization' }
                ]}
                dropdowns={[{ key: 'departmentId', label: 'Department', placeholder: 'Select department', options: departmentOptions, filter: true }]}
                templateFileName="lecturers_upload_template.csv"
                onUpload={async (records, dropdownValues) => {
                    return await UsersService.bulkUploadLecturers({
                        lecturers: records,
                        departmentId: dropdownValues.departmentId
                    });
                }}
                onComplete={loadLecturers}
            />
        </div>
    );
};

export default LecturersPage;
