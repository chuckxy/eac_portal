'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { StudentService } from '@/lib/service/StudentService';
import { LookupService } from '@/lib/service/LookupService';
import { useAuth } from '@/layout/context/authcontext';
import type { StudentCourseRow } from '@/types';

const MyCoursesPage = () => {
    const { user } = useAuth();
    const studentIndex = String(user?.profileId || '');
    const toast = useRef<Toast>(null);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [semesterOptions, setSemesterOptions] = useState<{ label: string; value: number }[]>([]);
    const [courses, setCourses] = useState<StudentCourseRow[]>([]);
    const [loadingSemesters, setLoadingSemesters] = useState(true);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

    useEffect(() => {
        loadSemesters();
    }, []);

    useEffect(() => {
        if (selectedSemester != null) {
            loadCourses(selectedSemester);
        }
    }, [selectedSemester]);

    const loadSemesters = async () => {
        setLoadingSemesters(true);
        try {
            const data = await LookupService.getSemesters();
            const options = (data || []).map((s: any) => ({
                label: `${s.yearName ?? ''} — ${s.semesterName ?? `Semester ${s.semesterNumber}`}`.trim(),
                value: s.id ?? s.semesterId
            }));
            setSemesterOptions(options);
            // Default to the current academic semester, or fall back to the first
            const current = (data || []).find((s: any) => s.isCurrent);
            if (current) {
                setSelectedSemester(current.id ?? current.semesterId);
            } else if (options.length > 0) {
                setSelectedSemester(options[0].value);
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load semesters', life: 3000 });
        } finally {
            setLoadingSemesters(false);
        }
    };

    const loadCourses = async (semesterId: number) => {
        setLoadingCourses(true);
        try {
            const data = await StudentService.getCourses(studentIndex, semesterId);
            setCourses(data || []);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load courses', life: 3000 });
            setCourses([]);
        } finally {
            setLoadingCourses(false);
        }
    };

    const totalCredits = courses.reduce((s, c) => s + c.creditHours, 0);

    const courseTemplate = (row: StudentCourseRow) => (
        <div>
            <div className="font-medium">{row.courseCode}</div>
            <div className="text-sm text-color-secondary">{row.courseName}</div>
        </div>
    );

    const progressTemplate = (row: StudentCourseRow) => {
        const pct = row.totalAssessments > 0 ? Math.round((row.completedAssessments / row.totalAssessments) * 100) : 0;
        return (
            <div className="flex flex-column gap-1">
                <ProgressBar value={pct} showValue={false} style={{ height: '6px' }} />
                <span className="text-xs text-color-secondary">
                    {row.completedAssessments}/{row.totalAssessments}
                </span>
            </div>
        );
    };

    const scoreTemplate = (row: StudentCourseRow) => {
        if (row.totalAssessments === 0) return <span className="text-color-secondary text-sm">No assessments</span>;
        const pct = Math.round((row.completedAssessments / row.totalAssessments) * 100);
        const sev = pct === 100 ? 'success' : pct >= 50 ? 'info' : 'warning';
        return <Tag value={`${pct}%`} severity={sev} />;
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="mb-3">
                    <h2 className="m-0 text-xl font-bold">My Courses</h2>
                    <p className="mt-1 mb-0 text-color-secondary text-sm">View your enrolled courses and assessment progress</p>
                </div>

                <div className="surface-card shadow-1 border-round p-3 mb-3">
                    <div className="flex flex-column sm:flex-row gap-3 align-items-start sm:align-items-end justify-content-between">
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Select Semester</label>
                            <Dropdown
                                value={selectedSemester}
                                options={semesterOptions}
                                onChange={(e) => setSelectedSemester(e.value)}
                                className="w-full sm:w-20rem"
                                placeholder={loadingSemesters ? 'Loading semesters...' : 'Select a semester'}
                                disabled={loadingSemesters}
                            />
                        </div>
                        <div className="flex gap-3">
                            <div className="text-center">
                                <div className="text-sm text-color-secondary">Courses</div>
                                {loadingCourses ? <Skeleton width="30px" height="1.5rem" className="mx-auto" /> : <div className="text-xl font-bold">{courses.length}</div>}
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-color-secondary">Credits</div>
                                {loadingCourses ? <Skeleton width="30px" height="1.5rem" className="mx-auto" /> : <div className="text-xl font-bold">{totalCredits}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedSemester != null && (
                    <div className="surface-card shadow-1 border-round p-3">
                        <div className="flex align-items-center justify-content-between mb-3">
                            <h3 className="text-base font-semibold text-color m-0">Enrolled Courses</h3>
                            <div className="flex gap-1">
                                <Button icon="pi pi-th-large" className={`p-button-sm p-button-rounded ${viewMode === 'cards' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('cards')} tooltip="Card view" tooltipOptions={{ position: 'top' }} />
                                <Button icon="pi pi-list" className={`p-button-sm p-button-rounded ${viewMode === 'list' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('list')} tooltip="List view" tooltipOptions={{ position: 'top' }} />
                            </div>
                        </div>

                        {viewMode === 'cards' ? (
                            <div className="grid">
                                {loadingCourses && <div className="col-12 text-center py-4"><i className="pi pi-spin pi-spinner text-2xl" /></div>}
                                {!loadingCourses && courses.length === 0 && <div className="col-12 text-center text-color-secondary py-4">No courses enrolled.</div>}
                                {!loadingCourses && courses.map((row, idx) => {
                                    const pct = row.totalAssessments > 0 ? Math.round((row.completedAssessments / row.totalAssessments) * 100) : 0;
                                    const sev = pct === 100 ? 'success' : pct >= 50 ? 'info' : 'warning';
                                    return (
                                        <div key={idx} className="col-12 sm:col-6">
                                            <div className="surface-border border-1 border-round p-3">
                                                <div className="flex align-items-start justify-content-between mb-2">
                                                    <div>
                                                        <div className="font-bold text-sm">{row.courseCode}</div>
                                                        <div className="text-xs text-color-secondary">{row.courseName}</div>
                                                    </div>
                                                    {row.totalAssessments > 0 ? <Tag value={`${pct}%`} severity={sev} /> : <span className="text-xs text-color-secondary">N/A</span>}
                                                </div>
                                                <ProgressBar value={pct} showValue={false} style={{ height: '6px' }} className="mb-2" />
                                                <div className="flex justify-content-between text-xs text-color-secondary mt-2 pt-2 border-top-1 surface-border">
                                                    <span>Credits: {row.creditHours}</span>
                                                    <span>Lecturer: {row.lecturerName}</span>
                                                    <span>{row.completedAssessments}/{row.totalAssessments} done</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <DataTable value={courses} responsiveLayout="scroll" className="p-datatable-sm" loading={loadingCourses} emptyMessage="No courses enrolled." tableStyle={{ minWidth: '26rem' }}>
                                <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '8rem' }} />
                                <Column field="creditHours" header="Cr" sortable style={{ width: '45px' }} className="text-center" />
                                <Column field="lecturerName" header="Lecturer" sortable style={{ minWidth: '8rem' }} />
                                <Column header="Progress" body={progressTemplate} style={{ width: '110px', minWidth: '110px' }} />
                                <Column header="Score" body={scoreTemplate} sortable sortField="completedAssessments" style={{ width: '110px' }} />
                            </DataTable>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCoursesPage;
