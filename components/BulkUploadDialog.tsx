'use client';
import React, { useState, useRef, useMemo } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';

export interface BulkUploadColumn {
    field: string;
    header: string;
    required?: boolean;
}

export interface DropdownOption {
    label: string;
    value: number;
}

export interface BulkUploadDropdown {
    key: string;
    label: string;
    placeholder: string;
    options: DropdownOption[];
    filter?: boolean;
}

export interface BulkUploadResultItem {
    row: number;
    success: boolean;
    message: string;
    [key: string]: any;
}

interface BulkUploadDialogProps {
    visible: boolean;
    onHide: () => void;
    title: string;
    columns: BulkUploadColumn[];
    dropdowns: BulkUploadDropdown[];
    templateFileName: string;
    onUpload: (
        records: Record<string, any>[],
        dropdownValues: Record<string, number>
    ) => Promise<{
        message: string;
        successCount: number;
        errorCount: number;
        total: number;
        results: BulkUploadResultItem[];
    }>;
    onComplete: () => void;
}

function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
            row[h.trim()] = (values[idx] || '').trim();
        });
        rows.push(row);
    }
    return rows;
}

function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

type UploadStep = 'upload' | 'preview' | 'uploading' | 'results';

const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({ visible, onHide, title, columns, dropdowns, templateFileName, onUpload, onComplete }) => {
    const fileUploadRef = useRef<FileUpload>(null);
    const [step, setStep] = useState<UploadStep>('upload');
    const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [dropdownValues, setDropdownValues] = useState<Record<string, number>>({});
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadResults, setUploadResults] = useState<BulkUploadResultItem[]>([]);
    const [resultSummary, setResultSummary] = useState<{ successCount: number; errorCount: number; total: number } | null>(null);
    const [uploading, setUploading] = useState(false);

    const reset = () => {
        setStep('upload');
        setParsedRows([]);
        setValidationErrors([]);
        setDropdownValues({});
        setUploadProgress(0);
        setUploadResults([]);
        setResultSummary(null);
        setUploading(false);
        fileUploadRef.current?.clear();
    };

    const handleHide = () => {
        reset();
        onHide();
    };

    const handleFileSelect = (e: FileUploadHandlerEvent) => {
        const file = e.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                setValidationErrors(['Could not read file contents.']);
                return;
            }

            const rows = parseCSV(text);
            if (rows.length === 0) {
                setValidationErrors(['No data rows found in the file. Make sure the file has a header row and at least one data row.']);
                return;
            }

            // Validate columns exist
            const fileHeaders = Object.keys(rows[0]);
            const requiredColumns = columns.filter((c) => c.required).map((c) => c.field);
            const missingColumns = requiredColumns.filter((rc) => !fileHeaders.includes(rc));

            if (missingColumns.length > 0) {
                setValidationErrors([`Missing required columns: ${missingColumns.join(', ')}. Expected columns: ${columns.map((c) => c.field).join(', ')}`]);
                return;
            }

            // Validate each row for required fields
            const errors: string[] = [];
            rows.forEach((row, idx) => {
                requiredColumns.forEach((col) => {
                    if (!row[col] || String(row[col]).trim() === '') {
                        errors.push(`Row ${idx + 1}: Missing required field "${col}"`);
                    }
                });
            });

            if (errors.length > 10) {
                setValidationErrors([...errors.slice(0, 10), `...and ${errors.length - 10} more errors`]);
            } else {
                setValidationErrors(errors);
            }

            setParsedRows(rows);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    const generateTemplate = () => {
        const headers = columns.map((c) => c.field).join(',');
        const blob = new Blob([headers + '\n'], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = templateFileName;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const allDropdownsSelected = useMemo(() => {
        return dropdowns.every((dd) => dropdownValues[dd.key] != null);
    }, [dropdowns, dropdownValues]);

    const canUpload = parsedRows.length > 0 && validationErrors.length === 0 && allDropdownsSelected;

    const handleUpload = async () => {
        if (!canUpload) return;
        setStep('uploading');
        setUploading(true);
        setUploadProgress(10);

        try {
            setUploadProgress(30);
            const result = await onUpload(parsedRows, dropdownValues);
            setUploadProgress(100);
            setUploadResults(result.results);
            setResultSummary({ successCount: result.successCount, errorCount: result.errorCount, total: result.total });
            setStep('results');
        } catch (err: any) {
            setValidationErrors([err.response?.data?.message || err.message || 'Upload failed.']);
            setStep('preview');
        } finally {
            setUploading(false);
        }
    };

    const handleDone = () => {
        if (resultSummary && resultSummary.successCount > 0) {
            onComplete();
        }
        handleHide();
    };

    const failedResults = uploadResults.filter((r) => !r.success);

    const renderUploadStep = () => (
        <div className="flex flex-column gap-3">
            {/* Dropdown selectors */}
            {dropdowns.length > 0 && (
                <div className="grid">
                    {dropdowns.map((dd) => (
                        <div key={dd.key} className={`col-12 ${dropdowns.length > 1 ? 'sm:col-6' : ''} flex flex-column gap-1`}>
                            <label className="text-sm font-medium">
                                {dd.label} <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={dropdownValues[dd.key] ?? null}
                                options={dd.options}
                                onChange={(e) => setDropdownValues((prev) => ({ ...prev, [dd.key]: e.value }))}
                                placeholder={dd.placeholder}
                                filter={dd.filter ?? false}
                                className="w-full"
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-column gap-2">
                <div className="flex align-items-center justify-content-between">
                    <label className="text-sm font-medium">Upload CSV File</label>
                    <Button label="Download Template" icon="pi pi-download" className="p-button-text p-button-sm" onClick={generateTemplate} />
                </div>
                <FileUpload
                    ref={fileUploadRef}
                    mode="advanced"
                    accept=".csv"
                    maxFileSize={5000000}
                    customUpload
                    uploadHandler={handleFileSelect}
                    auto={false}
                    chooseLabel="Choose CSV"
                    uploadLabel="Parse File"
                    cancelLabel="Clear"
                    emptyTemplate={
                        <div className="flex align-items-center flex-column py-3">
                            <i className="pi pi-file text-4xl text-color-secondary mb-2" />
                            <p className="text-color-secondary text-sm m-0">Drag and drop a CSV file here or click to browse.</p>
                        </div>
                    }
                />
            </div>

            <Message
                severity="info"
                text={`Required columns: ${columns
                    .filter((c) => c.required)
                    .map((c) => c.field)
                    .join(', ')}. Optional: ${
                    columns
                        .filter((c) => !c.required)
                        .map((c) => c.field)
                        .join(', ') || 'none'
                }.`}
            />
        </div>
    );

    const renderPreviewStep = () => (
        <div className="flex flex-column gap-3">
            {/* Summary dropdown values */}
            <div className="flex flex-wrap gap-2">
                {dropdowns.map((dd) => {
                    const opt = dd.options.find((o) => o.value === dropdownValues[dd.key]);
                    return opt ? <Tag key={dd.key} value={`${dd.label}: ${opt.label}`} severity="info" /> : null;
                })}
                <Tag value={`${parsedRows.length} record(s)`} severity="success" />
            </div>

            {validationErrors.length > 0 && (
                <div className="flex flex-column gap-1">
                    {validationErrors.map((err, idx) => (
                        <Message key={idx} severity="error" text={err} className="w-full" />
                    ))}
                </div>
            )}

            <DataTable value={parsedRows.slice(0, 50)} paginator={parsedRows.length > 10} rows={10} scrollable scrollHeight="300px" className="p-datatable-sm" size="small" emptyMessage="No records" tableStyle={{ minWidth: '30rem' }}>
                <Column header="#" body={(_, opts) => opts.rowIndex + 1} style={{ width: '50px' }} />
                {columns.map((col) => (
                    <Column key={col.field} field={col.field} header={col.header} style={{ minWidth: '8rem' }} />
                ))}
            </DataTable>
            {parsedRows.length > 50 && <Message severity="warn" text={`Showing first 50 of ${parsedRows.length} records in preview.`} />}

            <div className="flex justify-content-between gap-2 pt-2">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="p-button-text"
                    onClick={() => {
                        setStep('upload');
                        setParsedRows([]);
                        setValidationErrors([]);
                        fileUploadRef.current?.clear();
                    }}
                />
                <Button label={`Upload ${parsedRows.length} Record(s)`} icon="pi pi-upload" onClick={handleUpload} disabled={!canUpload} />
            </div>
        </div>
    );

    const renderUploadingStep = () => (
        <div className="flex flex-column align-items-center gap-3 py-5">
            <i className="pi pi-spin pi-spinner text-5xl text-primary" />
            <p className="text-lg font-medium m-0">Uploading {parsedRows.length} records...</p>
            <ProgressBar value={uploadProgress} className="w-full" style={{ height: '8px' }} />
            <p className="text-sm text-color-secondary m-0">Please do not close this dialog.</p>
        </div>
    );

    const renderResultsStep = () => (
        <div className="flex flex-column gap-3">
            {resultSummary && (
                <div className="grid">
                    <div className="col-4">
                        <div className="surface-100 border-round p-3 text-center">
                            <div className="text-2xl font-bold text-primary">{resultSummary.total}</div>
                            <div className="text-sm text-color-secondary">Total</div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="surface-100 border-round p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{resultSummary.successCount}</div>
                            <div className="text-sm text-color-secondary">Success</div>
                        </div>
                    </div>
                    <div className="col-4">
                        <div className="surface-100 border-round p-3 text-center">
                            <div className="text-2xl font-bold text-red-600">{resultSummary.errorCount}</div>
                            <div className="text-sm text-color-secondary">Failed</div>
                        </div>
                    </div>
                </div>
            )}

            {failedResults.length > 0 && (
                <>
                    <p className="font-medium text-sm m-0 text-red-600">Failed Records ({failedResults.length}):</p>
                    <DataTable value={failedResults} scrollable scrollHeight="200px" className="p-datatable-sm" size="small">
                        <Column field="row" header="Row" style={{ width: '60px' }} />
                        <Column header="Identifier" body={(row) => row.studentIndex || row.staffId || row.courseCode || ''} style={{ minWidth: '8rem' }} />
                        <Column field="message" header="Error" style={{ minWidth: '12rem' }} />
                    </DataTable>
                </>
            )}

            {resultSummary && resultSummary.errorCount === 0 && <Message severity="success" text="All records uploaded successfully!" className="w-full" />}

            <div className="flex justify-content-end pt-2">
                <Button label="Done" icon="pi pi-check" onClick={handleDone} />
            </div>
        </div>
    );

    return (
        <Dialog visible={visible} onHide={handleHide} header={title} modal className="w-full sm:w-40rem md:w-50rem" breakpoints={{ '640px': '95vw' }} closable={!uploading} closeOnEscape={!uploading}>
            {step === 'upload' && renderUploadStep()}
            {step === 'preview' && renderPreviewStep()}
            {step === 'uploading' && renderUploadingStep()}
            {step === 'results' && renderResultsStep()}
        </Dialog>
    );
};

export default BulkUploadDialog;
