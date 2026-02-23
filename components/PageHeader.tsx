'use client';
import React from 'react';
import { Button } from 'primereact/button';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    actionIcon?: string;
    onAction?: () => void;
}

const PageHeader = ({ title, subtitle, actionLabel, actionIcon = 'pi pi-plus', onAction }: PageHeaderProps) => {
    return (
        <div className="flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between mb-4 gap-2">
            <div>
                <h2 className="text-xl font-bold text-color m-0">{title}</h2>
                {subtitle && <p className="text-color-secondary text-sm mt-1 mb-0">{subtitle}</p>}
            </div>
            {actionLabel && onAction && <Button label={actionLabel} icon={actionIcon} size="small" onClick={onAction} className="w-auto" />}
        </div>
    );
};

export default PageHeader;
