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
import { InputTextarea } from 'primereact/inputtextarea';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import BulkUploadDialog from '@/components/BulkUploadDialog';
import { CoursesService } from '@/lib/service/CoursesService';
import { LookupService } from '@/lib/service/LookupService';
import { useAuth } from '@/layout/context/authcontext';
import type { Course } from '@/types';

const CoursesPage = () => {
    const toast = useRef<Toast>(null);
    const { hasRole } = useAuth();
    const isAdmin = hasRole('admin');
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        creditHours: 3,
        departmentId: null as number | null,
        levelId: null as number | null,
        semesterId: null as number | null,
        description: '',
        isActive: true
    });

    const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: number }[]>([]);
    const [levelOptions, setLevelOptions] = useState<{ label: string; value: number }[]>([]);
    const [semesterRefOptions, setSemesterRefOptions] = useState<{ label: string; value: number }[]>([]);
    const [showBulkUpload, setShowBulkUpload] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await CoursesService.getCourses();
            setCourses(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [departments, levels, semRefs] = await Promise.all([LookupService.getDepartments(), LookupService.getLevels(), LookupService.getSemesterRefs()]);
            setDepartmentOptions(departments.map((d) => ({ label: d.departmentName, value: d.id })));
            setLevelOptions(levels.map((l) => ({ label: l.levelName, value: l.id })));
            setSemesterRefOptions(semRefs.map((s) => ({ label: s.semesterName, value: s.id })));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load dropdown options.', life: 3000 });
        }
    };

    useEffect(() => {
        loadData();
        if (isAdmin) loadDropdowns();
    }, []);

    const openNew = () => {
        setEditing(null);
        setFormData({ courseCode: '', courseName: '', creditHours: 3, departmentId: null, levelId: null, semesterId: null, description: '', isActive: true });
        setShowDialog(true);
    };

    const openEdit = (c: Course) => {
        setEditing(c);
        setFormData({ courseCode: c.courseCode, courseName: c.courseName, creditHours: c.creditHours, departmentId: c.departmentId, levelId: c.levelId, semesterId: c.semesterId, description: c.description || '', isActive: c.isActive === 1 });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = editing ? { id: editing.id, ...formData } : formData;
            const res = await CoursesService.saveCourse({ ...payload, isActive: formData.isActive ? 1 : 0 });
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || `Course "${formData.courseCode}" saved.`, life: 3000 });
            setShowDialog(false);
            await loadData();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (c: Course) => {
        setDeletingId(c.id);
        try {
            const deps = await CoursesService.getCourseDependencies(c.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${c.courseCode} — ${c.courseName}" has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await CoursesService.cascadeDeleteCourse(c.id);
                            toast.current?.show({ severity: 'warn', summary: 'Deleted', detail: res.message || 'Course and all dependents removed.', life: 4000 });
                            await loadData();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Delete "${c.courseCode} — ${c.courseName}"? This cannot be undone.`,
                    header: 'Confirm Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await CoursesService.deleteCourse(c.id);
                            toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message || 'Course deleted.', life: 3000 });
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

    const actionTemplate = (row: Course) => {
        if (!isAdmin) return null;
        return (
            <div className="flex gap-1">
                <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
            </div>
        );
    };

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 sm:align-items-center sm:justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText
                    placeholder="Search courses..."
                    value={globalFilterValue}
                    onChange={(e) => {
                        setGlobalFilterValue(e.target.value);
                        setFilters((prev) => ({ ...prev, global: { value: e.target.value || null, matchMode: FilterMatchMode.CONTAINS } }));
                    }}
                    className="w-full sm:w-auto"
                />
            </span>
            {isAdmin && (
                <div className="flex gap-2">
                    <Button label="Upload" icon="pi pi-upload" className="p-button-outlined p-button-sm" onClick={() => setShowBulkUpload(true)} />
                </div>
            )}
        </div>
    );

    return (
        <>
            <ConfirmDialog />
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <PageHeader title="Courses" subtitle={isAdmin ? 'Manage university course catalog' : 'Browse university course catalog'} actionLabel={isAdmin ? 'New Course' : undefined} onAction={isAdmin ? openNew : undefined} />
                    <div className="surface-card shadow-1 border-round p-3">
                        <DataTable
                            value={courses}
                            loading={loading}
                            filters={filters}
                            header={header}
                            paginator
                            rows={20}
                            rowsPerPageOptions={[20, 50, 100, courses.length]}
                            responsiveLayout="scroll"
                            className="p-datatable-sm"
                            emptyMessage="No courses found."
                            tableStyle={{ minWidth: '36rem' }}
                        >
                            <Column field="courseCode" header="Code" sortable style={{ width: '100px', minWidth: '100px' }} />
                            <Column field="courseName" header="Course Name" sortable style={{ minWidth: '10rem' }} />
                            <Column field="creditHours" header="Credits" sortable style={{ width: '75px' }} className="text-center" body={(row) => <Tag value={row.creditHours} severity="info" />} />
                            <Column field="departmentName" header="Department" sortable style={{ minWidth: '8rem' }} />
                            <Column field="levelName" header="Level" sortable style={{ width: '100px' }} />
                            <Column field="semesterName" header="Semester" sortable style={{ width: '110px' }} />
                            <Column header="Status" body={(row) => <StatusChip active={row.isActive} />} style={{ width: '80px' }} />
                            {isAdmin && <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />}
                        </DataTable>
                    </div>
                </div>

                {isAdmin && (
                    <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Course' : 'New Course'} modal className="w-full sm:w-32rem" breakpoints={{ '640px': '95vw' }}>
                        <div className="flex flex-column gap-3 pt-2">
                            <div className="grid">
                                <div className="col-12 sm:col-4 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Course Code</label>
                                    <InputText value={formData.courseCode} onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })} placeholder="CS 101" />
                                </div>
                                <div className="col-12 sm:col-8 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Course Name</label>
                                    <InputText value={formData.courseName} onChange={(e) => setFormData({ ...formData, courseName: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid">
                                <div className="col-12 sm:col-4 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Credit Hours</label>
                                    <InputNumber value={formData.creditHours} onValueChange={(e) => setFormData({ ...formData, creditHours: e.value ?? 3 })} min={1} max={6} />
                                </div>
                                <div className="col-12 sm:col-4 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Department</label>
                                    <Dropdown value={formData.departmentId} options={departmentOptions} onChange={(e) => setFormData({ ...formData, departmentId: e.value })} placeholder="Select" />
                                </div>
                                <div className="col-12 sm:col-4 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Level</label>
                                    <Dropdown value={formData.levelId} options={levelOptions} onChange={(e) => setFormData({ ...formData, levelId: e.value })} placeholder="Select" />
                                </div>
                            </div>
                            <div className="grid">
                                <div className="col-12 sm:col-4 flex flex-column gap-1">
                                    <label className="text-sm font-medium">Semester</label>
                                    <Dropdown value={formData.semesterId} options={semesterRefOptions} onChange={(e) => setFormData({ ...formData, semesterId: e.value })} placeholder="Select" showClear />
                                </div>
                            </div>
                            <div className="flex flex-column gap-1">
                                <label className="text-sm font-medium">Description</label>
                                <InputTextarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} autoResize />
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
                )}

                {isAdmin && (
                    <BulkUploadDialog
                        visible={showBulkUpload}
                        onHide={() => setShowBulkUpload(false)}
                        title="Bulk Upload Courses"
                        columns={[
                            { field: 'courseCode', header: 'Course Code', required: true },
                            { field: 'courseName', header: 'Course Name', required: true },
                            { field: 'creditHours', header: 'Credit Hours' },
                            { field: 'description', header: 'Description' }
                        ]}
                        dropdowns={[
                            { key: 'departmentId', label: 'Department', placeholder: 'Select department', options: departmentOptions, filter: true },
                            { key: 'levelId', label: 'Level', placeholder: 'Select level', options: levelOptions },
                            { key: 'semesterId', label: 'Semester', placeholder: 'Select semester', options: semesterRefOptions }
                        ]}
                        templateFileName="courses_upload_template.csv"
                        onUpload={async (records, dropdownValues) => {
                            return await CoursesService.bulkUploadCourses({
                                courses: records,
                                departmentId: dropdownValues.departmentId,
                                levelId: dropdownValues.levelId,
                                semesterId: dropdownValues.semesterId
                            });
                        }}
                        onComplete={loadData}
                    />
                )}
            </div>
        </>
    );
};

export default CoursesPage;
