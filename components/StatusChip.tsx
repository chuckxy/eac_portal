'use client';
import React from 'react';
import { Tag } from 'primereact/tag';

interface StatusChipProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

const StatusChip = ({ active, activeLabel = 'Active', inactiveLabel = 'Inactive' }: StatusChipProps) => {
    return <Tag value={active ? activeLabel : inactiveLabel} severity={active ? 'success' : 'danger'} />;
};

export default StatusChip;
