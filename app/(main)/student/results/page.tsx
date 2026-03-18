'use client';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import GradeBadge from '@/components/GradeBadge';
import { StudentService } from '@/lib/service/StudentService';
import { LookupService } from '@/lib/service/LookupService';
import { useAuth } from '@/layout/context/authcontext';
import type { StudentResultRow } from '@/types';

/** Aggregated course result for display */
interface CourseResult {
    courseCode: string;
    courseName: string;
    creditHours: number;
    caScore: number;
    examScore: number;
    totalScore: number;
    grade: string;
    gradePoint: number;
}

/** Aggregate raw assessment rows into per-course results */
function aggregateResults(rows: StudentResultRow[]): CourseResult[] {
    const courseMap = new Map<string, { courseName: string; creditHours: number; assessments: StudentResultRow[] }>();
    for (const r of rows) {
        if (!courseMap.has(r.courseCode)) {
            courseMap.set(r.courseCode, { courseName: r.courseName, creditHours: r.creditHours, assessments: [] });
        }
        courseMap.get(r.courseCode)!.assessments.push(r);
    }
    const results: CourseResult[] = [];
    for (const [courseCode, { courseName, creditHours, assessments }] of Array.from(courseMap)) {
        let caScore = 0;
        let examScore = 0;
        let totalScore = 0;
        let lastGrade = '';
        let lastGP = 0;
        for (const a of assessments) {
            const weighted = a.totalMarks > 0 ? (a.marksObtained / a.totalMarks) * a.weight : 0;
            totalScore += weighted;
            if (a.typeName.toLowerCase().includes('exam')) {
                examScore += weighted;
            } else {
                caScore += weighted;
            }
            lastGrade = a.grade;
            lastGP = a.gradePoint;
        }
        results.push({ courseCode, courseName, creditHours, caScore: Math.round(caScore * 10) / 10, examScore: Math.round(examScore * 10) / 10, totalScore: Math.round(totalScore * 10) / 10, grade: lastGrade, gradePoint: lastGP });
    }
    return results;
}

const MyResultsPage = () => {
    const toast = useRef<Toast>(null);
    const { user } = useAuth();
    const studentIndex = String(user?.profileId || '');
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [semesterOptions, setSemesterOptions] = useState<{ label: string; value: number }[]>([]);
    const [results, setResults] = useState<CourseResult[]>([]);
    const [loadingSemesters, setLoadingSemesters] = useState(true);
    const [loadingResults, setLoadingResults] = useState(false);
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

    useEffect(() => {
        loadSemesters();
    }, []);

    useEffect(() => {
        if (selectedSemester != null) {
            loadResults(selectedSemester);
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
            if (options.length > 0) {
                setSelectedSemester(options[0].value);
            }
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load semesters', life: 3000 });
        } finally {
            setLoadingSemesters(false);
        }
    };

    const loadResults = async (semesterId: number) => {
        setLoadingResults(true);
        try {
            const rawRows = await StudentService.getResults(studentIndex, semesterId);
            setResults(aggregateResults(rawRows || []));
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load results', life: 3000 });
            setResults([]);
        } finally {
            setLoadingResults(false);
        }
    };

    const totalCredits = results.reduce((s, r) => s + r.creditHours, 0);
    const weightedGP = results.reduce((s, r) => s + r.gradePoint * r.creditHours, 0);
    const gpa = totalCredits > 0 ? (weightedGP / totalCredits).toFixed(2) : '0.00';

    const scoreTemplate = (row: CourseResult) => {
        const pct = row.totalScore;
        const sev = pct >= 70 ? 'success' : pct >= 50 ? 'info' : pct >= 40 ? 'warning' : 'danger';
        return <Tag value={`${row.totalScore}%`} severity={sev} />;
    };

    const courseTemplate = (row: CourseResult) => (
        <div>
            <div className="font-medium">{row.courseCode}</div>
            <div className="text-sm text-color-secondary">{row.courseName}</div>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="mb-3">
                    <h2 className="m-0 text-xl font-bold">My Results</h2>
                    <p className="mt-1 mb-0 text-color-secondary text-sm">View your academic results by semester</p>
                </div>

                <div className="surface-card shadow-1 border-round p-3 mb-3">
                    <div className="flex flex-column sm:flex-row gap-3 align-items-start sm:align-items-end">
                        <div className="flex flex-column gap-1 flex-1">
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
                    </div>
                </div>

                {selectedSemester != null && (
                    <>
                        {/* GPA Summary */}
                        <div className="grid mb-3">
                            <div className="col-6 sm:col-3">
                                <div className="surface-card shadow-1 border-round p-3 text-center">
                                    <div className="text-sm text-color-secondary">Semester GPA</div>
                                    {loadingResults ? <Skeleton width="60px" height="2rem" className="mx-auto mt-1" /> : <div className="text-3xl font-bold text-primary mt-1">{gpa}</div>}
                                </div>
                            </div>
                            <div className="col-6 sm:col-3">
                                <div className="surface-card shadow-1 border-round p-3 text-center">
                                    <div className="text-sm text-color-secondary">Courses</div>
                                    {loadingResults ? <Skeleton width="40px" height="2rem" className="mx-auto mt-1" /> : <div className="text-3xl font-bold mt-1">{results.length}</div>}
                                </div>
                            </div>
                            <div className="col-6 sm:col-3">
                                <div className="surface-card shadow-1 border-round p-3 text-center">
                                    <div className="text-sm text-color-secondary">Credit Hours</div>
                                    {loadingResults ? <Skeleton width="40px" height="2rem" className="mx-auto mt-1" /> : <div className="text-3xl font-bold mt-1">{totalCredits}</div>}
                                </div>
                            </div>
                            <div className="col-6 sm:col-3">
                                <div className="surface-card shadow-1 border-round p-3 text-center">
                                    <div className="text-sm text-color-secondary">Weighted GP</div>
                                    {loadingResults ? <Skeleton width="50px" height="2rem" className="mx-auto mt-1" /> : <div className="text-3xl font-bold mt-1">{weightedGP.toFixed(1)}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="surface-card shadow-1 border-round p-3">
                            <div className="flex align-items-center justify-content-between mb-3">
                                <h3 className="text-base font-semibold text-color m-0">Course Results</h3>
                                <div className="flex gap-1">
                                    <Button icon="pi pi-th-large" className={`p-button-sm p-button-rounded ${viewMode === 'cards' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('cards')} tooltip="Card view" tooltipOptions={{ position: 'top' }} />
                                    <Button icon="pi pi-list" className={`p-button-sm p-button-rounded ${viewMode === 'list' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('list')} tooltip="List view" tooltipOptions={{ position: 'top' }} />
                                </div>
                            </div>

                            {viewMode === 'cards' ? (
                                <div className="grid">
                                    {loadingResults && <div className="col-12 text-center py-4"><i className="pi pi-spin pi-spinner text-2xl" /></div>}
                                    {!loadingResults && results.length === 0 && <div className="col-12 text-center text-color-secondary py-4">No results available.</div>}
                                    {!loadingResults && results.map((row, idx) => {
                                        const sev = row.totalScore >= 70 ? 'success' : row.totalScore >= 50 ? 'info' : row.totalScore >= 40 ? 'warning' : 'danger';
                                        return (
                                            <div key={idx} className="col-12 sm:col-6">
                                                <div className="surface-border border-1 border-round p-3">
                                                    <div className="flex align-items-start justify-content-between mb-2">
                                                        <div>
                                                            <div className="font-bold text-sm">{row.courseCode}</div>
                                                            <div className="text-xs text-color-secondary">{row.courseName}</div>
                                                        </div>
                                                        <GradeBadge grade={row.grade} />
                                                    </div>
                                                    <div className="flex justify-content-between text-xs text-color-secondary mt-2 pt-2 border-top-1 surface-border">
                                                        <span>CA: {row.caScore}</span>
                                                        <span>Exam: {row.examScore}</span>
                                                        <span>Total: <Tag value={`${row.totalScore}%`} severity={sev} className="text-xs" /></span>
                                                        <span>GP: <span className="font-semibold text-color">{row.gradePoint}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <DataTable value={results} responsiveLayout="scroll" className="p-datatable-sm" loading={loadingResults} emptyMessage="No results available." tableStyle={{ minWidth: '28rem' }}>
                                    <Column header="Course" body={courseTemplate} sortable sortField="courseCode" style={{ minWidth: '10rem' }} />
                                    <Column field="creditHours" header="Credits" sortable style={{ width: '70px' }} className="text-center" />
                                    <Column field="caScore" header="CA" sortable style={{ width: '55px' }} className="text-center hidden sm:table-cell" />
                                    <Column field="examScore" header="Exam" sortable style={{ width: '55px' }} className="text-center hidden sm:table-cell" />
                                    <Column header="Total" body={scoreTemplate} sortable sortField="totalScore" style={{ width: '80px' }} />
                                    <Column header="Grade" body={(row) => <GradeBadge grade={row.grade} />} sortable sortField="grade" style={{ width: '75px' }} />
                                    <Column field="gradePoint" header="GP" sortable style={{ width: '55px' }} className="text-center" />
                                </DataTable>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MyResultsPage;
