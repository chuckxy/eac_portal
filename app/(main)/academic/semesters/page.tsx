'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import { AcademicService } from '@/lib/service/AcademicService';
import type { Semester, SemesterRef } from '@/types';
import { formatDateToString } from '@/lib/service/UtilityService';

const SemestersPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [loading, setLoading] = useState(true);
    const [academicYearOptions, setAcademicYearOptions] = useState<{ label: string; value: number }[]>([]);
    const [filterYearId, setFilterYearId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [semesterRefOptions, setSemesterRefOptions] = useState<{ label: string; value: number }[]>([]);

    const [formData, setFormData] = useState({ academicYearId: null as number | null, semesterId: null as number | null, startDate: null as Date | null, endDate: null as Date | null, isCurrent: false });

    const loadYears = async () => {
        try {
            const [years, semRefs] = await Promise.all([AcademicService.getYears(), AcademicService.getSemesterRefs()]);
            setAcademicYearOptions(years.map((y) => ({ label: y.yearName, value: y.id })));
            setSemesterRefOptions(semRefs.map((s) => ({ label: s.semesterName, value: s.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const loadSemesters = async (yearId?: number | null) => {
        try {
            setLoading(true);
            const data = await AcademicService.getSemesters(yearId ?? undefined);
            setSemesters(data.map((semeter) => ({ ...semeter, startDate: formatDateToString(new Date(semeter.startDate)), endDate: formatDateToString(new Date(semeter.endDate)) })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadYears();
        loadSemesters();
    }, []);

    useEffect(() => {
        loadSemesters(filterYearId);
    }, [filterYearId]);

    const openNew = () => {
        setEditingSemester(null);
        setFormData({ academicYearId: null, semesterId: null, startDate: null, endDate: null, isCurrent: false });
        setShowDialog(true);
    };

    const openEdit = (sem: Semester) => {
        console.log(sem.endDate);
        setEditingSemester(sem);
        setFormData({ academicYearId: sem.academicYearId, semesterId: sem.semesterId, startDate: new Date(sem.startDate), endDate: new Date(sem.endDate), isCurrent: sem.isCurrent });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload: any = {
                academicYearId: formData.academicYearId,
                semesterId: formData.semesterId,
                startDate: formData.startDate?.toISOString().split('T')[0],
                endDate: formData.endDate?.toISOString().split('T')[0],
                isCurrent: formData.isCurrent ? 1 : 0
            };
            if (editingSemester) payload.id = editingSemester.id;
            const res = await AcademicService.saveSemester(payload);
            const semName = semesterRefOptions.find((o) => o.value === formData.semesterId)?.label || 'Semester';
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || `${semName} saved.`, life: 3000 });
            setShowDialog(false);
            await loadSemesters(filterYearId);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (sem: Semester) => {
        setDeletingId(sem.id);
        try {
            const deps = await AcademicService.getSemesterDependencies(sem.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${sem.semesterName}" (${sem.yearName}) has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await AcademicService.cascadeDeleteSemester(sem.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || `${sem.semesterName} and all dependents removed.`, life: 4000 });
                            await loadSemesters(filterYearId);
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete "${sem.semesterName}" for ${sem.yearName}?`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await AcademicService.deleteSemester(sem.id);
                            toast.current?.show({ severity: 'info', summary: 'Deleted', detail: res.message || `${sem.semesterName} removed.`, life: 3000 });
                            await loadSemesters(filterYearId);
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

    const actionTemplate = (row: Semester) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
        </div>
    );

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 sm:align-items-center sm:justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText
                    placeholder="Search..."
                    value={globalFilterValue}
                    onChange={(e) => {
                        setGlobalFilterValue(e.target.value);
                        setFilters((prev) => ({ ...prev, global: { value: e.target.value || null, matchMode: FilterMatchMode.CONTAINS } }));
                    }}
                    className="w-full sm:w-auto"
                />
            </span>
            <Dropdown value={filterYearId} options={[{ label: 'All Years', value: null }, ...academicYearOptions]} onChange={(e) => setFilterYearId(e.value)} placeholder="Filter by year" className="w-full sm:w-auto" />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Semesters" subtitle="Manage semesters within academic years" actionLabel="New Semester" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable value={semesters} loading={loading} filters={filters} header={header} paginator rows={10} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No semesters found." tableStyle={{ minWidth: '36rem' }}>
                        <Column field="yearName" header="Academic Year" sortable style={{ minWidth: '8rem' }} />
                        <Column field="semesterName" header="Semester" sortable style={{ minWidth: '8rem' }} />
                        <Column field="startDate" header="Start" sortable style={{ minWidth: '7rem' }} />
                        <Column field="endDate" header="End" sortable style={{ minWidth: '7rem' }} />
                        <Column header="Status" body={(row) => <StatusChip active={row.isCurrent} activeLabel="Current" inactiveLabel="—" />} style={{ width: '90px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '100px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editingSemester ? 'Edit Semester' : 'New Semester'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Academic Year</label>
                        <Dropdown value={formData.academicYearId} options={academicYearOptions} onChange={(e) => setFormData({ ...formData, academicYearId: e.value })} placeholder="Select year" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Semester</label>
                        <Dropdown value={formData.semesterId} options={semesterRefOptions} onChange={(e) => setFormData({ ...formData, semesterId: e.value })} placeholder="Select semester" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Start Date</label>
                        <Calendar value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.value as Date })} dateFormat="yy-mm-dd" showIcon />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">End Date</label>
                        <Calendar value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.value as Date })} dateFormat="yy-mm-dd" showIcon />
                    </div>
                    <div className="flex align-items-center gap-2">
                        <InputSwitch checked={formData.isCurrent} onChange={(e) => setFormData({ ...formData, isCurrent: e.value })} />
                        <label className="text-sm">Set as current semester</label>
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

export default SemestersPage;
