'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column, ColumnEditorOptions } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import * as XLSX from 'xlsx';
import GradeBadge from '@/components/GradeBadge';
import { CoursesService } from '@/lib/service/CoursesService';
import { AssessmentsService } from '@/lib/service/AssessmentsService';
import { ResultsService } from '@/lib/service/ResultsService';
import { useAuth } from '@/layout/context/authcontext';
import type { StudentScore, CourseAssignment, Assessment } from '@/types';

const ScoreEntryPage = () => {
    const toast = useRef<Toast>(null);
    const { user } = useAuth();
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    });
    const [globalFilterValue, setGlobalFilterValue] = useState('');

    const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<number | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<number | null>(null);
    const [scores, setScores] = useState<StudentScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Load course assignments for the logged-in lecturer
    useEffect(() => {
        if (!user) return;
        const params = user.role === 'lecturer' ? { lecturerId: Number(user.profileId) } : undefined;
        CoursesService.getAssignments(params)
            .then(setAssignments)
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load course assignments', life: 3000 });
            });
    }, [user]);

    // Load assessments when assignment changes
    useEffect(() => {
        setAssessments([]);
        setSelectedAssessment(null);
        setScores([]);
        if (!selectedAssignment) return;
        AssessmentsService.getAssessments(selectedAssignment)
            .then(setAssessments)
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load assessments', life: 3000 });
            });
    }, [selectedAssignment]);

    // Load students when assessment changes
    useEffect(() => {
        setScores([]);
        if (!selectedAssessment) return;
        setLoading(true);
        ResultsService.getStudentsForAssessment(selectedAssessment)
            .then((rows) => setScores(rows))
            .catch(() => {
                toast.current?.show({ severity: 'error', summary: 'Failed to load students', life: 3000 });
            })
            .finally(() => setLoading(false));
    }, [selectedAssessment]);

    const assignmentOptions = assignments.map((a) => ({
        label: `${a.courseCode} — ${a.courseName} (${a.semesterName}, ${a.yearName})`,
        value: a.id
    }));

    const assessmentOptions = assessments.map((a) => ({
        label: `${a.title} (${a.totalMarks} marks, ${a.weight}%)`,
        value: a.id
    }));

    const selectedAssessmentObj = assessments.find((a) => a.id === selectedAssessment);
    const totalMarks = selectedAssessmentObj?.totalMarks ?? 0;

    const enteredCount = scores.filter((s) => s.marksObtained !== null).length;
    const progress = scores.length > 0 ? Math.round((enteredCount / scores.length) * 100) : 0;

    const onCellEditComplete = (e: any) => {
        const { rowData, newValue, field } = e;
        if (newValue !== null && (newValue < 0 || newValue > totalMarks)) {
            toast.current?.show({ severity: 'error', summary: `Marks must be 0–${totalMarks}`, life: 3000 });
            return;
        }
        const updated = scores.map((s) => {
            if (s.studentIndex === rowData.studentIndex) {
                return { ...s, [field]: newValue };
            }
            return s;
        });
        setScores(updated);
    };

    const marksEditor = (options: ColumnEditorOptions) => {
        return (
            <InputNumber
                value={options.value}
                onValueChange={(e) => options.editorCallback?.(e.value)}
                onBlur={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    options.editorCallback?.(val);
                }}
                min={0}
                max={totalMarks}
                className="w-full"
                inputClassName="w-full text-center"
                placeholder="—"
                autoFocus
            />
        );
    };

    const marksTemplate = (row: StudentScore) => {
        if (row.marksObtained === null) {
            return <span className="text-color-secondary">—</span>;
        }
        const pct = totalMarks > 0 ? (row.marksObtained / totalMarks) * 100 : 0;
        const severity = pct >= 70 ? 'success' : pct >= 50 ? 'info' : pct >= 40 ? 'warning' : 'danger';
        return <Tag value={`${row.marksObtained}/${totalMarks}`} severity={severity} />;
    };

    const gradeTemplate = (row: StudentScore) => {
        if (!row.grade) return <span className="text-color-secondary">—</span>;
        return <GradeBadge grade={row.grade} />;
    };

    const submitScores = () => {
        const toSubmit = scores.filter((s) => s.marksObtained !== null);
        confirmDialog({
            message: `Submit ${toSubmit.length} scores for this assessment? This action cannot be easily undone.`,
            header: 'Confirm Submission',
            icon: 'pi pi-upload',
            acceptClassName: 'p-button-success',
            accept: async () => {
                setSubmitting(true);
                try {
                    const payload = toSubmit.map((s) => ({
                        assessmentId: selectedAssessment!,
                        studentIndex: s.studentIndex,
                        marksObtained: s.marksObtained!,
                        uploadedBy: user?.userId || 0
                    }));
                    const result = await ResultsService.saveBulkScores(payload);
                    toast.current?.show({ severity: 'success', summary: result.message || 'Scores submitted successfully', life: 3000 });
                    // Reload students to get updated grades from server
                    const rows = await ResultsService.getStudentsForAssessment(selectedAssessment!);
                    setScores(rows);
                } catch (err: any) {
                    console.log(err);
                    toast.current?.show({ severity: 'error', summary: err?.message || 'Failed to submit scores', life: 4000 });
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const studentTemplate = (row: StudentScore) => (
        <div>
            <div className="font-medium">
                {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-color-secondary">{row.studentIndex}</div>
        </div>
    );

    const fileUploadRef = useRef<FileUpload>(null);

    /** Download pre-filled Excel template with student list */
    const downloadTemplate = () => {
        const assignmentObj = assignments.find((a) => a.id === selectedAssignment);
        const assessmentObj = assessments.find((a) => a.id === selectedAssessment);
        if (!assignmentObj || !assessmentObj || scores.length === 0) return;

        // Build worksheet data
        const wsData = scores.map((s, idx) => ({
            '#': idx + 1,
            'Student Index': s.studentIndex,
            'First Name': s.firstName,
            'Last Name': s.lastName,
            [`Marks (out of ${assessmentObj.totalMarks})`]: s.marksObtained ?? ''
        }));

        const ws = XLSX.utils.json_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [
            { wch: 5 }, // #
            { wch: 18 }, // Student Index
            { wch: 18 }, // First Name
            { wch: 18 }, // Last Name
            { wch: 22 } // Marks
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scores');

        // Add a metadata sheet so uploads can be validated
        const meta = XLSX.utils.aoa_to_sheet([
            ['Course', `${assignmentObj.courseCode} — ${assignmentObj.courseName}`],
            ['Assessment', assessmentObj.title],
            ['Total Marks', assessmentObj.totalMarks],
            ['Semester', `${assignmentObj.semesterName} (${assignmentObj.yearName})`],
            ['Generated', new Date().toISOString()]
        ]);
        XLSX.utils.book_append_sheet(wb, meta, 'Info');

        const filename = `${assignmentObj.courseCode}_${assessmentObj.title}_scores_template.xlsx`.replace(/\s+/g, '_');
        XLSX.writeFile(wb, filename);
        toast.current?.show({ severity: 'info', summary: 'Template downloaded', detail: `Fill in the Marks column and upload it back.`, life: 4000 });
    };

    /** Handle uploaded Excel file and populate marks */
    const handleFileUpload = (event: FileUploadHandlerEvent) => {
        const file = event.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                if (rows.length === 0) {
                    toast.current?.show({ severity: 'warn', summary: 'Empty file', detail: 'No data rows found in the uploaded file.', life: 3000 });
                    return;
                }

                // Find the marks column — look for a column header containing "marks" (case-insensitive)
                const firstRow = rows[0];
                const marksKey = Object.keys(firstRow).find((k) => k.toLowerCase().includes('marks'));
                const indexKey = Object.keys(firstRow).find((k) => k.toLowerCase().includes('student index') || k.toLowerCase().includes('studentindex') || k.toLowerCase().includes('index'));

                if (!marksKey || !indexKey) {
                    toast.current?.show({ severity: 'error', summary: 'Invalid format', detail: 'Could not find "Student Index" and "Marks" columns. Use the downloaded template.', life: 5000 });
                    return;
                }

                let matchCount = 0;
                let errorCount = 0;
                const updatedScores = [...scores];

                for (const row of rows) {
                    const studentIdx = String(row[indexKey] || '').trim();
                    const rawMarks = row[marksKey];
                    if (!studentIdx || rawMarks === '' || rawMarks === null || rawMarks === undefined) continue;

                    const marks = Number(rawMarks);
                    if (isNaN(marks) || marks < 0 || marks > totalMarks) {
                        errorCount++;
                        continue;
                    }

                    const scoreIdx = updatedScores.findIndex((s) => s.studentIndex === studentIdx);
                    if (scoreIdx >= 0) {
                        updatedScores[scoreIdx] = { ...updatedScores[scoreIdx], marksObtained: marks };
                        matchCount++;
                    }
                }

                setScores(updatedScores);

                if (matchCount > 0) {
                    toast.current?.show({
                        severity: 'success',
                        summary: 'Scores imported',
                        detail: `${matchCount} marks loaded${errorCount > 0 ? `, ${errorCount} rows skipped (invalid marks)` : ''}. Review and click Submit.`,
                        life: 5000
                    });
                } else {
                    toast.current?.show({ severity: 'warn', summary: 'No matches', detail: 'No student indices matched. Ensure the file uses the correct template.', life: 5000 });
                }
            } catch (err) {
                toast.current?.show({ severity: 'error', summary: 'Failed to read file', detail: 'Ensure the file is a valid .xlsx or .xls file.', life: 4000 });
            }
        };
        reader.readAsArrayBuffer(file);

        // Clear the file upload component
        fileUploadRef.current?.clear();
    };

    const header = (
        <div className="flex flex-column gap-2">
            <div className="flex flex-column sm:flex-row justify-content-between gap-2">
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText
                        placeholder="Search students..."
                        value={globalFilterValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setGlobalFilterValue(value);
                            setFilters((prev) => ({ ...prev, global: { value: value || null, matchMode: FilterMatchMode.CONTAINS } }));
                        }}
                    />
                </span>
                <div className="flex gap-2 flex-wrap">
                    <Button label="Template" icon="pi pi-download" className="p-button-outlined p-button-sm" onClick={downloadTemplate} tooltip="Download Excel template pre-filled with student list" tooltipOptions={{ position: 'top' }} />
                    <FileUpload
                        ref={fileUploadRef}
                        mode="basic"
                        accept=".xlsx,.xls,.csv"
                        maxFileSize={5000000}
                        chooseLabel="Upload"
                        chooseOptions={{ icon: 'pi pi-file-excel', className: 'p-button-outlined p-button-help p-button-sm' }}
                        auto
                        customUpload
                        uploadHandler={handleFileUpload}
                    />
                    <Button label="Submit" icon="pi pi-upload" className="p-button-success p-button-sm" onClick={submitScores} disabled={enteredCount === 0 || submitting} loading={submitting} />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <ConfirmDialog />
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <div className="flex flex-column sm:flex-row align-items-start sm:align-items-center justify-content-between mb-3">
                        <div>
                            <h2 className="m-0 text-xl font-bold">Score Entry</h2>
                            <p className="mt-1 mb-0 text-color-secondary text-sm">Select a course and assessment, then click on a cell to enter marks</p>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="surface-card shadow-1 border-round p-3 mb-3">
                        <div className="grid">
                            <div className="col-12 sm:col-6 flex flex-column gap-1">
                                <label className="text-sm font-medium">Course Assignment</label>
                                <Dropdown
                                    value={selectedAssignment}
                                    options={assignmentOptions}
                                    onChange={(e) => {
                                        setSelectedAssignment(e.value);
                                        setSelectedAssessment(null);
                                    }}
                                    placeholder="Select course"
                                    filter
                                    className="w-full"
                                />
                            </div>
                            <div className="col-12 sm:col-6 flex flex-column gap-1">
                                <label className="text-sm font-medium">Assessment</label>
                                <Dropdown value={selectedAssessment} options={assessmentOptions} onChange={(e) => setSelectedAssessment(e.value)} placeholder="Select assessment" className="w-full" disabled={!selectedAssignment} />
                            </div>
                        </div>
                    </div>

                    {selectedAssignment && selectedAssessment && (
                        <>
                            {/* Progress bar */}
                            <div className="surface-card shadow-1 border-round p-3 mb-3">
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="text-sm font-medium">Entry Progress</span>
                                    <span className="text-sm text-color-secondary">
                                        {enteredCount}/{scores.length} students
                                    </span>
                                </div>
                                <ProgressBar value={progress} showValue={false} style={{ height: '8px' }} />
                            </div>

                            {/* Score grid */}
                            <div className="surface-card shadow-1 border-round p-3">
                                <DataTable
                                    value={scores}
                                    filters={filters}
                                    globalFilterFields={['studentIndex', 'firstName', 'lastName']}
                                    header={header}
                                    editMode="cell"
                                    responsiveLayout="scroll"
                                    className="p-datatable-sm"
                                    emptyMessage="No students enrolled."
                                    loading={loading}
                                    paginator
                                    rows={20}
                                    rowsPerPageOptions={[20, 50, 100, scores.length]}
                                    rowClassName={(row) => (row.marksObtained === null ? 'bg-pink-300' : '')}
                                    tableStyle={{ minWidth: '28rem' }}
                                >
                                    <Column field="studentIndex" header="#" sortable style={{ width: '60px' }} body={(_row, opts) => opts.rowIndex + 1} />
                                    <Column header="Student" body={studentTemplate} sortable sortField="lastName" style={{ minWidth: '10rem' }} />
                                    <Column
                                        field="marksObtained"
                                        header={`Marks (/${totalMarks})`}
                                        body={marksTemplate}
                                        editor={marksEditor}
                                        onCellEditComplete={onCellEditComplete}
                                        sortable
                                        style={{ width: '140px', minWidth: '140px' }}
                                        className="text-center"
                                    />
                                    <Column field="grade" header="Grade" body={gradeTemplate} sortable style={{ width: '80px' }} />
                                    <Column field="gradePoint" header="GP" sortable style={{ width: '60px' }} />
                                </DataTable>
                            </div>
                        </>
                    )}

                    {(!selectedAssignment || !selectedAssessment) && (
                        <div className="surface-card shadow-1 border-round p-5 text-center">
                            <i className="pi pi-pencil text-4xl text-color-secondary mb-3" />
                            <p className="text-color-secondary">Select a course assignment and assessment above to begin entering scores</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ScoreEntryPage;
