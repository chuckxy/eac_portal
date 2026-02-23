'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import StatCard from '@/components/StatCard';
import { DashboardService } from '@/lib/service/DashboardService';
import { useAuth } from '@/layout/context/authcontext';
import type { DashboardStats, RecentStudent, StudentByLevel, GradeDistributionItem } from '@/types';

// ─── Helpers ────────────────────────────────────────────────
//cH,uVy@07Qd~

function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const GRADE_COLORS: Record<string, string> = {
    A: '#22c55e',
    'B+': '#84cc16',
    B: '#a3e635',
    'C+': '#facc15',
    C: '#fb923c',
    'D+': '#f87171',
    D: '#e11d48',
    E: '#a21caf',
    F: '#6b7280'
};

const LEVEL_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

// ─── Component ──────────────────────────────────────────────

const AdminHomePage = () => {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
    const [levelData, setLevelData] = useState<StudentByLevel[]>([]);
    const [gradeData, setGradeData] = useState<GradeDistributionItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect non-admins to their own dashboard
    useEffect(() => {
        if (authLoading) return;
        if (!user) return;
        if (user.role !== 'admin') {
            const paths: Record<string, string> = {
                lecturer: '/dashboard/lecturer',
                student: '/student/results'
            };
            router.replace(paths[user.role] ?? '/dashboard/admin');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        const load = async () => {
            try {
                const [statsData, studentsData, lvlData, grdData] = await Promise.all([DashboardService.getStats(), DashboardService.getRecentStudents(), DashboardService.getStudentsByLevel(), DashboardService.getGradeDistribution()]);
                setStats(statsData);
                setRecentStudents(studentsData);
                setLevelData(lvlData);
                setGradeData(grdData);
            } catch (err) {
                console.error('Failed to load dashboard:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    // ── Chart configs ──────────────────────────────────────

    const barChartData = {
        labels: levelData.map((l) => l.levelName),
        datasets: [
            {
                label: 'Students Enrolled',
                data: levelData.map((l) => l.count),
                backgroundColor: levelData.map((_, i) => LEVEL_COLORS[i % LEVEL_COLORS.length]),
                borderRadius: 6,
                borderSkipped: false
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} students` } }
        },
        scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.05)' } }
        }
    };

    const donutData = {
        labels: gradeData.map((g) => `Grade ${g.grade}`),
        datasets: [
            {
                data: gradeData.map((g) => g.count),
                backgroundColor: gradeData.map((g) => GRADE_COLORS[g.grade] ?? '#94a3b8'),
                hoverOffset: 6
            }
        ]
    };

    const donutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { position: 'right' as const, labels: { font: { size: 11 }, boxWidth: 12, padding: 10 } },
            tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} scores` } }
        }
    };

    // ── Loading / redirect guard ───────────────────────────

    if (authLoading || !user || user.role !== 'admin') {
        return (
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="grid">
            {/* ── Academic Context Banner ───────────────────── */}
            {stats && (
                <div className="col-12">
                    <div className="surface-card shadow-1 border-round p-3 flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-calendar text-blue-500 text-2xl" />
                            <div>
                                <div className="text-xs text-color-secondary font-medium uppercase">Current Academic Period</div>
                                <div className="font-semibold text-color">
                                    {stats.currentYear?.yearName ?? 'No active year'}
                                    {stats.currentSemester ? ` — ${stats.currentSemester.semesterName}` : ''}
                                </div>
                            </div>
                        </div>
                        {stats.currentYear && (
                            <div className="flex gap-3 text-sm text-color-secondary">
                                {stats.currentYear.startDate && (
                                    <span>
                                        <i className="pi pi-calendar-plus mr-1" />
                                        Start: {formatDate(stats.currentYear.startDate)}
                                    </span>
                                )}
                                {stats.currentYear.endDate && (
                                    <span>
                                        <i className="pi pi-calendar-minus mr-1" />
                                        End: {formatDate(stats.currentYear.endDate)}
                                    </span>
                                )}
                            </div>
                        )}
                        <Button label="Manage Calendar" icon="pi pi-pencil" className="p-button-outlined p-button-sm p-button-primary" onClick={() => router.push('/academic/years')} />
                    </div>
                </div>
            )}

            {/* ── Stat Cards ───────────────────────────────── */}
            <StatCard title="Total Students" value={loading ? '…' : stats?.studentCount?.toLocaleString() ?? '0'} icon="pi pi-users" iconBg="bg-blue-500" />
            <StatCard title="Lecturers" value={loading ? '…' : stats?.lecturerCount?.toLocaleString() ?? '0'} icon="pi pi-user" iconBg="bg-green-500" />
            <StatCard title="Active Courses" value={loading ? '…' : stats?.courseCount?.toLocaleString() ?? '0'} icon="pi pi-book" iconBg="bg-orange-500" />
            <StatCard title="Programmes" value={loading ? '…' : stats?.programmeCount?.toLocaleString() ?? '0'} icon="pi pi-sitemap" iconBg="bg-purple-500" />

            <div className="col-6 sm:col-3">
                <div className="surface-card shadow-1 border-round p-3 flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center border-round bg-cyan-500" style={{ width: '3rem', height: '3rem' }}>
                        <i className="pi pi-building text-white text-xl" />
                    </div>
                    <div>
                        <div className="text-color-secondary text-xs font-medium">Faculties</div>
                        <div className="text-2xl font-bold text-color">{loading ? '…' : stats?.facultyCount ?? 0}</div>
                    </div>
                </div>
            </div>

            <div className="col-6 sm:col-3">
                <div className="surface-card shadow-1 border-round p-3 flex align-items-center gap-3">
                    <div className="flex align-items-center justify-content-center border-round bg-pink-500" style={{ width: '3rem', height: '3rem' }}>
                        <i className="pi pi-objects-column text-white text-xl" />
                    </div>
                    <div>
                        <div className="text-color-secondary text-xs font-medium">Departments</div>
                        <div className="text-2xl font-bold text-color">{loading ? '…' : stats?.departmentCount ?? 0}</div>
                    </div>
                </div>
            </div>

            {/* ── Charts Row ───────────────────────────────── */}
            <div className="col-12 lg:col-7">
                <div className="surface-card shadow-1 border-round p-3 h-full">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">
                        <i className="pi pi-chart-bar text-blue-500 mr-2" />
                        Students by Level
                    </h3>
                    {loading ? (
                        <Skeleton height="260px" borderRadius="6px" />
                    ) : levelData.length > 0 ? (
                        <Chart type="bar" data={barChartData} options={barChartOptions} style={{ height: '260px' }} />
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center" style={{ height: '260px' }}>
                            <i className="pi pi-chart-bar text-4xl text-color-secondary mb-2" />
                            <span className="text-color-secondary text-sm">No student data yet</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="col-12 lg:col-5">
                <div className="surface-card shadow-1 border-round p-3 h-full">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">
                        <i className="pi pi-chart-pie text-purple-500 mr-2" />
                        Grade Distribution
                    </h3>
                    {loading ? (
                        <Skeleton height="260px" borderRadius="6px" />
                    ) : gradeData.length > 0 ? (
                        <Chart type="doughnut" data={donutData} options={donutOptions} style={{ height: '260px' }} />
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center" style={{ height: '260px' }}>
                            <i className="pi pi-chart-pie text-4xl text-color-secondary mb-2" />
                            <span className="text-color-secondary text-sm">No scores submitted yet</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Recent Students + Quick Actions ──────────── */}
            <div className="col-12 lg:col-8">
                <div className="surface-card shadow-1 border-round p-3">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <h3 className="text-base font-semibold text-color m-0">
                            <i className="pi pi-user-plus text-green-500 mr-2" />
                            Recently Enrolled Students
                        </h3>
                        <Button label="All Students" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" onClick={() => router.push('/users/students')} />
                    </div>
                    {loading ? (
                        <>
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} height="2.4rem" className="mb-2" borderRadius="6px" />
                            ))}
                        </>
                    ) : (
                        <DataTable value={recentStudents} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No students registered yet." tableStyle={{ minWidth: '26rem' }}>
                            <Column field="studentIndex" header="Index No." style={{ minWidth: '8rem' }} />
                            <Column
                                header="Full Name"
                                body={(row: RecentStudent) => (
                                    <div>
                                        <div className="font-medium">
                                            {row.firstName} {row.lastName}
                                        </div>
                                        <div className="text-xs text-color-secondary">{row.email}</div>
                                    </div>
                                )}
                                style={{ minWidth: '10rem' }}
                            />
                            <Column field="programmeName" header="Programme" className="hidden md:table-cell" style={{ minWidth: '9rem' }} />
                            <Column field="levelName" header="Level" body={(row: RecentStudent) => <Tag value={row.levelName} severity="info" />} style={{ width: '90px' }} />
                            <Column field="createdAt" header="Enrolled" body={(row: RecentStudent) => <span className="text-sm text-color-secondary">{formatDate(row.createdAt)}</span>} className="hidden sm:table-cell" style={{ width: '100px' }} />
                        </DataTable>
                    )}
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <div className="surface-card shadow-1 border-round p-3 h-full">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">
                        <i className="pi pi-bolt text-orange-500 mr-2" />
                        Quick Actions
                    </h3>
                    <div className="flex flex-column gap-1">
                        {[
                            { href: '/academic/years', icon: 'pi pi-calendar', color: 'text-blue-500', label: 'Academic Calendar', desc: 'Manage years & semesters' },
                            { href: '/institution/faculties', icon: 'pi pi-building', color: 'text-teal-500', label: 'Institution Setup', desc: 'Faculties, departments, programmes' },
                            { href: '/users/students', icon: 'pi pi-user-plus', color: 'text-orange-500', label: 'Register Students', desc: 'Add new student records' },
                            { href: '/users/lecturers', icon: 'pi pi-id-card', color: 'text-green-500', label: 'Manage Lecturers', desc: 'Add or update lecturer profiles' },
                            { href: '/courses/assignments', icon: 'pi pi-link', color: 'text-purple-500', label: 'Course Assignments', desc: 'Assign lecturers to courses' },
                            { href: '/assessments/list', icon: 'pi pi-pencil', color: 'text-cyan-500', label: 'Assessments', desc: 'Create & manage assessments' },
                            { href: '/results/upload', icon: 'pi pi-upload', color: 'text-indigo-500', label: 'Upload Scores', desc: 'Enter or bulk-upload marks' },
                            { href: '/grading', icon: 'pi pi-sliders-h', color: 'text-pink-500', label: 'Grading Scale', desc: 'Configure grade boundaries' }
                        ].map(({ href, icon, color, label, desc }) => (
                            <a key={href} href={href} className="flex align-items-center p-2 border-round surface-hover cursor-pointer no-underline text-color transition-colors transition-duration-150">
                                <i className={`${icon} ${color} mr-3 text-lg`} style={{ minWidth: '1.25rem' }} />
                                <div>
                                    <div className="font-medium text-sm">{label}</div>
                                    <div className="text-xs text-color-secondary">{desc}</div>
                                </div>
                                <i className="pi pi-chevron-right ml-auto text-color-secondary text-xs" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHomePage;
