'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import { InstitutionService } from '@/lib/service/InstitutionService';
import type { Programme } from '@/types';

const ProgrammesPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Programme | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const [formData, setFormData] = useState({ facultyId: null as number | null, departmentId: null as number | null, programmeName: '', programmeCode: '', duration: 4, isActive: true });
    const [programmes, setProgrammes] = useState<Programme[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [facultyOptions, setFacultyOptions] = useState<{ label: string; value: number }[]>([]);
    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: number }[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await InstitutionService.getProgrammes();
            setProgrammes(data);
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

    const loadDepartments = async (facultyId?: number) => {
        try {
            const departments = await InstitutionService.getDepartments(facultyId);
            setDepartmentOptions(departments.map((d) => ({ label: d.departmentName, value: d.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load departments.', life: 3000 });
        }
    };

    useEffect(() => {
        loadData();
        loadFaculties();
        loadDepartments();
    }, []);

    const onFacultyChange = (facultyId: number | null) => {
        setFormData({ ...formData, facultyId, departmentId: null });
        if (facultyId) {
            loadDepartments(facultyId);
        } else {
            loadDepartments();
        }
    };

    const openNew = () => {
        setEditing(null);
        setFormData({ facultyId: null, departmentId: null, programmeName: '', programmeCode: '', duration: 4, isActive: true });
        loadDepartments();
        setShowDialog(true);
    };

    const openEdit = (p: Programme) => {
        setEditing(p);
        setFormData({ facultyId: null, departmentId: p.departmentId, programmeName: p.programmeName, programmeCode: p.programmeCode, duration: p.duration, isActive: p.isActive === 1 });
        loadDepartments();
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const { facultyId, ...rest } = formData;
            const payload = editing ? { id: editing.id, ...rest } : rest;
            const res = await InstitutionService.saveProgramme({ ...payload, isActive: payload.isActive ? 1 : 0 });
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || 'Programme saved.', life: 3000 });
            setShowDialog(false);
            await loadData();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (p: Programme) => {
        setDeletingId(p.id);
        try {
            const deps = await InstitutionService.getProgrammeDependencies(p.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${p.programmeName}" has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await InstitutionService.cascadeDeleteProgramme(p.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || 'Programme and all dependents removed.', life: 4000 });
                            await loadData();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete "${p.programmeName}"? This cannot be undone.`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await InstitutionService.deleteProgramme(p.id);
                            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message || 'Programme deleted.', life: 3000 });
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

    const actionTemplate = (row: Programme) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
        </div>
    );

    const header = (
        <span className="p-input-icon-left w-full sm:w-auto">
            <i className="pi pi-search" />
            <InputText placeholder="Search..." value={globalFilterValue} onChange={(e) => setGlobalFilterValue(e.target.value)} className="w-full sm:w-auto" />
        </span>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Programmes" subtitle="Manage degree programmes" actionLabel="New Programme" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={programmes}
                        loading={loading}
                        filters={filters}
                        header={header}
                        paginator
                        rows={20}
                        rowsPerPageOptions={[20, 50, 100, programmes.length]}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No programmes found."
                        tableStyle={{ minWidth: '32rem' }}
                    >
                        <Column field="programmeCode" header="Code" sortable style={{ width: '100px' }} />
                        <Column field="programmeName" header="Programme" sortable style={{ minWidth: '10rem' }} />
                        <Column field="departmentName" header="Department" sortable style={{ minWidth: '8rem' }} />
                        <Column field="duration" header="Years" style={{ width: '70px' }} />
                        <Column header="Status" body={(row) => <StatusChip active={row.isActive} />} style={{ width: '90px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Programme' : 'New Programme'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Faculty</label>
                        <Dropdown value={formData.facultyId} options={facultyOptions} onChange={(e) => onFacultyChange(e.value)} placeholder="Filter by faculty (optional)" showClear />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Department</label>
                        <Dropdown value={formData.departmentId} options={departmentOptions} onChange={(e) => setFormData({ ...formData, departmentId: e.value })} placeholder="Select department" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Programme Name</label>
                        <InputText value={formData.programmeName} onChange={(e) => setFormData({ ...formData, programmeName: e.target.value })} placeholder="e.g. BSc Computer Science" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Programme Code</label>
                        <InputText value={formData.programmeCode} onChange={(e) => setFormData({ ...formData, programmeCode: e.target.value })} placeholder="e.g. BSC-CS" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Duration (years)</label>
                        <InputNumber value={formData.duration} onValueChange={(e) => setFormData({ ...formData, duration: e.value ?? 4 })} min={1} max={7} />
                    </div>
                    <div className="flex align-items-center gap-2">
                        <InputSwitch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.value })} />
                        <label className="text-sm">Active</label>
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

export default ProgrammesPage;
