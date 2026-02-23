'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import StatCard from '@/components/StatCard';
import { DashboardService } from '@/lib/service/DashboardService';
import { DashboardStats, RecentStudent } from '@/types';

const AdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsData, studentsData] = await Promise.all([DashboardService.getStats(), DashboardService.getRecentStudents()]);
                setStats(statsData);
                setRecentStudents(studentsData);
            } catch (err) {
                console.error('Failed to load admin dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="grid">
            {/* Stat Cards */}
            <StatCard title="Total Students" value={stats?.studentCount?.toLocaleString() ?? '—'} icon="pi pi-users" iconBg="bg-blue-500" />
            <StatCard title="Lecturers" value={stats?.lecturerCount?.toLocaleString() ?? '—'} icon="pi pi-user" iconBg="bg-green-500" />
            <StatCard title="Active Courses" value={stats?.courseCount?.toLocaleString() ?? '—'} icon="pi pi-book" iconBg="bg-orange-500" />
            <StatCard title="Programmes" value={stats?.programmeCount?.toLocaleString() ?? '—'} icon="pi pi-sitemap" iconBg="bg-red-500" />

            {/* Charts */}
            <div className="col-12 lg:col-8">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Students by Level</h3>
                    <div className="flex flex-column align-items-center justify-content-center" style={{ height: '280px' }}>
                        <i className="pi pi-chart-bar text-4xl text-color-secondary mb-3" />
                        <p className="text-color-secondary text-sm m-0">Level distribution chart will appear once data is available.</p>
                    </div>
                </div>
            </div>

            <div className="col-12 lg:col-4">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Quick Actions</h3>
                    <div className="flex flex-column gap-2">
                        <a href="/academic/years" className="p-ripple flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-calendar text-blue-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Academic Calendar</div>
                                <div className="text-xs text-color-secondary">Manage years & semesters</div>
                            </div>
                        </a>
                        <a href="/institution/faculties" className="p-ripple flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-building text-green-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Institution Setup</div>
                                <div className="text-xs text-color-secondary">Faculties & departments</div>
                            </div>
                        </a>
                        <a href="/users/students" className="p-ripple flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-user-plus text-orange-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Register Students</div>
                                <div className="text-xs text-color-secondary">Add new student records</div>
                            </div>
                        </a>
                        <a href="/grading" className="p-ripple flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-sliders-h text-purple-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Grading Scale</div>
                                <div className="text-xs text-color-secondary">Configure grade boundaries</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Recent Students Table */}
            <div className="col-12">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Recently Enrolled Students</h3>
                    <DataTable value={recentStudents} responsiveLayout="scroll" rows={5} className="p-datatable-sm" tableStyle={{ minWidth: '26rem' }}>
                        <Column field="studentIndex" header="Index No." style={{ minWidth: '8rem' }} />
                        <Column header="Full Name" body={(row) => `${row.firstName} ${row.lastName}`} style={{ minWidth: '9rem' }} />
                        <Column field="programmeName" header="Programme" className="hidden md:table-cell" style={{ minWidth: '8rem' }} />
                        <Column field="levelName" header="Level" body={(row) => <Tag value={row.levelName} severity="info" />} style={{ width: '90px' }} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
