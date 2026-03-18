'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import GradeBadge from '@/components/GradeBadge';
import { ResultsService } from '@/lib/service/ResultsService';
import { LookupService } from '@/lib/service/LookupService';
import type { ScoreRecord, Semester } from '@/types';

const ViewScoresPage = () => {
    const toast = useRef<Toast>(null);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });
    const [filterSemester, setFilterSemester] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [scores, setScores] = useState<ScoreRecord[]>([]);
    const [loading, setLoading] = useState(false);

    // Load semesters on mount
    useEffect(() => {
        LookupService.getSemesters()
            .then((rows) => setSemesters(rows))
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load semesters', life: 3000 });
            });
    }, []);

    // Load scores when semester filter changes
    useEffect(() => {
        setLoading(true);
        const params = filterSemester ? { semesterId: filterSemester } : undefined;
        ResultsService.getScores(params)
            .then((rows) => setScores(rows))
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load scores', life: 3000 });
            })
            .finally(() => setLoading(false));
    }, [filterSemester]);

    const semesterOptions = [{ label: 'All Semesters', value: null }, ...semesters.map((s) => ({ label: `${s.semesterName} (${s.yearName})`, value: s.id }))];

    const studentTemplate = (row: ScoreRecord) => (
        <div>
            <div className="font-medium">
                {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-color-secondary">{row.studentIndex}</div>
        </div>
    );

    const courseTemplate = (row: ScoreRecord) => (
        <div>
            <div className="font-medium">{row.courseCode}</div>
            <div className="text-sm text-color-secondary hidden sm:block">{row.courseName}</div>
        </div>
    );

    const marksTemplate = (row: ScoreRecord) => {
        const pct = row.totalMarks > 0 ? (row.marksObtained / row.totalMarks) * 100 : 0;
        const sev = pct >= 70 ? 'success' : pct >= 50 ? 'info' : pct >= 40 ? 'warning' : 'danger';
        return <Tag value={`${row.marksObtained}/${row.totalMarks}`} severity={sev} />;
    };

    const dt = useRef<DataTable<ScoreRecord[]>>(null);

    const exportCSV = () => {
        dt.current?.exportCSV();
    };

    const header = (
        <div className="flex flex-column sm:flex-row justify-content-between gap-2">
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
            <Button label="Export" icon="pi pi-download" className="p-button-outlined p-button-sm w-full sm:w-auto" onClick={exportCSV} disabled={scores.length === 0} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="mb-3">
                    <h2 className="m-0 text-xl font-bold">View Scores</h2>
                    <p className="mt-1 mb-0 text-color-secondary text-sm">Browse and export student scores across all assessments</p>
                </div>

                <div className="surface-card shadow-1 border-round p-3 mb-3">
                    <div className="grid">
                        <div className="col-12 sm:col-6 flex flex-column gap-1">
                            <label className="text-sm font-medium">Semester</label>
                            <Dropdown value={filterSemester} options={semesterOptions} onChange={(e) => setFilterSemester(e.value)} className="w-full" />
                        </div>
                    </div>
                </div>

                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable
                        ref={dt}
                        value={scores}
                        filters={filters}
                        header={header}
                        paginator
                        rows={20}
                        rowsPerPageOptions={[20, 50, 100, scores.length]}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No scores found."
                        sortField="lastName"
                        sortOrder={1}
                        loading={loading}
                        tableStyle={{ minWidth: '34rem' }}
                    >
                        <Column header="Student" body={studentTemplate} sortable sortField="lastName" style={{ minWidth: '9rem' }} />
                        <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '8rem' }} />
                        <Column field="assessmentTitle" header="Assessment" sortable style={{ minWidth: '8rem' }} />
                        <Column field="typeName" header="Type" sortable style={{ width: '8rem' }} body={(row) => <Tag value={row.typeName} severity={row.typeName === 'Exam' ? 'warning' : 'info'} />} className="" />
                        <Column header="Marks" body={marksTemplate} sortable sortField="marksObtained" style={{ width: '100px' }} />
                        <Column header="Grade" body={(row) => <GradeBadge grade={row.grade} />} sortable sortField="grade" style={{ width: '75px' }} />
                        <Column field="gradePoint" header="GP" sortable style={{ width: '55px' }} className="text-center" />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ViewScoresPage;
