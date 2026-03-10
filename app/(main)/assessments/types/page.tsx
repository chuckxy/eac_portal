'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { AssessmentsService } from '@/lib/service/AssessmentsService';
import type { AssessmentType } from '@/types';

const AssessmentTypesPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<AssessmentType | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [types, setTypes] = useState<AssessmentType[]>([]);

    const [formData, setFormData] = useState({ typeName: '', weight: 0 });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await AssessmentsService.getTypes();
            setTypes(data);
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to load assessment types', life: 4000 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openNew = () => {
        setEditing(null);
        setFormData({ typeName: '', weight: 0 });
        setShowDialog(true);
    };

    const openEdit = (t: AssessmentType) => {
        setEditing(t);
        setFormData({ typeName: t.typeName, weight: t.weight });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = { ...formData, id: editing?.id };
            const res = await AssessmentsService.saveType(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message, life: 3000 });
            setShowDialog(false);
            loadData();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to save', life: 4000 });
        }
    };

    const confirmDelete = async (t: AssessmentType) => {
        setDeletingId(t.id);
        try {
            const deps = await AssessmentsService.getTypeDependencies(t.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${t.typeName}" has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await AssessmentsService.cascadeDeleteType(t.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || 'Assessment type and all dependents removed.', life: 4000 });
                            loadData();
                        } catch (err: any) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to delete', life: 4000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete assessment type "${t.typeName}"? This cannot be undone.`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await AssessmentsService.deleteType(t.id);
                            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message, life: 3000 });
                            loadData();
                        } catch (err: any) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to delete', life: 4000 });
                        }
                    }
                });
            }
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to check dependencies', life: 3000 });
        } finally {
            setDeletingId(null);
        }
    };

    const actionTemplate = (row: AssessmentType) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
        </div>
    );

    const weightTemplate = (row: AssessmentType) => <Tag value={`${row.weight}%`} severity="info" />;

    const header = (
        <span className="p-input-icon-left w-full sm:w-auto">
            <i className="pi pi-search" />
            <InputText placeholder="Search types..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
        </span>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Assessment Types" subtitle="Configure assessment categories and their maximum weights" actionLabel="New Type" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={types}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No assessment types found."
                        tableStyle={{ minWidth: '20rem' }}
                    >
                        <Column field="typeName" header="Type Name" sortable style={{ minWidth: '10rem' }} />
                        <Column field="weight" header="Weight" body={weightTemplate} sortable style={{ width: '120px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Assessment Type' : 'New Assessment Type'} modal className="w-full sm:w-26rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Type Name</label>
                        <InputText value={formData.typeName} onChange={(e) => setFormData({ ...formData, typeName: e.target.value })} placeholder="e.g. Continuous Assessment" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Weight (%)</label>
                        <InputNumber value={formData.weight} onValueChange={(e) => setFormData({ ...formData, weight: e.value ?? 0 })} min={0} max={100} suffix="%" />
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

export default AssessmentTypesPage;
