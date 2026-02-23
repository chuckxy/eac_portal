'use client';
import React from 'react';
import { Tag } from 'primereact/tag';

interface GradeBadgeProps {
    grade: string | null | undefined;
    size?: 'normal' | 'large';
}

const gradeColors: Record<string, 'success' | 'info' | 'warning' | 'danger' | undefined> = {
    A: 'success',
    'B+': 'success',
    B: 'info',
    'C+': 'info',
    C: undefined,
    'D+': 'warning',
    D: 'warning',
    E: 'danger',
    F: 'danger'
};

const GradeBadge = ({ grade, size = 'normal' }: GradeBadgeProps) => {
    if (!grade) return <span className="text-color-secondary">—</span>;

    const severity = gradeColors[grade] ?? undefined;
    const style = size === 'large' ? { fontSize: '1.1rem', padding: '0.4rem 0.8rem' } : {};

    return <Tag value={grade} severity={severity} style={style} />;
};

export default GradeBadge;
