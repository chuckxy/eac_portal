'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { InstitutionService } from '@/lib/service/InstitutionService';
import type { Department } from '@/types';

const DepartmentsPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Department | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [formData, setFormData] = useState({ facultyId: null as number | null, departmentName: '', departmentCode: '' });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [facultyOptions, setFacultyOptions] = useState<{ label: string; value: number }[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await InstitutionService.getDepartments();
            setDepartments(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const loadFaculties = async () => {
        try {
            const faculties = await InstitutionService.getFaculties();
            setFacultyOptions(faculties.map((f) => ({ label: f.facultyName, value: f.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load faculties.', life: 3000 });
        }
    };

    useEffect(() => {
        loadData();
        loadFaculties();
    }, []);

    const openNew = () => {
        setEditing(null);
        setFormData({ facultyId: null, departmentName: '', departmentCode: '' });
        setShowDialog(true);
    };

    const openEdit = (d: Department) => {
        setEditing(d);
        setFormData({ facultyId: d.facultyId, departmentName: d.departmentName, departmentCode: d.departmentCode });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = editing ? { id: editing.id, ...formData } : formData;
            const res = await InstitutionService.saveDepartment(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || 'Department saved.', life: 3000 });
            setShowDialog(false);
            await loadData();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (d: Department) => {
        setDeletingId(d.id);
        try {
            const deps = await InstitutionService.getDepartmentDependencies(d.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${d.departmentName}" has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await InstitutionService.cascadeDeleteDepartment(d.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || 'Department and all dependents removed.', life: 4000 });
                            await loadData();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete "${d.departmentName}"? This cannot be undone.`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await InstitutionService.deleteDepartment(d.id);
                            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message || 'Department deleted.', life: 3000 });
                            await loadData();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setDeletingId(null);
        }
    };

    const actionTemplate = (row: Department) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
        </div>
    );

    const header = (
        <span className="p-input-icon-left w-full sm:w-auto">
            <i className="pi pi-search" />
            <InputText placeholder="Search..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
        </span>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Departments" subtitle="Manage departments under faculties" actionLabel="New Department" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={departments}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No departments found."
                        tableStyle={{ minWidth: '30rem' }}
                    >
                        <Column field="departmentCode" header="Code" sortable style={{ width: '80px' }} />
                        <Column field="departmentName" header="Department" sortable style={{ minWidth: '10rem' }} />
                        <Column field="facultyName" header="Faculty" sortable style={{ minWidth: '8rem' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Department' : 'New Department'} modal className="w-full sm:w-28rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Faculty</label>
                        <Dropdown value={formData.facultyId} options={facultyOptions} onChange={(e) => setFormData({ ...formData, facultyId: e.value })} placeholder="Select faculty" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Department Name</label>
                        <InputText value={formData.departmentName} onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })} placeholder="e.g. Computer Science" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Department Code</label>
                        <InputText value={formData.departmentCode} onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })} placeholder="e.g. CS" />
                    </div>
                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                        <Button label="Save" icon="pi pi-check" onClick={save} />
                    </div>
                </div>
            </Dialog>
        </div>
    );
};

export default DepartmentsPage;
