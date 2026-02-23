'use client';
import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    message?: string;
}

const EmptyState = ({ icon = 'pi pi-inbox', title, message }: EmptyStateProps) => {
    return (
        <div className="flex flex-column align-items-center justify-content-center py-6">
            <i className={`${icon} text-4xl text-color-secondary mb-3`} />
            <span className="text-lg font-medium text-color-secondary">{title}</span>
            {message && <span className="text-sm text-color-secondary mt-1">{message}</span>}
        </div>
    );
};

export default EmptyState;
