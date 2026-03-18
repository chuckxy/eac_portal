'use client';

import { useMemo } from 'react';
import { MenuModal } from '@/types';
import AppSubMenu from './AppSubMenu';
import { useAuth } from './context/authcontext';

const AppMenu = () => {
    const { user } = useAuth();
    const role = user?.role;

    const model = useMemo<MenuModal[]>(() => {
        // ─── Admin menu ──────────────────────────────
        if (role === 'admin') {
            return [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    items: [{ label: 'Admin Dashboard', icon: 'pi pi-fw pi-shield', to: '/dashboard/admin' }]
                },
                { separator: true },
                {
                    label: 'Academic',
                    icon: 'pi pi-calendar',
                    items: [
                        { label: 'Academic Years', icon: 'pi pi-fw pi-calendar-plus', to: '/academic/years' },
                        { label: 'Semesters', icon: 'pi pi-fw pi-calendar-minus', to: '/academic/semesters' }
                    ]
                },
                {
                    label: 'Institution',
                    icon: 'pi pi-building',
                    items: [
                        { label: 'Faculties', icon: 'pi pi-fw pi-sitemap', to: '/institution/faculties' },
                        { label: 'Departments', icon: 'pi pi-fw pi-th-large', to: '/institution/departments' },
                        { label: 'Programmes', icon: 'pi pi-fw pi-bookmark', to: '/institution/programmes' }
                    ]
                },
                {
                    label: 'Users',
                    icon: 'pi pi-users',
                    items: [
                        { label: 'Students', icon: 'pi pi-fw pi-graduation-cap', to: '/users/students' },
                        { label: 'Lecturers', icon: 'pi pi-fw pi-user', to: '/users/lecturers' }
                    ]
                },
                { separator: true },
                {
                    label: 'Courses',
                    icon: 'pi pi-book',
                    items: [
                        { label: 'Course Catalog', icon: 'pi pi-fw pi-list', to: '/courses/list' },
                        { label: 'Assignments', icon: 'pi pi-fw pi-link', to: '/courses/assignments' }
                    ]
                },
                {
                    label: 'Assessments',
                    icon: 'pi pi-file-edit',
                    items: [
                        { label: 'Assessment Types', icon: 'pi pi-fw pi-sliders-h', to: '/assessments/types' },
                        { label: 'All Assessments', icon: 'pi pi-fw pi-file', to: '/assessments/list' }
                    ]
                },
                {
                    label: 'Results',
                    icon: 'pi pi-chart-bar',
                    items: [
                        { label: 'Score Entry', icon: 'pi pi-fw pi-pencil', to: '/results/upload' },
                        { label: 'View Scores', icon: 'pi pi-fw pi-eye', to: '/results/scores' },
                        { label: 'Grading Scale', icon: 'pi pi-fw pi-percentage', to: '/grading' }
                    ]
                },
                { separator: true },
                {
                    label: 'SMS',
                    icon: 'pi pi-envelope',
                    items: [{ label: 'Bulk SMS', icon: 'pi pi-fw pi-send', to: '/sms' }]
                }
            ];
        }

        // ─── Lecturer menu ───────────────────────────
        if (role === 'lecturer') {
            return [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    items: [{ label: 'My Dashboard', icon: 'pi pi-fw pi-briefcase', to: '/dashboard/lecturer' }]
                },
                { separator: true },
                {
                    label: 'Courses',
                    icon: 'pi pi-book',
                    items: [
                        { label: 'Course Catalog', icon: 'pi pi-fw pi-list', to: '/courses/list' },
                        { label: 'My Assignments', icon: 'pi pi-fw pi-link', to: '/courses/assignments' }
                    ]
                },
                {
                    label: 'Assessments',
                    icon: 'pi pi-file-edit',
                    items: [{ label: 'All Assessments', icon: 'pi pi-fw pi-file', to: '/assessments/list' }]
                },
                {
                    label: 'Results',
                    icon: 'pi pi-chart-bar',
                    items: [
                        { label: 'Score Entry', icon: 'pi pi-fw pi-pencil', to: '/results/upload' },
                        { label: 'View Scores', icon: 'pi pi-fw pi-eye', to: '/results/scores' }
                    ]
                }
            ];
        }

        // ─── Student menu ────────────────────────────
        if (role === 'student') {
            return [
                {
                    label: 'Dashboard',
                    icon: 'pi pi-home',
                    items: [{ label: 'My Dashboard', icon: 'pi pi-fw pi-home', to: '/dashboard/student' }]
                },
                { separator: true },
                {
                    label: 'My Portal',
                    icon: 'pi pi-star',
                    items: [
                        { label: 'My Results', icon: 'pi pi-fw pi-chart-line', to: '/student/results' },
                        { label: 'Transcript', icon: 'pi pi-fw pi-file-pdf', to: '/student/transcript' },
                        { label: 'My Courses', icon: 'pi pi-fw pi-book', to: '/student/courses' },
                        { label: 'My Profile', icon: 'pi pi-fw pi-id-card', to: '/student/profile' }
                    ]
                }
            ];
        }

        // Fallback — no role yet (loading state)
        return [];
    }, [role]);

    return <AppSubMenu model={model} />;
};

export default AppMenu;
