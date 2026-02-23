'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
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
                label: s.semesterName ?? `Semester ${s.semesterNumber}, ${s.yearName ?? ''}`,
                value: s.id ?? s.semesterId
            }));
            setSemesterOptions(options);
            if (options.length > 0) {
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
                        <DataTable value={courses} responsiveLayout="scroll" className="p-datatable-sm" loading={loadingCourses} emptyMessage="No courses enrolled." tableStyle={{ minWidth: '26rem' }}>
                            <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '10rem' }} />
                            <Column field="creditHours" header="Cr" sortable style={{ width: '45px' }} className="text-center" />
                            <Column field="lecturerName" header="Lecturer" sortable className="hidden md:table-cell" style={{ minWidth: '8rem' }} />
                            <Column header="Progress" body={progressTemplate} style={{ width: '110px', minWidth: '110px' }} className="hidden sm:table-cell" />
                            <Column header="Score" body={scoreTemplate} sortable sortField="completedAssessments" style={{ width: '80px' }} />
                        </DataTable>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCoursesPage;
