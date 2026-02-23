'use client';
import React from 'react';
import { classNames } from 'primereact/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    iconBg?: string;
    trend?: { value: number; label: string };
    className?: string;
}

const StatCard = ({ title, value, icon, iconBg = 'bg-primary', trend, className }: StatCardProps) => {
    return (
        <div className={classNames('col-12 sm:col-6 lg:col-3', className)}>
            <div className="surface-card shadow-1 border-round p-3">
                <div className="flex align-items-center justify-content-between mb-3">
                    <span className="text-sm font-medium text-color-secondary">{title}</span>
                    <div className={classNames('flex align-items-center justify-content-center border-round', iconBg)} style={{ width: '2.5rem', height: '2.5rem' }}>
                        <i className={classNames(icon, 'text-white text-lg')} />
                    </div>
                </div>
                <div className="text-2xl font-bold text-color mb-1">{value}</div>
                {trend && (
                    <div className="flex align-items-center">
                        <i className={classNames('pi text-sm mr-1', trend.value >= 0 ? 'pi-arrow-up text-green-500' : 'pi-arrow-down text-red-500')} />
                        <span className={classNames('text-sm font-medium', trend.value >= 0 ? 'text-green-500' : 'text-red-500')}>{Math.abs(trend.value)}%</span>
                        <span className="text-sm text-color-secondary ml-1">{trend.label}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;
