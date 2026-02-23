'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import GradeBadge from '@/components/GradeBadge';
import { GradingService } from '@/lib/service/GradingService';
import type { GradingScale } from '@/types';

const GradingScalePage = () => {
    const toast = useRef<Toast>(null);
    const [grades, setGrades] = useState<GradingScale[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLoading(true);
        GradingService.getScales()
            .then((rows) => setGrades(rows))
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load grading scales', life: 3000 });
            })
            .finally(() => setLoading(false));
    }, []);

    const onCellEditComplete = (e: any) => {
        const { rowData, newValue, field } = e;
        const updated = grades.map((g) => {
            if (g.id === rowData.id) return { ...g, [field]: newValue };
            return g;
        });
        setGrades(updated);
    };

    const numberEditor = (options: ColumnEditorOptions) => <InputNumber value={options.value} onValueChange={(e) => options.editorCallback?.(e.value)} min={0} max={100} className="w-full" inputClassName="w-full text-center" />;

    const gpEditor = (options: ColumnEditorOptions) => (
        <InputNumber value={options.value} onValueChange={(e) => options.editorCallback?.(e.value)} min={0} max={4} minFractionDigits={1} maxFractionDigits={1} className="w-full" inputClassName="w-full text-center" />
    );

    const textEditor = (options: ColumnEditorOptions) => <InputText value={options.value} onChange={(e) => options.editorCallback?.(e.target.value)} className="w-full" />;

    const save = async () => {
        setSaving(true);
        try {
            const result = await GradingService.saveBulkScales(grades);
            toast.current?.show({ severity: 'success', summary: result.message || 'Grading scale saved', life: 3000 });
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: err?.message || 'Failed to save grading scale', life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const gradeTemplate = (row: GradingScale) => <GradeBadge grade={row.grade} />;

    const rangeTemplate = (row: GradingScale) => (
        <span>
            {row.minScore}% – {row.maxScore}%
        </span>
    );

    const gpTemplate = (row: GradingScale) => {
        const sev = row.gradePoint >= 3.0 ? 'success' : row.gradePoint >= 2.0 ? 'info' : row.gradePoint >= 1.0 ? 'warning' : 'danger';
        return <Tag value={row.gradePoint.toFixed(1)} severity={sev} />;
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between mb-3">
                    <div>
                        <h2 className="m-0 text-xl font-bold">Grading Scale</h2>
                        <p className="mt-1 mb-0 text-color-secondary text-sm">Configure the university grading boundaries. Click on a cell to edit.</p>
                    </div>
                    <Button label="Save Changes" icon="pi pi-save" className="p-button-success mt-2 sm:mt-0" onClick={save} loading={saving} />
                </div>

                <div className="surface-card shadow-1 border-round p-3">
                    <DataTable value={grades} editMode="cell" responsiveLayout="scroll" className="p-datatable-sm" emptyMessage="No grades configured." loading={loading} tableStyle={{ minWidth: '30rem' }}>
                        <Column field="grade" header="Grade" body={gradeTemplate} style={{ width: '80px' }} />
                        <Column header="Score Range" body={rangeTemplate} style={{ minWidth: '8rem' }} className="hidden sm:table-cell" />
                        <Column field="minScore" header="Min %" editor={numberEditor} onCellEditComplete={onCellEditComplete} sortable style={{ width: '100px' }} className="text-center" />
                        <Column field="maxScore" header="Max %" editor={numberEditor} onCellEditComplete={onCellEditComplete} sortable style={{ width: '100px' }} className="text-center" />
                        <Column field="gradePoint" header="Grade Point" body={gpTemplate} editor={gpEditor} onCellEditComplete={onCellEditComplete} style={{ width: '110px' }} className="text-center" />
                        <Column field="description" header="Description" editor={textEditor} onCellEditComplete={onCellEditComplete} style={{ minWidth: '8rem' }} className="hidden md:table-cell" />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default GradingScalePage;
