'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { confirmDialog } from 'primereact/confirmdialog';
import PageHeader from '@/components/PageHeader';
import { AssessmentsService } from '@/lib/service/AssessmentsService';
import { CoursesService } from '@/lib/service/CoursesService';
import { useAuth } from '@/layout/context/authcontext';
import type { Assessment, DropdownOption } from '@/types';
import { formatDateToString } from '@/lib/service/UtilityService';

const AssessmentsListPage = () => {
    const toast = useRef<Toast>(null);
    const { hasRole, user } = useAuth();
    const isAdmin = hasRole('admin');
    const isLecturer = hasRole('lecturer');
    const canManage = isAdmin || isLecturer;
    const [showDialog, setShowDialog] = useState(false);
    const [editing, setEditing] = useState<Assessment | null>(null);
    const [globalFilter, setGlobalFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [typeOptions, setTypeOptions] = useState<DropdownOption[]>([]);
    const [courseOptions, setCourseOptions] = useState<DropdownOption[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        assessmentTypeId: null as number | null,
        courseAssignmentId: null as number | null,
        totalMarks: 100,
        assessmentDate: null as Date | null
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            // Lecturers only see their own assignments; admins see all
            const assignmentsParams = isLecturer && user?.profileId ? { lecturerId: Number(user.profileId) } : {};
            const [assessData, typesData, assignmentsData] = await Promise.all([AssessmentsService.getAssessments(), AssessmentsService.getTypes(), CoursesService.getAssignments(assignmentsParams)]);
            setAssessments(assessData);
            setTypeOptions(typesData.map((t) => ({ label: `${t.typeName} (${t.weight}%)`, value: t.id })));
            setCourseOptions(assignmentsData.map((a) => ({ label: `${a.courseCode} — ${a.courseName} (${a.lecturerName}, ${a.programmeName})`, value: a.id })));
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to load data', life: 4000 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const openNew = () => {
        setEditing(null);
        setFormData({ title: '', assessmentTypeId: null, courseAssignmentId: null, totalMarks: 100, assessmentDate: null });
        setShowDialog(true);
    };

    const openEdit = (a: Assessment) => {
        setEditing(a);
        setFormData({
            title: a.title,
            assessmentTypeId: a.assessmentTypeId,
            courseAssignmentId: a.courseAssignmentId,
            totalMarks: a.totalMarks,
            assessmentDate: a.assessmentDate ? new Date(a.assessmentDate) : null
        });
        setShowDialog(true);
    };

    const save = async () => {
        try {
            const payload = {
                ...formData,
                id: editing?.id,
                assessmentDate: formData.assessmentDate instanceof Date ? formData.assessmentDate.toISOString().split('T')[0] : formData.assessmentDate
            };
            const res = await AssessmentsService.saveAssessment(payload);
            toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message, life: 3000 });
            setShowDialog(false);
            loadData();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to save', life: 4000 });
        }
    };

    const confirmDelete = (a: Assessment) => {
        confirmDialog({
            message: `Delete "${a.title}" for ${a.courseCode}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const res = await AssessmentsService.deleteAssessment(a.id);
                    toast.current?.show({ severity: 'success', summary: 'Deleted', detail: res.message, life: 3000 });
                    loadData();
                } catch (err: any) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to delete', life: 4000 });
                }
            }
        });
    };

    const actionTemplate = (row: Assessment) => (
        <div className="flex gap-1">
            {canManage && <Button icon="pi pi-pencil" className="p-button-text p-button-sm" onClick={() => openEdit(row)} />}
            <Button
                icon="pi pi-list"
                className="p-button-text p-button-info p-button-sm"
                tooltip="Enter Scores"
                tooltipOptions={{ position: 'top' }}
                onClick={() => toast.current?.show({ severity: 'info', summary: 'Navigate to score entry', life: 2000 })}
            />
            {isAdmin && <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" onClick={() => confirmDelete(row)} />}
        </div>
    );

    const courseTemplate = (row: Assessment) => (
        <div>
            <div className="font-medium">{row.courseCode}</div>
            <div className="text-sm text-color-secondary">{row.courseName}</div>
        </div>
    );

    const typeTag = (row: Assessment) => {
        const sev = row.typeName?.toLowerCase().includes('exam') ? 'warning' : 'info';
        return <Tag value={row.typeName} severity={sev} />;
    };

    const header = (
        <span className="p-input-icon-left w-full sm:w-auto">
            <i className="pi pi-search" />
            <InputText placeholder="Search assessments..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full sm:w-auto" />
        </span>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <PageHeader
                    title="Assessments"
                    subtitle={canManage ? 'Create and manage assessments for your course assignments' : 'View assessments for your course assignments'}
                    actionLabel={canManage ? 'New Assessment' : undefined}
                    onAction={canManage ? openNew : undefined}
                />
                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        value={assessments}
                        loading={loading}
                        globalFilter={globalFilter}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No assessments found."
                        tableStyle={{ minWidth: '38rem' }}
                    >
                        <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '9rem' }} />
                        <Column field="title" header="Assessment" sortable style={{ minWidth: '9rem' }} />
                        <Column field="typeName" header="Type" body={typeTag} sortable style={{ width: '90px' }} />
                        <Column field="totalMarks" header="Marks" sortable style={{ width: '75px' }} className="text-center" />
                        <Column field="weight" header="Weight" body={(row) => `${row.weight}%`} sortable style={{ width: '80px' }} />
                        <Column field="assessmentDate" header="Date" body={(row: Assessment) => <div>{formatDateToString(new Date(row.assessmentDate))}</div>} sortable style={{ width: '110px' }} />
                        <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} className="white-space-nowrap" />
                    </DataTable>
                </div>
            </div>

            {canManage && (
                <Dialog visible={showDialog} onHide={() => setShowDialog(false)} header={editing ? 'Edit Assessment' : 'New Assessment'} modal className="w-full sm:w-30rem" breakpoints={{ '640px': '95vw' }}>
                    <div className="flex flex-column gap-3 pt-2">
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Course Assignment</label>
                            <Dropdown value={formData.courseAssignmentId} options={courseOptions} onChange={(e) => setFormData({ ...formData, courseAssignmentId: e.value })} placeholder="Select course assignment" filter className="w-full" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Assessment Name</label>
                            <InputText value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. CA Test 1" />
                        </div>
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Assessment Type</label>
                            <Dropdown value={formData.assessmentTypeId} options={typeOptions} onChange={(e) => setFormData({ ...formData, assessmentTypeId: e.value })} placeholder="Select type" className="w-full" />
                        </div>
                        <div className="grid">
                            <div className="col-6 flex flex-column gap-1">
                                <label className="text-sm font-medium">Total Marks</label>
                                <InputNumber value={formData.totalMarks} onValueChange={(e) => setFormData({ ...formData, totalMarks: e.value ?? 100 })} min={1} />
                            </div>
                            <div className="col-6 flex flex-column gap-1">
                                <label className="text-sm font-medium">Assessment Date</label>
                                <Calendar value={formData.assessmentDate} onChange={(e) => setFormData({ ...formData, assessmentDate: e.value as Date })} dateFormat="yy-mm-dd" showIcon className="w-full" />
                            </div>
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

export default AssessmentsListPage;
