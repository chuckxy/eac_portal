'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { CoursesService } from '@/lib/service/CoursesService';
import { LookupService } from '@/lib/service/LookupService';
import { useAuth } from '@/layout/context/authcontext';
import type { CourseAssignment } from '@/types';

const CourseAssignmentsPage = () => {
    const toast = useRef<Toast>(null);
    const { hasRole } = useAuth();
    const isAdmin = hasRole('admin');
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<CourseAssignment | null>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        courseId: null as number | null,
        lecturerId: null as number | null,
        programmeId: null as number | null,
        academicSemesterId: null as number | null
    });

    const [courseOptions, setCourseOptions] = useState<{ label: string; value: number }[]>([]);
    const [lecturerOptions, setLecturerOptions] = useState<{ label: string; value: number }[]>([]);
    const [programmeOptions, setProgrammeOptions] = useState<{ label: string; value: number }[]>([]);
    const [semesterOptions, setSemesterOptions] = useState<{ label: string; value: number }[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await CoursesService.getAssignments();
            setAssignments(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const loadDropdowns = async () => {
        try {
            const [courses, lecturers, programmes, semesters] = await Promise.all([LookupService.getCourses(), LookupService.getLecturers(), LookupService.getProgrammes(), LookupService.getSemesters()]);
            setCourseOptions(courses.map((c) => ({ label: `${c.courseCode} — ${c.courseName}`, value: c.id })));
            setLecturerOptions(lecturers.map((l) => ({ label: `${l.title ? l.title + ' ' : ''}${l.firstName} ${l.lastName}`, value: l.id })));
            setProgrammeOptions(programmes.map((p) => ({ label: p.programmeName, value: p.id })));
            setSemesterOptions(semesters.map((s) => ({ label: `${s.semesterName} (${s.yearName})`, value: s.id })));
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
        setFormData({ courseId: null, lecturerId: null, programmeId: null, academicSemesterId: null });
        setShowDialog(true);
    };

    const openEdit = (a: CourseAssignment) => {
        setEditing(a);
        setFormData({ courseId: a.courseId, lecturerId: a.lecturerId, programmeId: a.programmeId, academicSemesterId: a.academicSemesterId });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = editing ? { id: editing.id, ...formData } : formData;
            const res = await CoursesService.saveAssignment(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message || 'Assignment saved.', life: 3000 });
            setShowDialog(false);
            await loadData();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const confirmDelete = async (a: CourseAssignment) => {
        setDeletingId(a.id);
        try {
            const deps = await CoursesService.getAssignmentDependencies(a.id);
            if (deps.hasDependencies) {
                const lines = Object.entries(deps.counts)
                    .filter(([, v]) => v > 0)
                    .map(([k, v]) => `${v} ${k}`);
                confirmDialog({
                    message: `"${a.courseCode}" assignment for ${a.lecturerName} has the following dependent records:\n\n• ${lines.join('\n• ')}\n\nDeleting will permanently remove ALL related records. Continue?`,
                    header: 'Warning: Cascade Delete',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    acceptLabel: 'Delete All',
                    rejectLabel: 'Cancel',
                    accept: async () => {
                        try {
                            const res = await CoursesService.cascadeDeleteAssignment(a.id);
                            toast.current?.show({ severity: 'warn', summary: 'Removed', detail: res.message || 'Assignment and all dependents removed.', life: 4000 });
                            await loadData();
                        } catch (err) {
                            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                        }
                    }
                });
            } else {
                confirmDialog({
                    message: `Remove "${a.courseCode}" assignment for ${a.lecturerName}? This cannot be undone.`,
                    header: 'Confirm Remove',
                    icon: 'pi pi-exclamation-triangle',
                    acceptClassName: 'p-button-danger',
                    accept: async () => {
                        try {
                            const res = await CoursesService.deleteAssignment(a.id);
                            toast.current?.show({ severity: 'success', summary: 'Removed', detail: res.message || 'Assignment removed.', life: 3000 });
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

    const actionTemplate = (row: CourseAssignment) => {
        if (!isAdmin) return null;
        return (
            <div className="flex gap-1">
                <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />
                <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} loading={deletingId === row.id} />
            </div>
        );
    };

    const courseTemplate = (row: CourseAssignment) => (
        <div>
            <div className="font-medium">{row.courseCode}</div>
            <div className="text-sm text-color-secondary">{row.courseName}</div>
        </div>
    );

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText
                    placeholder="Search assignments..."
                    value={globalFilterValue}
                    onChange={(e) => {
                        setGlobalFilterValue(e.target.value);
                        setFilters((prev) => ({ ...prev, global: { value: e.target.value || null, matchMode: FilterMatchMode.CONTAINS } }));
                    }}
                    className="w-full sm:w-auto"
                />
            </span>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader
                    title="Course Assignments"
                    subtitle={isAdmin ? 'Assign lecturers to courses for each programme and semester' : 'View your course assignments'}
                    actionLabel={isAdmin ? 'New Assignment' : undefined}
                    onAction={isAdmin ? openNew : undefined}
                />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable value={assignments} loading={loading} filters={filters} header={header} paginator rows={10} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No assignments found." tableStyle={{ minWidth: '34rem' }}>
                        <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '10rem' }} />
                        <Column field="lecturerName" header="Lecturer" sortable style={{ minWidth: '9rem' }} />
                        <Column field="programmeName" header="Programme" sortable style={{ minWidth: '8rem' }} />
                        <Column field="semesterName" header="Semester" sortable style={{ minWidth: '9rem' }} body={(row) => <Tag value={`${row.semesterName} (${row.yearName})`} severity="info" />} />
                        {isAdmin && <Column header="Actions" body={actionTemplate} style={{ width: '90px' }} className="white-space-nowrap" />}
                    </DataTable>
                </div>
            </div>

            {isAdmin && (
                <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Assignment' : 'New Assignment'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Course</label>
                            <Dropdown value={formData.courseId} options={courseOptions} onChange={(e) => setFormData({ ...formData, courseId: e.value })} placeholder="Select course" filter className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Lecturer</label>
                            <Dropdown value={formData.lecturerId} options={lecturerOptions} onChange={(e) => setFormData({ ...formData, lecturerId: e.value })} placeholder="Select lecturer" filter className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Programme</label>
                            <Dropdown value={formData.programmeId} options={programmeOptions} onChange={(e) => setFormData({ ...formData, programmeId: e.value })} placeholder="Select programme" filter className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Semester</label>
                            <Dropdown value={formData.academicSemesterId} options={semesterOptions} onChange={(e) => setFormData({ ...formData, academicSemesterId: e.value })} placeholder="Select semester" className="w-full" />
                        </div>
                        <div className="flex justify-content-end gap-2 pt-2">
                            <Button label="Cancel" className="p-button-text" onClick={() => setShowDialog(false)} />
                            <Button label="Save" icon="pi pi-check" onClick={save} />
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default CourseAssignmentsPage;
