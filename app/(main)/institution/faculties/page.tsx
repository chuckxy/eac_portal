'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { InstitutionService } from '@/lib/service/InstitutionService';
import type { Faculty } from '@/types';

const FacultiesPage = () => {
    const toast = useRef<Toast>(null);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Faculty | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [formData, setFormData] = useState({ facultyName: '', facultyCode: '' });
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await InstitutionService.getFaculties();
            setFaculties(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openNew = () => {
        setEditing(null);
        setFormData({ facultyName: '', facultyCode: '' });
        setShowDialog(true);
    };

    const openEdit = (f: Faculty) => {
        setEditing(f);
        setFormData({ facultyName: f.facultyName, facultyCode: f.facultyCode });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = editing ? { id: editing.id, ...formData } : formData;
            const res = await InstitutionService.saveFaculty(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || `Faculty "${formData.facultyName}" saved.`, life: 3000 });
            setShowDialog(false);
            await loadData();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = (f: Faculty) => {
        confirmDialog({
            message: `Delete "${f.facultyName}"? Departments under this faculty will also be affected.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const res = await InstitutionService.deleteFaculty(f.id);
                    toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message || 'Faculty deleted.', life: 3000 });
                    await loadData();
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                }
            }
        });
    };

    const actionTemplate = (row: Faculty) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} />
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
            <div className="col-12">
                <PageHeader title="Faculties" subtitle="Manage university faculties" actionLabel="New Faculty" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={faculties}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No faculties found."
                        tableStyle={{ minWidth: '20rem' }}
                    >
                        <Column field="facultyCode" header="Code" sortable style={{ width: '80px' }} />
                        <Column field="facultyName" header="Faculty Name" sortable style={{ minWidth: '10rem' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Faculty' : 'New Faculty'} modal className="w-full sm:w-28rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Faculty Name</label>
                        <InputText value={formData.facultyName} onChange={(e) => setFormData({ ...formData, facultyName: e.target.value })} placeholder="e.g. Faculty of Science" />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Faculty Code</label>
                        <InputText value={formData.facultyCode} onChange={(e) => setFormData({ ...formData, facultyCode: e.target.value })} placeholder="e.g. FSC" />
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

export default FacultiesPage;
