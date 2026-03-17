'use client';
import React, { useState, useRef, useEffect } from 'react';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { FilterMatchMode } from 'primereact/api';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import PageHeader from '@/components/PageHeader';
import { SmsService, SmsRecipient, SmsSenderId } from '@/lib/service/SmsService';
import { LookupService } from '@/lib/service/LookupService';

const MAX_SMS_LENGTH = 160;

const BulkSmsPage = () => {
    const toast = useRef<Toast>(null);

    // ─── Filter state ─────────────────────────────────
    const [programmeId, setProgrammeId] = useState<number | null>(null);
    const [levelId, setLevelId] = useState<number | null>(null);
    const [programmeOptions, setProgrammeOptions] = useState<{ label: string; value: number }[]>([]);
    const [levelOptions, setLevelOptions] = useState<{ label: string; value: number }[]>([]);

    // ─── Recipients state ─────────────────────────────
    const [recipients, setRecipients] = useState<SmsRecipient[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<SmsRecipient[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [filters, setFilters] = useState<DataTableFilterMeta>({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } });

    // ─── Message state ────────────────────────────────
    const [message, setMessage] = useState('');
    const [senderId, setSenderId] = useState<number | null>(null);
    const [sending, setSending] = useState(false);
    const [balance, setBalance] = useState<string | null>(null);

    // ─── Sender ID state ──────────────────────────────
    const [senderIds, setSenderIds] = useState<SmsSenderId[]>([]);
    const [showSenderIdDialog, setShowSenderIdDialog] = useState(false);
    const [newSenderName, setNewSenderName] = useState('');
    const [newSenderPurpose, setNewSenderPurpose] = useState('');
    const [registeringSenderId, setRegisteringSenderId] = useState(false);

    // ─── Load dropdown options ────────────────────────
    useEffect(() => {
        const loadDropdowns = async () => {
            try {
                const [programmes, levels] = await Promise.all([LookupService.getProgrammes(), LookupService.getLevels()]);
                setProgrammeOptions(programmes.map((p) => ({ label: p.programmeName, value: p.id })));
                setLevelOptions(levels.map((l) => ({ label: l.levelName, value: l.id })));
            } catch {
                toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load filter options.', life: 3000 });
            }
        };
        loadDropdowns();
        loadBalance();
        loadSenderIds();
    }, []);

    // ─── Load recipients when filters change ──────────
    const loadRecipients = async () => {
        try {
            setLoadingRecipients(true);
            const params: { programmeId?: number; levelId?: number } = {};
            if (programmeId) params.programmeId = programmeId;
            if (levelId) params.levelId = levelId;
            const data = await SmsService.getRecipients(params);
            setRecipients(data);
            setSelectedRecipients(data); // Select all by default
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setLoadingRecipients(false);
        }
    };

    const loadBalance = async () => {
        try {
            const data = await SmsService.getBalance();
            setBalance(data.balance);
        } catch {
            // Silently fail — balance is informational
        }
    };

    const loadSenderIds = async () => {
        try {
            const data = await SmsService.getSenderIds();
            setSenderIds(data);
            // Auto-select the default sender ID
            const defaultId = data.find((s) => s.isDefault);
            if (defaultId && !senderId) setSenderId(defaultId.id);
        } catch {
            // Silently fail
        }
    };

    const handleRegisterSenderId = async () => {
        if (!newSenderName.trim()) return;
        setRegisteringSenderId(true);
        try {
            const result = await SmsService.registerSenderId({
                senderName: newSenderName.trim(),
                purpose: newSenderPurpose.trim() || undefined
            });
            toast.current?.show({ severity: 'success', summary: 'Success', detail: `${result.message} Status: ${result.status}`, life: 4000 });
            setShowSenderIdDialog(false);
            setNewSenderName('');
            setNewSenderPurpose('');
            loadSenderIds();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
        } finally {
            setRegisteringSenderId(false);
        }
    };

    const handleDeleteSenderId = (id: number, name: string) => {
        confirmDialog({
            message: `Remove sender ID "${name}" from your list?`,
            header: 'Confirm Delete',
            icon: 'pi pi-trash',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await SmsService.deleteSenderId(id);
                    toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Sender ID removed.', life: 3000 });
                    if (senderId === id) setSenderId(null);
                    loadSenderIds();
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
                }
            }
        });
    };

    const handleSetDefaultSenderId = async (id: number) => {
        try {
            await SmsService.setDefaultSenderId(id);
            loadSenderIds();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        }
    };

    const [checkingStatusId, setCheckingStatusId] = useState<number | null>(null);

    const handleCheckSenderIdStatus = async (id: number, senderName: string) => {
        setCheckingStatusId(id);
        try {
            const result = await SmsService.checkSenderIdStatus({ senderName, id });
            toast.current?.show({ severity: 'success', summary: 'Status Updated', detail: `"${senderName}" status: ${result.senderStatus}`, life: 4000 });
            loadSenderIds();
        } catch (err) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 3000 });
        } finally {
            setCheckingStatusId(null);
        }
    };

    // ─── Send SMS ─────────────────────────────────────
    const handleSend = () => {
        if (selectedRecipients.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'No Recipients', detail: 'Please select at least one recipient.', life: 3000 });
            return;
        }
        if (!message.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Empty Message', detail: 'Please enter a message to send.', life: 3000 });
            return;
        }

        confirmDialog({
            message: `Send SMS to ${selectedRecipients.length} recipient${selectedRecipients.length > 1 ? 's' : ''}?\n\nMessage:\n"${message.trim().substring(0, 100)}${message.trim().length > 100 ? '...' : ''}"`,
            header: 'Confirm Send',
            icon: 'pi pi-send',
            acceptLabel: 'Send Now',
            rejectLabel: 'Cancel',
            accept: async () => {
                setSending(true);
                try {
                    const phones = selectedRecipients.map((r) => r.phone);
                    const payload: { recipients: string[]; message: string; senderId?: string } = { recipients: phones, message: message.trim() };
                    const selectedSender = senderIds.find((s) => s.id === senderId);
                    if (selectedSender) payload.senderId = selectedSender.senderName;

                    const result = await SmsService.send(payload);
                    const creditInfo = result.creditLeft !== null ? ` (Credit left: ${result.creditLeft})` : '';
                    toast.current?.show({
                        severity: result.failCount === 0 ? 'success' : 'warn',
                        summary: 'SMS Sent',
                        detail: `${result.message}${creditInfo}`,
                        life: 5000
                    });
                    loadBalance();
                } catch (err) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: (err as any).response?.data?.message || (err as any).message, life: 4000 });
                } finally {
                    setSending(false);
                }
            }
        });
    };

    const charCount = message.length;
    const smsPages = Math.ceil(charCount / MAX_SMS_LENGTH) || 1;

    const nameTemplate = (row: SmsRecipient) => (
        <div>
            <div className="font-medium">
                {row.firstName} {row.lastName}
            </div>
            <div className="text-sm text-color-secondary">{row.studentIndex}</div>
        </div>
    );

    const header = (
        <div className="flex flex-column sm:flex-row gap-2 sm:align-items-center sm:justify-content-between">
            <span className="p-input-icon-left w-full sm:w-auto">
                <i className="pi pi-search" />
                <InputText
                    placeholder="Search recipients..."
                    value={globalFilterValue}
                    onChange={(e) => {
                        setGlobalFilterValue(e.target.value);
                        setFilters((prev) => ({ ...prev, global: { value: e.target.value || null, matchMode: FilterMatchMode.CONTAINS } }));
                    }}
                    className="w-full sm:w-auto"
                />
            </span>
            <div className="text-sm text-color-secondary">
                {selectedRecipients.length} of {recipients.length} selected
            </div>
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="col-12">
                <PageHeader title="Bulk SMS" subtitle="Send SMS messages to students via mNotify" />
            </div>

            {/* ─── Compose Message Card ──────────────────── */}
            <div className="col-12 lg:col-5">
                <div className="surface-card shadow-1 border-round p-3">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <h6 className="m-0">Compose Message</h6>
                        {balance !== null && <Tag value={`Balance: ${balance}`} severity="info" icon="pi pi-wallet" />}
                    </div>

                    <div className="flex flex-column gap-3">
                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Sender ID</label>
                            <div className="flex gap-2">
                                <Dropdown
                                    value={senderId}
                                    options={senderIds.map((s) => ({
                                        label: `${s.senderName}${s.isDefault ? ' (Default)' : ''}`,
                                        value: s.id
                                    }))}
                                    onChange={(e) => setSenderId(e.value)}
                                    placeholder="Select sender ID"
                                    className="flex-1"
                                    showClear
                                />
                                <Button icon="pi pi-plus" tooltip="Register new Sender ID" tooltipOptions={{ position: 'top' }} onClick={() => setShowSenderIdDialog(true)} className="p-button-outlined" />
                            </div>
                            {senderIds.length === 0 && <small className="text-color-secondary">No sender IDs registered. Click + to register one with mNotify.</small>}
                        </div>

                        <div className="flex flex-column gap-1">
                            <label className="text-sm font-medium">Message</label>
                            <InputTextarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} autoResize placeholder="Type your message here..." />
                            <div className="flex justify-content-between">
                                <small className="text-color-secondary">
                                    {charCount} character{charCount !== 1 ? 's' : ''} · {smsPages} SMS page{smsPages > 1 ? 's' : ''}
                                </small>
                                {charCount > MAX_SMS_LENGTH && <small className="text-orange-500">Multi-page SMS</small>}
                            </div>
                        </div>

                        <Button
                            label={sending ? 'Sending...' : `Send to ${selectedRecipients.length} Recipient${selectedRecipients.length !== 1 ? 's' : ''}`}
                            icon="pi pi-send"
                            onClick={handleSend}
                            loading={sending}
                            disabled={sending || selectedRecipients.length === 0 || !message.trim()}
                            className="w-full"
                        />
                        {sending && <ProgressBar mode="indeterminate" style={{ height: '4px' }} />}
                    </div>
                </div>
            </div>

            {/* ─── Recipients Card ───────────────────────── */}
            <div className="col-12 lg:col-7">
                <div className="surface-card shadow-1 border-round p-3">
                    <h6 className="mt-0 mb-3">Recipients</h6>

                    {/* Filters */}
                    <div className="flex flex-column sm:flex-row gap-2 mb-3">
                        <Dropdown value={programmeId} options={[{ label: 'All Programmes', value: null }, ...programmeOptions]} onChange={(e) => setProgrammeId(e.value)} placeholder="Filter by programme" className="w-full sm:w-auto flex-1" />
                        <Dropdown value={levelId} options={[{ label: 'All Levels', value: null }, ...levelOptions]} onChange={(e) => setLevelId(e.value)} placeholder="Filter by level" className="w-full sm:w-auto flex-1" />
                        <Button label="Load" icon="pi pi-refresh" onClick={loadRecipients} loading={loadingRecipients} className="p-button-outlined" />
                    </div>

                    {/* Recipients Table */}
                    <DataTable
                        value={recipients}
                        loading={loadingRecipients}
                        selectionMode="checkbox"
                        selection={selectedRecipients}
                        onSelectionChange={(e) => setSelectedRecipients(e.value as SmsRecipient[])}
                        dataKey="studentIndex"
                        filters={filters}
                        header={header}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                        emptyMessage="No recipients found. Use filters and click Load."
                        tableStyle={{ minWidth: '30rem' }}
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                        <Column header="Student" body={nameTemplate} sortable sortField="lastName" style={{ minWidth: '10rem' }} />
                        <Column field="phone" header="Phone" sortable style={{ minWidth: '8rem' }} />
                        <Column field="programmeName" header="Programme" sortable style={{ minWidth: '8rem' }} />
                        <Column field="levelName" header="Level" sortable style={{ width: '80px' }} />
                    </DataTable>
                </div>
            </div>

            {/* ─── Sender IDs Card ───────────────────────── */}
            <div className="col-12">
                <div className="surface-card shadow-1 border-round p-3">
                    <div className="flex align-items-center justify-content-between mb-3">
                        <h6 className="m-0">Registered Sender IDs</h6>
                        <Button label="Register New" icon="pi pi-plus" size="small" onClick={() => setShowSenderIdDialog(true)} className="p-button-outlined" />
                    </div>
                    <DataTable value={senderIds} className="p-datatable-sm" emptyMessage="No sender IDs registered yet." responsiveLayout="scroll">
                        <Column field="senderName" header="Sender Name" sortable />
                        <Column field="purpose" header="Purpose" sortable />
                        <Column field="status" header="Status" body={(row: SmsSenderId) => <Tag value={row.status} severity={row.status === 'Approved' ? 'success' : row.status === 'Rejected' ? 'danger' : 'warning'} />} />
                        <Column
                            header="Default"
                            body={(row: SmsSenderId) =>
                                row.isDefault ? <Tag value="Default" severity="info" icon="pi pi-check" /> : <Button label="Set Default" size="small" className="p-button-text p-button-sm" onClick={() => handleSetDefaultSenderId(row.id)} />
                            }
                            style={{ width: '120px' }}
                        />
                        <Column
                            header="Actions"
                            body={(row: SmsSenderId) => (
                                <div className="flex gap-1">
                                    <Button
                                        icon="pi pi-sync"
                                        tooltip="Check Status"
                                        tooltipOptions={{ position: 'top' }}
                                        className="p-button-info p-button-text p-button-sm"
                                        loading={checkingStatusId === row.id}
                                        onClick={() => handleCheckSenderIdStatus(row.id, row.senderName)}
                                    />
                                    <Button icon="pi pi-trash" tooltip="Delete" tooltipOptions={{ position: 'top' }} className="p-button-danger p-button-text p-button-sm" onClick={() => handleDeleteSenderId(row.id, row.senderName)} />
                                </div>
                            )}
                            style={{ width: '100px' }}
                        />
                    </DataTable>
                </div>
            </div>

            {/* ─── Register Sender ID Dialog ─────────────── */}
            <Dialog
                header="Register Sender ID"
                visible={showSenderIdDialog}
                onHide={() => setShowSenderIdDialog(false)}
                style={{ width: '450px' }}
                breakpoints={{ '640px': '95vw' }}
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setShowSenderIdDialog(false)} />
                        <Button label="Register with mNotify" icon="pi pi-check" onClick={handleRegisterSenderId} loading={registeringSenderId} disabled={!newSenderName.trim() || newSenderName.trim().length > 11} />
                    </div>
                }
            >
                <div className="flex flex-column gap-3 pt-2">
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Sender Name *</label>
                        <InputText value={newSenderName} onChange={(e) => setNewSenderName(e.target.value)} placeholder="e.g. MyUniversity" maxLength={11} />
                        <small className="text-color-secondary">{newSenderName.length}/11 characters</small>
                    </div>
                    <div className="flex flex-column gap-1">
                        <label className="text-sm font-medium">Purpose</label>
                        <InputTextarea value={newSenderPurpose} onChange={(e) => setNewSenderPurpose(e.target.value)} rows={3} placeholder="e.g. For sending student result notifications" />
                    </div>
                    <small className="text-color-secondary">
                        <i className="pi pi-info-circle mr-1" />
                        After registration, mNotify will review and approve the Sender ID. This may take some time.
                    </small>
                </div>
            </Dialog>
        </div>
    );
};

export default BulkSmsPage;
