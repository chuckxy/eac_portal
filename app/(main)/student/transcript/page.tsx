'use client';
import React, { useRef, useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import GradeBadge from '@/components/GradeBadge';
import { StudentService } from '@/lib/service/StudentService';
import { useAuth } from '@/layout/context/authcontext';
import type { TranscriptData, TranscriptSemester, TranscriptCourse } from '@/types';

const TranscriptPage = () => {
    const { user } = useAuth();
    const studentIndex = String(user?.profileId || '');
    const toast = useRef<Toast>(null);
    const [transcript, setTranscript] = useState<TranscriptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

    useEffect(() => {
        loadTranscript();
    }, []);

    const loadTranscript = async () => {
        setLoading(true);
        try {
            const data = await StudentService.getTranscript(studentIndex);
            setTranscript(data);
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Failed to load transcript', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const printTranscript = () => {
        toast.current?.show({ severity: 'info', summary: 'Preparing print view...', life: 2000 });
        window.print();
    };

    if (loading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round p-4 mb-3">
                        <div className="grid">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="col-12 sm:col-6 md:col-3">
                                    <Skeleton width="100px" height="0.8rem" className="mb-1" />
                                    <Skeleton width="160px" height="1.2rem" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="surface-card shadow-1 border-round p-3 mb-3">
                            <Skeleton width="250px" height="1.2rem" className="mb-3" />
                            <Skeleton width="100%" height="200px" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!transcript) {
        return (
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round p-4 text-center">
                        <i className="pi pi-exclamation-triangle text-4xl text-orange-500 mb-3" />
                        <div className="text-lg font-medium">Transcript not available</div>
                        <Button label="Retry" icon="pi pi-refresh" className="mt-3" onClick={loadTranscript} />
                    </div>
                </div>
            </div>
        );
    }

    const semesters = transcript.semesters || [];
    console.log(semesters);
    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between mb-3">
                    <div>
                        <h2 className="m-0 text-xl font-bold">Academic Transcript</h2>
                        <p className="mt-1 mb-0 text-color-secondary text-sm">Complete academic record</p>
                    </div>
                    <div className="flex gap-2 mt-2 sm:mt-0">
                        <Button label="Download PDF" icon="pi pi-download" className="p-button-outlined p-button-sm" />
                        <Button label="Print" icon="pi pi-print" className="p-button-sm" onClick={printTranscript} />
                    </div>
                </div>

                {/* Student info card */}
                <div className="surface-card shadow-1 border-round p-4 mb-3">
                    <div className="grid">
                        <div className="col-12 sm:col-6 md:col-3">
                            <div className="text-sm text-color-secondary">Index Number</div>
                            <div className="font-bold mt-1">{studentIndex}</div>
                        </div>
                        <div className="col-12 sm:col-6 md:col-3">
                            <div className="text-sm text-color-secondary">CGPA</div>
                            <div className="text-2xl font-bold text-primary mt-1">{Number(transcript.cgpa).toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                {/* Semester blocks */}
                <div className="flex align-items-center justify-content-end mb-3">
                    <div className="flex gap-1">
                        <Button icon="pi pi-th-large" className={`p-button-sm p-button-rounded ${viewMode === 'cards' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('cards')} tooltip="Card view" tooltipOptions={{ position: 'top' }} />
                        <Button icon="pi pi-list" className={`p-button-sm p-button-rounded ${viewMode === 'list' ? '' : 'p-button-outlined'}`} onClick={() => setViewMode('list')} tooltip="List view" tooltipOptions={{ position: 'top' }} />
                    </div>
                </div>
                {semesters.map((sem, idx) => (
                    <div key={idx} className="surface-card shadow-1 border-round p-3 mb-3">
                        <div className="flex justify-content-between align-items-center mb-2">
                            <div>
                                <span className="font-bold">{sem.semesterName}</span>
                                <Tag value={sem.yearName} severity="info" className="ml-2" />
                            </div>
                            <div className="text-right">
                                <span className="text-sm text-color-secondary mr-2">GPA:</span>
                                <span className="font-bold text-primary">{Number(sem.gpa).toFixed(2)}</span>
                                <span className="text-sm text-color-secondary ml-3 mr-2 hidden sm:inline">Credits:</span>
                                <span className="font-bold hidden sm:inline">{sem.totalCreditHours}</span>
                            </div>
                        </div>

                        {viewMode === 'cards' ? (
                            <div className="grid">
                                {(sem.courses || []).map((row, cidx) => {
                                    const sev = row.totalScore >= 70 ? 'success' : row.totalScore >= 50 ? 'info' : row.totalScore >= 40 ? 'warning' : 'danger';
                                    return (
                                        <div key={cidx} className="col-12 sm:col-6">
                                            <div className="surface-border border-1 border-round p-3">
                                                <div className="flex align-items-start justify-content-between mb-2">
                                                    <div>
                                                        <div className="font-bold text-sm">{row.courseCode}</div>
                                                        <div className="text-xs text-color-secondary">{row.courseName}</div>
                                                    </div>
                                                    <GradeBadge grade={row.grade} />
                                                </div>
                                                <div className="flex justify-content-between text-xs text-color-secondary mt-2 pt-2 border-top-1 surface-border">
                                                    <span>Credits: {row.creditHours}</span>
                                                    <span>
                                                        Score: <Tag value={`${row.totalScore}%`} severity={sev} className="text-xs" />
                                                    </span>
                                                    <span>
                                                        GP: <span className="font-semibold text-color">{row.gradePoint}</span>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <DataTable value={sem.courses} responsiveLayout="scroll" className="p-datatable-sm" showGridlines={false} tableStyle={{ minWidth: '24rem' }}>
                                <Column field="courseCode" header="Code" style={{ width: '80px', minWidth: '80px' }} />
                                <Column field="courseName" header="Course" style={{ minWidth: '10rem' }} />
                                <Column field="creditHours" header="Cr" style={{ width: '45px' }} className="text-center" />
                                <Column
                                    header="Score"
                                    body={(row) => {
                                        const sev = row.totalScore >= 70 ? 'success' : row.totalScore >= 50 ? 'info' : row.totalScore >= 40 ? 'warning' : 'danger';
                                        return <Tag value={`${row.totalScore}%`} severity={sev} />;
                                    }}
                                    style={{ width: '70px' }}
                                />
                                <Column header="Grade" body={(row) => <GradeBadge grade={row.grade} />} style={{ width: '70px' }} />
                                <Column field="gradePoint" header="GP" style={{ width: '45px' }} className="text-center" />
                            </DataTable>
                        )}
                    </div>
                ))}

                {/* Cumulative summary */}
                <div className="surface-card shadow-1 border-round p-4">
                    <div className="flex justify-content-between align-items-center">
                        <span className="font-bold text-lg">Cumulative Summary</span>
                        <div>
                            <span className="text-color-secondary mr-2">Total Credits:</span>
                            <span className="font-bold mr-4">{transcript.totalCredits}</span>
                            <span className="text-color-secondary mr-2">CGPA:</span>
                            <span className="text-xl font-bold text-primary">{Number(transcript.cgpa).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TranscriptPage;
