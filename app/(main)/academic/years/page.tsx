'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { AcademicService } from '@/lib/service/AcademicService';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import type { AcademicYear } from '@/types';
import { format } from 'date-fns';

const AcademicYearsPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({ yearName: '', startDate: null as Date | null, endDate: null as Date | null, isCurrent: false });

    const loadYears = async () => {
        try {
            setLoading(true);
            const data = await AcademicService.getYears();
            setYears(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadYears();
    }, []);

    const openNew = () => {
        setEditingYear(null);
        setFormData({ yearName: '', startDate: null, endDate: null, isCurrent: false });
        setShowDialog(true);
    };

    const openEdit = (year: AcademicYear) => {
        setEditingYear(year);
        setFormData({ yearName: year.yearName, startDate: new Date(year.startDate), endDate: new Date(year.endDate), isCurrent: year.isCurrent });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload: any = {
                yearName: formData.yearName,
                startDate: formData.startDate?.toISOString().split('T')[0],
                endDate: formData.endDate?.toISOString().split('T')[0],
                isCurrent: formData.isCurrent?1:0
            };
            if (editingYear) payload.id = editingYear.id;
            const res = await AcademicService.saveYear(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || `Academic year ${formData.yearName} saved.`, life: 3000 });
            setShowDialog(false);
            await loadYears();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (year: AcademicYear) => {
        setDeletingId(year.id);
        try {
            const deps = await AcademicService.getYearDependencies(year.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${year.yearName}" has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await AcademicService.cascadeDeleteYear(year.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || `${year.yearName} and all dependents removed.`, life: 4000 });
                            await loadYears();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete academic year "${year.yearName}"? This cannot be undone.`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await AcademicService.deleteYear(year.id);
                            toast.current?.show({ severity: 'info', summary: 'Deleted', detail: res.message || `${year.yearName} removed.`, life: 3000 });
                            await loadYears();
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

    const actionTemplate = (row: AcademicYear) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} tooltip="Edit" tooltipOptions={{ position: 'top' }} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} tooltip="Delete" tooltipOptions={{ position: 'top' }} />
        </div>
    );

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 sm:align-items-center sm:justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText placeholder="Search..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
            </span>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Academic Years" subtitle="Manage university academic year calendar" actionLabel="New Academic Year" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={years}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No academic years found."
                        tableStyle={{ minWidth: '30rem' }}
                    >
                        <Column field="yearName" header="Year" sortable style={{ minWidth: '8rem' }} />
                        <Column header="Start" body={(row: AcademicYear) => <div>{format(new Date(row.startDate), 'yyyy-MM-dd')}</div>} sortable style={{ minWidth: '7rem' }} />
                        <Column header="End" body={(row: AcademicYear) => <div>{format(new Date(row.endDate), 'yyyy-MM-dd')}</div>} sortable style={{ minWidth: '7rem' }} />
                        <Column header="Current" body={(row) => <StatusChip active={row.isCurrent} activeLabel="Current" inactiveLabel="Past" />} style={{ width: '90px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '100px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editingYear ? 'Edit Academic Year' : 'New Academic Year'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Year Name</label>
                        <InputText value={formData.yearName} onChange={(e) => setFormData({ ...formData, yearName: e.target.value })} placeholder="e.g. 2025/2026" />
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
                        <label className="text-sm">Set as current academic year</label>
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

export default AcademicYearsPage;
