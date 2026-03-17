'use client';
import React, { useState, useEffect } from 'react';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { ProgressSpinner } from 'primereact/progressspinner';
import GradeBadge from '@/components/GradeBadge';
import StatCard from '@/components/StatCard';
import { StudentService } from '@/lib/service/StudentService';
import { useAuth } from '@/layout/context/authcontext';
import type { StudentProfile, TranscriptData, StudentCourseRow } from '@/types';

const StudentDashboard = () => {
    const [gpaData, setGpaData] = useState({});
    const [gpaOptions, setGpaOptions] = useState({});
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [transcript, setTranscript] = useState<TranscriptData | null>(null);
    const [courses, setCourses] = useState<StudentCourseRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const studentIndex = String(user?.profileId || '');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [profileData, transcriptData, coursesData] = await Promise.all([StudentService.getProfile(studentIndex), StudentService.getTranscript(studentIndex), StudentService.getCourses(studentIndex)]);
                setProfile(profileData);
                setTranscript(transcriptData);
                setCourses(coursesData);
            } catch (err) {
                console.error('Failed to load student dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [studentIndex]);

    useEffect(() => {
        if (!transcript?.semesters?.length) return;

        const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#6366f1';
        const labels = transcript.semesters.map((s) => s.semesterName ?? `Sem ${s.semesterId}`);
        const gpaValues = transcript.semesters.map((s) => s.gpa ?? 0);

        setGpaData({
            labels,
            datasets: [
                {
                    label: 'GPA',
                    data: gpaValues,
                    borderColor: primary,
                    backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }
            ]
        });
        setGpaOptions({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min: 0, max: 4.0, grid: { color: 'rgba(160,167,181,0.15)' } },
                x: { grid: { display: false } }
            }
        });
    }, [transcript]);

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    const studentName = profile ? `${profile.firstName} ${profile.lastName}` : '—';
    const programmeName = profile?.programmeName ?? '—';
    const levelName = profile?.levelName ?? '—';
    const cgpa = transcript?.cgpa ?? '—';
    const totalCredits = courses.reduce((sum, c) => sum + (c.creditHours ?? 0), 0);

    // Derive current semester results from transcript (last semester)
    const lastSemester = transcript?.semesters?.[transcript.semesters.length - 1];
    const currentResults = (lastSemester?.courses ?? []).map((c) => ({
        courseCode: c.courseCode,
        courseName: c.courseName,
        creditHours: c.creditHours,
        total: c.totalScore ?? '—',
        grade: c.assessments?.[c.assessments.length - 1]?.grade ?? null,
        gp: c.gradePoint ?? '—'
    }));
    console.log('Last Semester:', lastSemester);
    // Compute current GPA from transcript last semester
    const currentGpa = lastSemester?.gpa != null ? lastSemester.gpa.toFixed(2) : '—';
    console.log(currentResults);
    return (
        <div className="grid">
            {/* Student Profile Card (mobile-first) */}
            <div className="col-12">
                <div className="surface-card shadow-1 border-round p-3">
                    <div className="flex flex-column sm:flex-row align-items-center gap-3">
                        <Avatar icon="pi pi-user" size="xlarge" shape="circle" className="bg-primary text-white" />
                        <div className="text-center sm:text-left flex-1">
                            <h2 className="text-lg font-bold text-color m-0">{studentName}</h2>
                            <p className="text-sm text-color-secondary mt-1 mb-0">
                                {studentIndex} · {programmeName}
                            </p>
                            <p className="text-sm text-color-secondary mt-1 mb-0">{levelName}</p>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-color-secondary">CGPA</div>
                            <div className="text-3xl font-bold text-primary">{typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <StatCard title="Registered Courses" value={courses.length} icon="pi pi-book" iconBg="bg-blue-500" />
            <StatCard title="Credit Hours" value={totalCredits} icon="pi pi-clock" iconBg="bg-green-500" />
            <StatCard title="Current GPA" value={currentGpa} icon="pi pi-chart-line" iconBg="bg-purple-500" />
            <StatCard title="CGPA" value={typeof cgpa === 'number' ? cgpa.toFixed(2) : cgpa} icon="pi pi-star" iconBg="bg-orange-500" />

            {/* GPA Trend */}
            <div className="col-12 lg:col-5">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">GPA Trend</h3>
                    <div style={{ height: '250px' }}>
                        <Chart type="line" data={gpaData} options={gpaOptions} style={{ width: '100%', height: '100%' }} />
                    </div>
                </div>
            </div>

            {/* Current Semester Results */}
            <div className="col-12 lg:col-7">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Current Semester Results</h3>
                    <DataTable value={currentResults} responsiveLayout="scroll" className="p-datatable-sm" tableStyle={{ minWidth: '24rem' }}>
                        <Column field="courseCode" header="Code" style={{ width: '80px', minWidth: '80px' }} />
                        <Column field="courseName" header="Course" style={{ minWidth: '9rem' }} />
                        <Column field="creditHours" header="CH" style={{ width: '40px' }} className="text-center" />
                        <Column field="total" header="Total" style={{ width: '55px' }} className="text-center" body={(row) => <span className="font-semibold">{row.total}</span>} />
                        <Column header="Grade" style={{ width: '65px' }} className="text-center" body={(row) => <GradeBadge grade={row.grade} />} />
                        <Column field="gp" header="GP" style={{ width: '50px' }} className="text-center" />
                    </DataTable>
                </div>
            </div>

            {/* Actions */}
            <div className="col-12">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Quick Links</h3>
                    <div className="grid">
                        <div className="col-6 sm:col-3">
                            <a href="/student/results" className="flex flex-column align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                                <i className="pi pi-list text-2xl text-blue-500 mb-2" />
                                <span className="text-sm font-medium">All Results</span>
                            </a>
                        </div>
                        <div className="col-6 sm:col-3">
                            <a href="/student/transcript" className="flex flex-column align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                                <i className="pi pi-file text-2xl text-green-500 mb-2" />
                                <span className="text-sm font-medium">Transcript</span>
                            </a>
                        </div>
                        <div className="col-6 sm:col-3">
                            <a href="/student/courses" className="flex flex-column align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                                <i className="pi pi-book text-2xl text-orange-500 mb-2" />
                                <span className="text-sm font-medium">My Courses</span>
                            </a>
                        </div>
                        <div className="col-6 sm:col-3">
                            <a href="/student/profile" className="flex flex-column align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                                <i className="pi pi-user text-2xl text-purple-500 mb-2" />
                                <span className="text-sm font-medium">Profile</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
