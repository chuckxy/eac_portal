'use client';
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import StatCard from '@/components/StatCard';
import { DashboardService } from '@/lib/service/DashboardService';
import { useAuth } from '@/layout/context/authcontext';
import { LecturerDashboardStats, LecturerAssignment } from '@/types';

const LecturerDashboard = () => {
    const [lecturerStats, setLecturerStats] = useState<LecturerDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const lecturerId = user?.profileId ? Number(user.profileId) : 0;

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await DashboardService.getLecturerStats(lecturerId);
                setLecturerStats(data);
            } catch (err) {
                console.error('Failed to load lecturer dashboard data:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [lecturerId]);

    const assignedCourses: LecturerAssignment[] = lecturerStats?.assignments ?? [];
    const courseCount = lecturerStats?.courseCount ?? 0;
    const studentCount = lecturerStats?.studentCount ?? 0;
    const assessmentCount = lecturerStats?.assessmentCount ?? 0;

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
            <StatCard title="Courses" value={courseCount} icon="pi pi-book" iconBg="bg-blue-500" />
            <StatCard title="Total Students" value={studentCount} icon="pi pi-users" iconBg="bg-green-500" />
            <StatCard title="Assessments" value={assessmentCount} icon="pi pi-list" iconBg="bg-orange-500" />
            <StatCard title="Programmes" value={new Set(assignedCourses.map((a) => a.programmeId)).size || '—'} icon="pi pi-sitemap" iconBg="bg-teal-500" />

            {/* Assigned Courses */}
            <div className="col-12 lg:col-7">
                <div className="surface-card shadow-1 border-round p-3">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <h3 className="text-base font-semibold text-color m-0">My Courses (Current Semester)</h3>
                        <Button label="View All" icon="pi pi-arrow-right" className="p-button-text p-button-sm" />
                    </div>
                    <DataTable value={assignedCourses} responsiveLayout="scroll" className="p-datatable-sm" tableStyle={{ minWidth: '22rem' }}>
                        <Column field="courseCode" header="Code" style={{ width: '80px', minWidth: '80px' }} />
                        <Column field="courseName" header="Course" style={{ minWidth: '9rem' }} />
                        <Column field="programmeName" header="Programme" className="hidden md:table-cell" style={{ minWidth: '8rem' }} />
                        <Column field="semesterName" header="Semester" style={{ minWidth: '6rem' }} className="hidden sm:table-cell" />
                    </DataTable>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-12 lg:col-5">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Quick Actions</h3>
                    <div className="flex flex-column gap-2">
                        <a href="/assessments/create" className="flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-plus-circle text-blue-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Create Assessment</div>
                                <div className="text-xs text-color-secondary">Quiz, exam, or assignment</div>
                            </div>
                        </a>
                        <a href="/results/upload" className="flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-upload text-green-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">Upload Scores</div>
                                <div className="text-xs text-color-secondary">Enter or bulk upload marks</div>
                            </div>
                        </a>
                        <a href="/results/scores" className="flex align-items-center p-3 border-round surface-hover cursor-pointer no-underline text-color">
                            <i className="pi pi-chart-bar text-orange-500 mr-3 text-xl" />
                            <div>
                                <div className="font-medium text-sm">View Results</div>
                                <div className="text-xs text-color-secondary">Check student performance</div>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Grade Distribution — Placeholder until API endpoint is available */}
            <div className="col-12 lg:col-7">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Grade Distribution</h3>
                    <div className="flex flex-column align-items-center justify-content-center" style={{ height: '250px' }}>
                        <i className="pi pi-chart-bar text-4xl text-color-secondary mb-3" />
                        <p className="text-color-secondary text-sm m-0">Grade distribution chart will appear once data is available.</p>
                    </div>
                </div>
            </div>

            {/* Recent Uploads — placeholder until upload tracking is available */}
            <div className="col-12 lg:col-5">
                <div className="surface-card shadow-1 border-round p-3">
                    <h3 className="text-base font-semibold text-color mt-0 mb-3">Recent Uploads</h3>
                    <DataTable value={[]} responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No recent uploads found." tableStyle={{ minWidth: '20rem' }}>
                        <Column field="assessment" header="Assessment" style={{ minWidth: '9rem' }} />
                        <Column field="date" header="Date" style={{ width: '100px' }} className="hidden sm:table-cell" />
                        <Column header="Status" style={{ width: '90px' }} body={(row: { status: string }) => <Tag value={row.status} severity={row.status === 'Completed' ? 'success' : 'warning'} />} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default LecturerDashboard;
