'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { LibraryService, LibraryCategory } from '@/lib/service/LibraryService';

const LibraryCategoriesPage = () => {
    const toast = useRef<Toast>(null);
    const [items, setItems] = useState<LibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<LibraryCategory | null>(null);
    const [form, setForm] = useState<{ categoryName: string; description: string }>({ categoryName: '', description: '' });
    const [globalFilter, setGlobalFilter] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            setItems(await LibraryService.getCategories());
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
    }, []);

    const openNew = () => {
        setEditing(null);
        setForm({ categoryName: '', description: '' });
        setShowDialog(true);
    };
    const openEdit = (row: LibraryCategory) => {
        setEditing(row);
        setForm({ categoryName: row.categoryName, description: row.description || '' });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload: any = { ...form };
            if (editing) payload.id = editing.id;
            const res = await LibraryService.saveCategory(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message });
            setShowDialog(false);
            await load();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
        }
    };

    const confirmDelete = (row: LibraryCategory) =>
        confirmDialog({
            message: `Delete category "${row.categoryName}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const res = await LibraryService.deleteCategory(row.id);
                    toast.current?.show({ severity: 'info', summary: 'Deleted', detail: res.message });
                    await load();
                } catch (err: any) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
                }
            }
        });

    const actionBody = (row: LibraryCategory) => (
        <div className="flex gap-1">
            <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
            <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} />
        </div>
    );

    const header = (
        <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText placeholder="Search…" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
        </span>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="E-Library Categories" subtitle="Manage ebook categories" actionLabel="New Category" onAction={openNew} />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable value={items} loading={loading} header={header} globalFilter={globalFilter} paginator rows={20} className="p-datatable-sm" responsiveLayout="scroll" emptyMessage="No categories.">
                        <Column field="categoryName" header="Name" sortable />
                        <Column field="description" header="Description" className="hidden md:table-cell" />
                        <Column header="Actions" body={actionBody} style={{ width: '8rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Category' : 'New Category'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Name</label>
                        <InputText value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} />
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Description</label>
                        <InputTextarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

export default LibraryCategoriesPage;
