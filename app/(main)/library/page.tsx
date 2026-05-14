'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import { ProgressBar } from 'primereact/progressbar';
import { Paginator } from 'primereact/paginator';
import { Calendar } from 'primereact/calendar';
import { SelectButton } from 'primereact/selectbutton';
import { Checkbox } from 'primereact/checkbox';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { LibraryService, Ebook, LibraryCategory, ExternalEbook, BookProvider, SearchBy } from '@/lib/service/LibraryService';
import { useAuth } from '@/layout/context/authcontext';

const sourceOptions = [
    { label: 'All sources', value: '' },
    { label: 'Uploaded', value: 'upload' },
    { label: 'Google Books', value: 'googlebooks' },
    { label: 'Open Library', value: 'openlibrary' },
    { label: 'DBooks', value: 'dbooks' },
    { label: 'Internet Archive', value: 'archive' },
    { label: 'Library of Congress', value: 'libraryofcongress' }
];

const providerOptions: { label: string; value: BookProvider; icon: string }[] = [
    { label: 'Google Books', value: 'googleBooks', icon: 'pi pi-google' },
    { label: 'Open Library', value: 'openLibrary', icon: 'pi pi-book' },
    { label: 'DBooks', value: 'dBooks', icon: 'pi pi-file-pdf' },
    { label: 'Internet Archive', value: 'internetArchive', icon: 'pi pi-server' },
    { label: 'Library of Congress', value: 'libraryOfCongress', icon: 'pi pi-building' }
];

const searchByOptions: { label: string; value: SearchBy | '' }[] = [
    { label: 'Any', value: '' },
    { label: 'Title', value: 'title' },
    { label: 'Author', value: 'author' },
    { label: 'ISBN', value: 'isbn' },
    { label: 'Subject', value: 'subject' },
    { label: 'Publisher', value: 'publisher' }
];

const googleFilterOptions = [
    { label: 'Any', value: null },
    { label: 'Free e-books', value: 'free-ebooks' },
    { label: 'Paid e-books', value: 'paid-ebooks' },
    { label: 'All e-books', value: 'ebooks' },
    { label: 'Full preview', value: 'full' },
    { label: 'Partial preview', value: 'partial' }
];

const archiveMediaOptions = [
    { label: 'Texts', value: 'texts' },
    { label: 'Audio', value: 'audio' },
    { label: 'Video', value: 'movies' }
];

const sourceTagSeverity = (s: string): 'success' | 'info' | 'warning' | 'danger' | undefined => {
    switch (s) {
        case 'upload':
            return 'success';
        case 'openlibrary':
            return 'info';
        case 'googlebooks':
            return 'info';
        case 'dbooks':
            return 'warning';
        case 'archive':
            return 'warning';
        case 'libraryofcongress':
            return 'danger';
        default:
            return undefined;
    }
};

const providerLabel = (s: string) => sourceOptions.find((o) => o.value === s)?.label || s;

// Convert File to base64 data URI
const fileToDataUri = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const LibraryPage = () => {
    const toast = useRef<Toast>(null);
    const { user } = useAuth();
    const isStudent = user?.role === 'student';
    const canManage = user?.role === 'admin' || user?.role === 'lecturer';

    // Browse state
    const [ebooks, setEbooks] = useState<Ebook[]>([]);
    const [categories, setCategories] = useState<LibraryCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [globalFilter, setGlobalFilter] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | null>(null);
    const [filterSource, setFilterSource] = useState<string>('');

    // Upload dialog state
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [editing, setEditing] = useState<Ebook | null>(null);
    const [form, setForm] = useState<any>({
        title: '',
        authors: '',
        description: '',
        isbn: '',
        publisher: '',
        publishedYear: null,
        language: '',
        pageCount: null,
        categoryId: null,
        tags: '',
        fileData: '',
        fileName: '',
        coverData: '',
        coverUrl: ''
    });

    // External tab state
    const [externalProvider, setExternalProvider] = useState<BookProvider>('googleBooks');
    const [externalQuery, setExternalQuery] = useState('');
    const [externalSearchBy, setExternalSearchBy] = useState<SearchBy | ''>('');
    const [externalFilterValue, setExternalFilterValue] = useState('');
    const [googleFilter, setGoogleFilter] = useState<string | null>(null);
    const [archiveMediaType, setArchiveMediaType] = useState<string>('texts');
    const [archiveDateRange, setArchiveDateRange] = useState<(Date | null)[] | null>(null);
    const [allowDownloadOnly, setAllowDownloadOnly] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [externalResults, setExternalResults] = useState<ExternalEbook[]>([]);
    const [externalTotal, setExternalTotal] = useState(0);
    const [externalStart, setExternalStart] = useState(0);
    const [externalLoading, setExternalLoading] = useState(false);
    const [importingId, setImportingId] = useState<string | null>(null);

    const PAGE_SIZE = 20;

    // Detail dialog
    const [detail, setDetail] = useState<Ebook | null>(null);

    // ─── Data loading ────────────────────────────────────
    const loadCategories = async () => {
        try {
            setCategories(await LibraryService.getCategories());
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
        }
    };

    const loadEbooks = async () => {
        try {
            setLoading(true);
            const data = await LibraryService.getEbooks({
                q: globalFilter || undefined,
                category: filterCategory ?? undefined,
                source: filterSource || undefined
            });
            setEbooks(data);
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
        loadEbooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const id = setTimeout(loadEbooks, 250);
        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalFilter, filterCategory, filterSource]);

    // ─── Upload / edit ───────────────────────────────────
    const openUpload = (ebook?: Ebook) => {
        setEditing(ebook ?? null);
        setForm(
            ebook
                ? {
                      ...ebook,
                      fileData: '',
                      fileName: '',
                      coverData: ''
                  }
                : {
                      title: '',
                      authors: '',
                      description: '',
                      isbn: '',
                      publisher: '',
                      publishedYear: null,
                      language: '',
                      pageCount: null,
                      categoryId: null,
                      tags: '',
                      fileData: '',
                      fileName: '',
                      coverData: '',
                      coverUrl: ''
                  }
        );
        setUploadProgress(0);
        setShowUpload(true);
    };

    const onSelectFile = async (e: FileUploadHandlerEvent) => {
        const file = e.files?.[0];
        if (!file) return;
        const dataUri = await fileToDataUri(file);
        setForm((f: any) => ({ ...f, fileData: dataUri, fileName: file.name }));
    };

    const onSelectCover = async (e: FileUploadHandlerEvent) => {
        const file = e.files?.[0];
        if (!file) return;
        const dataUri = await fileToDataUri(file);
        setForm((f: any) => ({ ...f, coverData: dataUri }));
    };

    const submit = async () => {
        if (!form.title?.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Title required' });
            return;
        }
        try {
            setUploading(true);
            setUploadProgress(20);

            if (editing) {
                // Metadata-only update for existing ebook
                const payload: any = { ...form, id: editing.id };
                delete payload.fileData;
                delete payload.fileName;
                delete payload.coverData;
                const res = await LibraryService.saveEbook(payload);
                setUploadProgress(100);
                toast.current?.show({ severity: 'success', summary: 'Saved', detail: res.message });
            } else {
                if (!form.fileData) {
                    toast.current?.show({ severity: 'warn', summary: 'File required', detail: 'Choose an ebook file (pdf/epub).' });
                    setUploading(false);
                    return;
                }
                setUploadProgress(40);
                const res = await LibraryService.upload(form);
                setUploadProgress(100);
                toast.current?.show({ severity: 'success', summary: 'Uploaded', detail: res.message });
            }

            setShowUpload(false);
            await loadEbooks();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    // ─── Delete ──────────────────────────────────────────
    const confirmDelete = (row: Ebook) => {
        confirmDialog({
            message: `Delete ${row.title}? This will also remove the file from Cloudinary.`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const res = await LibraryService.deleteEbook(row.id);
                    toast.current?.show({ severity: 'info', summary: 'Deleted', detail: res.message });
                    await loadEbooks();
                } catch (err: any) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: err?.response?.data?.message || err.message });
                }
            }
        });
    };

    // ─── External search/import ─────────────────────────
    const runExternalSearch = async (startIndex = 0) => {
        const hasQuery = (externalSearchBy && externalFilterValue.trim()) || externalQuery.trim();
        if (!hasQuery) {
            toast.current?.show({ severity: 'warn', summary: 'Empty search', detail: 'Enter a search term.' });
            return;
        }
        try {
            setExternalLoading(true);
            const dateRange =
                archiveDateRange && archiveDateRange[0] && archiveDateRange[1]
                    ? ([archiveDateRange[0], archiveDateRange[1]] as [Date, Date])
                    : undefined;
            const res = await LibraryService.searchExternal(externalProvider, {
                query: externalQuery,
                searchBy: externalSearchBy || undefined,
                filterValue: externalFilterValue || undefined,
                startIndex,
                maxResults: PAGE_SIZE,
                googleFilter: externalProvider === 'googleBooks' ? googleFilter : null,
                mediaType: externalProvider === 'internetArchive' ? archiveMediaType : undefined,
                dateRange: externalProvider === 'internetArchive' ? dateRange : undefined,
                allowDownload: allowDownloadOnly
            });
            const items = allowDownloadOnly ? res.items.filter((i) => !!i.fileUrl) : res.items;
            setExternalResults(items);
            setExternalTotal(res.total);
            setExternalStart(startIndex);
            if (res.items.length === 0) {
                toast.current?.show({ severity: 'info', summary: 'No results', detail: 'Try a different query or provider.' });
            }
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Search failed', detail: err?.response?.data?.message || err.message });
        } finally {
            setExternalLoading(false);
        }
    };

    const onExternalPage = (e: { first: number }) => {
        runExternalSearch(e.first);
    };

    const importExternal = async (item: ExternalEbook) => {
        try {
            setImportingId(item.externalId);
            const res = await LibraryService.importExternal(item);
            toast.current?.show({ severity: 'success', summary: 'Imported', detail: res.message });
            await loadEbooks();
        } catch (err: any) {
            toast.current?.show({ severity: 'error', summary: 'Import failed', detail: err?.response?.data?.message || err.message });
        } finally {
            setImportingId(null);
        }
    };

    // ─── Templates ──────────────────────────────────────
    const titleBody = (row: Ebook) => (
        <div className="flex align-items-center gap-2">
            {row.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.coverUrl} alt="" style={{ width: 36, height: 48, objectFit: 'cover', borderRadius: 4 }} />
            ) : (
                <div className="bg-primary-100 text-primary-700 border-round flex align-items-center justify-content-center" style={{ width: 36, height: 48 }}>
                    <i className="pi pi-book" />
                </div>
            )}
            <div className="flex flex-column">
                <span className="font-medium">{row.title}</span>
                {row.authors && <span className="text-color-secondary text-xs">{row.authors}</span>}
            </div>
        </div>
    );

    const sourceBody = (row: Ebook) => <Tag value={row.source} severity={sourceTagSeverity(row.source) as any} />;

    const actionBody = (row: Ebook) => (
        <div className="flex gap-1">
            <Button icon="pi pi-eye" className="p-button-text p-button-sm" tooltip="Details" tooltipOptions={{ position: 'top' }} onClick={() => setDetail(row)} />
            {(row.fileUrl || row.externalUrl) && (
                <Button
                    icon="pi pi-external-link"
                    className="p-button-text p-button-sm"
                    tooltip={isStudent ? 'Read' : 'Open'}
                    tooltipOptions={{ position: 'top' }}
                    onClick={() => {
                        LibraryService.incrementDownload(row.id).catch(() => {});
                        window.open(row.fileUrl || row.externalUrl, '_blank', 'noopener');
                    }}
                />
            )}
            {canManage && <Button icon="pi pi-pencil" className="p-button-text p-button-sm" tooltip="Edit" tooltipOptions={{ position: 'top' }} onClick={() => openUpload(row)} />}
            {canManage && <Button icon="pi pi-trash" className="p-button-text p-button-danger p-button-sm" tooltip="Delete" tooltipOptions={{ position: 'top' }} onClick={() => confirmDelete(row)} />}
        </div>
    );

    const browseHeader = (
        <div className="flex flex-column md:flex-row gap-2 md:align-items-center md:justify-content-between">
            <span className="p-input-icon-left w-full md:w-20rem">
                <i className="pi pi-search" />
                <InputText placeholder="Search title, author, ISBN…" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="w-full" />
            </span>
            <div className="flex gap-2 flex-column sm:flex-row">
                <Dropdown
                    value={filterCategory}
                    options={[{ label: 'All categories', value: null }, ...categories.map((c) => ({ label: c.categoryName, value: c.id }))]}
                    onChange={(e) => setFilterCategory(e.value)}
                    placeholder="Category"
                    className="w-full sm:w-12rem"
                />
                <Dropdown value={filterSource} options={sourceOptions} onChange={(e) => setFilterSource(e.value)} className="w-full sm:w-12rem" />
            </div>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader
                    title="E-Library"
                    subtitle={isStudent ? 'Browse uploaded ebooks and search the web for more' : 'Browse, upload and import ebooks (Cloudinary + Open Library / archive.org)'}
                    actionLabel={canManage ? 'Upload Ebook' : undefined}
                    actionIcon={canManage ? 'pi pi-upload' : undefined}
                    onAction={canManage ? () => openUpload() : undefined}
                />

                <div className="surface-card shadow-1 border-round p-3">
                    <TabView>
                        <TabPanel header="Browse" leftIcon="pi pi-list mr-2">
                            {/* Mobile card view */}
                            <div className="block md:hidden">
                                <div className="mb-3">{browseHeader}</div>
                                {loading && <ProgressBar mode="indeterminate" style={{ height: 4 }} />}
                                {!loading && ebooks.length === 0 && (
                                    <EmptyState icon="pi pi-book" title="No ebooks yet" message={canManage ? 'Upload one or import from an external source.' : 'Check back later or use Search & Read to find books online.'} />
                                )}
                                <div className="grid">
                                    {ebooks.map((row) => (
                                        <div key={row.id} className="col-12 sm:col-6">
                                            <div className="surface-card border-1 surface-border border-round p-3 h-full flex gap-3">
                                                {row.coverUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={row.coverUrl}
                                                        alt=""
                                                        style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 4 }}
                                                        onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                                                    />
                                                ) : (
                                                    <div className="bg-primary-100 text-primary-700 border-round flex align-items-center justify-content-center" style={{ width: 56, height: 80 }}>
                                                        <i className="pi pi-book text-xl" />
                                                    </div>
                                                )}
                                                <div className="flex flex-column flex-1 gap-1">
                                                    <div className="font-medium text-sm line-height-3" title={row.title}>{row.title}</div>
                                                    {row.authors && <div className="text-color-secondary text-xs">{row.authors}</div>}
                                                    <div className="flex gap-1 flex-wrap mt-1">
                                                        <Tag value={providerLabel(row.source)} severity={sourceTagSeverity(row.source) as any} />
                                                        {row.publishedYear && <Tag value={String(row.publishedYear)} />}
                                                    </div>
                                                    <div className="flex gap-2 mt-2">
                                                        <Button label="Details" icon="pi pi-eye" size="small" outlined onClick={() => setDetail(row)} />
                                                        {(row.fileUrl || row.externalUrl) && (
                                                            <Button
                                                                label={isStudent ? 'Read' : 'Open'}
                                                                icon="pi pi-external-link"
                                                                size="small"
                                                                onClick={() => {
                                                                    LibraryService.incrementDownload(row.id).catch(() => {});
                                                                    window.open(row.fileUrl || row.externalUrl, '_blank', 'noopener');
                                                                }}
                                                            />
                                                        )}
                                                        {canManage && (
                                                            <Button icon="pi pi-trash" size="small" severity="danger" text onClick={() => confirmDelete(row)} aria-label="Delete" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Desktop table view */}
                            <div className="hidden md:block">
                                <DataTable
                                    value={ebooks}
                                    loading={loading}
                                    header={browseHeader}
                                    paginator
                                    rows={20}
                                    rowsPerPageOptions={[20, 50, 100]}
                                    responsiveLayout="scroll"
                                    className="p-datatable-sm"
                                    emptyMessage={<EmptyState icon="pi pi-book" title="No ebooks yet" message={canManage ? 'Upload one or import from an external source.' : 'Check back later or use Search & Read to find books online.'} />}
                                    tableStyle={{ minWidth: '40rem' }}
                                >
                                    <Column header="Title" body={titleBody} sortable sortField="title" style={{ minWidth: '18rem' }} />
                                    <Column field="categoryName" header="Category" sortable style={{ minWidth: '10rem' }} />
                                    <Column header="Source" body={sourceBody} sortable sortField="source" style={{ width: '8rem' }} />
                                    <Column field="publishedYear" header="Year" sortable style={{ width: '6rem' }} />
                                    <Column field="downloadCount" header="Reads" sortable style={{ width: '6rem' }} />
                                    <Column header="Actions" body={actionBody} style={{ width: '12rem' }} className="white-space-nowrap" />
                                </DataTable>
                            </div>
                        </TabPanel>

                        <TabPanel header={isStudent ? 'Search & Read' : 'Import from external sources'} leftIcon="pi pi-cloud-download mr-2">
                            {/* Provider selector */}
                            <div className="mb-3">
                                <SelectButton
                                    value={externalProvider}
                                    options={providerOptions}
                                    optionLabel="label"
                                    optionValue="value"
                                    onChange={(e) => e.value && setExternalProvider(e.value)}
                                    itemTemplate={(opt) => (
                                        <span className="flex align-items-center gap-2">
                                            <i className={opt.icon} />
                                            <span className="hidden sm:inline">{opt.label}</span>
                                        </span>
                                    )}
                                />
                                <div className="sm:hidden mt-2 text-sm text-color-secondary">
                                    Provider: <span className="font-medium text-color">{providerOptions.find((p) => p.value === externalProvider)?.label}</span>
                                </div>
                            </div>

                            {/* Search row */}
                            <div className="flex flex-row gap-2 mb-2">
                                <span className="p-input-icon-left flex-1">
                                    <i className="pi pi-search" />
                                    <InputText
                                        placeholder="Search e.g. 'introduction to algorithms'"
                                        value={externalQuery}
                                        onChange={(e) => setExternalQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && runExternalSearch(0)}
                                        className="w-full"
                                    />
                                </span>
                                <Button icon="pi pi-search" aria-label="Search" className="sm:hidden" onClick={() => runExternalSearch(0)} loading={externalLoading} />
                                <Button label="Search" icon="pi pi-search" className="hidden sm:inline-flex" onClick={() => runExternalSearch(0)} loading={externalLoading} />
                                <Button
                                    icon="pi pi-sliders-h"
                                    label={showAdvanced ? 'Hide filters' : 'Filters'}
                                    outlined
                                    className="hidden sm:inline-flex"
                                    onClick={() => setShowAdvanced((v) => !v)}
                                />
                                <Button
                                    icon="pi pi-sliders-h"
                                    aria-label="Filters"
                                    outlined
                                    className="sm:hidden"
                                    onClick={() => setShowAdvanced((v) => !v)}
                                />
                            </div>

                            {/* Advanced filters */}
                            {showAdvanced && (
                                <div className="surface-100 border-round p-3 mb-3">
                                    <div className="grid formgrid">
                                        <div className="field col-12 md:col-4">
                                            <label className="text-sm font-medium block mb-1">Search by</label>
                                            <Dropdown
                                                value={externalSearchBy}
                                                options={searchByOptions}
                                                onChange={(e) => setExternalSearchBy(e.value)}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="field col-12 md:col-8">
                                            <label className="text-sm font-medium block mb-1">Filter value</label>
                                            <InputText
                                                value={externalFilterValue}
                                                onChange={(e) => setExternalFilterValue(e.target.value)}
                                                placeholder="Used when 'Search by' is set"
                                                className="w-full"
                                                disabled={!externalSearchBy}
                                            />
                                        </div>

                                        {externalProvider === 'googleBooks' && (
                                            <div className="field col-12 md:col-6">
                                                <label className="text-sm font-medium block mb-1">Google filter</label>
                                                <Dropdown value={googleFilter} options={googleFilterOptions} onChange={(e) => setGoogleFilter(e.value)} className="w-full" />
                                            </div>
                                        )}

                                        {externalProvider === 'internetArchive' && (
                                            <>
                                                <div className="field col-12 md:col-6">
                                                    <label className="text-sm font-medium block mb-1">Media type</label>
                                                    <Dropdown value={archiveMediaType} options={archiveMediaOptions} onChange={(e) => setArchiveMediaType(e.value)} className="w-full" />
                                                </div>
                                                <div className="field col-12 md:col-6">
                                                    <label className="text-sm font-medium block mb-1">Date range</label>
                                                    <Calendar
                                                        value={archiveDateRange as any}
                                                        onChange={(e) => setArchiveDateRange(e.value as any)}
                                                        selectionMode="range"
                                                        readOnlyInput
                                                        showIcon
                                                        dateFormat="yy-mm-dd"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="field col-12 flex align-items-center gap-2">
                                            <Checkbox inputId="dl" checked={allowDownloadOnly} onChange={(e) => setAllowDownloadOnly(!!e.checked)} />
                                            <label htmlFor="dl" className="text-sm cursor-pointer">
                                                Only show items with download / read links
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {externalLoading && <ProgressBar mode="indeterminate" style={{ height: 4 }} />}

                            {externalResults.length === 0 && !externalLoading && (
                                <EmptyState icon="pi pi-cloud" title="No results" message="Search Google Books, Open Library, DBooks, archive.org or Library of Congress and import results." />
                            )}

                            <div className="grid">
                                {externalResults.map((item) => (
                                    <div key={`${item.source}-${item.externalId}`} className="col-12 md:col-6 lg:col-4">
                                        <div className="surface-card border-1 surface-border border-round p-3 h-full flex gap-3">
                                            {item.coverUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.coverUrl}
                                                    alt=""
                                                    style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: 4 }}
                                                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
                                                />
                                            ) : (
                                                <div className="bg-primary-100 text-primary-700 border-round flex align-items-center justify-content-center" style={{ width: 64, height: 90 }}>
                                                    <i className="pi pi-book text-2xl" />
                                                </div>
                                            )}
                                            <div className="flex flex-column flex-1 gap-1">
                                                <div className="font-medium" title={item.title}>
                                                    {item.title}
                                                </div>
                                                <div className="text-color-secondary text-xs">{item.authors}</div>
                                                <div className="text-color-secondary text-xs">
                                                    {item.publishedYear ? `${item.publishedYear} · ` : ''}
                                                    {item.publisher || ''}
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    <Tag value={providerLabel(item.source)} severity={sourceTagSeverity(item.source)} />
                                                    {item.fileUrl && <Tag value={item.fileFormat || 'read'} severity="success" icon="pi pi-arrow-up-right" />}
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    {!isStudent && (
                                                        <Button label="Import" icon="pi pi-download" size="small" loading={importingId === item.externalId} onClick={() => importExternal(item)} />
                                                    )}
                                                    <Button
                                                        label={item.fileUrl ? 'Read' : 'View'}
                                                        icon="pi pi-external-link"
                                                        size="small"
                                                        outlined={!isStudent}
                                                        onClick={() => window.open(item.fileUrl || item.externalUrl, '_blank', 'noopener')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {externalTotal > PAGE_SIZE && (
                                <Paginator
                                    first={externalStart}
                                    rows={PAGE_SIZE}
                                    totalRecords={externalTotal}
                                    onPageChange={onExternalPage}
                                    template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                                    currentPageReportTemplate={`{first}-{last} of ${externalTotal}`}
                                />
                            )}
                        </TabPanel>
                    </TabView>
                </div>
            </div>

            {/* Upload / edit dialog */}
            <Dialog
                visible={showUpload}
                onHide={() => !uploading && setShowUpload(false)}
                header={editing ? `Edit: ${editing.title}` : 'Upload Ebook'}
                modal
                className="w-full sm:w-40rem"
                breakpoints={{ '640px': '95vw' }}
            >
                <div className="flex flex-column gap-3 pt-2">
                    <div className="grid formgrid">
                        <div className="field col-12">
                            <label className="text-sm font-medium">Title *</label>
                            <InputText value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="text-sm font-medium">Authors</label>
                            <InputText value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} placeholder="Comma separated" className="w-full" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="text-sm font-medium">Category</label>
                            <Dropdown
                                value={form.categoryId}
                                options={categories.map((c) => ({ label: c.categoryName, value: c.id }))}
                                onChange={(e) => setForm({ ...form, categoryId: e.value })}
                                placeholder="Select"
                                className="w-full"
                                showClear
                            />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm font-medium">ISBN</label>
                            <InputText value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="w-full" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm font-medium">Year</label>
                            <InputNumber value={form.publishedYear} onValueChange={(e) => setForm({ ...form, publishedYear: e.value })} useGrouping={false} className="w-full" />
                        </div>
                        <div className="field col-12 md:col-4">
                            <label className="text-sm font-medium">Pages</label>
                            <InputNumber value={form.pageCount} onValueChange={(e) => setForm({ ...form, pageCount: e.value })} className="w-full" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="text-sm font-medium">Publisher</label>
                            <InputText value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className="w-full" />
                        </div>
                        <div className="field col-12 md:col-6">
                            <label className="text-sm font-medium">Language</label>
                            <InputText value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} placeholder="en, fr…" className="w-full" />
                        </div>
                        <div className="field col-12">
                            <label className="text-sm font-medium">Tags</label>
                            <InputText value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Comma separated tags" className="w-full" />
                        </div>
                        <div className="field col-12">
                            <label className="text-sm font-medium">Description</label>
                            <InputTextarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full" />
                        </div>

                        {!editing && (
                            <div className="field col-12">
                                <label className="text-sm font-medium block mb-2">Ebook file (pdf, epub) *</label>
                                <FileUpload
                                    mode="basic"
                                    accept="application/pdf,application/epub+zip,.pdf,.epub,.mobi"
                                    maxFileSize={50 * 1024 * 1024}
                                    customUpload
                                    auto
                                    chooseLabel={form.fileName || 'Choose file'}
                                    uploadHandler={onSelectFile}
                                />
                            </div>
                        )}

                        <div className="field col-12">
                            <label className="text-sm font-medium block mb-2">Cover image (optional)</label>
                            <FileUpload
                                mode="basic"
                                accept="image/*"
                                maxFileSize={5 * 1024 * 1024}
                                customUpload
                                auto
                                chooseLabel="Choose cover"
                                uploadHandler={onSelectCover}
                            />
                            {form.coverUrl && !form.coverData && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={form.coverUrl} alt="cover" className="mt-2" style={{ height: 80 }} />
                            )}
                        </div>
                    </div>

                    {uploading && <ProgressBar value={uploadProgress} />}

                    <div className="flex justify-content-end gap-2 pt-2">
                        <Button label="Cancel" className="p-button-text" onClick={() => setShowUpload(false)} disabled={uploading} />
                        <Button label={editing ? 'Save' : 'Upload'} icon={editing ? 'pi pi-check' : 'pi pi-upload'} loading={uploading} onClick={submit} />
                    </div>
                </div>
            </Dialog>

            {/* Detail dialog */}
            <Dialog visible={!!detail} onHide={() => setDetail(null)} header={detail?.title} modal className="w-full sm:w-35rem" breakpoints={{ '640px': '95vw' }}>
                {detail && (
                    <div className="flex flex-column gap-3">
                        <div className="flex gap-3">
                            {detail.coverUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={detail.coverUrl} alt="" style={{ width: 96, height: 132, objectFit: 'cover', borderRadius: 6 }} />
                            ) : (
                                <div className="bg-primary-100 text-primary-700 border-round flex align-items-center justify-content-center" style={{ width: 96, height: 132 }}>
                                    <i className="pi pi-book text-3xl" />
                                </div>
                            )}
                            <div className="flex flex-column gap-1 flex-1">
                                <div className="text-color-secondary text-sm">{detail.authors}</div>
                                <Tag value={detail.source} severity={sourceTagSeverity(detail.source) as any} className="w-min" />
                                <div className="text-sm">
                                    {detail.publisher} {detail.publishedYear ? `(${detail.publishedYear})` : ''}
                                </div>
                                {detail.isbn && <div className="text-xs text-color-secondary">ISBN: {detail.isbn}</div>}
                                {detail.pageCount && <div className="text-xs text-color-secondary">{detail.pageCount} pages</div>}
                            </div>
                        </div>
                        {detail.description && <p className="text-sm m-0">{detail.description}</p>}
                        {detail.tags && (
                            <div className="flex gap-1 flex-wrap">
                                {detail.tags.split(',').map((t) => (
                                    <Tag key={t} value={t.trim()} />
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            {(detail.fileUrl || detail.externalUrl) && (
                                <Button
                                    label="Open / Read"
                                    icon="pi pi-external-link"
                                    onClick={() => {
                                        LibraryService.incrementDownload(detail.id).catch(() => {});
                                        window.open(detail.fileUrl || detail.externalUrl, '_blank', 'noopener');
                                    }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default LibraryPage;
